export const formatTime = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const bestThumb = (
  thumbs: { url: string; width: number; height: number }[] | undefined,
  target = 240,
) => {
  if (!thumbs || thumbs.length === 0) return null;
  return thumbs.reduce((best, t) =>
    Math.abs(t.width - target) < Math.abs(best.width - target) ? t : best,
  );
};
