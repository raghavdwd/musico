import type { Request, Response, NextFunction } from "express";
import { getCache, setCache } from "../lib/redis.ts";

export function cacheRoute(ttl = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `route:${req.originalUrl}`;
    const cached = await getCache<unknown>(key);
    if (cached) {
      res.json(cached);
      return;
    }

    // store original json to intercept it
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      setCache(key, body, ttl);
      return originalJson(body);
    } as typeof res.json;

    next();
  };
}
