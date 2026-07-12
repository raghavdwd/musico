import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useState } from "react";
import { motion } from "motion/react";
import { RiSearch2Line } from "react-icons/ri";
import * as api from "../api";
import { useSearchParams } from "react-router-dom";
import SongRow from "../components/cards/SongRow";
import MediaCard from "../components/cards/MediaCard";
import { HelixLoader, OrbitLoader } from "../components/ui/Loaders";
import type { SearchResult } from "../types";

export default function Search() {
  const [params] = useSearchParams();
  const initialQ = params.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [debounced] = useDebounce(q, 300);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => api.search(debounced),
    enabled: debounced.length > 0,
  });

  const songs = (data || []).filter((r): r is Extract<SearchResult, { type: "SONG" }> => r.type === "SONG");
  const artists = (data || []).filter((r): r is Extract<SearchResult, { type: "ARTIST" }> => r.type === "ARTIST");
  const albums = (data || []).filter((r): r is Extract<SearchResult, { type: "ALBUM" }> => r.type === "ALBUM");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="relative">
        <RiSearch2Line className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search songs, albums, artists, playlists"
          className="w-full rounded-full border border-bark/60 bg-ash py-3 pl-12 pr-12 text-base text-snow placeholder:text-mist focus:border-ember focus:outline-none"
        />
        {isFetching && debounced.length > 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <OrbitLoader size={20} />
          </div>
        )}
      </div>

      {!q && (
        <p className="text-mist">Start typing to find music.</p>
      )}

      {isLoading && q && (
        <div className="flex h-32 items-center justify-center">
          <HelixLoader size={40} />
        </div>
      )}

      {data && (
        <motion.div
          key={debounced}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {songs.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-display text-2xl text-snow">Songs</h2>
              {songs.slice(0, 8).map((song, i) => (
                <SongRow key={song.videoId} song={song} index={i} queue={songs} />
              ))}
            </section>
          )}

          {artists.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-2xl text-snow">Artists</h2>
              <div className="-mx-2 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {artists.map((artist) => (
                  <MediaCard
                    key={artist.artistId}
                    title={artist.name}
                    thumbnails={artist.thumbnails}
                    to={`/artist/${artist.artistId}`}
                    rounded
                  />
                ))}
              </div>
            </section>
          )}

          {albums.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-2xl text-snow">Albums</h2>
              <div className="-mx-2 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {albums.map((album) => (
                  <MediaCard
                    key={album.albumId}
                    title={album.name}
                    subtitle={album.artist.name}
                    thumbnails={album.thumbnails}
                    to={`/album/${album.albumId}`}
                  />
                ))}
              </div>
            </section>
          )}

          {songs.length === 0 && artists.length === 0 && albums.length === 0 && (
            <p className="text-mist">No results for "{debounced}".</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
