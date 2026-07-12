import { Router } from "express";
import { getSong } from "../../lib/yt-music.ts";
import { getLyricsWithFallback } from "../../lib/lyrics.ts";
import { cacheRoute } from "../../middleware/cache.ts";

const router = Router();

router.get("/:id", cacheRoute(600), async (req, res, next) => {
  try {
    const id = req.params.id as string;

    // Try to get song metadata to help lrclib match better
    let trackName: string | undefined;
    let artistName: string | undefined;
    let duration: number | undefined;
    try {
      const song = await getSong(id);
      trackName = song.name;
      artistName = song.artist.name;
      duration = song.duration;
    } catch {
      // metadata fetch failed, try lyrics anyway
    }

    const data = await getLyricsWithFallback(id, trackName, artistName, duration);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
