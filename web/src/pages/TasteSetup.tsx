import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import {
  RiArrowRightLine,
  RiCheckLine,
  RiCloseLine,
  RiMusic2Line,
  RiSearch2Line,
  RiSparklingLine,
} from "react-icons/ri";
import * as api from "../api";
import type { ArtistDetailed, SearchResult, SongDetailed } from "../types";
import { useTaste } from "../lib/taste";
import { bestThumb } from "../lib/format";

function uniqSongs(items: SongDetailed[]) {
  const seen = new Set<string>();
  return items.filter((song) => {
    if (seen.has(song.videoId)) return false;
    seen.add(song.videoId);
    return true;
  });
}

function uniqArtists(items: ArtistDetailed[]) {
  const seen = new Set<string>();
  return items.filter((artist) => {
    if (seen.has(artist.artistId)) return false;
    seen.add(artist.artistId);
    return true;
  });
}

function artistsFromSongs(songs: SongDetailed[]) {
  const counts = new Map<string, { artist: ArtistDetailed; count: number }>();
  for (const song of songs) {
    if (!song.artist.artistId) continue;
    const existing = counts.get(song.artist.artistId);
    if (existing) existing.count += 1;
    else {
      counts.set(song.artist.artistId, {
        artist: {
          type: "ARTIST",
          artistId: song.artist.artistId,
          name: song.artist.name,
          thumbnails: song.thumbnails,
        },
        count: 1,
      });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map((entry) => entry.artist)
    .slice(0, 12);
}

function songsFromSections(sections: Awaited<ReturnType<typeof api.getRecommendations>>) {
  return uniqSongs(
    sections.flatMap((section) =>
      section.contents.filter((item): item is SongDetailed => item.type === "SONG"),
    ),
  ).slice(0, 12);
}

function SearchGrid({
  title,
  items,
  selectedIds,
  onToggleArtist,
  onToggleSong,
  emptyLabel,
}: {
  title: string;
  items: (ArtistDetailed | SongDetailed)[];
  selectedIds: Set<string>;
  onToggleArtist: (artist: ArtistDetailed) => void;
  onToggleSong: (song: SongDetailed) => void;
  emptyLabel: string;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-bark/60 bg-ash/70 p-4 shadow-2xl shadow-void/20 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-medium text-snow">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-widest text-mist">
          {items.length} picks
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-mist">{emptyLabel}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const id = item.type === "ARTIST" ? item.artistId : item.videoId;
            const selected = selectedIds.has(id);
            if (item.type === "ARTIST") {
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onToggleArtist(item)}
                  className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    selected
                      ? "border-ember/60 bg-ember/10"
                      : "border-bark/70 bg-bark/20 hover:border-bark hover:bg-bark/40"
                  }`}
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-bark">
                    <img
                      src={bestThumb(item.thumbnails, 120)?.url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-snow">{item.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-mist">
                      {selected ? <RiCheckLine className="text-ember" /> : <RiMusic2Line />}
                      <span>{selected ? "Selected" : "Tap to add"}</span>
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggleSong(item)}
                className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  selected
                    ? "border-ember/60 bg-ember/10"
                    : "border-bark/70 bg-bark/20 hover:border-bark hover:bg-bark/40"
                }`}
              >
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-bark">
                  <img
                    src={bestThumb(item.thumbnails, 120)?.url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-snow">{item.name}</div>
                  <div className="truncate text-xs text-mist">{item.artist.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-mist">
                    {selected ? <RiCheckLine className="text-ember" /> : <RiMusic2Line />}
                    <span>{selected ? "Selected" : "Tap to add"}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function TasteSetup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo") || "/";
  const { profile, markSetupSeen, saveProfile, skipSetup } = useTaste();
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query, 250);
  const [selectedArtists, setSelectedArtists] = useState<ArtistDetailed[]>(
    profile?.favoriteArtists ?? [],
  );
  const [selectedSongs, setSelectedSongs] = useState<SongDetailed[]>(
    profile?.favoriteSongs ?? [],
  );

  useEffect(() => {
    markSetupSeen();
  }, [markSetupSeen]);

  useEffect(() => {
    if (!profile) return;
    navigate(returnTo, { replace: true });
  }, [navigate, profile, returnTo]);

  const { data: seedSections, isLoading: seedLoading } = useQuery({
    queryKey: ["taste-seed"],
    queryFn: api.getRecommendations,
    staleTime: 60 * 60 * 1000,
  });

  const { data: searchResults, isFetching: searchFetching } = useQuery({
    queryKey: ["taste-search", debounced],
    queryFn: () => api.search(debounced),
    enabled: debounced.trim().length > 1,
  });

  const seedSongs = useMemo(() => {
    if (!seedSections) return [];
    return songsFromSections(seedSections);
  }, [seedSections]);

  const seedArtists = useMemo(() => artistsFromSongs(seedSongs), [seedSongs]);

  const queryArtists = useMemo(() => {
    const results = (searchResults ?? []).filter(
      (item): item is Extract<SearchResult, { type: "ARTIST" }> => item.type === "ARTIST",
    );
    return uniqArtists(results).slice(0, 12);
  }, [searchResults]);

  const querySongs = useMemo(() => {
    const results = (searchResults ?? []).filter(
      (item): item is Extract<SearchResult, { type: "SONG" }> => item.type === "SONG",
    );
    return uniqSongs(results).slice(0, 12);
  }, [searchResults]);

  const visibleArtists = debounced.trim().length > 1 ? queryArtists : seedArtists;
  const visibleSongs = debounced.trim().length > 1 ? querySongs : seedSongs;
  const allSelectedIds = useMemo(
    () => new Set([...selectedArtists.map((artist) => artist.artistId), ...selectedSongs.map((song) => song.videoId)]),
    [selectedArtists, selectedSongs],
  );

  const toggleArtist = (artist: ArtistDetailed) => {
    setSelectedArtists((current) =>
      current.some((item) => item.artistId === artist.artistId)
        ? current.filter((item) => item.artistId !== artist.artistId)
        : [artist, ...current],
    );
  };

  const toggleSong = (song: SongDetailed) => {
    setSelectedSongs((current) =>
      current.some((item) => item.videoId === song.videoId)
        ? current.filter((item) => item.videoId !== song.videoId)
        : [song, ...current],
    );
  };

  const finish = () => {
    saveProfile({
      favoriteArtists: selectedArtists,
      favoriteSongs: selectedSongs,
    });
    navigate(returnTo, { replace: true });
  };

  const skip = () => {
    skipSetup();
    navigate(returnTo, { replace: true });
  };

  const canFinish = selectedArtists.length > 0 || selectedSongs.length > 0;
  const loadingSuggestions = !seedSections && seedLoading;

  return (
    <div className="relative min-h-screen overflow-hidden bg-void text-snow">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(232,93,59,0.24),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.08),_transparent_28%),linear-gradient(180deg,_rgba(16,16,20,0.92),_rgba(12,12,14,1))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 md:px-8 md:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-ember">
              First-time setup
            </div>
            <h1 className="mt-2 font-display text-3xl font-medium md:text-5xl">
              Tell us what you listen to
            </h1>
          </div>
          <button
            type="button"
            onClick={skip}
            className="rounded-full border border-bark bg-bark/40 px-4 py-2 text-sm text-snow transition-colors hover:bg-bark/70"
          >
            Skip for now
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-5 rounded-3xl border border-bark/60 bg-ash/70 p-5 shadow-2xl shadow-void/20 backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-ember/15 p-3 text-ember">
                <RiSparklingLine className="text-xl" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-medium">Personalize home</h2>
                <p className="mt-2 text-sm leading-6 text-mist">
                  Pick a few artists and songs you already love. We will use this to rank your home page and keep the recommendations close to your taste.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-bark/60 bg-bark/30 p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-mist">
                Your picks
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-widest text-mist">
                    Artists
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArtists.length > 0 ? selectedArtists.map((artist) => (
                      <button
                        key={artist.artistId}
                        type="button"
                        onClick={() => toggleArtist(artist)}
                        className="inline-flex items-center gap-2 rounded-full border border-ember/50 bg-ember/10 px-3 py-1.5 text-sm text-snow transition-colors hover:bg-ember/20"
                      >
                        <span className="truncate max-w-[140px]">{artist.name}</span>
                        <RiCloseLine className="text-xs" />
                      </button>
                    )) : (
                      <span className="text-sm text-mist">No artists selected yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs uppercase tracking-widest text-mist">
                    Songs
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSongs.length > 0 ? selectedSongs.map((song) => (
                      <button
                        key={song.videoId}
                        type="button"
                        onClick={() => toggleSong(song)}
                        className="inline-flex items-center gap-2 rounded-full border border-ember/50 bg-ember/10 px-3 py-1.5 text-sm text-snow transition-colors hover:bg-ember/20"
                      >
                        <span className="truncate max-w-[140px]">{song.name}</span>
                        <RiCloseLine className="text-xs" />
                      </button>
                    )) : (
                      <span className="text-sm text-mist">No songs selected yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-bark/60 bg-bark/30 p-4 text-sm text-mist">
              <div className="font-mono text-[10px] uppercase tracking-widest text-mist">
                Summary
              </div>
              <p className="mt-2 leading-6">
                {selectedArtists.length + selectedSongs.length} selections so far. You can finish with a few picks or keep adding more for a tighter match.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={finish}
                disabled={!canFinish}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ember px-4 py-3 text-sm font-semibold text-void transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
                <RiArrowRightLine />
              </button>
              <button
                type="button"
                onClick={skip}
                className="rounded-full border border-bark bg-bark/40 px-4 py-3 text-sm text-snow transition-colors hover:bg-bark/70"
              >
                Later
              </button>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="relative rounded-3xl border border-bark/60 bg-ash/70 p-4 shadow-2xl shadow-void/20 backdrop-blur">
              <RiSearch2Line className="absolute left-8 top-1/2 -translate-y-1/2 text-mist" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search artists or songs you love"
                className="w-full rounded-full border border-bark/60 bg-void/60 py-3 pl-12 pr-4 text-base text-snow placeholder:text-mist focus:border-ember focus:outline-none"
              />
              <div className="mt-3 text-xs text-mist">
                Search by artist or song, then tap to add. Suggested picks come from the home feed when you do not search.
              </div>
            </div>

            {loadingSuggestions ? (
              <div className="rounded-2xl border border-bark/60 bg-ash/60 p-6 text-sm text-mist">
                Loading suggestions...
              </div>
            ) : (
              <>
                <SearchGrid
                  title={debounced.trim().length > 1 ? "Artist matches" : "Popular artists"}
                  items={visibleArtists}
                  selectedIds={allSelectedIds}
                  onToggleArtist={toggleArtist}
                  onToggleSong={toggleSong}
                  emptyLabel={
                    searchFetching
                      ? "Searching artists..."
                      : "Try another artist name to get more choices."
                  }
                />

                <SearchGrid
                  title={debounced.trim().length > 1 ? "Song matches" : "Popular songs"}
                  items={visibleSongs}
                  selectedIds={allSelectedIds}
                  onToggleArtist={toggleArtist}
                  onToggleSong={toggleSong}
                  emptyLabel={
                    searchFetching
                      ? "Searching songs..."
                      : "Try another song name to get more choices."
                  }
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
