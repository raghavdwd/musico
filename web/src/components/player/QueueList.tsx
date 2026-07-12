import { RiDeleteBin6Line, RiPlayFill, RiPlayList2Fill } from "react-icons/ri";
import { usePlayer } from "../../lib/store";
import { formatTime } from "../../lib/format";
import VinylArt from "./VinylArt";

export default function QueueList() {
  const { current, queue, queueIndex, removeFromQueue, load } = usePlayer();
  const upcoming = queue.filter((_, i) => i > queueIndex);

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-mist">
        <RiPlayList2Fill className="mb-3 text-3xl opacity-40" />
        <p className="text-sm">No song is playing.</p>
        <p className="text-xs opacity-60">Play something to see the queue.</p>
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-mist">
        <RiPlayList2Fill className="mb-3 text-3xl opacity-40" />
        <p className="text-sm">Queue is empty</p>
        <p className="text-xs opacity-60">Add songs from the current view.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-mist/60">
        Up next · {upcoming.length} {upcoming.length === 1 ? "song" : "songs"}
      </div>
      {upcoming.map((song, i) => {
        const realIndex = queueIndex + 1 + i;
        return (
          <div
            key={`${song.videoId}-${realIndex}`}
            className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-bark/60"
          >
            <button
              onClick={() => load(song, queue)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-mist hover:text-snow"
              aria-label={`Play ${song.name}`}
            >
              <RiPlayFill />
            </button>
            <VinylArt
              thumbnails={song.thumbnails}
              size={36}
              spinning={false}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-snow">
                {song.name}
              </div>
              <div className="truncate text-xs text-mist">
                {song.artist.name}
              </div>
            </div>
            <span className="hidden flex-shrink-0 font-mono text-xs tabular-nums text-mist sm:block">
              {song.duration ? formatTime(song.duration) : ""}
            </span>
            <button
              onClick={() => removeFromQueue(realIndex)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-mist opacity-0 transition-colors hover:text-ember group-hover:opacity-100"
              aria-label={`Remove ${song.name} from queue`}
            >
              <RiDeleteBin6Line className="text-sm" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
