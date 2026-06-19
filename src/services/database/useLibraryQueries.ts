import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VideoSummary } from '@/entities/video/types';
import { addToHistory, addToWatchlist, clearHistory, getHistory, getWatchlist, isInWatchlist, removeFromHistory, removeFromWatchlist, clearWatchlist, getSavedPlaylists, savePlaylist, removeSavedPlaylist, isPlaylistSaved, clearSavedPlaylists } from './queries';
import { useSettingsStore } from '@/store/useSettingsStore';

export const LIBRARY_KEYS = {
  history: ['library-history'] as const,
  watchlist: ['library-watchlist'] as const,
  inWatchlist: (videoId: string) => ['library-in-watchlist', videoId] as const,
  savedPlaylists: ['library-saved-playlists'] as const,
  isPlaylistSaved: (playlistId: string) => ['library-is-playlist-saved', playlistId] as const,
};

// History Hooks
export function useHistory() {
  return useQuery({
    queryKey: LIBRARY_KEYS.history,
    queryFn: getHistory,
  });
}

export function useAddHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (video: VideoSummary) => {
      const { pauseHistory } = useSettingsStore.getState();
      if (!pauseHistory) {
        addToHistory(video);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.history });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.history });
    },
  });
}

export function useRemoveFromHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => removeFromHistory(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.history });
    },
  });
}

// Watchlist Hooks
export function useWatchlist() {
  return useQuery({
    queryKey: LIBRARY_KEYS.watchlist,
    queryFn: getWatchlist,
  });
}

export function useIsInWatchlist(videoId: string) {
  return useQuery({
    queryKey: LIBRARY_KEYS.inWatchlist(videoId),
    queryFn: () => isInWatchlist(videoId),
  });
}

export function useToggleWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { video: VideoSummary; inWatchlist: boolean }) => {
      if (params.inWatchlist) {
        removeFromWatchlist(params.video.id);
      } else {
        addToWatchlist(params.video);
      }
      return !params.inWatchlist; // Return new state
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.watchlist });
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.inWatchlist(params.video.id) });
    },
  });
}

export function useClearWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      clearWatchlist();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.watchlist });
    },
  });
}

// Saved Playlists Hooks
export function useSavedPlaylists() {
  return useQuery({
    queryKey: LIBRARY_KEYS.savedPlaylists,
    queryFn: getSavedPlaylists,
  });
}

export function useIsPlaylistSaved(playlistId: string) {
  return useQuery({
    queryKey: LIBRARY_KEYS.isPlaylistSaved(playlistId),
    queryFn: () => isPlaylistSaved(playlistId),
    enabled: !!playlistId,
  });
}

export function useToggleSavedPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { playlist: VideoSummary; isSaved: boolean }) => {
      if (params.isSaved) {
        removeSavedPlaylist(params.playlist.id);
      } else {
        savePlaylist(params.playlist);
      }
      return !params.isSaved; // Return new state
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.savedPlaylists });
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.isPlaylistSaved(params.playlist.id) });
    },
  });
}

export function useClearSavedPlaylists() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      clearSavedPlaylists();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.savedPlaylists });
    },
  });
}
