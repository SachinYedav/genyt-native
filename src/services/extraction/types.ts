export type ExtractionErrorCode =
  | 'NETWORK'
  | 'INVALID_URL'
  | 'VIDEO_UNAVAILABLE'
  | 'LOGIN_REQUIRED'
  | 'EXTRACTOR_OUTDATED'
  | 'UNKNOWN';

export type NativeVideoSummaryDto = {
  id: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  authorAvatarUrl?: string;
  channelId?: string;
  durationSeconds?: number;
  viewCount?: number;
  publishedText?: string;
  isShort?: boolean;
  isPlaylist?: boolean;
};

export type NativePaginatedVideoResultDto = {
  videos: NativeVideoSummaryDto[];
  continuationToken?: string;
};

export type NativeChannelDetailsDto = {
  id: string;
  title: string;
  avatarUrl?: string;
  subscriberCountText?: string;
  videoCountText?: string;
  videos: NativeVideoSummaryDto[];
  continuationToken?: string;
};

export type NativePlaylistDetailsDto = {
  id: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  videoCountText?: string;
  videos: NativeVideoSummaryDto[];
  continuationToken?: string;
};



export type NativeMediaFormatDto = {
  formatId: string;
  category: string;
  label: string;
  container: string;
  quality: string;
  bitrate?: number;
  contentLength?: number;
  hasAudio: boolean;
  hasVideo: boolean;
};

export type NativeExtractionResultDto = {
  sessionId: string;
  video: NativeVideoSummaryDto;
  description: string;
  formats: NativeMediaFormatDto[];
  related: NativeVideoSummaryDto[];
};

export type ResolvedMediaRequest = {
  sessionId: string;
  formatId: string;
  url: string;
  mimeType: string;
  contentLength?: number;
  expiresAtEpochMs: number;
};

export type ExtractionRequestOptions = {
  signal?: AbortSignal;
};
