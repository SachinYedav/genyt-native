import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { usePlayerStore } from '@/features/watch/store/usePlayerStore';
import { Download, Search, SearchX, WifiOff } from 'lucide-react-native';
import { GenYTLogo } from '@/shared/ui/GenYTLogo';
import { useState, useMemo, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View, RefreshControl, ActivityIndicator } from 'react-native';
import type { RootStackParamList } from '@/app/navigation/types';
import { feedTopics, sourceAdapter } from '@/services/source';
import { useTheme, spacing, radius, type ThemeColors, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { VideoCard } from '@/shared/ui/VideoCard';
import { VideoFeedSkeleton } from '@/shared/ui/VideoFeedSkeleton';
import { ShortsShelf } from '@/shared/ui/ShortsShelf';
import type { VideoSummary } from '@/entities/video/types';

type FeedItem =
  | { type: 'video'; id: string; data: VideoSummary }
  | { type: 'shorts_shelf'; id: string; data: VideoSummary[] };

function buildFeedWithShorts(pages: { items: VideoSummary[] }[]): FeedItem[] {
  const result: FeedItem[] = [];
  let lastShelfIndex = -1;

  pages.forEach((page, pageIndex) => {
    const pageShorts = page.items.filter(v => v.isShort);
    const pageVideos = page.items.filter(v => !v.isShort);

    for (let i = 0; i < pageVideos.length; i++) {
      result.push({ type: 'video', id: pageVideos[i].id, data: pageVideos[i] });

      // For the first page, insert the shelf early (after 3rd video) for better UX
      if (pageIndex === 0 && i === 2 && pageShorts.length > 0) {
        result.push({ type: 'shorts_shelf', id: `shelf-${pageShorts[0].id}`, data: [...pageShorts] });
        lastShelfIndex = result.length - 1;
        // Clear the array so we don't process these shorts again at the end of the loop
        pageShorts.length = 0;
      }
    }

    if (pageShorts.length === 0) return;

    // Smart Merge Check
    if (lastShelfIndex !== -1) {
      const lastShelf = result[lastShelfIndex];
      if (lastShelf.type === 'shorts_shelf') {
        // If the previous existing shelf contains < 2 items, OR if the new batch has < 2 items, merge them
        if (lastShelf.data.length < 2 || pageShorts.length < 2) {
          lastShelf.data.push(...pageShorts);
          return;
        }
      }
    }

    // Otherwise, create a new shelf for this incoming page's batch
    result.push({ type: 'shorts_shelf', id: `shelf-${pageShorts[0].id}`, data: [...pageShorts] });
    lastShelfIndex = result.length - 1;
  });

  return result;
}

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const playVideo = usePlayerStore((state) => state.playVideo);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedTopic, setSelectedTopic] = useState(feedTopics[0]);

  const handleVideoPress = useCallback((video: VideoSummary) => {
    playVideo(video);
  }, [playVideo]);

  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    if (item.type === 'shorts_shelf') {
      return <ShortsShelf shorts={item.data} />;
    }
    return (
      <VideoCard
        video={item.data}
        onPress={handleVideoPress}
      />
    );
  }, [handleVideoPress]);

  const feedQuery = useInfiniteQuery({
    queryKey: ['home-feed', selectedTopic],
    queryFn: async ({ pageParam }) => {
      if (pageParam) {
        return sourceAdapter.fetchNextPage(pageParam);
      }
      return sourceAdapter.getHomeFeed({
        topic: selectedTopic === 'All' ? undefined : selectedTopic,
        limit: 20,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.continuationToken || undefined,
  });


  const feedItems = useMemo(() => {
    const pages = feedQuery.data?.pages ?? [];
    return buildFeedWithShorts(pages);
  }, [feedQuery.data]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <GenYTLogo size={29} color={colors.brand} strokeWidth={2} />
          <AppText style={{ fontSize: typography.subtitle, fontWeight: '700', color: colors.text }}>GenYT Pro</AppText>
        </View>
        <View style={styles.headerActions}>

          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={() => navigation.navigate('Tabs', { screen: 'Downloads' })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Download color={colors.text} size={22} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={() => navigation.navigate('Tabs', { screen: 'Search' })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Search color={colors.text} size={22} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topicScroller}
        contentContainerStyle={styles.topicRow}
      >
        {feedTopics.map((topic) => {
          const isActive = selectedTopic === topic;

          return (
            <Pressable
              key={topic}
              style={[styles.topicChip, isActive && styles.topicChipActive]}
              onPress={() => setSelectedTopic(topic)}
            >
              <AppText
                variant="caption"
                muted={!isActive}
                style={isActive && styles.topicTextActive}
              >
                {topic}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlashList<FeedItem>
        data={feedItems}
        keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : index.toString()}
        showsVerticalScrollIndicator={false}
        getItemType={(item) => item.type}
        renderItem={renderItem}
        // @ts-ignore: estimatedItemSize is a valid FlashList prop
        estimatedItemSize={280}
        extraData={selectedTopic}
        contentContainerStyle={styles.feedContent}
        onEndReached={() => {
          if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
            feedQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={feedQuery.isFetching && !feedQuery.isFetchingNextPage && !feedQuery.isLoading}
            onRefresh={() => feedQuery.refetch()}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
        ListFooterComponent={
          feedQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          feedQuery.isLoading ? (
            <VideoFeedSkeleton />
          ) : feedQuery.isError ? (
            <View style={styles.emptyState}>
              <WifiOff color={colors.textMuted} size={42} style={{ marginBottom: spacing.sm }} />
              <AppText variant="subtitle" style={{ marginBottom: spacing.xs }}>You're offline</AppText>
              <AppText muted style={{ textAlign: 'center' }}>Check your connection and try again.</AppText>
              <Pressable
                style={styles.retryButton}
                onPress={() => feedQuery.refetch()}
              >
                <AppText style={{ color: colors.white, fontWeight: '600' }}>Retry</AppText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <SearchX color={colors.textMuted} size={42} style={{ marginBottom: spacing.sm }} />
              <AppText muted>No videos found. Try a different topic.</AppText>
            </View>
          )
        }
      />
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    height: 58,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    transform: [{ scale: 0.95 }],
  },
  topicScroller: {
    flexGrow: 0,
    height: 48,
  },
  topicRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  topicChip: {
    height: 34,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  topicChipActive: {
    backgroundColor: colors.text,
  },
  topicTextActive: {
    color: colors.background,
  },
  feedContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  empty: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.full,
  },
});
