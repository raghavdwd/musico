import { create } from "zustand";
import { getStreamUrl } from "../api";
import type { SongDetailed } from "../types";

interface PlayerState {
  current: SongDetailed | null;
  queue: SongDetailed[];
  queueIndex: number;
  isPlaying: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  volume: number;
  audio: HTMLAudioElement | null;
  load: (song: SongDetailed, queue?: SongDetailed[]) => Promise<void>;
  addToQueue: (song: SongDetailed) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  expand: () => void;
  collapse: () => void;
  isQueueOpen: boolean;
  openQueue: () => void;
  closeQueue: () => void;
  prepareFromStorage: () => Promise<void>;
}

export const usePlayer = create<PlayerState>((set, get) => {
  const ensureAudio = (): HTMLAudioElement => {
    let audio = get().audio;
    if (!audio) {
      audio = new Audio();
      audio.ontimeupdate = () => {
        set({ progress: audio!.currentTime, duration: audio!.duration || 0 });
      };
      audio.onended = () => get().next();
      audio.onplay = () => set({ isPlaying: true });
      audio.onpause = () => set({ isPlaying: false });
      audio.onwaiting = () => set({ isLoading: true });
      audio.onplaying = () => set({ isLoading: false });
      audio.oncanplay = () => set({ isLoading: false });
      set({ audio });
    }
    return audio;
  };

  return {
    current: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    isExpanded: false,
    isLoading: false,
    progress: 0,
    duration: 0,
    volume: 1,
    audio: null,

    addToQueue: (song) => {
      const { queue, queueIndex, current } = get();
      if (!current) {
        get().load(song, [song]);
        return;
      }
      const q = [...queue];
      q.splice(queueIndex + 1, 0, song);
      set({ queue: q });
    },

    removeFromQueue: (index) => {
      const { queue, queueIndex } = get();
      if (index < 0 || index >= queue.length) return;
      const q = queue.filter((_, i) => i !== index);
      const newIdx = index < queueIndex ? queueIndex - 1 : queueIndex;
      set({ queue: q, queueIndex: newIdx < 0 ? 0 : Math.min(newIdx, q.length - 1) });
    },

    reorderQueue: (fromIndex, toIndex) => {
      const { queue, queueIndex } = get();
      if (fromIndex < 0 || fromIndex >= queue.length) return;
      if (toIndex < 0 || toIndex >= queue.length) return;
      if (fromIndex === toIndex) return;

      const q = [...queue];
      const [moved] = q.splice(fromIndex, 1);
      q.splice(toIndex, 0, moved);

      let newIdx = queueIndex;
      if (fromIndex === queueIndex) {
        newIdx = toIndex;
      } else if (fromIndex < queueIndex && toIndex >= queueIndex) {
        newIdx = queueIndex - 1;
      } else if (fromIndex > queueIndex && toIndex <= queueIndex) {
        newIdx = queueIndex + 1;
      }

      set({ queue: q, queueIndex: newIdx });
    },

    clearQueue: () => {
      const { current } = get();
      if (current) {
        set({ queue: [current], queueIndex: 0 });
      } else {
        set({ queue: [], queueIndex: -1 });
      }
    },

    load: async (song, queue) => {
      // Safety check — prevent setting a null/undefined current
      if (!song) {
        console.warn("load called with no song");
        return;
      }

      const audio = ensureAudio();
      const q = queue ?? [song];
      const idx = q.findIndex((s) => s.videoId === song.videoId);

      set({
        current: song,
        queue: q,
        queueIndex: idx,
        isLoading: true,
        progress: 0,
        duration: 0,
      });

      try {
        const streamUrl = await getStreamUrl(song.videoId);
        audio.volume = get().volume;
        audio.src = streamUrl;
        await audio.play();
        set({ isLoading: false, isPlaying: true });
      } catch (err) {
        console.error("Failed to play song:", err);
        set({ isLoading: false });
      }
    },

    prepareFromStorage: async () => {
      const { current, queue, queueIndex, progress, volume } = get();
      if (!current) return;

      const audio = ensureAudio();
      audio.volume = volume;
      set({ isLoading: true, isExpanded: false });

      try {
        const streamUrl = await getStreamUrl(current.videoId);
        audio.src = streamUrl;
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          if (progress > 0 && isFinite(audio.duration) && progress < audio.duration) {
            audio.currentTime = progress;
          }
        };
        audio.addEventListener("canplay", onCanPlay);
        set({ isLoading: false });
      } catch (err) {
        console.error("Failed to restore playback:", err);
        set({ isLoading: false });
      }
    },

    toggle: () => {
      const audio = get().audio;
      if (!audio || !get().current) return;
      if (audio.paused) audio.play();
      else audio.pause();
    },

    next: () => {
      const { queue, queueIndex } = get();
      if (queueIndex < queue.length - 1) {
        const nextSong = queue[queueIndex + 1];
        if (nextSong) {
          get().load(nextSong, queue);
        }
      }
    },

    prev: () => {
      const { queue, queueIndex, progress, audio } = get();
      if (progress > 3) {
        if (audio) audio.currentTime = 0;
        return;
      }
      if (queueIndex > 0) {
        const prevSong = queue[queueIndex - 1];
        if (prevSong) {
          get().load(prevSong, queue);
        }
      }
    },

    seek: (t) => {
      const audio = get().audio;
      if (audio) audio.currentTime = t;
      set({ progress: t });
    },

    setVolume: (v) => {
      const audio = get().audio;
      if (audio) audio.volume = v;
      set({ volume: v });
    },

    expand: () => set({ isExpanded: true }),
    collapse: () => set({ isExpanded: false }),

    isQueueOpen: false,
    openQueue: () => set({ isQueueOpen: true }),
    closeQueue: () => set({ isQueueOpen: false }),
  };
});

// ─── Manual persistence (avoiding persist middleware to prevent potential state conflicts) ───

const STORAGE_KEY = "musico-player";

function saveToStorage(state: PlayerState) {
  try {
    const data = JSON.stringify({
      current: state.current,
      queue: state.queue,
      queueIndex: state.queueIndex,
      progress: state.progress,
      volume: state.volume,
    });
    localStorage.setItem(STORAGE_KEY, data);
  } catch (err) {
    console.warn("Failed to persist player state:", err);
  }
}

function loadFromStorage(): Partial<PlayerState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return {
      current: parsed.current ?? null,
      queue: parsed.queue ?? [],
      queueIndex: parsed.queueIndex ?? -1,
      progress: parsed.progress ?? 0,
      volume: parsed.volume ?? 1,
    };
  } catch (err) {
    console.warn("Failed to restore player state:", err);
    return null;
  }
}

// Restore saved state immediately (synchronous, before React renders)
const saved = loadFromStorage();
if (saved) {
  usePlayer.setState({
    current: saved.current,
    queue: saved.queue,
    queueIndex: saved.queueIndex,
    progress: saved.progress,
    volume: saved.volume,
  });
}

// Persist critical changes immediately, debounce progress-only updates
let progressTimer: ReturnType<typeof setTimeout> | null = null;
let lastSaved = "";
usePlayer.subscribe((state) => {
  const snapshot = JSON.stringify({
    current: state.current?.videoId,
    queueLen: state.queue.length,
    queueIndex: state.queueIndex,
    volume: state.volume,
  });
  if (snapshot !== lastSaved) {
    lastSaved = snapshot;
    // Critical fields changed — save immediately
    saveToStorage(state);
    if (progressTimer) clearTimeout(progressTimer);
  } else {
    // Only progress/timing changed — debounce
    if (progressTimer) clearTimeout(progressTimer);
    progressTimer = setTimeout(() => saveToStorage(state), 2000);
  }
});
