import { create } from "zustand";
import type { SongDetailed } from "../types";

interface UIState {
  addToPlaylistSong: SongDetailed | null;
  openAddToPlaylist: (song: SongDetailed) => void;
  closeAddToPlaylist: () => void;
}

export const useUI = create<UIState>((set) => ({
  addToPlaylistSong: null,
  openAddToPlaylist: (song) => set({ addToPlaylistSong: song }),
  closeAddToPlaylist: () => set({ addToPlaylistSong: null }),
}));
