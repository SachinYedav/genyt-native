import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, useWindowDimensions, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { WifiOff, Play, Pause, X } from 'lucide-react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { usePlayerStore } from './store/usePlayerStore';
import { spacing, useTheme, radius, typography, type ThemeColors } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { CustomVideoPlayer } from './components/CustomVideoPlayer';
import { useAddHistory, useIsInWatchlist, useToggleWatchlist } from '@/services/database/useLibraryQueries';
import { useSettingsStore } from '@/store/useSettingsStore';
import { WatchSkeleton } from './components/WatchSkeleton';
import { CollapsibleDescription } from './components/CollapsibleDescription';

import { useWatchScreen } from './hooks/useWatchScreen';
import { VideoMetadataSection } from './components/VideoMetadataSection';
import { RelatedVideosSection } from './components/RelatedVideosSection';
import { PlayerLoadingState } from './components/PlayerLoadingState';

const MINI_WIDTH = 180;
const MINI_HEIGHT = MINI_WIDTH * (9 / 16);
const SWIPE_DOWN_THRESHOLD = 150;

export function RootPlayerOverlay() {
  const activeVideo = usePlayerStore(state => state.activeVideo);
  const queue = usePlayerStore(state => state.queue);
  const currentIndex = usePlayerStore(state => state.currentIndex);
  const playQueue = usePlayerStore(state => state.playQueue);
  const playNext = usePlayerStore(state => state.playNext);
  const playerState = usePlayerStore(state => state.playerState);
  const minimizeVideo = usePlayerStore(state => state.minimizeVideo);
  const expandVideo = usePlayerStore(state => state.expandVideo);
  const closeVideo = usePlayerStore(state => state.closeVideo);
  const navigation = useNavigation<any>();
  const pauseHistory = useSettingsStore(state => state.pauseHistory);
  const autoplay = useSettingsStore(state => state.autoplay);
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { videoId, video, detailsQuery, playbackUrls, activeFormatId, setSelectedFormatId } = useWatchScreen();

  const isFullscreen = usePlayerStore(state => state.isFullscreen);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const setIsPlaying = usePlayerStore(state => state.setIsPlaying);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    if (isPlaying && playerState === 'expanded') {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake().catch(() => {});
    }
    return () => {
      deactivateKeepAwake().catch(() => {});
    };
  }, [isPlaying, playerState]);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const MAX_WIDTH = SCREEN_WIDTH;
  const MAX_HEIGHT = isFullscreen ? SCREEN_HEIGHT : SCREEN_WIDTH * (9 / 16);
  const insets = useSafeAreaInsets();

  // Layout boundaries for mini player
  const margin = 16;
  // Estimate bottom tabs height ~60
  const BOTTOM_Y = SCREEN_HEIGHT - insets.bottom - 60 - MINI_HEIGHT - margin;
  const TOP_Y = insets.top + margin;
  const LEFT_X = margin;
  const RIGHT_X = SCREEN_WIDTH - MINI_WIDTH - margin;

  // Shared Values for Animation
  // 0 = Expanded, 1 = Minimized
  const progress = useSharedValue(playerState === 'expanded' ? 0 : 1);
  const floatingX = useSharedValue(RIGHT_X);
  const floatingY = useSharedValue(BOTTOM_Y);

  const prevPlayerState = useRef(playerState);

  // Sync animation with state
  useEffect(() => {
    if (playerState === 'expanded') {
      if (prevPlayerState.current === 'closed' || prevPlayerState.current === 'expanded') {
        // Reset default position for new videos so they don't animate from an old off-screen memory
        floatingX.value = RIGHT_X;
        floatingY.value = BOTTOM_Y;
      }
      progress.value = withTiming(0, { duration: 300 });
    } else if (playerState === 'minimized') {
      // Force the destination to always be bottom-right regardless of previous drag position
      floatingX.value = RIGHT_X;
      floatingY.value = BOTTOM_Y;
      progress.value = withTiming(1, { duration: 300 });
    }
    prevPlayerState.current = playerState;
  }, [playerState, progress, RIGHT_X, BOTTOM_Y, floatingX, floatingY]);

  const { mutate: addHistory } = useAddHistory();
  const { data: inWatchlist } = useIsInWatchlist(videoId ?? '');
  const { mutate: toggleWatchlist } = useToggleWatchlist();

  const loggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (video && loggedRef.current !== video.id) {
      if (!pauseHistory) {
        addHistory(video);
      }
      loggedRef.current = video.id;
    }
  }, [video, addHistory, pauseHistory]);

  const handleDownload = useCallback(() => {
    if (activeVideo) {
      minimizeVideo();
      // @ts-ignore
      navigation.navigate('VideoDownloader', { videoId: activeVideo.id });
    }
  }, [activeVideo, navigation, minimizeVideo]);

  // Gestures
  const startDragY = useSharedValue(0);
  const startDragX = useSharedValue(0);

  // Gesture for minimizing from expanded state OR dragging around in minimized state
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      if (playerState === 'minimized') {
        startDragX.value = floatingX.value;
        startDragY.value = floatingY.value;
      }
    })
    .onUpdate((e) => {
      if (playerState === 'expanded') {
        // Only allow swiping down to minimize
        if (e.translationY > 0) {
          progress.value = Math.min(1, e.translationY / SWIPE_DOWN_THRESHOLD);
        }
      } else if (playerState === 'minimized') {
        // Drag floating player
        floatingX.value = startDragX.value + e.translationX;
        floatingY.value = startDragY.value + e.translationY;
      }
    })
    .onEnd((e) => {
      if (playerState === 'expanded') {
        if (e.translationY > SWIPE_DOWN_THRESHOLD * 0.5 || e.velocityY > 500) {
          floatingX.value = RIGHT_X;
          floatingY.value = BOTTOM_Y;
          progress.value = withTiming(1, { duration: 300 });
          runOnJS(minimizeVideo)();
        } else {
          progress.value = withTiming(0, { duration: 300 });
        }
      } else if (playerState === 'minimized') {
        if (Math.abs(e.translationX) > SCREEN_WIDTH * 0.35 || Math.abs(e.velocityX) > 1500) {
          const offScreenX = e.velocityX > 0 || e.translationX > 0 ? SCREEN_WIDTH + 50 : -MINI_WIDTH - 50;
          floatingX.value = withTiming(offScreenX, { duration: 300 });
          runOnJS(closeVideo)();
        } else {
          const snapX = floatingX.value + e.velocityX * 0.2 < SCREEN_WIDTH / 2 ? LEFT_X : RIGHT_X;
          const snapY = floatingY.value + e.velocityY * 0.2 < SCREEN_HEIGHT / 2 ? TOP_Y : BOTTOM_Y;

          floatingX.value = withSpring(snapX, { velocity: e.velocityX });
          floatingY.value = withSpring(snapY, { velocity: e.velocityY });
        }
      }
    });

  // Tap gesture to expand
  const tapGesture = Gesture.Tap().onEnd(() => {
    if (playerState === 'minimized') {
      progress.value = withTiming(0, { duration: 300 });
      runOnJS(expandVideo)();
    }
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // Animated Styles
  const frameStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: interpolate(progress.value, [0, 1], [MAX_WIDTH, MINI_WIDTH], Extrapolation.CLAMP),
      height: interpolate(progress.value, [0, 1], [MAX_HEIGHT, MINI_HEIGHT], Extrapolation.CLAMP),
      left: interpolate(progress.value, [0, 1], [0, floatingX.value], Extrapolation.CLAMP),
      top: interpolate(progress.value, [0, 1], [insets.top, floatingY.value], Extrapolation.CLAMP),
      borderRadius: interpolate(progress.value, [0, 1], [0, radius.md], Extrapolation.CLAMP),
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      overflow: 'hidden',
      elevation: progress.value > 0.5 ? 99 : 0,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: interpolate(progress.value, [0, 1], [0, 0.3]),
      shadowRadius: 8,
      zIndex: 99999,
      backgroundColor: colors.black,
    };
  });

  const overlayContainerStyle = useAnimatedStyle(() => {
    return {
      zIndex: 100000,
      elevation: progress.value > 0.5 ? 100 : 0,
    };
  });

  const expandedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.2], [1, 0], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [0, 0.2], [1, 0.95], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale }],
      flex: 1,
      pointerEvents: opacity > 0.5 ? 'auto' : 'none',
      paddingTop: isFullscreen ? 0 : MAX_HEIGHT + insets.top,
      backgroundColor: colors.background,
    };
  });

  const minimizedOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.8, 1], [0, 1], Extrapolation.CLAMP);
    return {
      opacity,
      pointerEvents: opacity > 0.5 ? 'box-none' : 'none',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: spacing.xs,
    };
  });

  if (!activeVideo && playerState === 'closed') return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 99999, elevation: 99 }]} pointerEvents={playerState === 'expanded' ? 'auto' : 'box-none'}>
      <Animated.View style={[StyleSheet.absoluteFill, expandedContentStyle]}>
        {video && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: MAX_HEIGHT + insets.top + 350, opacity: 0.5, pointerEvents: 'none' }}>
            <Image
              source={{ uri: video.thumbnailUrl }}
              style={StyleSheet.absoluteFill}
              blurRadius={80}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.4)', colors.background]}
              locations={[0, 0.3, 0.6, 0.92]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}

        <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: insets.bottom }} showsVerticalScrollIndicator={false}>
          {video ? (
            <View style={styles.body}>
              <VideoMetadataSection
                video={video}
                inWatchlist={!!inWatchlist}
                onDownload={handleDownload}
                onToggleWatchlist={() => toggleWatchlist({ video, inWatchlist: !!inWatchlist })}
                onChannelPress={() => {
                  if (video.channelId) {
                    minimizeVideo();
                    // @ts-ignore
                    navigation.navigate('Channel', { id: video.channelId });
                  }
                }}
              />

              {detailsQuery.isLoading ? (
                <WatchSkeleton hideMeta={true} />
              ) : (
                <>
                  <View style={styles.metadataWrapper}>
                    <CollapsibleDescription description={video.description} viewCountLabel={video.viewCountLabel} publishedLabel={video.publishedLabel} />
                  </View>

                  <RelatedVideosSection
                    video={video}
                    queue={queue}
                    currentIndex={currentIndex}
                    onQueueVideoPress={(index) => {
                      playQueue(queue, index);
                      setSelectedFormatId(null);
                    }}
                    onRelatedVideoPress={(nextVideo) => {
                      usePlayerStore.getState().playVideo(nextVideo);
                      setSelectedFormatId(null);
                    }}
                  />
                </>
              )}
            </View>
          ) : detailsQuery.isError ? (
            <View style={styles.offlineContainer}>
              <View style={styles.offlineContent}>
                <WifiOff color={colors.textMuted} size={48} style={{ marginBottom: spacing.md }} />
                <AppText style={styles.offlineTitle}>You're offline</AppText>
                <AppText style={styles.offlineMessage}>Check your connection and try again.</AppText>
                <Pressable style={styles.retryButton} onPress={() => detailsQuery.refetch()}>
                  <AppText style={styles.retryButtonText}>Retry</AppText>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.body}>
              <WatchSkeleton />
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[frameStyle, containerStyle]}>
          {playbackUrls?.fallbackUrl ? (
            <CustomVideoPlayer
              streamSource={playbackUrls}
              videoId={videoId!}
              title={video?.title ?? ''}
              onClose={() => minimizeVideo()}
              qualities={video?.formats.filter(f => f.hasVideo) ?? []}
              currentQualityId={activeFormatId}
              onQualityChange={setSelectedFormatId}
              initialProgress={video?.progress}
              animationProgress={progress}
              onProgressUpdate={(progress) => {
                if (video && !pauseHistory) addHistory({ ...video, progress });
              }}
              onVideoEnd={() => {
                if (currentIndex < queue.length - 1) {
                  playNext();
                } else if (autoplay && video && video.related && video.related.length > 0) {
                  // Find the first related video that is not a short
                  const firstRelated = video.related.find(v => !v.isShort);
                  if (firstRelated) {
                    usePlayerStore.getState().playVideo(firstRelated);
                  } else {
                    playNext();
                  }
                } else {
                  playNext(); // Stop playback
                }
                setSelectedFormatId(null);
              }}
              onPlayNext={() => {
                if (currentIndex < queue.length - 1) {
                  playNext();
                } else if (autoplay && video && video.related && video.related.length > 0) {
                  const firstRelated = video.related.find(v => !v.isShort);
                  if (firstRelated) {
                    usePlayerStore.getState().playVideo(firstRelated);
                  } else {
                    playNext();
                  }
                } else {
                  playNext();
                }
                setSelectedFormatId(null);
              }}
            />
          ) : (
            <PlayerLoadingState
              thumbnailUrl={video?.thumbnailUrl}
              isError={detailsQuery.isError}
            />
          )}
        </Animated.View>
      </GestureDetector>

      <Animated.View style={[frameStyle, overlayContainerStyle, minimizedOverlayStyle]} pointerEvents="box-none">
        <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.full, padding: 2 }}>
          <Pressable style={{ padding: spacing.xs }} onPress={handlePlayPause} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            {isPlaying ? <Pause color="white" size={20} fill="white" /> : <Play color="white" size={20} fill="white" />}
          </Pressable>
        </View>
        <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.full, padding: 2 }}>
          <Pressable style={{ padding: spacing.xs }} onPress={() => closeVideo()} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <X color="white" size={20} />
          </Pressable>
        </View>
      </Animated.View>

    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  body: { paddingVertical: spacing.lg, gap: spacing.lg },
  metadataWrapper: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  offlineContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  offlineContent: {
    width: '100%',
    alignItems: 'center',
  },
  offlineTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  offlineMessage: {
    fontSize: typography.bodySm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  retryButton: {
    width: '80%',
    paddingVertical: spacing.md,
    backgroundColor: colors.text,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: typography.bodyLg,
  },
});
