import { useInfiniteQuery } from '@tanstack/react-query';
import { sourceAdapter } from '@/services/source';
import { formatYoutubeUrl } from '@/utils/youtubeUrl';

export function usePlaylist(playlistIdOrUrl: string) {
  return useInfiniteQuery({
    queryKey: ['playlist', playlistIdOrUrl],
    queryFn: async ({ pageParam, signal }) => {
      if (pageParam) {
        return sourceAdapter.fetchNextPage(pageParam, signal);
      }
      const formattedUrl = formatYoutubeUrl(playlistIdOrUrl, 'playlist');
      try {
        return await sourceAdapter.getPlaylistDetails(formattedUrl, signal);
      } catch (error) {
        throw new Error('Extraction failed: Unable to load playlist details.');
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.continuationToken,
    enabled: !!playlistIdOrUrl,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
