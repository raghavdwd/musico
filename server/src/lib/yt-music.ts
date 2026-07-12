import YTMusic from "ytmusic-api";

type RadioSong = {
  videoId: string;
  name?: string;
  artist?: { name?: string; id?: string };
  artists?: Array<{ name?: string; id?: string }>;
  thumbnails?: Array<{ url: string; width: number; height: number }>;
  duration?: number | null;
};

function pickArtist(song: RadioSong): { artistId: string | null; name: string } | null {
  const artist = song.artist ?? song.artists?.[0];
  if (!artist?.name) return null;
  return {
    artistId: artist.id ?? null,
    name: artist.name,
  };
}

let api: YTMusic | null = null;

export async function getYTMusic(): Promise<YTMusic> {
  if (!api) {
    api = new YTMusic();
    await api.initialize({
      cookies: process.env.YT_MUSIC_COOKIE,
    });
  }
  return api;
}

export async function search(query: string) {
  const client = await getYTMusic();
  return client.search(query);
}

export async function getSong(songId: string) {
  const client = await getYTMusic();
  return client.getSong(songId);
}

export async function getAlbum(albumId: string) {
  const client = await getYTMusic();
  return client.getAlbum(albumId);
}

export async function getPlaylist(playlistId: string) {
  const client = await getYTMusic();
  return client.getPlaylist(playlistId);
}

export async function getArtist(artistId: string) {
  const client = await getYTMusic();
  return client.getArtist(artistId);
}

export async function getLyrics(songId: string) {
  const client = await getYTMusic();
  return client.getLyrics(songId);
}

export async function getRecommendations() {
  const client = await getYTMusic();
  return client.getHomeSections();
}

export async function getRadioSongs(songId: string) {
  const client = await getYTMusic();

  // Fetch home sections (general recommendations) and artist details in parallel
  const [homeSections, songDetails] = await Promise.all([
    client.getHomeSections(),
    client.getSong(songId).catch(() => null),
  ]);

  // Collect songs from home sections
  const homeSongs: RadioSong[] = [];
  for (const section of homeSections) {
    if (section.contents && Array.isArray(section.contents)) {
      for (const item of section.contents) {
        if (item && "videoId" in item && item.type === "SONG") {
          homeSongs.push(item);
        }
      }
    }
  }

  // Try to get the artist's top songs for richer radio
  let artistSongs: Array<Record<string, any>> = [];
  if (songDetails?.artist?.artistId) {
    try {
      const artistData = await client.getArtist(songDetails.artist.artistId) as Record<string, any>;
      // The artist response might use "songs" or "topSongs" depending on the ytmusic-api version
      const rawSongs = artistData?.songs ?? artistData?.topSongs ?? [];
      artistSongs = Array.isArray(rawSongs) ? rawSongs : [];
    } catch {
      // Artist fetch is optional
    }
  }

  // Merge home songs + artist songs, deduplicate by videoId, exclude seed
  const seen = new Set<string>([songId]);
  const merged: Array<{
    type: "SONG";
    videoId: string;
    name: string;
    artist: { artistId: string | null; name: string };
    album: null;
    duration: number | null;
    thumbnails: Array<{ url: string; width: number; height: number }>;
  }> = [];

  for (const song of [...artistSongs, ...homeSongs]) {
    if (song.videoId && song.name && !seen.has(song.videoId)) {
      seen.add(song.videoId);
      const artist = pickArtist(song);
      if (!artist?.name) continue;

      merged.push({
        videoId: song.videoId,
        name: song.name,
        type: "SONG",
        artist,
        thumbnails: song.thumbnails ?? [],
        duration: song.duration ?? null,
        album: null,
      });
    }
  }

  // Shuffle for variety
  for (let i = merged.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [merged[i], merged[j]] = [merged[j], merged[i]];
  }

  return merged.slice(0, 30);
}
