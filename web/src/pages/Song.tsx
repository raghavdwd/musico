import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { RiPlayFill } from "react-icons/ri";
import { useSong, useLyrics } from "../hooks/useApi";
import { usePlayer } from "../lib/store";
import { useLibrary } from "../lib/library";
import { bestThumb, formatTime } from "../lib/format";
import { SquareLoader, CenteredLoader } from "../components/ui/Loaders";
import type { SongDetailed } from "../types";

export default function Song() {
  const { id } = useParams();
  const { data: song, isLoading } = useSong(id);
  const { data: lyrics, isLoading: lyricsLoading } = useLyrics(id);
  const { load, current, isPlaying, toggle } = usePlayer();
  const { liked, toggleLike } = useLibrary();

  if (isLoading || !song) {
    return (
      <CenteredLoader>
        <SquareLoader size={56} />
      </CenteredLoader>
    );
  }

  const isCurrent = current?.videoId === song.videoId;
  const isLiked = liked.some((s) => s.videoId === song.videoId);

  const play = () => {
    if (isCurrent) toggle();
    else
      load(
        { ...song, type: "SONG", album: null, duration: song.duration, artist: song.artist },
        [song as unknown as SongDetailed],
      );
  };

  const hero = bestThumb(song.thumbnails, 600) || song.thumbnails?.[0];

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-[240px_1fr] md:gap-8"
      >
        <div className="flex flex-col items-start">
          <motion.img
            src={hero?.url}
            alt={song.name}
            className="w-full rounded-lg object-cover shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
          <div className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ember">Song</div>
          <h1 className="mt-2 font-display text-3xl font-medium text-snow md:text-4xl">
            {song.name}
          </h1>
          <div className="mt-1 text-sm text-mist">
            {song.artist.name} · {formatTime(song.duration)}
          </div>
          <div className="mt-6 flex gap-2">
            <button
              onClick={play}
              className="flex items-center gap-2 rounded-full bg-ember px-5 py-2 text-sm font-semibold text-void transition-transform hover:scale-105 active:scale-95"
            >
              <RiPlayFill />
              {isCurrent && isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={() =>
                toggleLike({
                  ...song,
                  type: "SONG",
                  album: null,
                  duration: song.duration,
                } as SongDetailed)
              }
              className={`rounded-full border px-5 py-2 text-sm transition-colors ${
                isLiked
                  ? "border-ember bg-ember/20 text-ember"
                  : "border-bark bg-ash/60 text-snow hover:bg-bark/60"
              }`}
            >
              {isLiked ? "♥ Liked" : "♡ Like"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-mist">
            Lyrics
          </h2>
          {lyricsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <SquareLoader size={40} />
            </div>
          ) : lyrics && lyrics.length > 0 ? (
            <div className="space-y-1.5 text-base leading-relaxed text-snow/80">
              {lyrics.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          ) : (
            <p className="text-mist">No lyrics for this track.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
