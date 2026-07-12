import express from "express";
import { env } from "./config/config.ts";
import { connectRedis } from "./lib/redis.ts";
import { errorHandler } from "./middleware/error-handler.ts";

import v0Search from "./routes/v0/search.ts";
import v0Songs from "./routes/v0/songs.ts";
import v0Albums from "./routes/v0/albums.ts";
import v0Playlists from "./routes/v0/playlists.ts";
import v0Artists from "./routes/v0/artists.ts";
import v0Lyrics from "./routes/v0/lyrics.ts";
import v0Stream from "./routes/v0/stream.ts";
import v0Recommendations from "./routes/v0/recommendations.ts";
import v0Radio from "./routes/v0/radio.ts";

import v1Search from "./routes/v1/search.ts";
import v1Songs from "./routes/v1/songs.ts";
import v1Albums from "./routes/v1/albums.ts";
import v1Playlists from "./routes/v1/playlists.ts";
import v1Artists from "./routes/v1/artists.ts";
import v1Lyrics from "./routes/v1/lyrics.ts";
import v1Stream from "./routes/v1/stream.ts";
import v1Recommendations from "./routes/v1/recommendations.ts";
const app = express();

const mount = (base: string) => {
  app.use(`${base}/search`, v0Search);
  app.use(`${base}/songs`, v0Songs);
  app.use(`${base}/albums`, v0Albums);
  app.use(`${base}/playlists`, v0Playlists);
  app.use(`${base}/artists`, v0Artists);
  app.use(`${base}/lyrics`, v0Lyrics);
  app.use(`${base}/stream`, v0Stream);
  app.use(`${base}/recommendations`, v0Recommendations);
  app.use(`${base}/radio`, v0Radio);
};

// same behavior, versioned URLs
mount("/api/v0");
mount("/api/v1");

app.use(errorHandler);

const start = async () => {
  try {
    await connectRedis();
  } catch {
    // redis is optional
  }
  app.listen(env.PORT, () => {
    console.log(`musico server listening on port ${env.PORT}`);
  });
};

start();
