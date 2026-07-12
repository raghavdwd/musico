import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  RiCloseLine,
  RiPauseFill,
  RiPlayFill,
  RiSkipBackFill,
  RiSkipForwardFill,
  RiHeartFill,
  RiHeartLine,
  RiPlayList2Fill,
  RiMenuLine,
  RiRadioLine,
} from "react-icons/ri";
import { usePlayer } from "../../lib/store";
import { useLibrary } from "../../lib/library";
import { useQuery } from "@tanstack/react-query";
import * as api from "../../api";
import { formatTime } from "../../lib/format";
import VinylArt from "./VinylArt";
import QueueList from "./QueueList";
import { InfinityLoader } from "../ui/Loaders";
import { toast } from "sonner";
import type { SongDetailed } from "../../types";

type Panel = "lyrics" | "queue";

export function LyricsPanel() {
  const current = usePlayer((s) => s.current);
  const { data: lyrics, isLoading, isError } = useQuery({
    queryKey: ["lyrics", current?.videoId],
    queryFn: () => api.getLyrics(current!.videoId),
    enabled: !!current,
    retry: false,
  });

  return (
    <>
      <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-mist">
        Lyrics
      </h2>
      {lyrics && lyrics.length > 0 ? (
        <div className="space-y-1.5 text-base leading-relaxed text-snow/80">
          {lyrics.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : isError ? (
        <p className="text-mist">Couldn't load lyrics.</p>
      ) : isLoading ? (
        <p className="text-mist">Loading lyrics…</p>
      ) : (
        <p className="text-mist">No lyrics for this track.</p>
      )}
    </>
  );
}

export default function FullPlayer() {
  const { current, isPlaying, isLoading, toggle, next, prev, seek, progress, duration, isExpanded, collapse, queue, queueIndex, isRadio, startRadio, stopRadio } = usePlayer();
  const { liked, toggleLike } = useLibrary();
  const [dragging, setDragging] = useState<boolean>(false);
  const [localValue, setLocalValue] = useState(progress);
  const [panel, setPanel] = useState<Panel>("lyrics");

  // Reset to lyrics when the song changes
  const lastVideoId = current?.videoId;
  useEffect(() => {
    setPanel("lyrics");
  }, [lastVideoId]);

  // Reset to lyrics when player collapses
  useEffect(() => {
    if (!isExpanded) setPanel("lyrics");
  }, [isExpanded]);

  // sync local value to the real progress when not dragging
  useEffect(() => {
    if (!dragging) setLocalValue(progress);
  }, [progress, dragging]);

  // ESC collapses the player
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        collapse();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isExpanded, collapse]);

  if (!current) return null;
  const isLiked = liked.some((s) => s.videoId === current.videoId);
  const pct = duration > 0 ? Math.min(100, (localValue / duration) * 100) : 0;

  const handleLike = () => {
    toggleLike({
      ...current,
      type: "SONG" as const,
      album: current.album,
      duration: current.duration,
    } as SongDetailed);
    if (isLiked) toast("Removed from Liked songs");
    else toast.success("Added to Liked songs");
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: isExpanded ? 0 : "100%" }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-void"
          style={{ pointerEvents: isExpanded ? "auto" : "none" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
            style={{
              backgroundImage: `url(${current.thumbnails?.[current.thumbnails.length - 1]?.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-void/70" />

          <button
            onClick={collapse}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-snow transition-colors hover:bg-bark/60"
            aria-label="Close"
          >
            <RiCloseLine className="text-2xl" />
          </button>

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 overflow-y-auto p-6 md:flex-row md:gap-12 md:p-12">
            <div className="flex flex-col items-center md:items-start">
              <VinylArt
                thumbnails={current.thumbnails}
                size={300}
                spinning={isPlaying}
              />
              <div className="mt-6 text-center md:text-left">
                <div className="font-display text-3xl font-medium text-snow md:text-5xl">
                  {current.name}
                </div>
                <div className="mt-1 text-base text-mist">{current.artist.name}</div>
              </div>

              <div className="mt-8 flex w-full flex-col gap-3 md:max-w-md">
                <div className="relative">
                  <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-bark" />
                  <div
                    className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ember"
                    style={{ width: `${pct}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={localValue}
                    onMouseDown={() => setDragging(true)}
                    onTouchStart={() => setDragging(true)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLocalValue(v);
                      seek(v);
                    }}
                    onMouseUp={() => setDragging(false)}
                    onTouchEnd={() => setDragging(false)}
                    className="relative h-3 w-full cursor-pointer appearance-none bg-transparent"
                    style={{ WebkitAppearance: "none" }}
                    aria-label="Seek"
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] tabular-nums text-mist">
                  <span>{formatTime(localValue)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="mt-2 flex items-center justify-center gap-4">
                  <button
                    onClick={prev}
                    className="rounded-full p-3 text-snow transition-colors hover:bg-bark/60"
                  >
                    <RiSkipBackFill className="text-2xl" />
                  </button>
                  <button
                    onClick={toggle}
                    className="rounded-full bg-snow p-4 text-void transition-transform hover:scale-105 active:scale-95"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="block h-8 w-8">
                        <InfinityLoader size={32} />
                      </span>
                    ) : isPlaying ? (
                      <RiPauseFill className="text-3xl" />
                    ) : (
                      <RiPlayFill className="text-3xl" />
                    )}
                  </button>
                  <button
                    onClick={next}
                    className="rounded-full p-3 text-snow transition-colors hover:bg-bark/60"
                  >
                    <RiSkipForwardFill className="text-2xl" />
                  </button>
                  <button
                    onClick={handleLike}
                    className={`rounded-full p-3 transition-colors hover:bg-bark/60 ${
                      isLiked ? "text-ember" : "text-snow"
                    }`}
                    aria-label={isLiked ? "Unlike" : "Like"}
                  >
                    {isLiked ? <RiHeartFill className="text-2xl" /> : <RiHeartLine className="text-2xl" />}
                  </button>
                  <button
                    onClick={() => isRadio ? stopRadio() : startRadio(current)}
                    className={`rounded-full p-3 transition-colors ${
                      isRadio
                        ? "bg-ember/20 text-ember"
                        : "text-mist hover:bg-bark/60 hover:text-ember"
                    }`}
                    aria-label={isRadio ? "Stop radio" : "Start radio"}
                    title={isRadio ? "Stop radio" : "Start radio"}
                  >
                    <RiRadioLine className={`text-2xl ${isRadio ? "animate-pulse" : ""}`} />
                  </button>
                  <button
                    onClick={() => setPanel(panel === "queue" ? "lyrics" : "queue")}
                    className={`relative rounded-full p-3 transition-colors ${
                      panel === "queue"
                        ? "bg-ember/20 text-ember"
                        : "text-mist hover:bg-bark/60 hover:text-snow"
                    }`}
                    aria-label={panel === "queue" ? "Show lyrics" : "Show queue"}
                  >
                    {panel === "queue" ? <RiMenuLine className="text-2xl" /> : <RiPlayList2Fill className="text-2xl" />}
                    {panel !== "queue" && queue.length - queueIndex - 1 > 0 && (
                      <span className="absolute right-0.5 top-1.5 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold text-void">
                        {queue.length - queueIndex - 1}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Panel tabs */}
              <div className="mb-4 flex gap-4 border-b border-bark/30">
                <button
                  onClick={() => setPanel("lyrics")}
                  className={`pb-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    panel === "lyrics"
                      ? "border-b-2 border-ember text-ember"
                      : "text-mist hover:text-snow"
                  }`}
                >
                  Lyrics
                </button>
                <button
                  onClick={() => setPanel("queue")}
                  className={`relative pb-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    panel === "queue"
                      ? "border-b-2 border-ember text-ember"
                      : "text-mist hover:text-snow"
                  }`}
                >
                  Queue
                  {queue.length - queueIndex - 1 > 0 && (
                    <span className="ml-1.5 rounded-full bg-ember px-1.5 py-0.5 text-[9px] font-bold text-void">
                      {queue.length - queueIndex - 1}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-12">
                {panel === "lyrics" ? <LyricsPanel /> : <QueueList />}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
