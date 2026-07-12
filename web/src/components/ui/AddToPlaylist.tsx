import { useState, useEffect } from "react";
import { RiCheckLine, RiAddLine, RiMusic2Line } from "react-icons/ri";
import { useLibrary } from "../../lib/library";
import { useUI } from "../../lib/ui";

export default function AddToPlaylist() {
  const song = useUI((s) => s.addToPlaylistSong);
  const onClose = useUI((s) => s.closeAddToPlaylist);
  const { playlists, createPlaylist, addToPlaylist, isInPlaylist, removeFromPlaylist } = useLibrary();
  const [name, setName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!song) {
      setName("");
      setShowCreate(false);
    }
  }, [song]);

  useEffect(() => {
    if (!song) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [song, onClose]);

  if (!song) return null;

  const handleCreate = () => {
    const p = createPlaylist(name || "Untitled");
    addToPlaylist(p.id, song);
    setName("");
    setShowCreate(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-bark bg-ash shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-bark/60 p-4">
          <RiMusic2Line className="text-ember" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-snow">{song.name}</div>
            <div className="truncate text-xs text-mist">{song.artist.name}</div>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {playlists.length === 0 && !showCreate && (
            <p className="px-2 py-6 text-center text-sm text-mist">
              No playlists yet. Create one below.
            </p>
          )}

          {playlists.map((p) => {
            const added = isInPlaylist(p.id, song.videoId);
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (added) {
                    removeFromPlaylist(p.id, song.videoId);
                  } else {
                    addToPlaylist(p.id, song);
                    onClose();
                  }
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-bark/60"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-bark text-mist">
                  <RiMusic2Line />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-snow">{p.name}</div>
                  <div className="text-xs text-mist">{p.songIds.length} songs</div>
                </div>
                {added ? (
                  <RiCheckLine className="text-ember" />
                ) : (
                  <RiAddLine className="text-mist" />
                )}
              </button>
            );
          })}

          {showCreate ? (
            <div className="mt-2 flex gap-2 p-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                placeholder="Playlist name"
                className="flex-1 rounded-md border border-bark bg-void px-3 py-2 text-sm text-snow placeholder:text-mist focus:border-ember focus:outline-none"
              />
              <button
                onClick={handleCreate}
                className="rounded-md bg-ember px-4 py-2 text-sm font-semibold text-void hover:scale-105 active:scale-95"
              >
                Create
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-ember transition-colors hover:bg-bark/60"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-dashed border-ember">
                <RiAddLine />
              </div>
              <span className="text-sm">New playlist</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
