import { RiHeartFill, RiHeartLine, RiPauseFill, RiPlayFill, RiAddLine, RiPlayListAddLine } from "react-icons/ri";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import type { SongDetailed } from "../../types";
import { usePlayer } from "../../lib/store";
import { useLibrary } from "../../lib/library";
import { useUI } from "../../lib/ui";
import { formatTime } from "../../lib/format";
import VinylArt from "../player/VinylArt";
import { SquareLoader } from "../ui/Loaders";
import * as api from "../../api";

interface Props {
  song: SongDetailed;
  index?: number;
  queue?: SongDetailed[];
  showArt?: boolean;
  onClick?: () => void;
  onAddToQueue?: (song: SongDetailed) => void;
}

export default function SongRow({ song, index, queue, showArt = true, onClick, onAddToQueue }: Props) {
  const { load, current, isPlaying, isLoading, toggle } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();
  const openAddToPlaylist = useUI((s) => s.openAddToPlaylist);
  const liked = isLiked(song.videoId);
  const isCurrent = current?.videoId === song.videoId;
  const isBuffering = isCurrent && isLoading;

  // Background-fetch the full song to get the duration if missing
  const { data: fullSong } = useQuery({
    queryKey: ["song", song.videoId],
    queryFn: () => api.getSong(song.videoId),
    enabled: song.duration == null,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const duration = song.duration ?? fullSong?.duration ?? null;

  const play = () => {
    if (onClick) return onClick();
    if (isCurrent) return toggle();
    load(song, queue);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: isBuffering ? "rgba(232, 93, 59, 0.08)" : "rgba(0, 0, 0, 0)",
      }}
      transition={{ duration: 0.3 }}
      className={`group relative grid grid-cols-[24px_1fr_60px_40px_40px] items-center gap-3 rounded-md px-2 py-1.5 transition-colors ${
        isBuffering ? "" : "hover:bg-bark/60"
      }`}
    >
      <button
        onClick={play}
        className="flex h-6 w-6 items-center justify-center text-mist hover:text-snow"
        aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
      >
        {isBuffering ? (
          <span className="block h-4 w-4">
            <SquareLoader size={16} />
          </span>
        ) : isCurrent && isPlaying ? (
          <RiPauseFill className="text-ember" />
        ) : isCurrent ? (
          <RiPlayFill className="text-ember" />
        ) : index !== undefined ? (
          <span className="font-mono text-xs tabular-nums group-hover:hidden">
            {index + 1}
          </span>
        ) : null}
        {(!isCurrent || (isCurrent && !isPlaying)) && !isBuffering && (
          <RiPlayFill className="hidden group-hover:block" />
        )}
      </button>

      <div className="flex min-w-0 items-center gap-3">
        {showArt && (
          <VinylArt
            thumbnails={song.thumbnails}
            size={40}
            spinning={isCurrent && isPlaying}
            loading={isBuffering}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className={`truncate text-sm font-medium ${isCurrent ? "text-ember" : "text-snow"}`}>
            {song.name}
          </div>
          <div className="truncate text-xs text-mist">{song.artist.name}</div>
        </div>
      </div>

      <div className="font-mono text-xs tabular-nums text-mist">
        {duration ? formatTime(duration) : <span className="opacity-30">—:—</span>}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleLike(song);
        }}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          liked ? "text-ember" : "text-mist opacity-0 group-hover:opacity-100 hover:text-snow"
        }`}
        aria-label={liked ? "Unlike" : "Like"}
      >
        {liked ? <RiHeartFill /> : <RiHeartLine />}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          openAddToPlaylist(song);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-mist opacity-0 transition-colors hover:text-ember group-hover:opacity-100"
        aria-label="Add to playlist"
      >
        <RiAddLine />
      </button>

      {onAddToQueue && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToQueue(song);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-mist opacity-0 transition-colors hover:text-snow group-hover:opacity-100"
          aria-label="Add to queue"
        >
          <RiPlayListAddLine />
        </button>
      )}
    </motion.div>
  );
}
