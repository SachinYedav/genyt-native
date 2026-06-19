import type { HybridObject } from 'react-native-nitro-modules'

export interface NativeVideoSummary {
  id: string
  title: string
  author: string
  thumbnailUrl: string
  authorAvatarUrl?: string
  channelId?: string
  durationSeconds?: number
  viewCount?: number
  publishedText?: string
  isShort?: boolean
  isPlaylist?: boolean
}

export interface NativeMediaFormat {
  formatId: string
  category: string
  label: string
  container: string
  quality: string
  bitrate?: number
  contentLength?: number
  hasAudio: boolean
  hasVideo: boolean
}

export interface NativePaginatedVideoResult {
  videos: NativeVideoSummary[]
  continuationToken?: string
}

export interface NativeExtractionResult {
  sessionId: string
  video: NativeVideoSummary
  description: string
  formats: NativeMediaFormat[]
  related: NativeVideoSummary[]
}

export interface NativeResolvedFormat {
  sessionId: string
  formatId: string
  url: string
  mimeType: string
  contentLength?: number
  expiresAtEpochMs: number
}


export interface NativeChannelDetails {
  id: string
  title: string
  avatarUrl?: string
  subscriberCountText?: string
  videoCountText?: string
  videos: NativeVideoSummary[]
  continuationToken?: string
}

export interface NativePlaylistDetails {
  id: string
  title: string
  channelTitle?: string
  thumbnailUrl?: string
  videoCountText?: string
  videos: NativeVideoSummary[]
  continuationToken?: string
}

export interface YoutubeExtractor extends HybridObject<{ android: 'kotlin' }> {
  healthCheck(): string
  search(
    requestId: string,
    query: string,
    limit: number
  ): Promise<NativePaginatedVideoResult>
  getHomeFeed(
    requestId: string,
    topic: string | undefined,
    limit: number
  ): Promise<NativePaginatedVideoResult>
  fetchNextPage(
    requestId: string,
    token: string
  ): Promise<NativePaginatedVideoResult>

  extractVideo(
    requestId: string,
    videoIdOrUrl: string
  ): Promise<NativeExtractionResult>
  resolveFormat(
    requestId: string,
    sessionId: string,
    formatId: string
  ): Promise<NativeResolvedFormat>
  
  getChannelDetails(
    requestId: string,
    channelIdOrUrl: string,
    tabFilter: string | undefined
  ): Promise<NativeChannelDetails>
  
  getPlaylistDetails(
    requestId: string,
    playlistIdOrUrl: string
  ): Promise<NativePlaylistDetails>

  cancel(requestId: string): void
}
