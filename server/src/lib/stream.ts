import { getSong } from "./yt-music.ts";
import { getCache, setCache } from "./redis.ts";

interface StreamData {
  url: string;
  mimeType: string;
  bitrate: number;
  contentLength: number;
}

export async function getStreamUrl(songId: string): Promise<StreamData> {
  const cacheKey = `stream:${songId}`;
  const cached = await getCache<StreamData>(cacheKey);
  if (cached) return cached;

  const song = await getSong(songId);
  const formats = song.adaptiveFormats as Array<{
    url?: string;
    mimeType?: string;
    bitrate?: number;
    contentLength?: string;
  }> | undefined;

  if (!formats || formats.length === 0) {
    throw new Error("No stream formats available");
  }

  const audio = formats.find((f) => f.mimeType?.startsWith("audio/")) || formats[0];
  if (!audio?.url) {
    throw new Error("No audio stream available for this video");
  }

  const result: StreamData = {
    url: audio.url,
    mimeType: audio.mimeType ?? "",
    bitrate: audio.bitrate ?? 0,
    contentLength: Number(audio.contentLength) || 0,
  };

  await setCache(cacheKey, result, 60);
  return result;
}
