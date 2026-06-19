import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Download, ListCheck, ListPlus, Share2 } from 'lucide-react-native';
import { spacing, useTheme, radius, typography, type ThemeColors } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import type { VideoDetails } from '@/entities/video/types';
import { shareVideo } from '@/utils/share';

interface Props {
  video: VideoDetails;
  inWatchlist: boolean;
  onDownload: () => void;
  onToggleWatchlist: () => void;
  onChannelPress: () => void;
}

export function VideoMetadataSection({
  video,
  inWatchlist,
  onDownload,
  onToggleWatchlist,
  onChannelPress,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.metadataWrapper}>
      <AppText style={styles.videoTitle}>{video.title}</AppText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={onDownload}>
          <Download color={colors.text} size={18} />
          <AppText variant="caption">Download</AppText>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => shareVideo(video.id, video.title, video.isShort)}>
          <Share2 color={colors.text} size={18} />
          <AppText variant="caption">Share</AppText>
        </Pressable>
        <Pressable
          style={[styles.actionButton, inWatchlist && { backgroundColor: colors.brandMuted }]}
          onPress={onToggleWatchlist}
        >
          {inWatchlist ? <ListCheck color={colors.brand} size={18} /> : <ListPlus color={colors.text} size={18} />}
          <AppText variant="caption" style={inWatchlist && { color: colors.brand }}>
            {inWatchlist ? 'Saved' : 'Watchlist'}
          </AppText>
        </Pressable>
      </ScrollView>

      <Pressable style={styles.channelRow} onPress={onChannelPress}>
        {video.channelAvatarUrl ? (
          <Image source={{ uri: video.channelAvatarUrl }} style={styles.channelAvatar} contentFit="cover" />
        ) : (
          <View style={styles.channelAvatarPlaceholder}>
            <AppText variant="caption">{video.channelTitle?.slice(0, 1)}</AppText>
          </View>
        )}
        <View style={styles.channelInfo}>
          <AppText style={styles.channelTitleText} numberOfLines={1}>
            {video.channelTitle}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    metadataWrapper: { paddingHorizontal: spacing.lg, gap: spacing.lg },
    actionRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
    actionButton: {
      height: 38,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceMuted,
    },
    videoTitle: { fontSize: typography.subtitle, fontWeight: '700', lineHeight: 24 },
    channelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
    channelAvatar: { width: 36, height: 36, borderRadius: radius.full },
    channelAvatarPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    channelInfo: { flex: 1, justifyContent: 'center' },
    channelTitleText: { fontWeight: '600', fontSize: typography.body },
  });
