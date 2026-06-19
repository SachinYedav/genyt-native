import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { sourceAdapter } from '@/services/source';
import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { ShortsFeed } from './components/ShortsFeed';
import { ShortsSkeleton } from './components/ShortsSkeleton';

export function ShortsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  // Accept params if navigated from shelf, otherwise generic feed
  const route = useRoute<RouteProp<RootStackParamList, 'Shorts'>>();
  const initialIndex = route.params?.initialIndex ?? 0;

  // Fetch dedicated shorts feed via targeted search 
  const defaultFeedQuery = useQuery({
    queryKey: ['shorts-default-feed'],
    queryFn: async () => {
      const feed = await sourceAdapter.search({ query: '#shorts', limit: 40 });
      return feed.items.filter(v => v.isShort);
    },
    enabled: !route.params?.initialShorts?.length,
  });

  // Extract the true initial array
  const initialData = route.params?.initialShorts?.length
    ? route.params.initialShorts
    : (defaultFeedQuery.data ?? []);

  // Use local state to grow the feed algorithmically
  const [feedData, setFeedData] = useState<import('@/entities/video/types').VideoSummary[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Background prefetching for up to 3 upcoming shorts
  useEffect(() => {
    if (feedData.length > 0) {
      const prefetchLimit = Math.min(activeIndex + 4, feedData.length);
      for (let i = activeIndex + 1; i < prefetchLimit; i++) {
        const short = feedData[i];
        if (short) {
          queryClient.prefetchQuery({
            queryKey: ['video-details', short.id],
            queryFn: () => sourceAdapter.getVideoDetails(short.id)
          });
        }
      }
    }
  }, [activeIndex, feedData, queryClient]);

  useEffect(() => {
    if (initialData.length > 0 && feedData.length === 0) {
      setFeedData(initialData);
    }
  }, [initialData]);

  // The "Related Items Loop" strategy
  const handleLoadMore = async () => {
    if (isFetchingMore || feedData.length === 0) return;

    setIsFetchingMore(true);
    try {
      const lastShort = feedData[feedData.length - 1];
      const details = await sourceAdapter.getVideoDetails(lastShort.id);

      if (details.related && details.related.length > 0) {
        // STRICTLY filter only true shorts to prevent horizontal video leaks
        const nextShorts = details.related
          .filter(item => item.isShort === true)
          .filter(item => !feedData.some(existing => existing.id === item.id))
          .map(item => ({ ...item, isShort: true }));

        if (nextShorts.length > 0) {
          setFeedData(prev => [...prev, ...nextShorts]);
        }
      }
    } catch (error) {
      console.error('[ShortsScreen] Failed to extract next sequence of shorts:', error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const isModalContext = !!route.params?.initialShorts;

  return (
    <View style={[styles.root, { paddingBottom: isModalContext ? insets.bottom : 0 }]}>
      {isModalContext && (
        <Pressable style={[styles.backButton, { top: insets.top + spacing.md }]} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.white} size={28} />
        </Pressable>
      )}

      {!route.params?.initialShorts?.length && defaultFeedQuery.isLoading ? (
        <ShortsSkeleton />
      ) : !route.params?.initialShorts?.length && defaultFeedQuery.isError ? (
        <View style={styles.offlineContainer}>
          <View style={styles.offlineContent}>
            <AppText style={styles.offlineTitle}>Connect to the Internet</AppText>
            <AppText style={styles.offlineMessage}>You're offline. Check your connection.</AppText>
            <View style={styles.offlineActionsContainer}>
              <Pressable style={styles.retryButton} onPress={() => defaultFeedQuery.refetch()}>
                <AppText style={styles.retryButtonText}>Retry</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <ShortsFeed
          videos={feedData}
          initialIndex={initialIndex}
          onIndexChange={setActiveIndex}
          onEndReached={handleLoadMore}
          isEndReachedLoading={isFetchingMore}
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    width: '100%',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: colors.black,
    fontWeight: '600',
    fontSize: typography.bodyLg,
  },
  offlineContainer: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'flex-end',
  },
  offlineContent: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl4,
    alignItems: 'flex-start',
  },
  offlineTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  offlineMessage: {
    fontSize: typography.bodySm,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
    textAlign: 'left',
  },
  offlineActionsContainer: {
    width: '100%',
  },
});
