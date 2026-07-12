import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SongDetailed } from "../types";

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  songIds: string[];
}

interface LibraryState {
  liked: SongDetailed[];
  recent: SongDetailed[];
  playlists: Playlist[];

  toggleLike: (song: SongDetailed) => void;
  isLiked: (id: string) => boolean;
  pushRecent: (song: SongDetailed) => void;

  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, song: SongDetailed) => void;
  removeFromPlaylist: (playlistId: string, videoId: string) => void;
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void;
  isInPlaylist: (playlistId: string, videoId: string) => boolean;
  getPlaylistSongs: (playlistId: string, allSongs: SongDetailed[]) => SongDetailed[];
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      liked: [],
      recent: [],
      playlists: [],

      toggleLike: (song) => {
        const exists = get().liked.find((s) => s.videoId === song.videoId);
        set({
          liked: exists
            ? get().liked.filter((s) => s.videoId !== song.videoId)
            : [song, ...get().liked],
        });
      },
      isLiked: (id) => !!get().liked.find((s) => s.videoId === id),
      pushRecent: (song) => {
        const filtered = get().recent.filter((s) => s.videoId !== song.videoId);
        set({ recent: [song, ...filtered].slice(0, 30) });
      },

      createPlaylist: (name) => {
        const p: Playlist = {
          id: `pl_${uid()}`,
          name: name.trim() || "Untitled",
          createdAt: Date.now(),
          songIds: [],
        };
        set({ playlists: [p, ...get().playlists] });
        return p;
      },
      deletePlaylist: (id) => {
        set({ playlists: get().playlists.filter((p) => p.id !== id) });
      },
      renamePlaylist: (id, name) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === id ? { ...p, name: name.trim() || p.name } : p,
          ),
        });
      },
      addToPlaylist: (playlistId, song) => {
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== playlistId) return p;
            if (p.songIds.includes(song.videoId)) return p;
            return { ...p, songIds: [...p.songIds, song.videoId] };
          }),
        });
      },
      removeFromPlaylist: (playlistId, videoId) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songIds: p.songIds.filter((id) => id !== videoId) }
              : p,
          ),
        });
      },
      reorderPlaylist: (playlistId, fromIndex, toIndex) => {
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const ids = [...p.songIds];
            const [moved] = ids.splice(fromIndex, 1);
            ids.splice(toIndex, 0, moved);
            return { ...p, songIds: ids };
          }),
        });
      },
      isInPlaylist: (playlistId, videoId) => {
        const p = get().playlists.find((x) => x.id === playlistId);
        return p?.songIds.includes(videoId) ?? false;
      },
      getPlaylistSongs: (playlistId, allSongs) => {
        const p = get().playlists.find((x) => x.id === playlistId);
        if (!p) return [];
        const map = new Map(allSongs.map((s) => [s.videoId, s]));
        const fromLibrary = get().liked;
        const fromRecent = get().recent;
        const all = [...fromLibrary, ...fromRecent, ...allSongs];
        const allMap = new Map(all.map((s) => [s.videoId, s]));
        return p.songIds
          .map((id) => allMap.get(id) ?? map.get(id))
          .filter((s): s is SongDetailed => !!s);
      },
    }),
    { name: "musico-library" },
  ),
);

