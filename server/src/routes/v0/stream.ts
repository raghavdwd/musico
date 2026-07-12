import { Router } from "express";
import { getStreamUrl } from "../../lib/stream.ts";
import { AppError } from "../../middleware/error-handler.ts";

const router = Router();

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const data = await getStreamUrl(id);
    res.json({ data });
  } catch (err) {
    if (err instanceof Error && err.message.includes("No audio stream")) {
      next(new AppError(404, "STREAM_NOT_FOUND", err.message));
      return;
    }
    next(err);
  }
});

export default router;
