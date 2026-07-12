import { getCache, setCache } from "./redis.ts";
import { getYTMusic } from "./yt-music.ts";

interface LrclibRecord {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

const LRC_BASE = "https://lrclib.net/api";

function parseLrc(lrc: string): string[] {
  // strip [mm:ss.xx] timestamps, keep just text
  return lrc
    .split("\n")
    .map((line) => line.replace(/^\[\d+:\d+\.\d+\]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

export async function getLyricsWithFallback(
  videoId: string,
  trackName?: string,
  artistName?: string,
  duration?: number,
): Promise<string[] | null> {
  const cacheKey = `lyrics:${videoId}`;
  const cached = await getCache<string[] | null>(cacheKey);
  if (cached !== null) return cached;

  // 1) Try ytmusic-api first
  try {
    const client = await getYTMusic();
    const raw = await client.getLyrics(videoId);
    if (raw && Array.isArray(raw) && raw.length > 0) {
      await setCache(cacheKey, raw, 24 * 60 * 60);
      return raw;
    }
  } catch {
    // fall through
  }

  // 2) Fallback to lrclib.net
  if (!trackName) return null;

  const trySearch = async (query: URLSearchParams): Promise<LrclibRecord[] | null> => {
    try {
      const res = await fetch(`${LRC_BASE}/search?${query.toString()}`, {
        headers: { "User-Agent": "Musico/0.1 (https://github.com/musico)" },
      });
      if (!res.ok) return null;
      const records = (await res.json()) as LrclibRecord[];
      return records.length ? records : null;
    } catch {
      return null;
    }
  };

  // try a few query strategies in order
  const strategies: URLSearchParams[] = [];
  const firstArtist = artistName?.split(",")[0]?.split("&")[0]?.trim();

  if (trackName && artistName) {
    const params = new URLSearchParams({ track_name: trackName, artist_name: artistName });
    if (duration) params.set("duration", String(Math.round(duration)));
    strategies.push(params);
  }
  if (trackName && firstArtist && firstArtist !== artistName) {
    const params = new URLSearchParams({ track_name: trackName, artist_name: firstArtist });
    if (duration) params.set("duration", String(Math.round(duration)));
    strategies.push(params);
  }
  if (trackName) {
    // try every individual artist
    const allArtists = artistName
      ?.split(/[,&]/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0 && a !== firstArtist) ?? [];
    for (const artist of allArtists) {
      strategies.push(
        new URLSearchParams({ track_name: trackName, artist_name: artist }),
      );
    }
  }
  if (trackName) {
    strategies.push(new URLSearchParams({ q: `${trackName} ${artistName ?? ""}`.trim() }));
  }

  for (const params of strategies) {
    const records = await trySearch(params);
    if (!records) continue;
    const best = records.find((r) => !r.instrumental) ?? records[0];
    const lyricsText = best.syncedLyrics || best.plainLyrics;
    if (!lyricsText) continue;
    const lines = parseLrc(lyricsText);
    await setCache(cacheKey, lines, 24 * 60 * 60);
    return lines;
  }

  return null;
}
