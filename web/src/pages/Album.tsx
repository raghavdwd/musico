import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { RiPlayFill, RiShuffleLine } from "react-icons/ri";
import { usePlayer } from "../lib/store";
import { useAlbum } from "../hooks/useApi";
import { bestThumb } from "../lib/format";
import SongRow from "../components/cards/SongRow";
import { toast } from "sonner";
import { SquareLoader, CenteredLoader } from "../components/ui/Loaders";
import type { SongDetailed } from "../types";

export default function Album() {
  const { id } = useParams();
  const { data: album, isLoading } = useAlbum(id);
  const load = usePlayer((s) => s.load);

  if (isLoading || !album) {
    return (
      <CenteredLoader>
        <SquareLoader size={56} />
      </CenteredLoader>
    );
  }

  const hero = bestThumb(album.thumbnails, 600) || album.thumbnails?.[0];

  return (
    <div className="mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-[280px_1fr] md:gap-10"
      >
        <div className="flex flex-col items-start">
          <motion.img
            src={hero?.url}
            alt={album.name}
            className="w-full rounded-lg object-cover shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
          <div className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ember">Album</div>
          <h1 className="mt-2 font-display text-3xl font-medium text-snow md:text-4xl">
            {album.name}
          </h1>
          <div className="mt-1 text-sm text-mist">
            {album.artist.name} {album.year && <span>· {album.year}</span>}
          </div>
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => load(album.songs[0] as any, album.songs as any)}
              className="flex items-center gap-2 rounded-full bg-ember px-5 py-2 text-sm font-semibold text-void transition-transform hover:scale-105 active:scale-95"
            >
              <RiPlayFill /> Play
            </button>
            <button
              onClick={() => {
                const shuffled = [...album.songs].sort(() => Math.random() - 0.5);
                load(shuffled[0] as any, shuffled as any);
                toast("Shuffle on");
              }}
              className="flex items-center gap-2 rounded-full border border-bark bg-ash/60 px-5 py-2 text-sm text-snow transition-colors hover:bg-bark/60"
            >
              <RiShuffleLine /> Shuffle
            </button>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-3 border-b border-bark/40 pb-2 font-mono text-[10px] uppercase tracking-widest text-mist">
            <span className="w-6 text-right">#</span>
            <span className="flex-1">Title</span>
            <span>Duration</span>
          </div>
          {album.songs.map((song: SongDetailed, i: number) => (
            <SongRow key={song.videoId} song={song} index={i} queue={album.songs} showArt={false} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
