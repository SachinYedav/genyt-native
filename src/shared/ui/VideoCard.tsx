import { Image } from 'expo-image';
import { MoreVertical, ListVideo, Play } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { VideoSummary } from '@/entities/video/types';
import { useTheme, spacing, radius, typography, type ThemeColors } from '@/shared/theme';
import { AppText } from './AppText';
import { useActionMenuStore, type ActionContext } from '@/store/useActionSheetStore';



export type VideoCardProps = {
  video: VideoSummary;
  onPress: (video: VideoSummary) => void;
  compact?: boolean;
  layout?: 'default' | 'compact' | 'carousel' | 'short' | 'playlist';
  context?: ActionContext | 'playlist_card';
  isPlaylist?: boolean;
  playlistVideoCount?: number;
};

export function VideoCard({ compact = false, layout, video, onPress, context = 'home', isPlaylist = false, playlistVideoCount }: VideoCardProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { openMenu } = useActionMenuStore();
  const buttonRef1 = useRef<View>(null);
  const buttonRef2 = useRef<View>(null);
  const buttonRef3 = useRef<View>(null);

  const currentLayout = layout || (compact ? 'compact' : 'default');
  const isShort = video.isShort;
  const aspectRatio = isShort ? 9 / 16 : 16 / 9;
  
  // Enforce playlist_card context for playlists
  const activeContext = (currentLayout === 'playlist' || isPlaylist) ? 'playlist_card' : context;

  const handleOpenMenu = (ref: React.RefObject<any>) => {
    ref.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      openMenu(video, activeContext, { x: pageX, y: pageY, width, height });
    });
  };

  if (currentLayout === 'playlist') {
    return (
      <Pressable
        style={styles.compactCard}
        onPress={() => navigation.navigate('Playlist', { id: video.id })}
      >
        <View style={styles.compactThumbWrap}>
          <Image
            source={video.thumbnailAsset ?? { uri: video.thumbnailUrl }}
            style={[styles.compactThumbnail, { aspectRatio }]}
            contentFit="cover"
            transition={120}
          />
          <View style={styles.playlistOverlayCompact}>
            <ListVideo color={colors.white} size={16} />
            <AppText variant="caption" style={{ color: colors.white, marginTop: 2 }}>
              {playlistVideoCount ?? 12}
            </AppText>
          </View>
        </View>
        <View style={styles.compactCopy}>
          <AppText numberOfLines={2}>{video.title}</AppText>
          <AppText muted variant="caption" numberOfLines={2}>
            {video.channelTitle} • {video.viewCountLabel} • {video.publishedLabel}
          </AppText>
        </View>
        <View style={styles.playlistAction}>
          <Pressable ref={buttonRef1} style={styles.actionButton} onPress={() => handleOpenMenu(buttonRef1)}>
            <MoreVertical color={colors.textMuted} size={20} />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  if (currentLayout === 'compact') {
    return (
      <Pressable
        style={styles.compactCard}
        onPress={() => isPlaylist ? navigation.navigate('Playlist', { id: video.id }) : onPress(video)}
      >
        <View style={styles.compactThumbWrap}>
          <Image
            source={video.thumbnailAsset ?? { uri: video.thumbnailUrl }}
            style={[styles.compactThumbnail, { aspectRatio }]}
            contentFit="cover"
            transition={120}
          />
          {!isPlaylist && (
            <View style={styles.durationBadgeSmall}>
              <AppText variant="caption" style={{ color: colors.white }}>{video.durationLabel}</AppText>
            </View>
          )}
          {isPlaylist && (
            <View style={styles.playlistOverlayCompact}>
              <ListVideo color={colors.white} size={16} />
              <AppText variant="caption" style={{ color: colors.white, marginTop: 2 }}>
                {playlistVideoCount ?? 12}
              </AppText>
            </View>
          )}
          {video.progress !== undefined && video.progress > 0 && !isShort && !isPlaylist && (
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, video.progress * 100)}%` }]} />
            </View>
          )}
        </View>
        <View style={styles.compactCopy}>
          <AppText numberOfLines={2}>{video.title}</AppText>
          <AppText muted variant="caption" numberOfLines={2}>
            {video.channelTitle} • {video.viewCountLabel} • {video.publishedLabel}
          </AppText>
        </View>
        <Pressable ref={buttonRef1} onPress={() => handleOpenMenu(buttonRef1)} style={styles.actionButton}>
          <MoreVertical color={colors.textMuted} size={18} />
        </Pressable>
      </Pressable>
    );
  }


  if (currentLayout === 'carousel') {
    return (
      <Pressable
        style={styles.carouselCard}
        onPress={() => isPlaylist ? navigation.navigate('Playlist', { id: video.id }) : onPress(video)}
      >
        <View style={styles.carouselThumbWrap}>
          <Image
            source={video.thumbnailAsset ?? { uri: video.thumbnailUrl }}
            style={[styles.carouselThumbnail, { aspectRatio }]}
            contentFit="cover"
            transition={120}
          />
          {!isPlaylist && (
            <View style={styles.durationBadgeSmall}>
              <AppText variant="caption" style={{ color: colors.white }}>{video.durationLabel}</AppText>
            </View>
          )}
          {isPlaylist && (
            <View style={styles.playlistOverlayCompact}>
              <ListVideo color={colors.white} size={16} />
              <AppText variant="caption" style={{ color: colors.white, marginTop: 2 }}>
                {playlistVideoCount ?? 12}
              </AppText>
            </View>
          )}
          {video.progress !== undefined && video.progress > 0 && !isShort && !isPlaylist && (
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, video.progress * 100)}%` }]} />
            </View>
          )}
        </View>
        <View style={styles.carouselMeta}>
          <View style={styles.copy}>
            <AppText numberOfLines={2} style={styles.carouselTitle}>{video.title}</AppText>
            <AppText muted variant="caption" numberOfLines={1}>{video.channelTitle}</AppText>
          </View>
          <Pressable ref={buttonRef2} onPress={() => handleOpenMenu(buttonRef2)} style={styles.actionButton}>
            <MoreVertical color={colors.textMuted} size={18} />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  if (currentLayout === 'short') {
    return (
      <Pressable
        style={styles.shortCard}
        onPress={() => isPlaylist ? navigation.navigate('Playlist', { id: video.id }) : onPress(video)}
      >
        <Image
          source={video.thumbnailAsset ?? { uri: video.thumbnailUrl }}
          style={styles.shortThumbnail}
          contentFit="cover"
          transition={120}
        />
        <View style={styles.shortGradient}>
          <AppText style={styles.shortTitle} numberOfLines={2}>{video.title}</AppText>
          <AppText style={styles.shortViewCount} variant="caption">{video.viewCountLabel}</AppText>
        </View>
        <Pressable ref={buttonRef2} onPress={() => handleOpenMenu(buttonRef2)} style={styles.shortMenuButton}>
          <MoreVertical color="#fff" size={18} />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => isPlaylist ? navigation.navigate('Playlist', { id: video.id }) : onPress(video)}
    >
      <Image
        source={video.thumbnailAsset ?? { uri: video.thumbnailUrl }}
        style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.25 : 0.15 }]}
        blurRadius={60}
        pointerEvents="none"
        contentFit="cover"
      />
      <View>
        <Image
          source={video.thumbnailAsset ?? { uri: video.thumbnailUrl }}
          style={[styles.thumbnail, { aspectRatio }]}
          contentFit="cover"
          transition={120}
        />
        {!isPlaylist && (
          <View style={styles.durationBadge}>
            <AppText variant="caption" style={{ color: colors.white }}>{video.durationLabel}</AppText>
          </View>
        )}
        {isPlaylist && (
          <View style={styles.playlistOverlayDefault}>
            <ListVideo color={colors.white} size={20} />
            <AppText variant="caption" style={{ color: colors.white, fontWeight: 'bold' }}>
              {playlistVideoCount ?? 12} videos
            </AppText>
          </View>
        )}
        {video.progress !== undefined && video.progress > 0 && !isShort && !isPlaylist && (
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, video.progress * 100)}%` }]} />
          </View>
        )}
      </View>

      <View style={styles.metaRow}>
        <Pressable
          style={styles.avatar}
          onPress={() => video.channelId && navigation.navigate('Channel', { id: video.channelId })}
        >
          {video.channelAvatarUrl ? (
            <Image source={{ uri: video.channelAvatarUrl }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <AppText variant="caption">{video.channelTitle?.slice(0, 1)}</AppText>
          )}
        </Pressable>
        <View style={styles.copy}>
          <AppText numberOfLines={2}>{video.title}</AppText>
          <AppText muted variant="caption" numberOfLines={1}>
            {video.channelTitle} • {video.viewCountLabel} • {video.publishedLabel}
          </AppText>
        </View>
        {!isPlaylist && (
          <Pressable ref={buttonRef3} onPress={() => handleOpenMenu(buttonRef3)} style={styles.actionButton}>
            <MoreVertical color={colors.textMuted} size={18} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    gap: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  progressBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand,
  },
  durationBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(0,0,0,0.82)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
    ,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandMuted,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },
  compactCard: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  compactThumbWrap: {
    width: 150,
  },
  compactThumbnail: {
    width: 150,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  durationBadgeSmall: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(0,0,0,0.82)',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  playlistOverlayCompact: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistOverlayDefault: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    top: 0,
    width: '35%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  playlistAction: {
    justifyContent: 'center',
    paddingLeft: spacing.xs,
  },
  playAllButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAllText: {
    color: colors.background,
  },
  compactCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  carouselCard: {
    gap: spacing.sm,
    flex: 1,
  },
  carouselThumbWrap: {
    width: '100%',
  },
  carouselThumbnail: {
    width: '100%',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  carouselMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  carouselTitle: {
    fontWeight: '600',
    fontSize: typography.bodySm,
    lineHeight: 18,
  },
  shortCard: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    position: 'relative',
  },
  shortThumbnail: {
    width: '100%',
    height: '100%',
  },
  shortGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shortTitle: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.captionLg,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shortViewCount: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.tiny,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shortMenuButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.full,
  },
});
