import { create } from "zustand";
import { getStreamUrl, getRadio } from "../api";
import type { SongDetailed } from "../types";
import { useSettings } from "./settings";

// Web Audio graph: a single gain node routes the HTMLAudioElement so volume
// and crossfade can be applied programmatically.
let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;

function getGain(): GainNode | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
  }
  return gainNode;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const RADIO_REFRESH_THRESHOLD = 3;
type RepeatMode = "off" | "one" | "all";

type SongLike = Partial<SongDetailed> & {
  artists?: ArtistLike[];
};

type ArtistLike = {
  artistId?: string | null;
  id?: string | null;
  name?: string;
};

function normalizeSong(song: SongLike | null | undefined): SongDetailed | null {
  if (!song?.videoId || !song.name) return null;
  const artist = (song.artist ?? song.artists?.[0]) as ArtistLike | undefined;
  if (!artist?.name) return null;

  return {
    type: "SONG",
    videoId: song.videoId,
    name: song.name,
    artist: {
      artistId: artist.artistId ?? artist.id ?? null,
      name: artist.name,
    },
    album: song.album ?? null,
    duration: song.duration ?? null,
    thumbnails: song.thumbnails ?? [],
  };
}

interface PlayerState {
  current: SongDetailed | null;
  queue: SongDetailed[];
  queueIndex: number;
  isPlaying: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  repeatMode: RepeatMode;
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
  isRadio: boolean;
  radioSeed: SongDetailed | null;
  startRadio: (song: SongDetailed) => Promise<void>;
  stopRadio: () => void;
  cycleRepeatMode: () => void;
  prepareFromStorage: () => Promise<void>;
}

export const usePlayer = create<PlayerState>((set, get) => {
  const ensureAudio = (): HTMLAudioElement => {
    let audio = get().audio;
    if (!audio) {
      audio = new Audio();
      const gain = getGain();
      if (gain) {
        try {
          const source = audioCtx!.createMediaElementSource(audio);
          source.connect(gain);
        } catch {
          // createMediaElementSource throws if called twice on the same element;
          // safe to ignore since we only create audio once.
        }
      }
      audio.ontimeupdate = () => {
        set({ progress: audio!.currentTime, duration: audio!.duration || 0 });
      };
      audio.onended = () => {
        if (get().repeatMode === "one" && get().current) {
          if (!audio) return;
          const player = audio;
          player.currentTime = 0;
          void player.play();
          set({ progress: 0, isPlaying: true });
          return;
        }
        get().next();
      };
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
    repeatMode: "off",
    progress: 0,
    duration: 0,
    volume: 1,
    audio: null,

    addToQueue: (song) => {
      const { queue, queueIndex, current } = get();
      const nextSong = normalizeSong(song);
      if (!nextSong) return;
      if (!current) {
        get().load(nextSong, [nextSong]);
        return;
      }
      const q = [...queue];
      q.splice(queueIndex + 1, 0, nextSong);
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
      const normalizedSong = normalizeSong(song);
      if (!normalizedSong) {
        console.warn("load called with no song");
        return;
      }

      const audio = ensureAudio();
      const q = (queue ?? [normalizedSong])
        .map((item) => normalizeSong(item))
        .filter((item): item is SongDetailed => item !== null);
      const queueItems = q.length > 0 ? q : [normalizedSong];
      const idx = queueItems.findIndex((s) => s.videoId === normalizedSong.videoId);

      set({
        current: normalizedSong,
        queue: queueItems,
        queueIndex: idx >= 0 ? idx : 0,
        isLoading: true,
        progress: 0,
        duration: 0,
      });

      try {
        const streamUrl = await getStreamUrl(
          normalizedSong.videoId,
          useSettings.getState().quality,
        );
        const gain = getGain();
        const crossfade = useSettings.getState().crossfade;
        const isTrackChange = get().current !== null;

        if (gain && crossfade > 0 && isTrackChange && audioCtx) {
          const now = audioCtx.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(get().volume, now);
          gain.gain.linearRampToValueAtTime(0, now + crossfade);
          await sleep(crossfade * 1000);
          audio.src = streamUrl;
          await audio.play();
          const after = audioCtx.currentTime;
          gain.gain.setValueAtTime(0, after);
          gain.gain.linearRampToValueAtTime(get().volume, after + crossfade);
        } else {
          if (gain) gain.gain.value = get().volume;
          else audio.volume = get().volume;
          audio.src = streamUrl;
          await audio.play();
        }
        set({ isLoading: false, isPlaying: true });
      } catch (err) {
        console.error("Failed to play song:", err);
        set({ isLoading: false });
      }
    },

    prepareFromStorage: async () => {
      const { current, progress, volume } = get();
      if (!current) return;

      const audio = ensureAudio();
      const gain = getGain();
      if (gain) gain.gain.value = volume;
      else audio.volume = volume;
      set({ isLoading: true, isExpanded: false });

      try {
        const streamUrl = await getStreamUrl(
          current.videoId,
          useSettings.getState().quality,
        );
        audio.src = streamUrl;
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          if (progress > 0 && isFinite(audio.duration) && progress < audio.duration) {
            audio.currentTime = progress;
          }
          if (useSettings.getState().autoplayOnLoad) {
            void audio.play();
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
      const { queue, queueIndex, isRadio, radioSeed, repeatMode } = get();
      if (queueIndex < queue.length - 1) {
        const nextSong = queue[queueIndex + 1];
        if (nextSong) {
          get().load(nextSong, queue);

          // Radio auto-refresh: if radio is active and queue is running low, fetch more
          if (isRadio && radioSeed && queueIndex + 1 >= queue.length - RADIO_REFRESH_THRESHOLD) {
            getRadio(radioSeed.videoId).then((radioSongs) => {
              const state = get();
              const freshRecs = radioSongs.filter(
                (s) => !state.queue.some((qs) => qs.videoId === s.videoId),
              );
              if (freshRecs.length > 0) {
                set({ queue: [...state.queue, ...freshRecs] });
              }
            }).catch((err) => {
              console.warn("Failed to refresh radio:", err);
            });
          }
        }
      } else if (repeatMode === "all" && queue.length > 0) {
        const firstSong = queue[0];
        if (firstSong) {
          get().load(firstSong, queue);
        }
      }
    },

    prev: () => {
      const { queue, queueIndex, progress, audio, repeatMode } = get();
      if (progress > 3) {
        if (audio) audio.currentTime = 0;
        return;
      }
      if (queueIndex > 0) {
        const prevSong = queue[queueIndex - 1];
        if (prevSong) {
          get().load(prevSong, queue);
        }
      } else if (repeatMode === "all" && queue.length > 0) {
        const lastSong = queue[queue.length - 1];
        if (lastSong) {
          get().load(lastSong, queue);
        }
      }
    },

    seek: (t) => {
      const audio = get().audio;
      if (audio) audio.currentTime = t;
      set({ progress: t });
    },

    setVolume: (v) => {
      const gain = getGain();
      if (gain) gain.gain.value = v;
      else {
        const audio = get().audio;
        if (audio) audio.volume = v;
      }
      set({ volume: v });
    },

    expand: () => set({ isExpanded: true }),
    collapse: () => set({ isExpanded: false }),

    isQueueOpen: false,
    openQueue: () => set({ isQueueOpen: true }),
    closeQueue: () => set({ isQueueOpen: false }),

    isRadio: false,
    radioSeed: null,

    cycleRepeatMode: () => {
      set((state) => ({
        repeatMode:
          state.repeatMode === "off"
            ? "one"
            : state.repeatMode === "one"
              ? "all"
              : "off",
      }));
    },

    startRadio: async (song) => {
      const normalizedSong = normalizeSong(song);
      if (!normalizedSong) return;
      set({ isRadio: true, radioSeed: normalizedSong, isLoading: true });

      try {
        const radioSongs = (await getRadio(normalizedSong.videoId))
          .map((item) => normalizeSong(item))
          .filter((item): item is SongDetailed => item !== null);
        const queue = [normalizedSong, ...radioSongs];
        get().load(normalizedSong, queue);
      } catch (err) {
        console.error("Failed to start radio:", err);
        set({ isRadio: false, radioSeed: null, isLoading: false });
      }
    },

    stopRadio: () => {
      set({ isRadio: false, radioSeed: null });
    },
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
        repeatMode: state.repeatMode,
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
    const parsed = JSON.parse(saved) as {
      current?: SongLike | null;
      queue?: unknown;
      queueIndex?: number;
      progress?: number;
      volume?: number;
      repeatMode?: RepeatMode;
      isRepeatOne?: boolean;
    };
    const current = normalizeSong(parsed.current);
    const queue = Array.isArray(parsed.queue)
      ? parsed.queue
          .map((item: unknown) => normalizeSong(item as SongLike))
          .filter((item): item is SongDetailed => item !== null)
      : [];
    const hydratedQueue = current
      ? (queue.some((song) => song.videoId === current.videoId) ? queue : [current, ...queue])
      : queue;
    return {
      current,
      queue: hydratedQueue,
      queueIndex: current
        ? hydratedQueue.findIndex((song: SongDetailed) => song.videoId === current.videoId)
        : parsed.queueIndex ?? -1,
      progress: parsed.progress ?? 0,
      volume: parsed.volume ?? 1,
      repeatMode: parsed.repeatMode ?? (parsed.isRepeatOne ? "one" : "off"),
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
    repeatMode: saved.repeatMode,
  });
} else {
  // No persisted player — seed volume from settings default.
  usePlayer.setState({ volume: useSettings.getState().defaultVolume });
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
    repeatMode: state.repeatMode,
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
