import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState, useRef } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { PlayerControlsOverlay } from './PlayerControlsOverlay';
import { PlayerSettingsSheet, type QualityOption, type PlaybackSpeed } from './QualitySheet';
import { GenytVideoPlayerView, GenytVideoPlayerRef } from '../../../../modules/genyt-video-player/src';
import { usePlayerStore } from '../store/usePlayerStore';
import type { SharedValue } from 'react-native-reanimated';

interface CustomVideoPlayerProps {
  streamSource?: {
    dashVideoUrl: string | null;
    dashAudioUrl: string | null;
    fallbackUrl: string;
  } | null;
  videoId?: string;
  title: string;
  onClose: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  qualities?: QualityOption[];
  currentQualityId?: string;
  onQualityChange?: (id: string) => void;
  onProgressUpdate?: (progress: number) => void;
  initialProgress?: number;
  animationProgress?: SharedValue<number>;
  onVideoEnd?: () => void;
  onPlayNext?: () => void;
}

export function CustomVideoPlayer({ streamSource, videoId, title, onClose, onFullscreenChange, qualities, currentQualityId, onQualityChange, onProgressUpdate, initialProgress, animationProgress, onVideoEnd, onPlayNext }: CustomVideoPlayerProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const isPlaying = usePlayerStore(state => state.isPlaying);
  const setIsPlaying = usePlayerStore(state => state.setIsPlaying);
  const playerState = usePlayerStore(state => state.playerState);
  const isFullscreen = usePlayerStore(state => state.isFullscreen);
  const setIsFullscreen = usePlayerStore(state => state.setIsFullscreen);

  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);

  const playerRef = useRef<GenytVideoPlayerRef>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'readyToPlay' | 'error'>('loading');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPosition, setBufferedPosition] = useState(0);

  // Sync fullscreen exit when player is minimized globally
  useEffect(() => {
    if ((playerState === 'minimized' || playerState === 'closed') && isFullscreen) {
      setIsFullscreen(false);
      onFullscreenChange?.(false);
    }
  }, [playerState, isFullscreen, onFullscreenChange, setIsFullscreen]);

  // Play automatically when ready if global state is playing
  useEffect(() => {
    if (isPlaying && status === 'readyToPlay') {
      playerRef.current?.play()?.catch?.((e) => { });
    }
  }, [isPlaying, status]);

  // Sync with global isPlaying state
  const prevIsPlaying = useRef(isPlaying);
  useEffect(() => {
    if (prevIsPlaying.current !== isPlaying) {
      if (isPlaying) {
        playerRef.current?.play()?.catch?.(() => { });
      } else {
        playerRef.current?.pause()?.catch?.(() => { });
      }
      prevIsPlaying.current = isPlaying;
    }
  }, [isPlaying]);

  // Keep track of progress safely without relying on the player object during unmount
  const progressRef = useRef(0);
  useEffect(() => {
    if (duration > 0 && currentTime > 0) {
      progressRef.current = currentTime / duration;
    }
  }, [currentTime, duration]);

  const [hasSeekedToInitial, setHasSeekedToInitial] = useState(false);
  useEffect(() => {
    if (initialProgress && initialProgress > 0 && duration > 0 && !hasSeekedToInitial) {
      playerRef.current?.seekTo(initialProgress * duration)?.catch?.((e) => { });
      setHasSeekedToInitial(true);
    }
  }, [duration, initialProgress, hasSeekedToInitial]);

  useEffect(() => {
    playerRef.current?.setPlaybackRate?.(playbackSpeed)?.catch?.(() => { });
  }, [playbackSpeed]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      setIsFullscreen(false);
      onFullscreenChange?.(false);
    } else {
      setIsFullscreen(true);
      onFullscreenChange?.(true);
    }
  }, [isFullscreen, setIsFullscreen, onFullscreenChange]);

  const handleClose = useCallback(async () => {
    if (isFullscreen) {
      setIsFullscreen(false);
      onFullscreenChange?.(false);
    }
    onClose();
  }, [isFullscreen, setIsFullscreen, onClose, onFullscreenChange]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFullscreen) {
        toggleFullscreen();
        return true;
      }
      const isCurrentlyMinimized = usePlayerStore.getState().playerState === 'minimized';
      if (!isCurrentlyMinimized) {
        onClose(); // Minimize player
        return true;
      }
      return false; // Let the back button behave normally 
    });
    return () => subscription.remove();
  }, [isFullscreen, toggleFullscreen, onClose]);

  const onProgressUpdateRef = useRef(onProgressUpdate);
  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  // Sync orientation with global fullscreen state strictly
  useEffect(() => {
    if (isFullscreen) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [isFullscreen]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (progressRef.current > 0) {
        onProgressUpdateRef.current?.(progressRef.current);
      }
    };
  }, []);

  const isLoading = status === 'loading';

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar hidden={isFullscreen} />
      <GenytVideoPlayerView
        ref={playerRef}
        streamSource={streamSource || { dashVideoUrl: null, dashAudioUrl: null, fallbackUrl: '' }}
        isShortsMode={false}
        resizeMode={isFullscreen ? 'cover' : 'contain'}
        style={styles.videoView}
        onPlaybackStateChanged={(e) => {
          const stateStr = e.nativeEvent.state;
          if (stateStr) {
            setStatus(stateStr === 'buffering' ? 'loading' : stateStr === 'ready' ? 'readyToPlay' : stateStr === 'error' ? 'error' : 'idle');
            if (stateStr === 'ended') {
              onVideoEnd?.();
            }
          }
          if (e.nativeEvent.isPlaying !== undefined) {
            setIsPlaying(e.nativeEvent.isPlaying);
          }
        }}
        onProgress={(e) => {
          setCurrentTime(e.nativeEvent.currentTime);
          setDuration(e.nativeEvent.duration);
          setBufferedPosition(e.nativeEvent.bufferedPosition);
        }}
      />

      <PlayerControlsOverlay
        playerRef={playerRef}
        videoId={videoId}
        currentTime={currentTime}
        duration={duration}
        bufferedPosition={bufferedPosition}
        title={title}
        isPlaying={isPlaying}
        status={status}
        error={status === 'error'}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onClose={handleClose}
        hasQualities={!!qualities && qualities.length > 0}
        onSettingsPress={() => setShowSettings(true)}
        animationProgress={animationProgress}
        isMinimized={playerState === 'minimized' || playerState === 'closed'}
        onPlayNext={onPlayNext}
      />

      <PlayerSettingsSheet
        visible={showSettings}
        qualities={qualities ?? []}
        currentQualityId={currentQualityId ?? ''}
        currentSpeed={playbackSpeed}
        onSelectQuality={(id) => {
          onQualityChange?.(id);
        }}
        onSelectSpeed={(speed) => {
          setPlaybackSpeed(speed);
        }}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.black,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    backgroundColor: colors.black,
    aspectRatio: undefined,
  },
  videoView: {
    flex: 1,
  },
});
