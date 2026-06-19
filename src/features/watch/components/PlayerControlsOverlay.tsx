import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
  FadeOut,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { ChevronDown, Maximize, Minimize, Pause, Play, RotateCw, FastForward, Rewind, Settings, X, SkipBack, SkipForward, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { PlayerGestures } from './PlayerGestures';
import { PlayerScrubber } from './PlayerScrubber';
import { PlayerErrorState } from './PlayerErrorState';
import { GenytVideoPlayerRef, GenytVideoPlayerModule } from '../../../../modules/genyt-video-player/src';

interface PlayerControlsOverlayProps {
  playerRef: React.RefObject<GenytVideoPlayerRef | null>;
  videoId?: string;
  currentTime: number;
  duration: number;
  bufferedPosition: number;
  title: string;
  isPlaying: boolean;
  status: 'idle' | 'loading' | 'readyToPlay' | 'error';
  error: unknown;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
  onSettingsPress?: () => void;
  hasQualities?: boolean;
  animationProgress?: SharedValue<number>;
  isMinimized?: boolean;
  onPlayNext?: () => void;
}

export function PlayerControlsOverlay({
  playerRef,
  videoId,
  currentTime,
  duration,
  bufferedPosition,
  title,
  isPlaying,
  status,
  error,
  isFullscreen,
  onToggleFullscreen,
  onClose,
  onSettingsPress,
  hasQualities,
  animationProgress,
  isMinimized,
  onPlayNext,
}: PlayerControlsOverlayProps) {
  const closeVideo = usePlayerStore(state => state.closeVideo);
  const playPrevious = usePlayerStore(state => state.playPrevious);
  const autoplay = useSettingsStore(state => state.autoplay);
  const toggleAutoplay = useSettingsStore(state => state.toggleAutoplay);
  
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const opacity = useSharedValue(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [seekFeedback, setSeekFeedback] = useState<'forward' | 'backward' | null>(null);

  const isEnded = duration > 0 && Math.abs(currentTime - duration) < 0.5;

  const currentTimeRef = useRef(currentTime);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const hideControls = useCallback(() => {
    opacity.value = withTiming(0, { duration: 300 });
  }, [opacity]);

  const showControls = useCallback(() => {
    opacity.value = withTiming(1, { duration: 200 });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isPlaying) {
      timeoutRef.current = setTimeout(() => {
        hideControls();
      }, 3000);
    }
  }, [opacity, isPlaying, hideControls]);

  useEffect(() => {
    showControls();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    };
  }, [isPlaying, showControls]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animationProgressStyle = useAnimatedStyle(() => {
    if (!animationProgress) return { opacity: 1 };
    return {
      opacity: interpolate(animationProgress.value, [0, 0.2], [1, 0], Extrapolation.CLAMP),
      pointerEvents: animationProgress.value < 0.1 ? 'auto' : 'none',
    };
  });

  const handlePlayPause = useCallback(() => {
    if (isPlaying) playerRef.current?.pause()?.catch?.(() => {});
    else playerRef.current?.play()?.catch?.(() => {});
    showControls();
  }, [isPlaying, playerRef, showControls]);

  const handleSeek = useCallback((direction: 'forward' | 'backward') => {
    const skipAmount = 10;
    const newTime = direction === 'forward' ? currentTimeRef.current + skipAmount : currentTimeRef.current - skipAmount;
    const clampedTime = Math.max(0, Math.min(newTime, duration));
    playerRef.current?.seekTo(clampedTime)?.catch?.(() => {}); // Native expects seconds
    showControls();

    setSeekFeedback(direction);
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      setSeekFeedback(null);
      seekTimeoutRef.current = null;
    }, 600);
  }, [duration, playerRef, showControls]);

  const isError = status === 'error' || error;
  const isLoading = status === 'loading';

  const topBar = useMemo(() => (
    <View style={styles.topBar}>
      <Pressable style={styles.iconButton} onPress={onClose} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
        <ChevronDown color={colors.white} size={28} />
      </Pressable>
      <AppText numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      <Pressable style={styles.iconButton} onPress={toggleAutoplay} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
        {autoplay ? (
          <ToggleRight color={colors.brand} size={24} />
        ) : (
          <ToggleLeft color={colors.white} size={24} />
        )}
      </Pressable>
      {onSettingsPress ? (
        <Pressable style={styles.iconButton} onPress={onSettingsPress} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Settings color={colors.white} size={24} />
        </Pressable>
      ) : null}
    </View>
  ), [styles.topBar, styles.iconButton, styles.title, onClose, title, onSettingsPress, colors.white, colors.brand, autoplay, toggleAutoplay]);

  const centerControls = useMemo(() => (
    <View style={styles.centerControls} pointerEvents="box-none">
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.brand} />
      ) : isError ? (
        <PlayerErrorState 
          message={typeof error === 'string' ? error : 'This video cannot be played directly.'}
          youtubeUrl={`https://www.youtube.com/watch?v=${videoId ?? ''}`}
        />
      ) : isEnded ? (
        <View style={styles.playbackControlsRow} pointerEvents="box-none">
          <Pressable style={styles.skipButton} onPress={() => { 
            const store = usePlayerStore.getState();
            if (store.currentIndex > 0) {
              store.playPrevious();
            } else {
              playerRef.current?.seekTo(0)?.catch?.(() => {});
              playerRef.current?.play()?.catch?.(() => {});
            }
            showControls(); 
          }}>
            <SkipBack color={colors.white} size={28} />
          </Pressable>
          <Pressable style={styles.playPauseButton} onPress={() => {
            playerRef.current?.seekTo(0)?.catch?.(() => {});
            playerRef.current?.play()?.catch?.(() => {});
            showControls();
          }}>
            <RotateCw color={colors.white} size={32} />
          </Pressable>
          <Pressable style={styles.skipButton} onPress={() => { onPlayNext?.(); showControls(); }}>
            <SkipForward color={colors.white} size={28} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.playbackControlsRow} pointerEvents="box-none">
          <Pressable style={styles.skipButton} onPress={() => { 
            const store = usePlayerStore.getState();
            if (store.currentIndex > 0) {
              store.playPrevious();
            } else {
              playerRef.current?.seekTo(0)?.catch?.(() => {});
              playerRef.current?.play()?.catch?.(() => {});
            }
            showControls(); 
          }}>
            <SkipBack color={colors.white} size={28} />
          </Pressable>
          <Pressable style={styles.playPauseButton} onPress={handlePlayPause}>
            {isPlaying ? (
              <Pause color={colors.white} size={32} fill={colors.white} />
            ) : (
              <Play color={colors.white} size={32} fill={colors.white} />
            )}
          </Pressable>
          <Pressable style={styles.skipButton} onPress={() => { onPlayNext?.(); showControls(); }}>
            <SkipForward color={colors.white} size={28} />
          </Pressable>
        </View>
      )}
    </View>
  ), [styles.centerControls, styles.playbackControlsRow, styles.skipButton, styles.playPauseButton, isLoading, isError, error, videoId, isEnded, isPlaying, handlePlayPause, playerRef, colors.brand, colors.white, onPlayNext, showControls]);

  const fullscreenToggle = useMemo(() => (
    <Pressable style={styles.iconButton} onPress={onToggleFullscreen} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
      {isFullscreen ? (
        <Minimize color={colors.white} size={20} />
      ) : (
        <Maximize color={colors.white} size={20} />
      )}
    </Pressable>
  ), [styles.iconButton, onToggleFullscreen, isFullscreen, colors.white]);

  if (isMinimized) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animationProgressStyle]}>
      <PlayerGestures
        onSingleTap={showControls}
        onDoubleTapLeft={() => handleSeek('backward')}
        onDoubleTapRight={() => handleSeek('forward')}
      >
        <View style={StyleSheet.absoluteFill} />
      </PlayerGestures>

      <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents="box-none">
        {topBar}
        {centerControls}

        {/* Seek Feedback Overlay */}
        <View style={styles.feedbackContainer} pointerEvents="none">
          {seekFeedback === 'backward' && (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.feedbackRippleLeft}>
              <Rewind color={colors.white} size={32} />
              <AppText style={{ marginTop: 4, color: colors.white }}>-10s</AppText>
            </Animated.View>
          )}
          {seekFeedback === 'forward' && (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.feedbackRippleRight}>
              <FastForward color={colors.white} size={32} />
              <AppText style={{ marginTop: 4, color: colors.white }}>+10s</AppText>
            </Animated.View>
          )}
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <PlayerScrubber 
            playerRef={playerRef} 
            currentTime={currentTime} 
            duration={duration} 
            bufferedPosition={bufferedPosition} 
            onInteractionStart={showControls} 
            onInteractionEnd={showControls} 
          />

          {fullscreenToggle}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.bodyLg,
    fontWeight: '600',
    color: colors.white,
  },
  iconButton: {
    padding: spacing.sm,
  },
  centerControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1, // Keep it behind gestures unless needed
  },
  playbackControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  skipButton: {
    padding: spacing.md,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.lg,
    borderRadius: radius.sm,
    gap: spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 10,
  },
  feedbackRippleLeft: {
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopRightRadius: 1000,
    borderBottomRightRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackRippleRight: {
    width: '50%',
    height: '100%',
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 1000,
    borderBottomLeftRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
