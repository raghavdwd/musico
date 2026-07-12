import { useLibrary } from "../lib/library";
import { usePlayer } from "../lib/store";
import { RiPlayFill } from "react-icons/ri";
import SongRow from "../components/cards/SongRow";
import { toast } from "sonner";

export default function Recent() {
  const { recent } = useLibrary();
  const { load, addToQueue } = usePlayer();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end gap-6">
        <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-bark">
          <span className="font-display text-5xl text-ember">↻</span>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ember">History</div>
          <h1 className="mt-2 font-display text-5xl font-medium tracking-tight text-snow">Recent</h1>
          <div className="mt-2 text-sm text-mist">{recent.length} songs</div>
          {recent.length > 0 && (
            <button
              onClick={() => load(recent[0]!, recent)}
              className="mt-6 flex items-center gap-2 rounded-full bg-ember px-5 py-2 text-sm font-semibold text-void transition-transform hover:scale-105 active:scale-95"
            >
              <RiPlayFill /> Play all
            </button>
          )}
        </div>
      </div>

      <div className="mt-10">
        {recent.length === 0 ? (
          <p className="text-mist">
            Nothing here yet. Play a song and it'll show up here.
          </p>
        ) : (
          recent.map((song, i) => (
            <SongRow key={song.videoId} song={song} index={i} queue={recent} showArt={false} onAddToQueue={(s) => { addToQueue(s); toast.success("Added to queue"); }} />
          ))
        )}
      </div>
    </div>
  );
}
