import { getCache, setCache } from "./redis.ts";

interface StreamData {
  url: string;
  mimeType: string;
  bitrate: number;
  contentLength: number;
}

interface YtDlpResult {
  url: string;
  ext: string;
  abr: number;
  filesize: number | null;
  acodec: string;
}

function mimeFromExt(ext: string): string {
  if (ext === "webm") return "audio/webm";
  if (ext === "m4a" || ext === "mp4") return "audio/mp4";
  if (ext === "ogg") return "audio/ogg";
  if (ext === "opus") return "audio/ogg; codecs=opus";
  return "audio/mpeg";
}

export async function getStreamUrl(songId: string): Promise<StreamData> {
  const cacheKey = `stream:${songId}`;
  const cached = await getCache<StreamData>(cacheKey);
  if (cached) return cached;

  const proc = Bun.spawn(
    [
      "yt-dlp",
      "--no-warnings",
      "--no-progress",
      "--quiet",
      "--dump-json",
      "--format", "bestaudio/best",
      "--no-playlist",
      "--extractor-args", "youtube:player_client=tv,web,android_vr,ios",
      `https://music.youtube.com/watch?v=${songId}`,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`yt-dlp failed: ${stderr.trim() || `exit ${exitCode}`}`);
  }

  const info = JSON.parse(stdout.trim().split("\n").pop() || "{}") as Partial<YtDlpResult>;
  if (!info.url) {
    throw new Error("yt-dlp returned no URL");
  }

  // Validate the URL works before caching — sometimes yt-dlp returns URLs
  // that haven't been fully deciphered (e.g. partial signature)
  const head = await fetch(info.url, { method: "HEAD" });
  if (!head.ok) {
    throw new Error(`stream URL not playable (HTTP ${head.status})`);
  }

  const result: StreamData = {
    url: info.url,
    mimeType: mimeFromExt(info.ext || "webm"),
    bitrate: (info.abr ?? 128) * 1000,
    contentLength: info.filesize ?? 0,
  };

  await setCache(cacheKey, result, 300);
  return result;
}
