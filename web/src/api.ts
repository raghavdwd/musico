import type {
  SearchResult, SongFull, AlbumFull, ArtistFull, PlaylistFull,
  HomeSection,
} from "./types.ts";

const BASE = "/api/v0";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `HTTP ${res.status}`);
  }
  const json = await res.json() as { data: T };
  return json.data;
}

export function search(query: string): Promise<SearchResult[]> {
  return fetchJson(`${BASE}/search?q=${encodeURIComponent(query)}`);
}

export function getSong(videoId: string): Promise<SongFull> {
  return fetchJson(`${BASE}/songs/${videoId}`);
}

export function getAlbum(albumId: string): Promise<AlbumFull> {
  return fetchJson(`${BASE}/albums/${albumId}`);
}

export function getArtist(artistId: string): Promise<ArtistFull> {
  return fetchJson(`${BASE}/artists/${artistId}`);
}

export function getPlaylist(playlistId: string): Promise<PlaylistFull> {
  return fetchJson(`${BASE}/playlists/${playlistId}`);
}

export function getLyrics(videoId: string): Promise<string[]> {
  return fetchJson(`${BASE}/lyrics/${videoId}`);
}

export function getStreamUrl(videoId: string): Promise<string> {
  // The server proxies the audio. The URL itself is the stream endpoint.
  return Promise.resolve(`${BASE}/stream/${videoId}`);
}

export function getRecommendations(): Promise<HomeSection[]> {
  return fetchJson(`${BASE}/recommendations`);
}
