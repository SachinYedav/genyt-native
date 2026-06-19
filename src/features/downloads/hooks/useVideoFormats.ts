import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sourceAdapter } from '@/services/source';

type TabOption = 'video' | 'audio' | 'thumbnail';

export function useVideoFormats(videoId: string, activeTab: TabOption) {
  const detailsQuery = useQuery({
    queryKey: ['video-details', videoId],
    queryFn: () => sourceAdapter.getVideoDetails(videoId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const video = detailsQuery.data;
  const formats = video?.formats ?? [];

  const videoFormats = useMemo(() => formats.filter((f) => f.category === 'video'), [formats]);
  const audioFormats = useMemo(() => formats.filter((f) => f.category === 'audio'), [formats]);
  const imageFormats = useMemo(() => formats.filter((f) => f.category === 'thumbnail'), [formats]);

  const activeFormats = useMemo(() => {
    const list = activeTab === 'video' ? videoFormats : activeTab === 'audio' ? audioFormats : imageFormats;
    return list.map(format => {
      let uiLabel: 'RECOMMENDED' | 'NO_AUDIO' | null = null;
      if (activeTab === 'video') {
        if (format.hasVideo && format.hasAudio) uiLabel = 'RECOMMENDED';
        else if (format.hasVideo && !format.hasAudio) uiLabel = 'NO_AUDIO';
      } else if (activeTab === 'audio') {
        if (!format.hasVideo && format.hasAudio && format.extension === 'm4a') uiLabel = 'RECOMMENDED';
      }
      return { ...format, uiLabel };
    });
  }, [activeTab, videoFormats, audioFormats, imageFormats]);

  const counts = {
    video: videoFormats.length,
    audio: audioFormats.length,
    thumbnail: imageFormats.length,
  };

  return {
    video,
    detailsQuery,
    refetch: detailsQuery.refetch,
    activeFormats,
    counts,
  };
}
