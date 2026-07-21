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

export type StreamQuality = "auto" | "high" | "medium" | "low";

function formatForQuality(quality: StreamQuality): string {
  // yt-dlp format selectors mapped to YouTube Music audio bitrates.
  switch (quality) {
    case "high":
      return "bestaudio[abr>=256]/bestaudio";
    case "medium":
      return "bestaudio[abr=128]/bestaudio[abr<=160]/bestaudio";
    case "low":
      return "bestaudio[abr<=64]/worstaudio/bestaudio";
    case "auto":
    default:
      return "bestaudio/best";
  }
}

function writeCookies(): string | null {
  // Write YT_MUSIC_COOKIE to temp file for yt-dlp
  // Format: Netscape cookie file, one line per cookie
  // youtube.com	TRUE	/	TRUE	2147483647	SAPISID	<value>
  const raw = Bun.env.YT_MUSIC_COOKIE;
  if (!raw) return null;
  try {
    const path = "/tmp/yt-cookies.txt";
    // If cookie is raw header value, wrap it; otherwise assume it's already Netscape format
    const content = raw.includes("\t")
      ? raw
      : `# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t2147483647\tSAPISID\t${raw}`;
    Bun.write(path, content);
    return path;
  } catch {
    return null;
  }
}

export async function getStreamUrl(
  songId: string,
  quality: StreamQuality = "auto",
): Promise<StreamData> {
  const cacheKey = `stream:${songId}:${quality}`;
  const cached = await getCache<StreamData>(cacheKey);
  if (cached) return cached;

  const cookiesPath = writeCookies();

  // Try clients in order of likelihood to work from datacenter IPs.
  // mobile/tv clients use different API endpoints that are less often blocked.
  const clients = ["web", "android", "tv", "ios"];
  let lastError: Error | null = null;

  for (const client of clients) {
    const args = [
      "yt-dlp",
      "--no-warnings",
      "--no-progress",
      "--quiet",
      "--dump-json",
      "--format",
      formatForQuality(quality),
      "--no-playlist",
      "--extractor-retries",
      "2",
      "--extractor-args",
      `youtube:player_client=${client}`,
    ];
    if (cookiesPath) {
      args.push("--cookies", cookiesPath);
    }
    args.push(`https://music.youtube.com/watch?v=${songId}`);

    const proc = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      const info = JSON.parse(
        stdout.trim().split("\n").pop() || "{}",
      ) as Partial<YtDlpResult>;
      if (info.url) {
        const result: StreamData = {
          url: info.url,
          mimeType: mimeFromExt(info.ext || "webm"),
          bitrate: (info.abr ?? 128) * 1000,
          contentLength: info.filesize ?? 0,
        };

        await setCache(cacheKey, result, 3600);
        return result;
      }
      lastError = new Error("yt-dlp returned no URL");
    } else {
      lastError = new Error(
        `yt-dlp failed: ${stderr.trim() || `exit ${exitCode}`}`,
      );
    }
  }

  throw lastError || new Error("All yt-dlp clients failed");
}
