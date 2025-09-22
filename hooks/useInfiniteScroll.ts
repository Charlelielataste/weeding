// Hook personnalisé pour l'infinite scroll avec TanStack Query
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchPhotos, fetchVideos } from "../services/api";
import { MediaFile, PaginatedResponse } from "../types";

export function useInfinitePhotos(limit = 20) {
  return useInfiniteQuery<PaginatedResponse<MediaFile>, Error>({
    queryKey: ["photos", "infinite"],
    queryFn: ({ pageParam }) =>
      fetchPhotos(pageParam as string | undefined, limit),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    refetchInterval: 30000, // auto-refresh toutes les 30s
  });
}

export function useInfiniteVideos(limit = 20) {
  return useInfiniteQuery<PaginatedResponse<MediaFile>, Error>({
    queryKey: ["videos", "infinite"],
    queryFn: ({ pageParam }) =>
      fetchVideos(pageParam as string | undefined, limit),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    refetchInterval: 30000, // auto-refresh toutes les 30s
  });
}
