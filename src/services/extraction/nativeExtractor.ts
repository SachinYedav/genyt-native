import { youtubeExtractor } from 'genyt-youtube-extractor';

import { normalizeExtractionError } from './extractionErrors';
import type {
  ExtractionRequestOptions,
  NativeExtractionResultDto,
  NativePaginatedVideoResultDto,
  ResolvedMediaRequest,
} from './types';

let nextRequestId = 0;

async function runRequest<T>(
  operation: (requestId: string) => Promise<T>,
  options?: ExtractionRequestOptions,
): Promise<T> {
  const requestId = `extract-${Date.now()}-${nextRequestId++}`;
  const onAbort = () => youtubeExtractor.cancel(requestId);
  options?.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    if (options?.signal?.aborted) onAbort();
    return await operation(requestId);
  } catch (error) {
    throw normalizeExtractionError(error);
  } finally {
    options?.signal?.removeEventListener('abort', onAbort);
  }
}

export const nativeExtractor = {
  healthCheck: () => youtubeExtractor.healthCheck(),

  async search(query: string, limit = 20, options?: ExtractionRequestOptions) {
    try {
      const result = await runRequest<NativePaginatedVideoResultDto>(
        (requestId) => youtubeExtractor.search(requestId, query, limit),
        options,
      );
      return result;
    } catch (error) {
      console.error('[nativeExtractor] search failed', error);
      throw error;
    }
  },

  async getHomeFeed(topic?: string, limit = 20, options?: ExtractionRequestOptions) {
    try {
      const result = await runRequest<NativePaginatedVideoResultDto>(
        (requestId) => youtubeExtractor.getHomeFeed(requestId, topic, limit),
        options,
      );
      return result;
    } catch (error) {
      console.error('[nativeExtractor] home feed failed', error);
      throw error;
    }
  },

  async fetchNextPage(token: string, options?: ExtractionRequestOptions) {
    try {
      const result = await runRequest<NativePaginatedVideoResultDto>(
        (requestId) => youtubeExtractor.fetchNextPage(requestId, token),
        options,
      );
      return result;
    } catch (error) {
      console.error('[nativeExtractor] fetchNextPage failed', error);
      throw error;
    }
  },

  async extractVideo(videoIdOrUrl: string, options?: ExtractionRequestOptions) {
    try {
      const result = await runRequest<NativeExtractionResultDto>(
        (requestId) => youtubeExtractor.extractVideo(requestId, videoIdOrUrl),
        options,
      );
      return result;
    } catch (error) {
      console.error('[JS Bridge] Native Extraction FAILED for:', videoIdOrUrl, '| error:', error);
      throw error;
    }
  },

  resolveFormat(sessionId: string, formatId: string, options?: ExtractionRequestOptions) {
    return runRequest<ResolvedMediaRequest>(
      (requestId) => youtubeExtractor.resolveFormat(requestId, sessionId, formatId),
      options,
    );
  },

  async getChannelDetails(channelIdOrUrl: string, tabFilter?: string, options?: ExtractionRequestOptions) {
    try {
      const result = await runRequest<import('./types').NativeChannelDetailsDto>(
        (requestId) => youtubeExtractor.getChannelDetails(requestId, channelIdOrUrl, tabFilter),
        options,
      );
      return result;
    } catch (error) {
      console.error('[nativeExtractor] getChannelDetails failed', error);
      throw error;
    }
  },

  async getPlaylistDetails(playlistIdOrUrl: string, options?: ExtractionRequestOptions) {
    try {
      const result = await runRequest<import('./types').NativePlaylistDetailsDto>(
        (requestId) => youtubeExtractor.getPlaylistDetails(requestId, playlistIdOrUrl),
        options,
      );
      return result;
    } catch (error) {
      console.error('[nativeExtractor] getPlaylistDetails failed', error);
      throw error;
    }
  },
};
