import { Router } from "express";
import { search } from "../../lib/yt-music.ts";
import { cacheRoute } from "../../middleware/cache.ts";

const router = Router();

router.get("/", cacheRoute(120), async (req, res, next) => {
  try {
    const query = req.query.q as string | undefined;
    if (!query) {
      res.status(400).json({ error: { code: "MISSING_QUERY", message: "Query parameter q is required" } });
      return;
    }
    const results = await search(query);
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

export default router;
