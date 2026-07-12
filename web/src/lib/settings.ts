import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "system";
export type AccentKey = "ember" | "rose" | "violet" | "teal" | "amber";
export type Quality = "auto" | "high" | "medium" | "low";

export interface AccentPreset {
  ember: string;
  emberSoft: string;
}

export const ACCENTS: Record<AccentKey, AccentPreset> = {
  ember: { ember: "#e85d3b", emberSoft: "#c84a2e" },
  rose: { ember: "#e84d8a", emberSoft: "#c83e72" },
  violet: { ember: "#8b5cf6", emberSoft: "#7c3aed" },
  teal: { ember: "#2dd4bf", emberSoft: "#14b8a6" },
  amber: { ember: "#f59e0b", emberSoft: "#d97706" },
};

interface SettingsState {
  theme: ThemeMode;
  accent: AccentKey;
  defaultVolume: number;
  crossfade: number;
  autoplayOnLoad: boolean;
  quality: Quality;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  setDefaultVolume: (v: number) => void;
  setCrossfade: (seconds: number) => void;
  setAutoplayOnLoad: (v: boolean) => void;
  setQuality: (quality: Quality) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      accent: "ember",
      defaultVolume: 1,
      crossfade: 0,
      autoplayOnLoad: false,
      quality: "auto",
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setDefaultVolume: (defaultVolume) => set({ defaultVolume }),
      setCrossfade: (crossfade) => set({ crossfade: Math.max(0, crossfade) }),
      setAutoplayOnLoad: (autoplayOnLoad) => set({ autoplayOnLoad }),
      setQuality: (quality) => set({ quality }),
    }),
    { name: "musico-settings" },
  ),
);
