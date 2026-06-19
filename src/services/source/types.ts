import type { VideoDetails, VideoSummary } from '@/entities/video/types';

export type SourceSearchParams = {
  query: string;
  limit?: number;
  signal?: AbortSignal;
};

export type SourceFeedParams = {
  topic?: string;
  limit?: number;
  signal?: AbortSignal;
};

export type PaginatedFeed = {
  items: VideoSummary[];
  continuationToken?: string;
};

export type ChannelDetails = {
  id: string;
  title: string;
  avatarUrl?: string;
  subscriberCountText?: string;
  videoCountText?: string;
  videos: VideoSummary[];
  continuationToken?: string;
};

export type PlaylistDetails = {
  id: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  videoCountText?: string;
  videos: VideoSummary[];
  continuationToken?: string;
};

export type SourceAdapter = {
  getHomeFeed(params?: SourceFeedParams): Promise<PaginatedFeed>;
  search(params: SourceSearchParams): Promise<PaginatedFeed>;
  fetchNextPage(token: string, signal?: AbortSignal): Promise<PaginatedFeed>;
  getVideoDetails(videoId: string): Promise<VideoDetails>;
  getChannelDetails(channelId: string, tabFilter?: string, signal?: AbortSignal): Promise<ChannelDetails>;
  getPlaylistDetails(playlistId: string, signal?: AbortSignal): Promise<PlaylistDetails>;
};
