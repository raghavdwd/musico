import { useCallback } from "react";
import { RiDeleteBin6Line, RiPlayFill, RiPlayList2Fill, RiDragMove2Fill } from "react-icons/ri";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SongDetailed } from "../../types";
import { usePlayer } from "../../lib/store";
import { formatTime } from "../../lib/format";
import VinylArt from "./VinylArt";

function SortableQueueItem({
  song,
  realIndex,
  onRemove,
}: {
  song: SongDetailed;
  realIndex: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${song.videoId}-${realIndex}`,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  const { load, queue } = usePlayer();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
        isDragging ? "bg-bark/80 shadow-xl ring-1 ring-ember/30" : "hover:bg-bark/60"
      }`}
    >
      <button
        onClick={() => load(song, queue)}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-mist hover:text-snow"
        aria-label={`Play ${song.name}`}
      >
        <RiPlayFill />
      </button>

      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="flex h-8 w-5 cursor-grab touch-none items-center justify-center text-mist/40 transition-colors hover:text-mist active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <RiDragMove2Fill className="text-sm" />
      </span>

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
        onClick={onRemove}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-mist opacity-0 transition-colors hover:text-ember group-hover:opacity-100"
        aria-label={`Remove ${song.name} from queue`}
      >
        <RiDeleteBin6Line className="text-sm" />
      </button>
    </div>
  );
}

export default function QueueList() {
  const { current, queue, queueIndex, removeFromQueue, reorderQueue } = usePlayer();
  const upcoming = queue.filter((_, i) => i > queueIndex);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Parse the realIndex from the compound id
      const fromRealIndex = parseInt(activeId.split("-").pop()!, 10);
      const toRealIndex = parseInt(overId.split("-").pop()!, 10);
      if (isNaN(fromRealIndex) || isNaN(toRealIndex)) return;

      reorderQueue(fromRealIndex, toRealIndex);
    },
    [reorderQueue],
  );

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

  const sortableIds = upcoming.map((_, i) => `${upcoming[i]!.videoId}-${queueIndex + 1 + i}`);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          <div className="px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-mist/60">
            Up next · {upcoming.length} {upcoming.length === 1 ? "song" : "songs"}
          </div>
          {upcoming.map((song, i) => {
            const realIndex = queueIndex + 1 + i;
            return (
              <SortableQueueItem
                key={`${song.videoId}-${realIndex}`}
                song={song}
                realIndex={realIndex}
                onRemove={() => removeFromQueue(realIndex)}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
