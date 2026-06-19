import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePlayerStore } from '../store/usePlayerStore';
import { sourceAdapter } from '@/services/source';
import { nativeExtractor } from '@/services/extraction/nativeExtractor';
import type { VideoDetails } from '@/entities/video/types';

export function useWatchScreen() {
  const activeVideo = usePlayerStore((state) => state.activeVideo);
  const videoId = activeVideo?.id;
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);

  const detailsQuery = useQuery({
    queryKey: ['video-details', videoId],
    queryFn: async () => {
      const details = await sourceAdapter.getVideoDetails(videoId!);
      return {
        ...activeVideo,
        ...details,
        publishedLabel: details.publishedLabel || activeVideo?.publishedLabel || '',
      };
    },
    enabled: !!videoId,
  });

  // Merge: use full API data when available, fall back to store's activeVideo for instant rendering
  const video = useMemo((): VideoDetails | null => {
    if (detailsQuery.data) return detailsQuery.data;
    if (!activeVideo) return null;
    // Provide a VideoDetails-shaped object from the summary so Title/Author/Thumbnail render instantly
    return {
      ...activeVideo,
      description: '',
      formats: [],
      related: [],
    };
  }, [detailsQuery.data, activeVideo]);

  const activeFormat = useMemo(() => {
    if (!video) return null;

    const videoFormats = video.formats.filter((f) => f.hasVideo && !f.hasAudio); // DASH video
    const progressiveFormats = video.formats.filter((f) => f.hasVideo && f.hasAudio);

    // If selected format, use it
    if (selectedFormatId) {
      return video.formats.find((f) => f.id === selectedFormatId) ?? videoFormats[0] ?? progressiveFormats[0];
    }

    // Default to the best DASH format under or equal to 1080p
    const defaultFormat = videoFormats.find((f) => {
      const match = f.qualityLabel?.match(/(\d+)p/);
      if (match) {
        return parseInt(match[1], 10) <= 1080;
      }
      return true;
    });

    return defaultFormat ?? videoFormats[0] ?? progressiveFormats[0];
  }, [selectedFormatId, video]);

  const activeFormatId = activeFormat?.id ?? '';

  const playbackQuery = useQuery({
    queryKey: ['video-playback', videoId, activeFormatId],
    queryFn: async () => {
      if (!activeFormat || !video) return { dashVideoUrl: null, dashAudioUrl: null, fallbackUrl: '' };

      // 1. Get DASH Video or Progressive URL
      let videoUrl = activeFormat.downloadUrl;
      if (!videoUrl && activeFormat.extractionSessionId) {
        const resolved = await nativeExtractor.resolveFormat(activeFormat.extractionSessionId, activeFormat.id);
        videoUrl = resolved.url;
      }

      // 2. Get DASH Audio URL (only if activeFormat is DASH video)
      let audioUrl = null;
      if (!activeFormat.hasAudio) {
        // Find best m4a audio, or any audio
        const audioFormat =
          video.formats.filter((f) => !f.hasVideo && f.hasAudio).find((f) => f.extension === 'm4a') ||
          video.formats.filter((f) => !f.hasVideo && f.hasAudio)[0];
        if (audioFormat) {
          audioUrl = audioFormat.downloadUrl ?? null;
          if (!audioUrl && audioFormat.extractionSessionId) {
            const resolved = await nativeExtractor.resolveFormat(audioFormat.extractionSessionId, audioFormat.id);
            audioUrl = resolved.url;
          }
        }
      }

      // 3. Get Fallback URL (Best 360p or any progressive)
      const progressiveFormats = video.formats.filter((f) => f.hasVideo && f.hasAudio);
      const fallbackFormat = progressiveFormats.find((f) => f.qualityLabel?.includes('360p')) || progressiveFormats[0];
      let fallbackUrl = fallbackFormat?.downloadUrl ?? '';

      if (!fallbackUrl && fallbackFormat?.extractionSessionId) {
        const resolved = await nativeExtractor.resolveFormat(fallbackFormat.extractionSessionId, fallbackFormat.id);
        fallbackUrl = resolved.url;
      }

      // If the active format is already progressive, it acts as the fallback.
      const isProgressive = activeFormat.hasVideo && activeFormat.hasAudio;

      return {
        dashVideoUrl: isProgressive ? null : videoUrl,
        dashAudioUrl: isProgressive ? null : audioUrl,
        fallbackUrl: isProgressive ? (videoUrl ?? fallbackUrl) : fallbackUrl,
      };
    },
    enabled: !!activeFormat,
  });

  const [cachedUrls, setCachedUrls] = useState<{
    dashVideoUrl: string | null;
    dashAudioUrl: string | null;
    fallbackUrl: string;
  } | null>(null);

  const prevVideoId = useRef(videoId);
  if (videoId !== prevVideoId.current) {
    setCachedUrls(null);
    prevVideoId.current = videoId;
  }

  useEffect(() => {
    if (playbackQuery.data) {
      setCachedUrls(playbackQuery.data);
    }
  }, [playbackQuery.data]);

  const playbackUrls = playbackQuery.data ?? cachedUrls;

  return {
    videoId,
    video,
    detailsQuery,
    playbackUrls,
    activeFormatId,
    setSelectedFormatId,
  };
}
