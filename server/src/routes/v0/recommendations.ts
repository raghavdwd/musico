import { Router } from "express";
import { getRecommendations } from "../../lib/yt-music.ts";
import { cacheRoute } from "../../middleware/cache.ts";

const router = Router();

router.get("/", cacheRoute(300), async (req, res, next) => {
  try {
    const data = await getRecommendations();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
