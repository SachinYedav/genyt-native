import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ArrowLeft, Play, Shuffle, ListVideo } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { VideoCard } from '@/shared/ui/VideoCard';
import type { VideoSummary } from '@/entities/video/types';
import { usePlaylist } from './api/usePlaylist';
import { usePlayerStore } from '@/features/watch/store/usePlayerStore';
import type { PlaylistDetails } from '@/services/source/types';

type RootStackParamList = {
  Playlist: { id: string };
};
type PlaylistScreenRouteProp = RouteProp<RootStackParamList, 'Playlist'>;

export function PlaylistScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const navigation = useNavigation<any>();
  const route = useRoute<PlaylistScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const playlistIdOrUrl = route.params?.id;

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = usePlaylist(playlistIdOrUrl);
  const playQueue = usePlayerStore((state) => state.playQueue);

  // Flatten the paginated videos
  const videos = data?.pages.flatMap((page) => ('videos' in page ? page.videos : page.items)) || [];
  // Use the first page's metadata for the playlist header
  const playlist = data?.pages[0] as PlaylistDetails | undefined;

  const handlePress = useCallback((video: VideoSummary) => {
    const index = videos.findIndex(v => v.id === video.id);
    playQueue(videos, index >= 0 ? index : 0);
  }, [videos, playQueue]);

  const keyExtractor = useCallback((item: VideoSummary) => item.id, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <VideoCard video={item} layout="compact" onPress={handlePress} />
  ), [handlePress]);

  if (isLoading) {
    return (
      <Screen padded>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </Screen>
    );
  }

  if (error || !playlist) {
    const errorMessage = error?.message?.toLowerCase().includes('extraction')
      ? 'This playlist is private, empty, or unavailable.'
      : 'Failed to load playlist details. Please try again.';

    return (
      <Screen padded={false} safeAreaEdges={['right', 'bottom', 'left']}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={28} />
          </Pressable>
        </View>
        <View style={styles.centerContainer}>
          <ListVideo color={colors.textMuted} size={48} style={{ marginBottom: spacing.md }} />
          <AppText style={{ color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl }}>
            {errorMessage}
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} safeAreaEdges={['right', 'bottom', 'left']}>
      <View style={[StyleSheet.absoluteFill, { height: '60%' }]}>
        {playlist.thumbnailUrl && (
          <Image
            source={{ uri: playlist.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            blurRadius={60}
            contentFit="cover"
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', colors.background]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={28} />
        </Pressable>
        <AppText style={styles.headerTitle}>Playlist</AppText>
      </View>

      <FlashList
        data={videos}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        // @ts-ignore
        estimatedItemSize={110}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.playlistInfo}>
              <View style={styles.playlistThumbnailContainer}>
                {playlist.thumbnailUrl ? (
                  <Image
                    source={{ uri: playlist.thumbnailUrl }}
                    style={styles.playlistThumbnail}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.playlistThumbnail} />
                )}
              </View>
              <View style={styles.playlistText}>
                <AppText style={styles.playlistTitle} numberOfLines={2}>
                  {playlist.title}
                </AppText>
                {playlist.channelTitle && (
                  <AppText style={styles.channelName}>{playlist.channelTitle}</AppText>
                )}
                <AppText muted variant="body">
                  {playlist.videoCountText || '0'} videos
                </AppText>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>
              <Pressable
                style={[styles.actionBtn, styles.playAllBtn]}
                onPress={() => {
                  if (videos.length > 0) {
                    playQueue(videos, 0);
                  }
                }}
              >
                <Play color={colors.background} size={20} fill={colors.background} />
                <AppText style={styles.playAllText}>Play all</AppText>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.shuffleBtn]}
                onPress={() => {
                  if (videos.length > 0) {
                    playQueue(videos, 0, true);
                  }
                }}
              >
                <Shuffle color={colors.text} size={20} />
                <AppText style={styles.shuffleText}>Shuffle</AppText>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ListVideo color={colors.textMuted} size={42} style={{ marginBottom: spacing.sm }} />
              <AppText muted>No videos found in this playlist.</AppText>
            </View>
          )
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        renderItem={renderItem}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  headerContent: {
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    zIndex: 10,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: 'bold',
    color: colors.text,
  },
  backButton: {
    padding: spacing.sm,
  },
  playlistInfo: {
    flexDirection: 'column',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  playlistThumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playlistThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceMuted,
  },
  playlistText: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  playlistTitle: {
    fontSize: typography.header,
    fontWeight: 'bold',
    color: colors.text,
  },
  channelName: {
    fontSize: typography.bodyLg,
    fontWeight: '600',
    color: colors.text,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    gap: spacing.sm,
  },
  playAllBtn: {
    backgroundColor: colors.text,
  },
  playAllText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: typography.body,
  },
  shuffleBtn: {
    backgroundColor: isDark ? colors.surfaceMuted : colors.border,
  },
  shuffleText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: typography.body,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    paddingTop: spacing.xl4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
