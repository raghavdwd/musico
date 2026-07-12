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
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  expand: () => void;
  collapse: () => void;
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

    load: async (song, queue) => {
      const audio = ensureAudio();
      const q = queue ?? [song];
      const idx = q.findIndex((s) => s.videoId === song.videoId);

      // Mark this song as current + loading right away
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
        // isPlaying is set by the onplay event handler,
        // but also set it explicitly as a fallback in case the event is delayed
        set({ isLoading: false, isPlaying: true });
      } catch (err) {
        console.error("Failed to play song:", err);
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
        get().load(queue[queueIndex + 1]!, queue);
      }
    },

    prev: () => {
      const { queue, queueIndex, progress, audio } = get();
      if (progress > 3) {
        if (audio) audio.currentTime = 0;
        return;
      }
      if (queueIndex > 0) {
        get().load(queue[queueIndex - 1]!, queue);
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
  };
});
