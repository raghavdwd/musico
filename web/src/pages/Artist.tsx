import { useParams } from "react-router-dom";
import { useArtist } from "../hooks/useApi";
import { usePlayer } from "../lib/store";
import { RiPlayFill } from "react-icons/ri";
import { bestThumb } from "../lib/format";
import SongRow from "../components/cards/SongRow";
import MediaCard from "../components/cards/MediaCard";
import { Ring2Loader, CenteredLoader } from "../components/ui/Loaders";
import { toast } from "sonner";
import type { SongDetailed, AlbumDetailed, ArtistDetailed as ArtistD } from "../types";

export default function Artist() {
  const { id } = useParams();
  const { data: artist, isLoading } = useArtist(id);
  const { load, addToQueue } = usePlayer();

  if (isLoading || !artist) {
    return (
      <CenteredLoader>
        <Ring2Loader size={56} />
      </CenteredLoader>
    );
  }

  const hero = bestThumb(artist.thumbnails, 600) || artist.thumbnails?.[0];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
        <img
          src={hero?.url}
          alt={artist.name}
          className="h-48 w-48 rounded-full object-cover shadow-2xl md:h-60 md:w-60"
        />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ember">Artist</div>
          <h1 className="mt-2 font-display text-5xl font-medium tracking-tight text-snow md:text-7xl">
            {artist.name}
          </h1>
        </div>
      </div>

      {artist.topSongs && artist.topSongs.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl text-snow">Popular</h2>
            <button
              onClick={() => load(artist.topSongs[0] as any, artist.topSongs as any)}
              className="flex items-center gap-2 rounded-full bg-ember px-4 py-1.5 text-xs font-semibold text-void transition-transform hover:scale-105 active:scale-95"
            >
              <RiPlayFill /> Play
            </button>
          </div>
          {artist.topSongs.slice(0, 6).map((song: SongDetailed, i: number) => (
            <SongRow key={song.videoId} song={song} index={i} queue={artist.topSongs} showArt={false} onAddToQueue={(s) => { addToQueue(s); toast.success("Added to queue"); }} />
          ))}
        </section>
      )}

      {artist.topAlbums && artist.topAlbums.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-snow">Albums</h2>
          <div className="-mx-2 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {artist.topAlbums.map((album: AlbumDetailed) => (
              <MediaCard
                key={album.albumId}
                title={album.name}
                subtitle={`${album.year || ""}`}
                thumbnails={album.thumbnails}
                to={`/album/${album.albumId}`}
              />
            ))}
          </div>
        </section>
      )}

      {artist.similarArtists && artist.similarArtists.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-snow">Similar artists</h2>
          <div className="-mx-2 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {artist.similarArtists.map((a: ArtistD) => (
              <MediaCard
                key={a.artistId}
                title={a.name}
                thumbnails={a.thumbnails}
                to={`/artist/${a.artistId}`}
                rounded
                size={140}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
