import { Router } from "express";
import { getArtist } from "../../lib/yt-music.ts";
import { cacheRoute } from "../../middleware/cache.ts";

const router = Router();

router.get("/:id", cacheRoute(600), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const data = await getArtist(id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
