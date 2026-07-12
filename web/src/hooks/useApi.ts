import { useQuery } from "@tanstack/react-query";
import * as api from "../api";

export const useHome = () =>
  useQuery({ queryKey: ["home"], queryFn: api.getRecommendations });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ["search", q],
    queryFn: () => api.search(q),
    enabled: q.trim().length > 0,
  });

export const useSong = (id: string | undefined) =>
  useQuery({
    queryKey: ["song", id],
    queryFn: () => api.getSong(id!),
    enabled: !!id,
  });

export const useAlbum = (id: string | undefined) =>
  useQuery({
    queryKey: ["album", id],
    queryFn: () => api.getAlbum(id!),
    enabled: !!id,
  });

export const useArtist = (id: string | undefined) =>
  useQuery({
    queryKey: ["artist", id],
    queryFn: () => api.getArtist(id!),
    enabled: !!id,
  });

export const usePlaylist = (id: string | undefined) =>
  useQuery({
    queryKey: ["playlist", id],
    queryFn: () => api.getPlaylist(id!),
    enabled: !!id,
  });

export const useLyrics = (id: string | undefined) =>
  useQuery({
    queryKey: ["lyrics", id],
    queryFn: () => api.getLyrics(id!),
    enabled: !!id,
  });
