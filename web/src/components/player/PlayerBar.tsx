import {
  RiPauseFill,
  RiPlayFill,
  RiSkipBackFill,
  RiSkipForwardFill,
  RiVolumeDownFill,
  RiVolumeUpFill,
  RiVolumeMuteFill,
  RiExpandUpDownLine,
  RiHeartFill,
  RiHeartLine,
  RiPlayList2Fill,
  RiRadioLine,
} from "react-icons/ri";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../../lib/store";
import { useLibrary } from "../../lib/library";
import { formatTime } from "../../lib/format";
import VinylArt from "./VinylArt";
import { TrefoilLoader, InfinityLoader } from "../ui/Loaders";
import { toast } from "sonner";
import type { SongDetailed } from "../../types";

function SeekBar({
  progress,
  duration,
  onSeek,
}: {
  progress: number;
  duration: number;
  onSeek: (t: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [localValue, setLocalValue] = useState(progress);

  // sync local value to the real progress when not dragging
  useEffect(() => {
    if (!dragging) setLocalValue(progress);
  }, [progress, dragging]);

  const pct = duration > 0 ? Math.min(100, (localValue / duration) * 100) : 0;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="hidden w-10 flex-shrink-0 text-right font-mono text-[10px] tabular-nums text-mist sm:block">
        {formatTime(localValue)}
      </span>
      <div className="relative min-w-0 flex-1">
        <div
          className="absolute inset-y-0 left-0 right-0 m-auto h-1 rounded-full bg-bark"
        />
        <div
          className="absolute inset-y-0 left-0 m-auto h-1 rounded-full bg-ember"
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
            onSeek(v);
          }}
          onMouseUp={() => setDragging(false)}
          onTouchEnd={() => setDragging(false)}
          className="relative h-3 w-full cursor-pointer appearance-none bg-transparent"
          aria-label="Seek"
          style={{ WebkitAppearance: "none" }}
        />
      </div>
      <span className="hidden w-10 flex-shrink-0 font-mono text-[10px] tabular-nums text-mist sm:block">
        {formatTime(duration)}
      </span>
    </div>
  );
}

export default function PlayerBar() {
  const {
    current,
    isPlaying,
    isLoading,
    progress,
    duration,
    volume,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    expand,
    isQueueOpen,
    openQueue,
    closeQueue,
    queue,
    queueIndex,
    isRadio,
    startRadio,
    stopRadio,
  } = usePlayer();
  const { liked, toggleLike, pushRecent } = useLibrary();
  const [muted, setMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (current && current.videoId !== lastId.current) {
      lastId.current = current.videoId;
      pushRecent(current);
    }
  }, [current, pushRecent]);

  if (!current) return null;

  const vol = muted ? 0 : volume;
  const isLiked = liked.some((s) => s.videoId === current.videoId);

  const handleLike = () => {
    toggleLike({
      ...current,
      type: "SONG" as const,
      album: current.album,
      duration: current.duration,
    } as SongDetailed);
    if (isLiked) {
      toast("Removed from Liked songs");
    } else {
      toast.success("Added to Liked songs");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex h-20 items-center gap-2 overflow-hidden border-t border-bark/40 bg-ash/95 px-3 backdrop-blur-md md:gap-3 md:px-5">
      <button
        onClick={expand}
        className="flex min-w-0 flex-shrink items-center gap-2 rounded-md p-1 transition-colors hover:bg-bark/60 md:gap-3"
      >
        <VinylArt thumbnails={current.thumbnails} size={48} spinning={isPlaying} />
        <div className="hidden min-w-0 text-left md:block">
          <div className="flex max-w-[180px] items-center gap-2">
            <span className="truncate text-sm font-medium text-snow">{current.name}</span>
            {isLoading && <span className="inline-block h-3 w-3 flex-shrink-0"><TrefoilLoader size={12} /></span>}
          </div>
          <div className="max-w-[180px] truncate text-xs text-mist">{current.artist.name}</div>
        </div>
      </button>

      <button
        onClick={handleLike}
        className={`flex-shrink-0 rounded-full p-1.5 transition-colors md:p-2 ${
          isLiked
            ? "text-ember"
            : "text-mist hover:bg-bark/60 hover:text-snow"
        }`}
        aria-label={isLiked ? "Unlike" : "Like"}
      >
        {isLiked ? <RiHeartFill className="text-lg" /> : <RiHeartLine className="text-lg" />}
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <SeekBar progress={progress} duration={duration} onSeek={seek} />

        <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
          <button
            onClick={prev}
            className="rounded-full p-1.5 text-snow transition-colors hover:bg-bark/60 md:p-2"
            aria-label="Previous"
          >
            <RiSkipBackFill className="text-lg" />
          </button>
          <button
            onClick={toggle}
            className="rounded-full bg-snow p-1.5 text-void transition-transform hover:scale-105 active:scale-95 md:p-2"
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="block h-[18px] w-[18px] md:h-5 md:w-5">
                <InfinityLoader size={18} />
              </span>
            ) : isPlaying ? (
              <RiPauseFill className="text-lg" />
            ) : (
              <RiPlayFill className="text-lg" />
            )}
          </button>
          <button
            onClick={next}
            className="rounded-full p-1.5 text-snow transition-colors hover:bg-bark/60 md:p-2"
            aria-label="Next"
          >
            <RiSkipForwardFill className="text-lg" />
          </button>
        </div>

        <button
          onClick={() => isQueueOpen ? closeQueue() : openQueue()}
          className={`relative flex-shrink-0 rounded-full p-2 transition-colors ${
            isQueueOpen
              ? "bg-ember/20 text-ember"
              : "text-mist hover:bg-bark/60 hover:text-snow"
          }`}
          aria-label="Queue"
        >
          <RiPlayList2Fill />
          {queue.length - queueIndex - 1 > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold text-void">
              {queue.length - queueIndex - 1}
            </span>
          )}
        </button>

        <button
          onClick={() => isRadio ? stopRadio() : startRadio(current)}
          className={`relative flex-shrink-0 rounded-full p-2 transition-colors ${
            isRadio
              ? "bg-ember/20 text-ember"
              : "text-mist hover:text-ember hover:bg-bark/60"
          }`}
          aria-label={isRadio ? "Stop radio" : "Start radio"}
          title={isRadio ? "Stop radio" : "Start radio"}
        >
          <RiRadioLine className={isRadio ? "animate-pulse" : ""} />
        </button>

        <button
          onClick={expand}
          className="hidden flex-shrink-0 rounded-full p-2 text-mist transition-colors hover:bg-bark/60 hover:text-snow md:block"
          aria-label="Expand"
        >
          <RiExpandUpDownLine />
        </button>
      </div>

      <div className="hidden w-28 flex-shrink-0 items-center gap-2 md:flex lg:w-32">
        <button
          onClick={() => {
            if (muted) {
              setMuted(false);
              setVolume(prevVolume);
            } else {
              setPrevVolume(volume);
              setMuted(true);
              setVolume(0);
            }
          }}
          className="flex-shrink-0 rounded-full p-1.5 text-mist transition-colors hover:bg-bark/60 hover:text-snow"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {vol === 0 ? <RiVolumeMuteFill /> : vol < 0.5 ? <RiVolumeDownFill /> : <RiVolumeUpFill />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={vol}
          onChange={(e) => {
            setVolume(Number(e.target.value));
            setMuted(false);
          }}
          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-bark accent-ember"
          style={{ background: `linear-gradient(to right, var(--color-ember) ${vol * 100}%, var(--color-bark) ${vol * 100}%)` }}
        />
      </div>
    </div>
  );
}
