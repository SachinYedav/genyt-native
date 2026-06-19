import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Download, ListCheck, ListPlus, Play, Share2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Pressable, StyleSheet, View, AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';

import type { RootStackParamList } from '@/app/navigation/types';
import type { VideoSummary } from '@/entities/video/types';
import { useTheme, spacing, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { useToggleWatchlist, useIsInWatchlist } from '@/services/database/useLibraryQueries';
import { useQuery } from '@tanstack/react-query';
import { nativeExtractor } from '@/services/extraction/nativeExtractor';
import { sourceAdapter } from '@/services/source';
import { shareVideo } from '@/utils/share';
import { PlayerErrorState } from '../../watch/components/PlayerErrorState';
import { PlayerSettingsSheet, type PlaybackSpeed } from '../../watch/components/QualitySheet';
import { GenytVideoPlayerView, GenytVideoPlayerRef } from '../../../../modules/genyt-video-player/src';
import { Settings } from 'lucide-react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

interface InteractiveShortsTimelineProps {
  playerRef: React.RefObject<GenytVideoPlayerRef | null>;
  currentTime: number;
  duration: number;
}

function InteractiveShortsTimeline({ playerRef, currentTime, duration }: InteractiveShortsTimelineProps) {
  const { colors } = useTheme();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTimeText, setScrubTimeText] = useState('0:00');
  const progressFraction = useSharedValue(0);
  const trackWidthRef = useRef(0);
  const lastScrubTime = useRef(0);

  const stylesTimeline = useMemo(() => getStylesTimeline(colors), [colors]);

  useEffect(() => {
    if (!isScrubbing && duration > 0 && Date.now() - lastScrubTime.current > 1000) {
      const fraction = currentTime / duration;
      progressFraction.value = withTiming(fraction, { duration: 500, easing: Easing.linear });
    }
  }, [currentTime, isScrubbing, duration]);

  const onTrackLayout = useCallback((e: any) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progressFraction.value * 100}%`
  }));

  const knobStyle = useAnimatedStyle(() => ({
    left: `${progressFraction.value * 100}%`
  }));

  return (
    <View
      style={stylesTimeline.hitSlopArea}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(evt) => {
        setIsScrubbing(true);
        playerRef.current?.pause()?.catch?.(() => { });
        const tw = trackWidthRef.current;
        if (tw > 0) {
          const fraction = Math.max(0, Math.min(1, evt.nativeEvent.pageX / tw));
          progressFraction.value = fraction;
          setScrubTimeText(formatTime(fraction * duration));
        }
      }}
      onResponderMove={(evt) => {
        const tw = trackWidthRef.current;
        if (tw > 0) {
          const fraction = Math.max(0, Math.min(1, evt.nativeEvent.pageX / tw));
          progressFraction.value = fraction;
          setScrubTimeText(formatTime(fraction * duration));
        }
      }}
      onResponderRelease={() => {
        lastScrubTime.current = Date.now();
        if (duration > 0) {
          playerRef.current?.seekTo(progressFraction.value * duration)?.catch?.(() => { });
        }
        playerRef.current?.play()?.catch?.(() => { });
        setIsScrubbing(false);
      }}
      onResponderTerminate={() => {
        lastScrubTime.current = Date.now();
        playerRef.current?.play()?.catch?.(() => { });
        setIsScrubbing(false);
      }}
    >
      <View style={stylesTimeline.trackContainer} onLayout={onTrackLayout}>
        <View style={stylesTimeline.trackBackground} />
        <Animated.View style={[stylesTimeline.trackFill, { backgroundColor: colors.brand }, fillStyle]} />
        {isScrubbing && (
          <Animated.View style={[stylesTimeline.knob, { backgroundColor: colors.brand }, knobStyle]} />
        )}
      </View>

      {isScrubbing && (
        <View style={stylesTimeline.scrubTimeContainer}>
          <AppText style={stylesTimeline.scrubTimeText}>{scrubTimeText}</AppText>
        </View>
      )}
    </View>
  );
}

const getStylesTimeline = (colors: any) => StyleSheet.create({
  hitSlopArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  trackContainer: {
    height: 6,
    width: '100%',
    justifyContent: 'flex-end',
    bottom: 2,
  },
  trackBackground: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    position: 'absolute',
  },
  trackFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
  },
  knob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    marginLeft: -8,
    bottom: -4,
  },
  scrubTimeContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scrubTimeText: {
    color: colors.white,
    fontSize: typography.header,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  }
});

interface ShortsPlayerItemProps {
  video: VideoSummary;
  isActive: boolean;
  isAdjacent: boolean;
}

export function ShortsPlayerItem({ video, isActive, isAdjacent }: ShortsPlayerItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isScreenFocused = useIsFocused();

  const { data: inWatchlist } = useIsInWatchlist(video.id);
  const { mutate: toggleWatchlist } = useToggleWatchlist();

  const [selectedQualityId, setSelectedQualityId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const detailsQuery = useQuery({
    queryKey: ['video-details', video.id],
    queryFn: () => sourceAdapter.getVideoDetails(video.id),
    enabled: isActive || isAdjacent,
  });

  const details = detailsQuery.data;

  const videoFormats = useMemo(() => {
    if (!details) return [];
    return details.formats.filter(f => f.hasVideo && !f.hasAudio);
  }, [details]);

  const audioFormat = useMemo(() => {
    if (!details) return null;
    const audios = details.formats.filter(f => !f.hasVideo && f.hasAudio);
    return audios.find(f => f.extension === 'm4a') || audios[0] || null;
  }, [details]);

  const activeFormat = useMemo(() => {
    const formatsToUse = videoFormats.length > 0 ? videoFormats : (details?.formats.filter(f => f.hasVideo && f.hasAudio) || []);
    if (formatsToUse.length === 0) return null;

    if (selectedQualityId) {
      const selected = formatsToUse.find(f => f.id === selectedQualityId);
      if (selected) return selected;
    }

    const defaultFormat = formatsToUse.find(f => {
      const match = f.qualityLabel?.match(/(\d+)p/);
      if (match) {
        return parseInt(match[1]) <= 1080;
      }
      return true; // if no 'p' label, assume it's safe
    });

    return defaultFormat ?? formatsToUse[0];
  }, [videoFormats, details]);

  const playbackQuery = useQuery({
    queryKey: ['video-playback', video.id, activeFormat?.id],
    queryFn: async () => {
      if (!activeFormat) return { videoUrl: null, audioUrl: null };

      let videoUrl = activeFormat.downloadUrl;
      if (!videoUrl && activeFormat.extractionSessionId) {
        const resolved = await nativeExtractor.resolveFormat(activeFormat.extractionSessionId, activeFormat.id);
        videoUrl = resolved.url;
      }

      let audioUrl = audioFormat?.downloadUrl ?? null;
      if (!audioUrl && audioFormat?.extractionSessionId) {
        const resolved = await nativeExtractor.resolveFormat(audioFormat.extractionSessionId, audioFormat.id);
        audioUrl = resolved.url;
      }

      if (activeFormat.hasAudio) {
        audioUrl = null;
      }

      return { videoUrl, audioUrl };
    },
    enabled: !!activeFormat && (isActive || isAdjacent),
  });

  const playbackUrls = playbackQuery.data;
  const shouldMountVideoView = isActive || isAdjacent;

  const handleDownload = () => {
    navigation.navigate('VideoDownloader', { videoId: video.id });
  };

  return (
    <View style={styles.itemContainer}>
      {shouldMountVideoView && playbackUrls?.videoUrl ? (
        <ShortsActivePlayer
          video={video}
          videoUri={playbackUrls.videoUrl}
          audioUri={playbackUrls.audioUrl}
          isActive={isActive}
          isScreenFocused={isScreenFocused}
          playbackSpeed={playbackSpeed}
          inWatchlist={!!inWatchlist}
          toggleWatchlist={() => toggleWatchlist({ video, inWatchlist: !!inWatchlist })}
          onDownload={handleDownload}
          onOpenSettings={() => setIsSettingsVisible(true)}
        />
      ) : playbackQuery.isError ? (
        <PlayerErrorState
          message="This Shorts video cannot be played directly."
          youtubeUrl={`https://www.youtube.com/watch?v=${video.id}`}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}>
          {!shouldMountVideoView && <AppText variant="caption">Unmounted</AppText>}
        </View>
      )}

      <PlayerSettingsSheet
        visible={isSettingsVisible}
        qualities={
          (videoFormats.length > 0 ? videoFormats : details?.formats.filter(f => f.hasVideo && f.hasAudio) || []).map(f => ({
            id: f.id,
            qualityLabel: f.qualityLabel || 'Auto',
            sizeLabel: f.sizeLabel || undefined
          }))
        }
        currentQualityId={activeFormat?.id || ''}
        currentSpeed={playbackSpeed}
        onSelectQuality={setSelectedQualityId}
        onSelectSpeed={setPlaybackSpeed}
        onClose={() => setIsSettingsVisible(false)}
      />
    </View>
  );
}

interface ShortsActivePlayerProps {
  video: VideoSummary;
  videoUri: string;
  audioUri: string | null;
  isActive: boolean;
  isScreenFocused: boolean;
  playbackSpeed: number;
  inWatchlist: boolean;
  toggleWatchlist: () => void;
  onDownload: () => void;
  onOpenSettings?: () => void;
}

function ShortsActivePlayer({
  video,
  videoUri,
  audioUri,
  isActive,
  isScreenFocused,
  playbackSpeed,
  inWatchlist,
  toggleWatchlist,
  onDownload,
  onOpenSettings
}: ShortsActivePlayerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const playerRef = useRef<GenytVideoPlayerRef>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState !== 'active') {
        playerRef.current?.pause()?.catch?.(() => { });
      } else if (isActive && isScreenFocused && !isPausedByUser) {
        playerRef.current?.play()?.catch?.(() => { });
      }
    });

    if (isActive && isScreenFocused && !isPausedByUser) {
      playerRef.current?.play()?.catch?.(() => { });
    } else {
      playerRef.current?.pause()?.catch?.(() => { });
      if (!isActive && currentTime > 0) {
        playerRef.current?.seekTo(0)?.catch?.(() => { });
      }
    }

    return () => {
      subscription.remove();
    };
  }, [isActive, isScreenFocused, isPausedByUser]);

  useEffect(() => {
    if (isActive && isScreenFocused && isPlaying) {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake().catch(() => {});
    }
    return () => {
      deactivateKeepAwake().catch(() => {});
    };
  }, [isActive, isScreenFocused, isPlaying]);

  const [resizeMode, setResizeMode] = useState<'cover' | 'contain'>('cover');

  useEffect(() => {
    playerRef.current?.setPlaybackRate(playbackSpeed)?.catch?.(() => { });
  }, [playbackSpeed]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={80}
          onLoad={(e) => {
            const { width, height } = e.source;
            if (width && height) {
              setResizeMode(height > width ? 'cover' : 'contain');
            }
          }}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        {isActive && (
          <>
            <GenytVideoPlayerView
              ref={playerRef}
              videoUri={videoUri}
              audioUri={audioUri}
              isShortsMode={true}
              resizeMode={resizeMode}
              style={StyleSheet.absoluteFill}
              onPlaybackStateChanged={(e) => {
                if (e.nativeEvent.state === 'error') {
                  setHasError(true);
                }
                if (e.nativeEvent.isPlaying !== undefined) {
                  setIsPlaying(e.nativeEvent.isPlaying);
                }
              }}
              onProgress={(e) => {
                setCurrentTime(e.nativeEvent.currentTime);
                setDuration(e.nativeEvent.duration);
              }}
            />
            <Pressable
              style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
              onPress={() => {
                if (isPlaying) {
                  playerRef.current?.pause()?.catch?.(() => { });
                  setIsPausedByUser(true);
                } else {
                  playerRef.current?.play()?.catch?.(() => { });
                  setIsPausedByUser(false);
                }
              }}
            >
              {!isPlaying && !hasError && (
                <View style={styles.playIconBg}>
                  <Play color={colors.white} size={48} fill={colors.white} />
                </View>
              )}
            </Pressable>
          </>
        )}
      </View>

      {hasError && (
        <PlayerErrorState
          message="Playback Error: Unable to stream."
          youtubeUrl={`https://www.youtube.com/watch?v=${video.id}`}
        />
      )}

      {/* Overlay UI */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.actionColumn}>
          <Pressable style={styles.actionButton} onPress={toggleWatchlist}>
            {inWatchlist ? <ListCheck color={colors.brand} size={28} /> : <ListPlus color={colors.white} size={28} />}
            <AppText style={styles.actionText}>{inWatchlist ? 'Saved' : 'Save'}</AppText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={onDownload}>
            <Download color={colors.white} size={28} />
            <AppText style={styles.actionText}>Download</AppText>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => shareVideo(video.id, video.title, true)}
          >
            <Share2 color={colors.white} size={28} />
            <AppText style={styles.actionText}>Share</AppText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={onOpenSettings}>
            <Settings color={colors.white} size={28} />
            <AppText style={styles.actionText}>Quality</AppText>
          </Pressable>
        </View>

        <View style={styles.infoColumn}>
          <AppText style={styles.title} numberOfLines={2}>{video.title}</AppText>
          <View style={styles.channelRow}>
            {video.channelAvatarUrl ? (
              <Image
                source={{ uri: video.channelAvatarUrl }}
                style={styles.avatarPlaceholder}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <AppText variant="caption">{video.channelTitle?.slice(0, 1)}</AppText>
              </View>
            )}
            <AppText style={styles.channelName}>{video.channelTitle}</AppText>
          </View>
        </View>
      </View>

      <InteractiveShortsTimeline playerRef={playerRef} currentTime={currentTime} duration={duration} />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  itemContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  actionColumn: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 24,
    gap: spacing.xl,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  infoColumn: {
    paddingRight: 60,
    gap: spacing.sm,
  },
  title: {
    color: colors.white,
    fontSize: typography.bodyLg,
    fontWeight: '700',
    lineHeight: 22,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelName: {
    color: colors.white,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
  playIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 6,
  },
});
