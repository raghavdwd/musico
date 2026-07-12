import { Router } from "express";
import { getPlaylist } from "../../lib/yt-music.ts";
import { cacheRoute } from "../../middleware/cache.ts";

const router = Router();

router.get("/:id", cacheRoute(600), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const data = await getPlaylist(id);
    if (!data) return res.status(404).json({ error: { message: "Playlist not found" } });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
