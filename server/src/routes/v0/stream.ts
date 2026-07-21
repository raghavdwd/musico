import { Router } from "express";
import { getStreamUrl, type StreamQuality } from "../../lib/stream.ts";
import { AppError } from "../../middleware/error-handler.ts";
import { getCache } from "../../lib/redis.ts";

const router = Router();

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const quality = (req.query.q as StreamQuality) || "auto";

    // Try cached stream URL first
    const cached = await getCache<{ url: string; mimeType: string }>(
      `stream:${id}:${quality}`,
    );
    let streamUrl: string;

    if (cached?.url) {
      streamUrl = cached.url;
    } else {
      const stream = await getStreamUrl(id, quality);
      streamUrl = stream.url;
    }

    // Redirect to CDN URL — browser plays directly from Google, no proxy overhead
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.redirect(302, streamUrl);
  } catch (err) {
    // Map known errors to proper status codes
    if (err instanceof Error) {
      const msg = err.message;
      if (
        msg.includes("yt-dlp failed") ||
        msg.includes("stream URL not playable") ||
        msg.includes("no URL")
      ) {
        next(new AppError(404, "SONG_NOT_FOUND", "Song not found on YouTube Music"));
        return;
      }
    }
    next(err);
  }
});

export default router;
