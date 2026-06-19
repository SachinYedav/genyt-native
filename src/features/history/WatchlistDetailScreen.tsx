import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft, ListPlus, Trash2 } from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';

import type { RootStackParamList } from '@/app/navigation/types';
import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { VideoCard } from '@/shared/ui/VideoCard';
import { AppConfirmModal } from '@/shared/ui/AppConfirmModal';
import { useWatchlist, useClearWatchlist } from '@/services/database/useLibraryQueries';
import { usePlayerStore } from '@/features/watch/store/usePlayerStore';
import type { VideoSummary } from '@/entities/video/types';

export function WatchlistDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'WatchlistDetail'>>();

  const [filter, setFilter] = useState<'videos' | 'shorts'>(route.params?.filter || 'videos');

  const watchlistQuery = useWatchlist();
  const { mutate: clearWatchlist, isPending: isClearing } = useClearWatchlist();
  const [showClearModal, setShowClearModal] = useState(false);

  const filteredData = React.useMemo(() => {
    if (!watchlistQuery.data) return [];
    if (filter === 'videos') return watchlistQuery.data.filter(v => !v.isShort);
    return watchlistQuery.data.filter(v => v.isShort);
  }, [watchlistQuery.data, filter]);

  const handlePress = (video: VideoSummary) => {
    if (video.isShort) {
      const index = filteredData.findIndex(v => v.id === video.id);
      navigation.navigate('Shorts', {
        initialIndex: index >= 0 ? index : 0,
        initialShorts: filteredData,
      });
    } else if (video) {
      usePlayerStore.getState().playVideo(video);
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={28} />
          </Pressable>
          <AppText variant="subtitle">Watchlist</AppText>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.filterGroup}>
            <Pressable
              style={[styles.filterChip, filter === 'videos' && styles.filterChipActive]}
              onPress={() => setFilter('videos')}
            >
              <AppText style={filter === 'videos' ? styles.filterTextActive : styles.filterText}>Videos</AppText>
            </Pressable>
            <Pressable
              style={[styles.filterChip, filter === 'shorts' && styles.filterChipActive]}
              onPress={() => setFilter('shorts')}
            >
              <AppText style={filter === 'shorts' ? styles.filterTextActive : styles.filterText}>Shorts</AppText>
            </Pressable>
          </View>

          {watchlistQuery.data && watchlistQuery.data.length > 0 && (
            <Pressable style={styles.clearButton} onPress={() => setShowClearModal(true)}>
              <Trash2 color={colors.textMuted} size={20} />
            </Pressable>
          )}
        </View>
      </View>

      <FlashList
        key={`list-${filter}`}
        data={filteredData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        numColumns={filter === 'shorts' ? 2 : 1}
        // @ts-ignore
        estimatedItemSize={filter === 'shorts' ? 240 : 110}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          if (filter === 'shorts') {
            return (
              <View style={[styles.shortGridItem, index % 2 === 0 ? { paddingRight: 6 } : { paddingLeft: 6 }]}>
                <VideoCard video={item} layout="short" context="watchlist" onPress={handlePress} />
              </View>
            );
          }
          return <VideoCard video={item} layout="compact" context="watchlist" onPress={handlePress} />;
        }}
        ListEmptyComponent={
          !watchlistQuery.isLoading ? (
            <View style={styles.emptyState}>
              <ListPlus color={colors.textMuted} size={42} style={{ marginBottom: spacing.sm }} />
              <AppText muted>Your {filter} watchlist is empty.</AppText>
            </View>
          ) : null
        }
      />

      <AppConfirmModal
        visible={showClearModal}
        title="Clear Watchlist?"
        message="This will remove all videos from your watchlist. This action cannot be undone."
        confirmText={isClearing ? 'Clearing...' : 'Clear Watchlist'}
        cancelText="Cancel"
        isDestructive
        onConfirm={() => {
          clearWatchlist(undefined, {
            onSuccess: () => setShowClearModal(false),
          });
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </Screen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginRight: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: isDark ? colors.surfaceMuted : colors.border,
  },
  filterChipActive: {
    backgroundColor: isDark ? colors.text : colors.text,
  },
  filterText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.text,
  },
  filterTextActive: {
    fontSize: typography.body,
    fontWeight: '500',
    color: isDark ? colors.background : colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  shortGridItem: {
    width: '100%',
    marginBottom: spacing.md,
  },
  emptyState: {
    paddingTop: spacing.xl4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
