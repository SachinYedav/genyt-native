import { mapNativeExtractionResult, mapNativeVideoSummary } from '@/services/extraction/mapNativeResult';
import { nativeExtractor } from '@/services/extraction/nativeExtractor';

import type { SourceAdapter } from './types';

export const nativeSourceAdapter: SourceAdapter = {
  async getHomeFeed({ topic, limit = 20, signal } = {}) {
    const result = await nativeExtractor.getHomeFeed(topic, limit, { signal });
    return {
      items: result.videos.map(mapNativeVideoSummary),
      continuationToken: result.continuationToken,
    };
  },

  async search({ query, limit = 20, signal }) {
    const trimmedQuery = query.trim();
    const result = await nativeExtractor.search(trimmedQuery, limit, { signal });
    return {
      items: result.videos.map(mapNativeVideoSummary),
      continuationToken: result.continuationToken,
    };
  },

  async fetchNextPage(token: string, signal?: AbortSignal) {
    const result = await nativeExtractor.fetchNextPage(token, { signal });
    return {
      items: result.videos.map(mapNativeVideoSummary),
      continuationToken: result.continuationToken,
    };
  },

  async getVideoDetails(videoId) {
    try {
      const result = await nativeExtractor.extractVideo(videoId);
      const mapped = mapNativeExtractionResult(result);
      return mapped;
    } catch (error) {
      console.error('[SourceAdapter] getVideoDetails FAILED:', videoId, '| error:', error);
      throw error;
    }
  },

  async getChannelDetails(channelId, tabFilter, signal) {
    try {
      const result = await nativeExtractor.getChannelDetails(channelId, tabFilter, { signal });
      return {
        id: result.id,
        title: result.title,
        avatarUrl: result.avatarUrl,
        subscriberCountText: result.subscriberCountText,
        videoCountText: result.videoCountText,
        videos: result.videos.map(mapNativeVideoSummary),
        continuationToken: result.continuationToken,
      };
    } catch (error) {
      console.error('[SourceAdapter] getChannelDetails FAILED:', channelId, '| error:', error);
      throw error;
    }
  },

  async getPlaylistDetails(playlistId, signal) {
    try {
      const result = await nativeExtractor.getPlaylistDetails(playlistId, { signal });
      return {
        id: result.id,
        title: result.title,
        channelTitle: result.channelTitle,
        thumbnailUrl: result.thumbnailUrl,
        videoCountText: result.videoCountText,
        videos: result.videos.map(mapNativeVideoSummary),
        continuationToken: result.continuationToken,
      };
    } catch (error) {
      console.error('[SourceAdapter] getPlaylistDetails FAILED:', playlistId, '| error:', error);
      throw error;
    }
  },
};
