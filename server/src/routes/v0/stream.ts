import { Router } from "express";
import { getStreamUrl } from "../../lib/stream.ts";
import { AppError } from "../../middleware/error-handler.ts";
import { getCache } from "../../lib/redis.ts";

const router = Router();

router.get("/:id", async (req, res, next) => {
  // HEAD: respond with headers only, no body
  if (req.method === "HEAD") {
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", "audio/webm");
    res.status(200).end();
    return;
  }
  try {
    const id = req.params.id as string;

    // Try cached stream URL first
    const cached = await getCache<{ url: string; mimeType: string }>(`stream:${id}`);
    let streamUrl: string;
    let mimeType: string;

    if (cached?.url) {
      streamUrl = cached.url;
      mimeType = cached.mimeType;
    } else {
      const stream = await getStreamUrl(id);
      streamUrl = stream.url;
      mimeType = stream.mimeType;
    }

    // Proxy the audio: server fetches from CDN, streams to browser (same-origin)
    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0",
    };
    const range = req.headers.range;
    if (range) upstreamHeaders["Range"] = range;

    const upstream = await fetch(streamUrl, {
      headers: upstreamHeaders,
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      throw new AppError(502, "UPSTREAM_ERROR", `Upstream returned ${upstream.status}`);
    }

    // Forward relevant headers
    const contentType = upstream.headers.get("content-type") || mimeType;
    const contentLength = upstream.headers.get("content-length");
    const acceptRanges = upstream.headers.get("accept-ranges") || "bytes";
    const contentRange = upstream.headers.get("content-range");

    res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    res.setHeader("Accept-Ranges", acceptRanges);
    if (contentRange) res.setHeader("Content-Range", contentRange);
    res.setHeader("Cache-Control", "public, max-age=3600");

    res.status(upstream.status);

    if (!upstream.body) {
      throw new AppError(502, "NO_BODY", "Upstream returned no body");
    }

    // Stream the body through using Node ReadableStream pipe (backpressure-aware)
    const { Readable } = await import("node:stream");
    const nodeStream = Readable.fromWeb(upstream.body as unknown as import("node:stream/web").ReadableStream);
    nodeStream.pipe(res);
    nodeStream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) res.status(502);
      res.destroy(err);
    });
  } catch (err) {
    next(err);
  }
});

export default router;
