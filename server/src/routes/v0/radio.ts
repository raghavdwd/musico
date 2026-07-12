import { Router } from "express";
import { getRadioSongs } from "../../lib/yt-music.ts";
import { cacheRoute } from "../../middleware/cache.ts";

const router = Router();

router.get("/:videoId", cacheRoute(300), async (req, res, next) => {
  try {
    const data = await getRadioSongs(req.params.videoId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
