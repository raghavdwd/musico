import { useParams } from "react-router-dom";
import { usePlaylist } from "../hooks/useApi";
import { bestThumb } from "../lib/format";
import { TailspinLoader, CenteredLoader } from "../components/ui/Loaders";

export default function Playlist() {
  const { id } = useParams();
  const { data, isLoading } = usePlaylist(id);

  if (isLoading || !data) {
    return (
      <CenteredLoader>
        <TailspinLoader size={56} />
      </CenteredLoader>
    );
  }

  const hero = bestThumb(data.thumbnails, 600) || data.thumbnails?.[0];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 md:grid-cols-[280px_1fr] md:gap-10">
        <div>
          <img src={hero?.url} alt={data.name} className="w-full rounded-lg object-cover shadow-2xl" />
          <div className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ember">Playlist</div>
          <h1 className="mt-2 font-display text-3xl font-medium text-snow md:text-4xl">{data.name}</h1>
          <div className="mt-1 text-sm text-mist">{data.videoCount} videos</div>
        </div>
        <div className="text-mist">
          Track listing for playlists is on the API roadmap. Playlist metadata works.
        </div>
      </div>
    </div>
  );
}
