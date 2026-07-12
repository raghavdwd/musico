import YTMusic from "ytmusic-api";

let api: YTMusic | null = null;

export async function getYTMusic(): Promise<YTMusic> {
  if (!api) {
    api = new YTMusic();
    await api.initialize();
  }
  return api;
}

export async function search(query: string) {
  const client = await getYTMusic();
  return client.search(query);
}

export async function getSong(songId: string) {
  const client = await getYTMusic();
  return client.getSong(songId);
}

export async function getAlbum(albumId: string) {
  const client = await getYTMusic();
  return client.getAlbum(albumId);
}

export async function getPlaylist(playlistId: string) {
  const client = await getYTMusic();
  return client.getPlaylist(playlistId);
}

export async function getArtist(artistId: string) {
  const client = await getYTMusic();
  return client.getArtist(artistId);
}

export async function getLyrics(songId: string) {
  const client = await getYTMusic();
  return client.getLyrics(songId);
}

export async function getRecommendations() {
  const client = await getYTMusic();
  return client.getHomeSections();
}
