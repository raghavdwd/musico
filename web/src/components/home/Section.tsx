import type { SongDetailed, AlbumDetailed, ArtistDetailed, PlaylistDetailed } from "../../types";
import { Virtuoso } from "react-virtuoso";
import SongRow from "../cards/SongRow";
import MediaCard from "../cards/MediaCard";
import { usePlayer } from "../../lib/store";
import { toast } from "sonner";

interface Props {
  title: string;
  items: (SongDetailed | AlbumDetailed | ArtistDetailed | PlaylistDetailed)[];
  type: "songs" | "albums" | "artists" | "playlists" | "mixed";
  queue?: SongDetailed[];
}

export default function Section({ title, items, type, queue }: Props) {
  const { addToQueue } = usePlayer();
  if (items.length === 0) return null;

  const isList = type === "songs";

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-medium tracking-tight text-snow">
        {title}
      </h2>

      {isList ? (
        <div className="space-y-0.5">
          <Virtuoso
            useWindowScroll
            data={items as SongDetailed[]}
            itemContent={(_i, song) => (
              <SongRow
                key={song.videoId}
                song={song}
                index={_i}
                queue={(queue as SongDetailed[]) ?? (items as SongDetailed[])}
                onAddToQueue={(s) => { addToQueue(s); toast.success("Added to queue"); }}
              />
            )}
          />
        </div>
      ) : (
        <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-2 scrollbar-hide">
          {items.map((item) => {
            if (item.type === "ALBUM") {
              const album = item as AlbumDetailed;
              return (
                <MediaCard
                  key={album.albumId}
                  title={album.name}
                  subtitle={album.artist.name}
                  thumbnails={album.thumbnails}
                  to={`/album/${album.albumId}`}
                />
              );
            }
            if (item.type === "ARTIST") {
              const artist = item as ArtistDetailed;
              return (
                <MediaCard
                  key={artist.artistId}
                  title={artist.name}
                  thumbnails={artist.thumbnails}
                  to={`/artist/${artist.artistId}`}
                  rounded
                />
              );
            }
            if (item.type === "PLAYLIST") {
              const p = item as PlaylistDetailed;
              return (
                <MediaCard
                  key={p.playlistId}
                  title={p.name}
                  subtitle={p.artist?.name}
                  thumbnails={p.thumbnails}
                  to={`/playlist/${p.playlistId}`}
                />
              );
            }
            if (item.type === "SONG") {
              const s = item as SongDetailed;
              return (
                <MediaCard
                  key={s.videoId}
                  title={s.name}
                  subtitle={s.artist.name}
                  thumbnails={s.thumbnails}
                  to={`/song/${s.videoId}`}
                />
              );
            }
            return null;
          })}
        </div>
      )}
    </section>
  );
}
