import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, ListRenderItemInfo } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { VideoCard } from '@/shared/ui/VideoCard';
import type { VideoSummary } from '@/entities/video/types';
import { useChannel } from './api/useChannel';

import { usePlayerStore } from '@/features/watch/store/usePlayerStore';

type FilterTab = 'Videos' | 'Shorts' | 'Playlists';

type RootStackParamList = {
  Channel: { id: string };
};
type ChannelScreenRouteProp = RouteProp<RootStackParamList, 'Channel'>;

export function ChannelScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const navigation = useNavigation<any>();
  const route = useRoute<ChannelScreenRouteProp>();
  const channelIdOrUrl = route.params?.id;

  const [activeTab, setActiveTab] = useState<FilterTab>('Videos');

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useChannel(channelIdOrUrl, activeTab.toLowerCase());

  const channel = data?.pages[0] as import('@/services/source/types').ChannelDetails | undefined;

  const [cachedChannel, setCachedChannel] = useState<import('@/services/source/types').ChannelDetails | null>(null);
  useEffect(() => {
    if (channel) {
      setCachedChannel(channel);
    }
  }, [channel]);

  const displayChannel = channel || cachedChannel;

  const filteredData = useMemo(() => {
    const dataList = data?.pages.flatMap(page => ('videos' in page ? page.videos : page.items) || []) || [];
    if (activeTab === 'Playlists') {
      return dataList.filter((item: any) => {
        const count = parseInt(item.videoCountLabel || '0');
        return count > 0;
      });
    }
    return dataList;
  }, [data, activeTab]);

  const playVideo = usePlayerStore((state) => state.playVideo);

  const handlePress = useCallback((video: VideoSummary) => {
    if (activeTab === 'Shorts') {
      const shorts = filteredData;
      const index = shorts.findIndex(v => v.id === video.id);
      navigation.navigate('Shorts', { initialIndex: Math.max(0, index), initialShorts: shorts });
    } else {
      playVideo(video);
    }
  }, [activeTab, filteredData, navigation, playVideo]);

  const insets = useSafeAreaInsets();

  if (isLoading && !displayChannel) {
    return (
      <Screen padded>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </Screen>
    );
  }

  if (error && !displayChannel) {
    return (
      <Screen padded>
        <View style={styles.centerContainer}>
          <AppText style={{ color: colors.brand }}>Failed to load channel details</AppText>
        </View>
      </Screen>
    );
  }

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    if (activeTab === 'Shorts') {
      return (
        <View style={[styles.shortGridItem, index % 2 === 0 ? { paddingRight: 6 } : { paddingLeft: 6 }]}>
          <VideoCard video={item} layout="short" onPress={handlePress} />
        </View>
      );
    }
    if (activeTab === 'Playlists') {
      return (
        <VideoCard
          video={item}
          layout="playlist"
          onPress={handlePress}
          playlistVideoCount={parseInt(item.videoCountLabel || '0')}
        />
      );
    }
    return <VideoCard video={item} layout="compact" onPress={handlePress} />;
  };

  return (
    <Screen padded={false} safeAreaEdges={['right', 'bottom', 'left']}>
      {/* Header Profile Row */}
      <View style={[styles.headerRow, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={28} />
        </Pressable>
        {displayChannel?.avatarUrl ? (
          <Image
            source={{ uri: displayChannel.avatarUrl }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.headerAvatar} />
        )}
        <View style={styles.headerTextCol}>
          <AppText style={styles.channelName} numberOfLines={1}>{displayChannel?.title}</AppText>
          <AppText muted style={styles.metadata}>
            {displayChannel?.subscriberCountText || '0'} subscribers
          </AppText>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterGroup}>
        {(['Videos', 'Shorts', 'Playlists'] as FilterTab[]).map(tab => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveTab(tab)}
            >
              <AppText style={isActive ? styles.filterTextActive : styles.filterText}>
                {tab}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <FlashList
        key={`list-${activeTab}`}
        data={filteredData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        numColumns={activeTab === 'Shorts' ? 2 : 1}
        // @ts-ignore
        estimatedItemSize={activeTab === 'Shorts' ? 240 : 110}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <AppText muted>No videos found.</AppText>
            </View>
          )
        }
        renderItem={renderItem}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  channelName: {
    fontSize: typography.title,
    fontWeight: 'bold',
    color: colors.text,
  },
  metadata: {
    fontSize: typography.bodySm,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: isDark ? colors.surfaceMuted : colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.text,
  },
  filterText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.text,
  },
  filterTextActive: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  shortGridItem: {
    width: '100%',
    marginBottom: spacing.md,
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
});
