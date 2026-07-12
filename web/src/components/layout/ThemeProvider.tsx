import { useEffect, useRef } from "react";
import { useSettings, ACCENTS } from "../../lib/settings";

function resolveTheme(mode: "dark" | "light" | "system"): "dark" | "light" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return mode;
}

export default function ThemeProvider() {
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  const mqlRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(useSettings.getState().theme);
      document.documentElement.dataset.theme = resolved;
    };
    apply();

    const mql = window.matchMedia("(prefers-color-scheme: light)");
    mqlRef.current = mql;
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    const { ember, emberSoft } = ACCENTS[accent];
    document.documentElement.style.setProperty("--color-ember", ember);
    document.documentElement.style.setProperty("--color-ember-soft", emberSoft);
  }, [accent]);

  return null;
}
