import { useLibrary } from "../lib/library";
import type { SongDetailed } from "../types";

/**
 * Returns all unique songs from the library's liked + recent lists.
 * Used by playlist pages to resolve songIds into full song data.
 */
export function useLikedAndRecent(): SongDetailed[] {
  const { liked, recent } = useLibrary();
  const map = new Map<string, SongDetailed>();
  for (const s of liked) map.set(s.videoId, s);
  for (const s of recent) map.set(s.videoId, s);
  return Array.from(map.values());
}
