import type { ImageSourcePropType } from 'react-native';

export type VideoSource = 'mock' | 'youtube';

export type VideoSummary = {
  id: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  channelAvatarUrl?: string;
  thumbnailUrl: string;
  thumbnailAsset?: ImageSourcePropType;
  durationLabel: string;
  viewCountLabel: string;
  publishedLabel: string;
  source: VideoSource;
  isShort?: boolean;
  isPlaylist?: boolean;
  videoCountLabel?: string;
  progress?: number;
};

export type MediaFormat = {
  id: string;
  extractionSessionId?: string;
  category: 'video' | 'audio' | 'thumbnail';
  label: string;
  extension: 'mp4' | 'webm' | 'm4a' | 'mp3' | 'jpg' | 'png' | 'webp';
  qualityLabel: string;
  sizeLabel?: string;
  downloadUrl: string; // The actual URL to fetch the file
  hasAudio: boolean;
  hasVideo: boolean;
};

export type VideoDetails = VideoSummary & {
  description: string;
  formats: MediaFormat[];
  related: VideoSummary[];
};
