import type { HomeSection, SongDetailed } from "../types";
import type { Playlist } from "./library";
import type { TasteProfile } from "./taste";

interface RecommendationInput {
  sections: HomeSection[];
  liked: SongDetailed[];
  recent: SongDetailed[];
  playlists: Playlist[];
  getPlaylistSongs: (playlistId: string, allSongs: SongDetailed[]) => SongDetailed[];
  profile: TasteProfile | null;
}

type ScoredSong = {
  song: SongDetailed;
  score: number;
  index: number;
};

type RawSongLike = {
  type?: string;
  videoId?: string;
  name?: string;
  title?: string;
  artist?: { artistId?: string | null; id?: string | null; name?: string };
  artists?: Array<{ artistId?: string | null; id?: string | null; name?: string }>;
  album?: { albumId?: string; name?: string } | null;
  duration?: number | null;
  thumbnails?: Array<{ url: string; width: number; height: number }>;
};

function uniqSongs(songs: SongDetailed[]) {
  const seen = new Set<string>();
  return songs.filter((song) => {
    if (seen.has(song.videoId)) return false;
    seen.add(song.videoId);
    return true;
  });
}

function collectHomeSongs(sections: HomeSection[]) {
  const songs: SongDetailed[] = [];
  for (const section of sections) {
    for (const item of section.contents as RawSongLike[]) {
      const videoId = item?.videoId;
      const name = item?.name ?? item?.title;
      const artist = item?.artist ?? item?.artists?.[0];
      if (!videoId || !name || !artist?.name) continue;
      songs.push({
        type: "SONG",
        videoId,
        name,
        artist: {
          artistId: artist.artistId ?? artist.id ?? null,
          name: artist.name,
        },
        album:
          item.album && "albumId" in item.album && item.album.albumId && item.album.name
            ? {
                albumId: item.album.albumId,
                name: item.album.name,
              }
            : null,
        duration: item.duration ?? null,
        thumbnails: item.thumbnails ?? [],
      });
    }
  }

  return uniqSongs(songs);
}

function bump(map: Map<string, number>, key: string | null | undefined, weight: number) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + weight);
}

export function buildRecommendedSongs({
  sections,
  liked,
  recent,
  playlists,
  getPlaylistSongs,
  profile,
}: RecommendationInput): {
  allSongs: SongDetailed[];
  recommendedSongs: SongDetailed[];
} {
  const homeSongs = collectHomeSongs(sections);
  const seedSongs = uniqSongs([
    ...liked,
    ...recent,
    ...playlists.flatMap((playlist) => getPlaylistSongs(playlist.id, homeSongs)),
    ...(profile?.favoriteSongs ?? []),
  ]);
  const allSongs = homeSongs.length > 0 ? homeSongs : seedSongs;
  console.debug("[DEBUG-taste] buildRecommendedSongs", {
    homeSections: sections.length,
    homeSongs: homeSongs.length,
    allSongs: allSongs.length,
    liked: liked.length,
    recent: recent.length,
    playlists: playlists.length,
    profileArtists: profile?.favoriteArtists.length ?? 0,
    profileSongs: profile?.favoriteSongs.length ?? 0,
  });
  if (allSongs.length === 0) {
    console.debug("[DEBUG-taste] no home songs available");
    return { allSongs: [], recommendedSongs: [] };
  }

  const songScores = new Map<string, number>();
  const artistScores = new Map<string, number>();

  const addSongSignals = (songs: SongDetailed[], weight: number) => {
    for (const song of songs) {
      bump(songScores, song.videoId, weight);
      bump(artistScores, song.artist.artistId, weight * 0.7);
    }
  };

  const addArtistSignals = (artists: Array<{ artistId: string | null }>, weight: number) => {
    for (const artist of artists) {
      bump(artistScores, artist.artistId, weight);
    }
  };

  addSongSignals(liked, 3.5);
  addSongSignals(recent, 1.8);

  const playlistSongs = playlists.flatMap((playlist) => getPlaylistSongs(playlist.id, allSongs));
  addSongSignals(playlistSongs, 2.4);

  if (profile) {
    addSongSignals(profile.favoriteSongs, 5.5);
    addArtistSignals(profile.favoriteArtists, 4.5);
  }

  const scored: ScoredSong[] = allSongs.map((song, index) => {
    const artistId = song.artist.artistId;
    const artistBoost = artistId ? artistScores.get(artistId) ?? 0 : 0;
    const songBoost = songScores.get(song.videoId) ?? 0;
    const baseBoost = Math.max(0, allSongs.length - index) * 0.01;
    return {
      song,
      score: songBoost + artistBoost + baseBoost,
      index,
    };
  });

  const hasSignal = scored.some((item) => item.score > 0);
  console.debug("[DEBUG-taste] scoring result", {
    hasSignal,
    topScores: scored
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => ({
        videoId: item.song.videoId,
        name: item.song.name,
        artist: item.song.artist.name,
        score: Number(item.score.toFixed(2)),
      })),
  });
  if (!hasSignal) {
    console.debug("[DEBUG-taste] falling back to generic home songs", {
      fallbackCount: allSongs.slice(0, 12).length,
    });
    return {
      allSongs,
      recommendedSongs: allSongs.slice(0, 12),
    };
  }

  const ranked = scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    })
    .map((item) => item.song);

  return {
    allSongs,
    recommendedSongs: uniqSongs(ranked).slice(0, 12),
  };
}
