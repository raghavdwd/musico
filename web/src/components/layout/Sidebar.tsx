import { NavLink, useNavigate } from "react-router-dom";
import {
  RiHome5Line,
  RiSearch2Line,
  RiHeart3Line,
  RiTimeLine,
  RiAddLine,
  RiMusic2Line,
} from "react-icons/ri";
import { Command } from "cmdk";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import * as api from "../../api";
import { useLibrary } from "../../lib/library";
import { WobbleLoader } from "../ui/Loaders";

export default function Sidebar() {
  const { liked, recent, playlists, createPlaylist } = useLibrary();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <aside className="hidden w-64 flex-shrink-0 border-r border-bark/40 bg-ash p-4 md:flex md:flex-col">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="h-7 w-7 rounded-full bg-ember" />
          <span className="font-display text-xl tracking-tight text-snow">Musico</span>
        </div>

        <nav className="space-y-0.5">
          <NavItem to="/" icon={<RiHome5Line />} label="Home" />
          <NavItem to="/search" icon={<RiSearch2Line />} label="Search" />
        </nav>

        <div className="mt-8 flex-1 overflow-y-auto">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-mist">Library</span>
            <button
              onClick={() => {
                const p = createPlaylist("My playlist");
                navigate(`/playlist/local/${p.id}`);
              }}
              className="rounded-md p-1 text-mist hover:bg-bark/60 hover:text-snow"
              aria-label="Create playlist"
            >
              <RiAddLine />
            </button>
          </div>
          <NavItem to="/liked" icon={<RiHeart3Line />} label="Liked Songs" count={liked.length} />
          <NavItem to="/recent" icon={<RiTimeLine />} label="Recent" count={recent.length} />

          {playlists.length > 0 && (
            <>
              <div className="mt-4 mb-1 px-2 font-mono text-[10px] uppercase tracking-widest text-mist">
                Playlists
              </div>
              {playlists.map((p) => (
                <NavItem
                  key={p.id}
                  to={`/playlist/local/${p.id}`}
                  icon={<RiMusic2Line />}
                  label={p.name}
                  count={p.songIds.length}
                />
              ))}
            </>
          )}
        </div>
      </aside>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={(to) => {
          setPaletteOpen(false);
          navigate(to);
        }}
      />
    </>
  );
}

function NavItem({ to, icon, label, count }: { to: string; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-bark/80 font-medium text-snow"
            : "text-mist hover:bg-bark/60 hover:text-snow"
        }`
      }
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-auto font-mono text-[10px] text-mist">{count}</span>
      )}
    </NavLink>
  );
}

function CommandPalette({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (to: string) => void;
}) {
  const [q, setQ] = useState("");
  const { data: results, isFetching } = useQuery({
    queryKey: ["cmdk-search", q],
    queryFn: () => api.search(q),
    enabled: q.length > 1,
  });

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-void/80 pt-24 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <Command
        label="Search"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-bark bg-ash shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-bark/60 px-4 py-3">
          <RiSearch2Line className="text-mist" />
          <Command.Input
            value={q}
            onValueChange={setQ}
            placeholder="Search songs, artists, albums, playlists..."
            className="flex-1 bg-transparent text-snow placeholder:text-mist focus:outline-none"
          />
          <kbd className="rounded border border-bark bg-bark/60 px-1.5 py-0.5 font-mono text-[10px] text-mist">esc</kbd>
        </div>
        <Command.List className="max-h-96 overflow-y-auto p-2">
          <Command.Empty className="p-6 text-center text-sm text-mist">
            {isFetching ? <div className="flex justify-center"><WobbleLoader size={24} /></div> : "No results."}
          </Command.Empty>

          {q.length <= 1 && (
            <>
              <Command.Group heading="Navigate" className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-mist">
                <Command.Item
                  onSelect={() => onSelect("/")}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-snow aria-selected:bg-bark/60"
                >
                  <RiHome5Line /> Home
                </Command.Item>
                <Command.Item
                  onSelect={() => onSelect("/liked")}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-snow aria-selected:bg-bark/60"
                >
                  <RiHeart3Line /> Liked songs
                </Command.Item>
              </Command.Group>
            </>
          )}

          {results && results.length > 0 && (
            <>
              {results.filter((r) => r.type === "SONG").slice(0, 5).map((r: any) => (
                <Command.Item
                  key={r.videoId}
                  onSelect={() => onSelect(`/song/${r.videoId}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 aria-selected:bg-bark/60"
                >
                  <img src={r.thumbnails?.[0]?.url} alt="" className="h-8 w-8 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-snow">{r.name}</div>
                    <div className="truncate text-xs text-mist">Song · {r.artist.name}</div>
                  </div>
                </Command.Item>
              ))}
              {results.filter((r) => r.type === "ARTIST").slice(0, 3).map((r: any) => (
                <Command.Item
                  key={r.artistId}
                  onSelect={() => onSelect(`/artist/${r.artistId}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 aria-selected:bg-bark/60"
                >
                  <img src={r.thumbnails?.[0]?.url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-snow">{r.name}</div>
                    <div className="truncate text-xs text-mist">Artist</div>
                  </div>
                </Command.Item>
              ))}
              {results.filter((r) => r.type === "ALBUM").slice(0, 3).map((r: any) => (
                <Command.Item
                  key={r.albumId}
                  onSelect={() => onSelect(`/album/${r.albumId}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 aria-selected:bg-bark/60"
                >
                  <img src={r.thumbnails?.[0]?.url} alt="" className="h-8 w-8 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-snow">{r.name}</div>
                    <div className="truncate text-xs text-mist">Album · {r.artist.name}</div>
                  </div>
                </Command.Item>
              ))}
            </>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
