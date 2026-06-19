import { useInfiniteQuery } from '@tanstack/react-query';
import { sourceAdapter } from '@/services/source';

export function useChannel(channelId: string, tabFilter?: string) {
  return useInfiniteQuery({
    queryKey: ['channel', channelId, tabFilter],
    queryFn: async ({ pageParam, signal }) => {
      if (pageParam) {
        // For pagination, just fetch the next page using the token
        return sourceAdapter.fetchNextPage(pageParam, signal);
      }
      // For initial load, fetch the channel details
      return sourceAdapter.getChannelDetails(channelId, tabFilter, signal);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.continuationToken,
    enabled: !!channelId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
