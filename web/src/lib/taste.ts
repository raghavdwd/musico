import { create } from "zustand";
import type { ArtistDetailed, SongDetailed } from "../types";

const STORAGE_KEY = "musico-taste";

export interface TasteProfile {
  favoriteArtists: ArtistDetailed[];
  favoriteSongs: SongDetailed[];
}

interface TasteState {
  profile: TasteProfile | null;
  seenSetup: boolean;
  skippedSetup: boolean;
  markSetupSeen: () => void;
  saveProfile: (profile: TasteProfile) => void;
  removeFavoriteArtist: (artistId: string) => void;
  removeFavoriteSong: (videoId: string) => void;
  skipSetup: () => void;
  clearProfile: () => void;
}

type StoredTasteState = Pick<TasteState, "profile" | "seenSetup" | "skippedSetup">;

function loadTasteState(): StoredTasteState {
  if (typeof window === "undefined") {
    return {
      profile: null,
      seenSetup: false,
      skippedSetup: false,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        profile: null,
        seenSetup: false,
        skippedSetup: false,
      };
    }

    const parsed = JSON.parse(raw) as Partial<StoredTasteState>;
    return {
      profile: parsed.profile ?? null,
      seenSetup: parsed.seenSetup ?? !!parsed.profile,
      skippedSetup: parsed.skippedSetup ?? false,
    };
  } catch {
    return {
      profile: null,
      seenSetup: false,
      skippedSetup: false,
    };
  }
}

function saveTasteState(state: StoredTasteState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to persist taste state:", err);
  }
}

function uniqById<T extends { videoId?: string; artistId?: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = item.videoId ?? item.artistId;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

const initial = loadTasteState();

export const useTaste = create<TasteState>((set, get) => ({
  profile: initial.profile,
  seenSetup: initial.seenSetup,
  skippedSetup: initial.skippedSetup,
  markSetupSeen: () => {
    if (get().seenSetup) return;
    set((state) => {
      const next = { ...state, seenSetup: true };
      saveTasteState({
        profile: next.profile,
        seenSetup: next.seenSetup,
        skippedSetup: next.skippedSetup,
      });
      return next;
    });
  },
  saveProfile: (profile) => {
    const normalizedProfile: TasteProfile = {
      favoriteArtists: uniqById(profile.favoriteArtists),
      favoriteSongs: uniqById(profile.favoriteSongs),
    };
    console.debug("[DEBUG-taste] saveProfile", {
      artists: normalizedProfile.favoriteArtists.map((artist) => artist.name),
      songs: normalizedProfile.favoriteSongs.map((song) => song.name),
    });
    set((state) => {
      const next = {
        ...state,
        profile: normalizedProfile,
        seenSetup: true,
        skippedSetup: false,
      };
      saveTasteState({
        profile: next.profile,
        seenSetup: next.seenSetup,
        skippedSetup: next.skippedSetup,
      });
      return next;
    });
  },
  removeFavoriteArtist: (artistId) => {
    const profile = get().profile;
    if (!profile) return;
    set((state) => {
      const next = {
        ...state,
        profile: {
          ...profile,
          favoriteArtists: profile.favoriteArtists.filter(
            (a) => a.artistId !== artistId,
          ),
        },
      };
      saveTasteState({
        profile: next.profile,
        seenSetup: next.seenSetup,
        skippedSetup: next.skippedSetup,
      });
      return next;
    });
  },
  removeFavoriteSong: (videoId) => {
    const profile = get().profile;
    if (!profile) return;
    set((state) => {
      const next = {
        ...state,
        profile: {
          ...profile,
          favoriteSongs: profile.favoriteSongs.filter((s) => s.videoId !== videoId),
        },
      };
      saveTasteState({
        profile: next.profile,
        seenSetup: next.seenSetup,
        skippedSetup: next.skippedSetup,
      });
      return next;
    });
  },
  skipSetup: () => {
    console.debug("[DEBUG-taste] skipSetup");
    set((state) => {
      const next = {
        ...state,
        seenSetup: true,
        skippedSetup: true,
      };
      saveTasteState({
        profile: next.profile,
        seenSetup: next.seenSetup,
        skippedSetup: next.skippedSetup,
      });
      return next;
    });
  },
  clearProfile: () => {
    console.debug("[DEBUG-taste] clearProfile");
    set((state) => {
      const next = {
        ...state,
        profile: null,
        seenSetup: false,
        skippedSetup: false,
      };
      saveTasteState({
        profile: next.profile,
        seenSetup: next.seenSetup,
        skippedSetup: next.skippedSetup,
      });
      return next;
    });
  },
}));
