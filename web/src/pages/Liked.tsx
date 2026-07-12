import { useLibrary } from "../lib/library";
import { usePlayer } from "../lib/store";
import { RiPlayFill } from "react-icons/ri";
import SongRow from "../components/cards/SongRow";
import VinylArt from "../components/player/VinylArt";
import { toast } from "sonner";

export default function Liked() {
  const { liked } = useLibrary();
  const { load, addToQueue } = usePlayer();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end gap-6">
        <VinylArt size={160} rounded={false} />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ember">Library</div>
          <h1 className="mt-2 font-display text-5xl font-medium tracking-tight text-snow">Liked songs</h1>
          <div className="mt-2 text-sm text-mist">{liked.length} songs</div>
          {liked.length > 0 && (
            <button
              onClick={() => load(liked[0]!, liked)}
              className="mt-6 flex items-center gap-2 rounded-full bg-ember px-5 py-2 text-sm font-semibold text-void transition-transform hover:scale-105 active:scale-95"
            >
              <RiPlayFill /> Play all
            </button>
          )}
        </div>
      </div>

      <div className="mt-10">
        {liked.length === 0 ? (
          <p className="text-mist">
            Nothing here yet. Click the heart on any song to add it.
          </p>
        ) : (
          liked.map((song, i) => (
            <SongRow key={song.videoId} song={song} index={i} queue={liked} showArt={false} onAddToQueue={(s) => { addToQueue(s); toast.success("Added to queue"); }} />
          ))
        )}
      </div>
    </div>
  );
}
