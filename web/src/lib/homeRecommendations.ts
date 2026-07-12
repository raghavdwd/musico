import { create } from "zustand";
import type { HomeSection, SongDetailed } from "../types";
import { useLibrary } from "./library";
import { useTaste } from "./taste";
import { buildRecommendedSongs } from "./recommendations";

interface HomeRecommendationsState {
  sections: HomeSection[];
  allSongs: SongDetailed[];
  recommendedSongs: SongDetailed[];
  updatedAt: number;
  setSections: (sections: HomeSection[]) => void;
  refresh: () => void;
}

function computeRecommendations(sections: HomeSection[]) {
  const library = useLibrary.getState();
  const taste = useTaste.getState();

  return buildRecommendedSongs({
    sections,
    liked: library.liked,
    recent: library.recent,
    playlists: library.playlists,
    getPlaylistSongs: library.getPlaylistSongs,
    profile: taste.profile,
  });
}

export const useHomeRecommendations = create<HomeRecommendationsState>((set, get) => ({
  sections: [],
  allSongs: [],
  recommendedSongs: [],
  updatedAt: 0,
  setSections: (sections) => {
    const next = computeRecommendations(sections);
    set({
      sections,
      allSongs: next.allSongs,
      recommendedSongs: next.recommendedSongs,
      updatedAt: Date.now(),
    });
  },
  refresh: () => {
    const sections = get().sections;
    const next = computeRecommendations(sections);
    set({
      allSongs: next.allSongs,
      recommendedSongs: next.recommendedSongs,
      updatedAt: Date.now(),
    });
  },
}));

if (typeof window !== "undefined") {
  const sync = () => {
    const sections = useHomeRecommendations.getState().sections;
    if (sections.length === 0) return;
    useHomeRecommendations.getState().refresh();
  };

  useLibrary.subscribe(sync);
  useTaste.subscribe(sync);
}
