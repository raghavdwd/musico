import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiArrowRightSLine,
  RiCheckLine,
  RiDownload2Line,
  RiPushpinLine,
  RiSettings3Line,
  RiShuffleLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiUpload2Line,
} from "react-icons/ri";
import { toast } from "sonner";
import { useSettings, ACCENTS, type AccentKey, type ThemeMode, type Quality } from "../lib/settings";
import { useTaste } from "../lib/taste";
import { useLibrary } from "../lib/library";

type Tab = "appearance" | "playback" | "library";

const TABS: { key: Tab; label: string }[] = [
  { key: "appearance", label: "Appearance" },
  { key: "playback", label: "Playback" },
  { key: "library", label: "Library & data" },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>("appearance");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <RiSettings3Line className="text-2xl text-ember" />
        <h1 className="font-display text-3xl text-snow">Settings</h1>
      </div>

      <div className="mb-8 flex gap-1 border-b border-bark/40">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
              tab === t.key
                ? "border-ember font-medium text-snow"
                : "border-transparent text-mist hover:text-snow"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "appearance" && <AppearanceTab />}
      {tab === "playback" && <PlaybackTab />}
      {tab === "library" && <LibraryTab />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 rounded-xl border border-bark/40 bg-ash/40 p-5">
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-mist">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <div className="text-sm text-snow">{label}</div>
        {hint && <div className="text-xs text-mist">{hint}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function AppearanceTab() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const accent = useSettings((s) => s.accent);
  const setAccent = useSettings((s) => s.setAccent);
  const { profile } = useTaste();
  const navigate = useNavigate();

  const themes: { key: ThemeMode; label: string }[] = [
    { key: "dark", label: "Dark" },
    { key: "light", label: "Light" },
    { key: "system", label: "System" },
  ];

  return (
    <>
      <Section title="Theme">
        <div className="flex gap-2">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                theme === t.key
                  ? "border-ember bg-ember/10 text-snow"
                  : "border-bark/60 text-mist hover:text-snow"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Accent color">
        <div className="flex gap-3">
          {(Object.keys(ACCENTS) as AccentKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setAccent(key)}
              aria-label={key}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform ${
                accent === key ? "scale-110 ring-2 ring-snow ring-offset-2 ring-offset-ash" : ""
              }`}
              style={{ backgroundColor: ACCENTS[key].ember }}
            >
              {accent === key && <RiCheckLine className="text-void" />}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Taste profile">
        {profile ? (
          <div className="space-y-4">
            <TasteList
              heading="Favorite artists"
              items={profile.favoriteArtists.map((a) => ({
                id: a.artistId ?? "",
                name: a.name,
                thumb: a.thumbnails?.[0]?.url,
                onRemove: () => useTaste.getState().removeFavoriteArtist(a.artistId ?? ""),
              }))}
            />
            <TasteList
              heading="Favorite songs"
              items={profile.favoriteSongs.map((s) => ({
                id: s.videoId,
                name: s.name,
                sub: s.artist.name,
                thumb: s.thumbnails?.[0]?.url,
                onRemove: () => useTaste.getState().removeFavoriteSong(s.videoId),
              }))}
            />
            <button
              onClick={() => navigate("/taste-setup?returnTo=/settings")}
              className="flex items-center gap-2 rounded-lg border border-bark/60 px-3 py-2 text-sm text-mist hover:text-snow"
            >
              <RiShuffleLine /> Re-run taste setup
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/taste-setup?returnTo=/settings")}
            className="flex items-center gap-2 rounded-lg bg-ember px-3 py-2 text-sm font-medium text-void hover:bg-ember-soft"
          >
            Set up your taste <RiArrowRightSLine />
          </button>
        )}
      </Section>
    </>
  );
}

function TasteList({
  heading,
  items,
}: {
  heading: string;
  items: {
    id: string;
    name: string;
    sub?: string;
    thumb?: string;
    onRemove: () => void;
  }[];
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-mist">
        {heading} ({items.length})
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-mist">None yet.</div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-bark/40"
            >
              {it.thumb ? (
                <img
                  src={it.thumb}
                  alt=""
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-bark" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-snow">{it.name}</div>
                {it.sub && <div className="truncate text-xs text-mist">{it.sub}</div>}
              </div>
              <button
                onClick={it.onRemove}
                className="rounded p-1 text-mist hover:bg-bark hover:text-snow"
                aria-label={`Remove ${it.name}`}
              >
                <RiCloseLine />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaybackTab() {
  const defaultVolume = useSettings((s) => s.defaultVolume);
  const setDefaultVolume = useSettings((s) => s.setDefaultVolume);
  const crossfade = useSettings((s) => s.crossfade);
  const setCrossfade = useSettings((s) => s.setCrossfade);
  const autoplayOnLoad = useSettings((s) => s.autoplayOnLoad);
  const setAutoplayOnLoad = useSettings((s) => s.setAutoplayOnLoad);

  return (
    <>
      <Section title="Volume">
        <Row label="Default volume" hint="Applied when no saved player volume exists.">
          <div className="flex w-48 items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={defaultVolume}
              onChange={(e) => setDefaultVolume(Number(e.target.value))}
              className="flex-1 accent-ember"
            />
            <span className="w-9 text-right font-mono text-xs text-mist">
              {Math.round(defaultVolume * 100)}
            </span>
          </div>
        </Row>
      </Section>

      <Section title="Audio quality">
        <Row label="Stream quality" hint="Applies on the next track. Higher = more data.">
          <QualitySelector />
        </Row>
      </Section>

      <Section title="Crossfade">
        <Row label="Crossfade duration" hint="Fades out then in between tracks. 0 = off.">
          <div className="flex w-48 items-center gap-2">
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={crossfade}
              onChange={(e) => setCrossfade(Number(e.target.value))}
              className="flex-1 accent-ember"
            />
            <span className="w-12 text-right font-mono text-xs text-mist">
              {crossfade === 0 ? "off" : `${crossfade}s`}
            </span>
          </div>
        </Row>
      </Section>

      <Section title="Autoplay">
        <Row
          label="Autoplay on load"
          hint="Resume playback automatically when the app opens."
        >
          <Toggle on={autoplayOnLoad} onToggle={() => setAutoplayOnLoad(!autoplayOnLoad)} />
        </Row>
      </Section>
    </>
  );
}

function LibraryTab() {
  const { recent, clearRecent } = useLibrary();
  const navigate = useNavigate();
  const [storageBytes, setStorageBytes] = useState(0);

  const computeStorage = () => {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("musico-")) {
        bytes += (localStorage.getItem(k) ?? "").length;
      }
    }
    setStorageBytes(bytes);
  };

  const handleExport = () => {
    const data = {
      version: 1,
      taste: useTaste.getState().profile,
      library: {
        liked: useLibrary.getState().liked,
        recent: useLibrary.getState().recent,
        playlists: useLibrary.getState().playlists,
      },
      settings: {
        theme: useSettings.getState().theme,
        accent: useSettings.getState().accent,
        defaultVolume: useSettings.getState().defaultVolume,
        crossfade: useSettings.getState().crossfade,
        autoplayOnLoad: useSettings.getState().autoplayOnLoad,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "musico-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported your data");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.taste) useTaste.getState().saveProfile(parsed.taste);
        if (parsed.library) {
          useLibrary.setState({
            liked: parsed.library.liked ?? [],
            recent: parsed.library.recent ?? [],
            playlists: parsed.library.playlists ?? [],
          });
        }
        if (parsed.settings) {
          useSettings.setState({
            theme: parsed.settings.theme,
            accent: parsed.settings.accent,
            defaultVolume: parsed.settings.defaultVolume ?? 1,
            crossfade: parsed.settings.crossfade ?? 0,
            autoplayOnLoad: parsed.settings.autoplayOnLoad ?? false,
          });
        }
        toast.success("Imported your data");
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("musico-")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    toast.success("All local data cleared. Reloading…");
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <>
      <Section title="Storage">
        <Row label="Local storage used" hint="Liked songs, history, playlists, settings.">
          <button
            onClick={computeStorage}
            className="flex items-center gap-2 text-sm text-mist hover:text-snow"
          >
            <RiPushpinLine /> {storageBytes > 0 ? `${storageBytes} bytes` : "Calculate"}
          </button>
        </Row>
      </Section>

      <Section title="History">
        <Row label="Recently played" hint={`${recent.length} tracks.`}>
          <button
            onClick={() => {
              clearRecent();
              toast.success("Cleared recent history");
            }}
            className="flex items-center gap-2 rounded-lg border border-bark/60 px-3 py-2 text-sm text-mist hover:text-snow"
          >
            <RiDeleteBinLine /> Clear recent
          </button>
        </Row>
      </Section>

      <Section title="Backup">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleExport}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-bark/60 px-3 py-2.5 text-sm text-snow hover:bg-bark/40"
          >
            <RiDownload2Line /> Export data
          </button>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-bark/60 px-3 py-2.5 text-sm text-snow hover:bg-bark/40">
            <RiUpload2Line /> Import data
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </Section>

      <Section title="Danger zone">
        <Row label="Reset all data" hint="Permanently clears taste, library, and settings.">
          <button
            onClick={() => {
              if (window.confirm("Reset ALL local data? This cannot be undone.")) {
                handleReset();
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20"
          >
            <RiDeleteBinLine /> Reset everything
          </button>
        </Row>
        <div className="mt-3">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-mist underline hover:text-snow"
          >
            Return home
          </button>
        </div>
      </Section>
    </>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        on ? "bg-ember" : "bg-bark"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-snow transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function QualitySelector() {
  const quality = useSettings((s) => s.quality);
  const setQuality = useSettings((s) => s.setQuality);
  const options: { key: Quality; label: string }[] = [
    { key: "auto", label: "Auto" },
    { key: "high", label: "High" },
    { key: "medium", label: "Medium" },
    { key: "low", label: "Low" },
  ];
  return (
    <div className="flex gap-1 rounded-lg border border-bark/60 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => setQuality(o.key)}
          className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
            quality === o.key
              ? "bg-ember/15 font-medium text-snow"
              : "text-mist hover:text-snow"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
