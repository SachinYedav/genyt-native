import type { StyleProp, ViewStyle } from 'react-native';

export type PlaybackState = 'idle' | 'buffering' | 'ready' | 'ended' | 'unknown' | 'error';

export type OnPlaybackStateChangedPayload = {
  state?: PlaybackState;
  isPlaying?: boolean;
};

export type OnProgressPayload = {
  currentTime: number;
  duration: number;
  bufferedPosition: number;
};

export type StreamSourcePayload = {
  dashVideoUrl: string | null;
  dashAudioUrl: string | null;
  fallbackUrl: string;
};

export type GenytVideoPlayerViewProps = {
  videoUri?: string | null;
  audioUri?: string | null;
  fallbackUri?: string | null;
  streamSource?: StreamSourcePayload | null;
  isShortsMode?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  onPlaybackStateChanged?: (event: { nativeEvent: OnPlaybackStateChangedPayload }) => void;
  onProgress?: (event: { nativeEvent: OnProgressPayload }) => void;
  style?: StyleProp<ViewStyle>;
};

export type GenytVideoPlayerRef = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;
};
