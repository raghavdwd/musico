export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface ArtistBasic {
  artistId: string | null;
  name: string;
}

export interface AlbumBasic {
  albumId: string;
  name: string;
}

export type SearchResult = SongDetailed | VideoDetailed | AlbumDetailed | ArtistDetailed | PlaylistDetailed;

export interface SongDetailed {
  type: "SONG";
  videoId: string;
  name: string;
  artist: ArtistBasic;
  album: AlbumBasic | null;
  duration: number | null;
  thumbnails: Thumbnail[];
}

export interface VideoDetailed {
  type: "VIDEO";
  videoId: string;
  name: string;
  artist: ArtistBasic;
  duration: number | null;
  thumbnails: Thumbnail[];
}

export interface AlbumDetailed {
  type: "ALBUM";
  albumId: string;
  playlistId: string;
  name: string;
  artist: ArtistBasic;
  year: number | null;
  thumbnails: Thumbnail[];
}

export interface ArtistDetailed {
  type: "ARTIST";
  artistId: string;
  name: string;
  thumbnails: Thumbnail[];
}

export interface PlaylistDetailed {
  type: "PLAYLIST";
  playlistId: string;
  name: string;
  artist: ArtistBasic;
  thumbnails: Thumbnail[];
}

export interface SongFull {
  type: "SONG";
  videoId: string;
  name: string;
  artist: ArtistBasic;
  duration: number;
  thumbnails: Thumbnail[];
}

export interface AlbumFull {
  type: "ALBUM";
  albumId: string;
  playlistId: string;
  name: string;
  artist: ArtistBasic;
  year: number | null;
  thumbnails: Thumbnail[];
  songs: SongDetailed[];
}

export interface ArtistFull {
  type: "ARTIST";
  artistId: string;
  name: string;
  thumbnails: Thumbnail[];
  topSongs: SongDetailed[];
  topAlbums: AlbumDetailed[];
  similarArtists: ArtistDetailed[];
}

export interface PlaylistFull {
  type: "PLAYLIST";
  playlistId: string;
  name: string;
  artist: ArtistBasic;
  videoCount: number;
  thumbnails: Thumbnail[];
}

export interface HomeSection {
  title: string;
  contents: Array<SongDetailed | AlbumDetailed | PlaylistDetailed>;
}

export interface StreamData {
  url: string;
  mimeType: string;
  bitrate: number;
  contentLength: number;
}
