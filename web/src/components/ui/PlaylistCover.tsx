import type { SongDetailed } from "../../types";
import { bestThumb } from "../../lib/format";

interface Props {
  songs: SongDetailed[];
  size?: number;
  rounded?: boolean;
}

export default function PlaylistCover({ songs, size = 160, rounded = false }: Props) {
  const radius = rounded ? "rounded-full" : "rounded-lg";
  const firstFour = songs.slice(0, 4);
  const thumbs = firstFour.map((s) => bestThumb(s.thumbnails, 240)).slice(0, 4);

  if (thumbs.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`${radius} bg-gradient-to-br from-ember to-ember-soft flex items-center justify-center text-void`}
      >
        <span className="text-3xl">♪</span>
      </div>
    );
  }

  if (thumbs.length === 1) {
    return (
      <img
        src={thumbs[0]?.url}
        alt=""
        style={{ width: size, height: size }}
        className={`${radius} object-cover`}
      />
    );
  }

  if (thumbs.length === 2) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`${radius} grid grid-cols-2 gap-0.5 overflow-hidden bg-bark`}
      >
        {thumbs.map((t, i) => (
          <img key={i} src={t?.url} alt="" className="h-full w-full object-cover" />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`${radius} grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden bg-bark`}
    >
      {thumbs.map((t, i) => (
        <img key={i} src={t?.url} alt="" className="h-full w-full object-cover" />
      ))}
    </div>
  );
}
