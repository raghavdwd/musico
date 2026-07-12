import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
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
import { RiPlayFill, RiDeleteBinLine, RiArrowLeftLine } from "react-icons/ri";
import { useLibrary } from "../lib/library";
import { usePlayer } from "../lib/store";
import { useLikedAndRecent } from "../hooks/useLibraryData";
import { formatTime } from "../lib/format";
import PlaylistCover from "../components/ui/PlaylistCover";
import type { SongDetailed } from "../types";

function SortableSong({
  song,
  index,
  queue,
  onRemove,
}: {
  song: SongDetailed;
  index: number;
  queue: SongDetailed[];
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.videoId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const { load, current, isPlaying, toggle } = usePlayer();
  const isCurrent = current?.videoId === song.videoId;
  const play = () => (isCurrent ? toggle() : load(song, queue));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[24px_auto_1fr_60px_40px] items-center gap-3 rounded-md px-2 py-1.5 hover:bg-bark/60"
    >
      <button onClick={play} className="flex h-6 w-6 items-center justify-center text-mist hover:text-snow">
        {isCurrent && isPlaying ? <span className="text-ember">▌▌</span> : <RiPlayFill />}
      </button>
      <span {...attributes} {...listeners} className="cursor-grab select-none font-mono text-xs text-mist active:cursor-grabbing">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className={`truncate text-sm ${isCurrent ? "text-ember" : "text-snow"}`}>{song.name}</span>
      <span className="font-mono text-xs tabular-nums text-mist">
        {song.duration ? formatTime(song.duration) : ""}
      </span>
      <button
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center rounded-full text-mist opacity-0 transition-colors hover:text-ember group-hover:opacity-100"
        aria-label="Remove from playlist"
      >
        <RiDeleteBinLine />
      </button>
    </div>
  );
}

export default function LocalPlaylist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playlists, getPlaylistSongs, deletePlaylist, removeFromPlaylist, reorderPlaylist } = useLibrary();
  const { load } = usePlayer();
  const allSongs = useLikedAndRecent();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const playlist = playlists.find((p) => p.id === id);
  if (!playlist) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-mist">
        <p>Playlist not found.</p>
        <button
          onClick={() => navigate("/")}
          className="rounded-full border border-bark bg-ash/60 px-4 py-2 text-sm text-snow transition-colors hover:bg-bark/60"
        >
          Go home
        </button>
      </div>
    );
  }

  const songs = getPlaylistSongs(playlist.id, allSongs);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = playlist.songIds.indexOf(active.id as string);
    const to = playlist.songIds.indexOf(over.id as string);
    if (from === -1 || to === -1) return;
    reorderPlaylist(playlist.id, from, to);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-sm text-mist transition-colors hover:text-snow"
      >
        <RiArrowLeftLine /> Back
      </button>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
        <PlaylistCover songs={songs} size={200} />
        <div className="flex-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ember">Playlist</div>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-snow md:text-5xl">
            {playlist.name}
          </h1>
          <div className="mt-2 text-sm text-mist">{songs.length} songs</div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => songs.length > 0 && load(songs[0]!, songs)}
              disabled={songs.length === 0}
              className="flex items-center gap-2 rounded-full bg-ember px-5 py-2 text-sm font-semibold text-void transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RiPlayFill /> Play
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 rounded-full border border-bark bg-ash/60 px-5 py-2 text-sm text-mist transition-colors hover:border-ember/60 hover:text-ember"
            >
              <RiDeleteBinLine /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 group">
        {songs.length === 0 ? (
          <p className="text-mist">
            This playlist is empty. Click <span className="text-snow">Add songs</span> to add some.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={playlist.songIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {songs.map((song, i) => (
                  <SortableSong
                    key={song.videoId}
                    song={song}
                    index={i}
                    queue={songs}
                    onRemove={() => removeFromPlaylist(playlist.id, song.videoId)}
                  />
                ))}
               </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-bark bg-ash p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl text-snow">Delete playlist?</h3>
            <p className="mt-2 text-sm text-mist">
              "{playlist.name}" and its {songs.length} songs will be removed from your library.
              The songs themselves stay in your Liked and Recent.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-full px-4 py-2 text-sm text-mist hover:text-snow"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deletePlaylist(playlist.id);
                  navigate("/");
                }}
                className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-void hover:scale-105 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
