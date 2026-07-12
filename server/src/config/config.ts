export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 3000,
  YT_MUSIC_COOKIE: process.env.YT_MUSIC_COOKIE || "",
};
