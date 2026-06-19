import { Clock3, ChevronRight, ListVideo, Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import type { RootStackParamList } from '@/app/navigation/types';
import { useHistory, useWatchlist, useSavedPlaylists } from '@/services/database/useLibraryQueries';
import { usePlayerStore } from '@/features/watch/store/usePlayerStore';
import { useTheme, spacing, radius } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { VideoCard } from '@/shared/ui/VideoCard';
import type { VideoSummary } from '@/entities/video/types';

export function LibraryScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const historyQuery = useHistory();
  const watchlistQuery = useWatchlist();
  const savedPlaylistsQuery = useSavedPlaylists();

  const handleVideoPress = useCallback((video: VideoSummary) => {
    usePlayerStore.getState().playVideo(video);
  }, []);

  const handleShortPress = useCallback((video: VideoSummary, contextList: VideoSummary[]) => {
    const index = contextList.findIndex(v => v.id === video.id);
    navigation.navigate('Shorts', {
      initialIndex: index >= 0 ? index : 0,
      initialShorts: contextList,
    });
  }, [navigation]);

  const historyVideos = historyQuery.data?.filter(v => !v.isShort) ?? [];
  const historyShorts = historyQuery.data?.filter(v => v.isShort) ?? [];
  const watchlistVideos = watchlistQuery.data?.filter(v => !v.isShort) ?? [];
  const watchlistShorts = watchlistQuery.data?.filter(v => v.isShort) ?? [];
  const savedPlaylists = savedPlaylistsQuery.data ?? [];

  const renderCarouselHeader = (title: string, icon: React.ReactNode, onNavigate: () => void) => (
    <Pressable style={styles.carouselHeader} onPress={onNavigate}>
      <View style={styles.carouselHeaderLeft}>
        {icon}
        <AppText variant="subtitle" style={styles.carouselTitle}>{title}</AppText>
      </View>
      <View style={styles.carouselHeaderRight}>
        <AppText style={styles.viewAllText}>View all</AppText>
        <ChevronRight color={colors.brand} size={16} />
      </View>
    </Pressable>
  );

  const renderEmptyCarousel = (message: string) => (
    <View style={styles.emptyCarousel}>
      <AppText muted>{message}</AppText>
    </View>
  );

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Actions */}
        <View style={styles.headerActions}>
          <Pressable style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
            <Settings color={colors.text} size={24} />
            <AppText variant="subtitle">Settings</AppText>
          </Pressable>
        </View>

        {/* History Carousel - Videos */}
        <View style={styles.section}>
          {renderCarouselHeader('History', <Clock3 color={colors.text} size={20} />, () => navigation.navigate('HistoryDetail', { filter: 'videos' }))}
          {historyVideos.length > 0 ? (
            <FlashList
              data={historyVideos.slice(0, 15)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              // @ts-ignore
              estimatedItemSize={160}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <VideoCard video={item} onPress={handleVideoPress} layout="carousel" context="history" />
                </View>
              )}
            />
          ) : (
            renderEmptyCarousel('No recently watched videos')
          )}
        </View>

        {/* History Carousel - Shorts */}
        {historyShorts.length > 0 && (
          <View style={styles.section}>
            {renderCarouselHeader('Shorts History', <Clock3 color={colors.text} size={20} />, () => navigation.navigate('HistoryDetail', { filter: 'shorts' }))}
            <FlashList
              data={historyShorts.slice(0, 15)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              // @ts-ignore
              estimatedItemSize={140}
              renderItem={({ item }) => (
                <View style={styles.shortCardWrapper}>
                  <VideoCard video={item} onPress={(v) => handleShortPress(v, historyShorts)} layout="short" context="history" />
                </View>
              )}
            />
          </View>
        )}

        {/* Watchlist Carousel - Videos */}
        <View style={styles.section}>
          {renderCarouselHeader('Watchlist', <ListVideo color={colors.text} size={20} />, () => navigation.navigate('WatchlistDetail', { filter: 'videos' }))}
          {watchlistVideos.length > 0 ? (
            <FlashList
              data={watchlistVideos.slice(0, 15)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              // @ts-ignore
              estimatedItemSize={160}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <VideoCard video={item} onPress={handleVideoPress} layout="carousel" context="watchlist" />
                </View>
              )}
            />
          ) : (
            renderEmptyCarousel('Your watchlist is empty')
          )}
        </View>

        {/* Watchlist Carousel - Shorts */}
        {watchlistShorts.length > 0 && (
          <View style={styles.section}>
            {renderCarouselHeader('Shorts Watchlist', <ListVideo color={colors.text} size={20} />, () => navigation.navigate('WatchlistDetail', { filter: 'shorts' }))}
            <FlashList
              data={watchlistShorts.slice(0, 15)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              // @ts-ignore
              estimatedItemSize={140}
              renderItem={({ item }) => (
                <View style={styles.shortCardWrapper}>
                  <VideoCard video={item} onPress={(v) => handleShortPress(v, watchlistShorts)} layout="short" context="watchlist" />
                </View>
              )}
            />
          </View>
        )}

        {/* Saved Playlists Carousel */}
        <View style={styles.section}>
          {renderCarouselHeader('Saved Playlists', <ListVideo color={colors.text} size={20} />, () => navigation.navigate('SavedPlaylistsDetail'))}
          {savedPlaylists.length > 0 ? (
            <FlashList
              data={savedPlaylists.slice(0, 15)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              // @ts-ignore
              estimatedItemSize={160}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <VideoCard
                    video={item}
                    onPress={() => navigation.navigate('Playlist', { id: item.id })}
                    layout="carousel"
                    context="playlist_card"
                    isPlaylist={true}
                    playlistVideoCount={parseInt(item.videoCountLabel || '0')}
                  />
                </View>
              )}
            />
          ) : (
            renderEmptyCarousel('No saved playlists yet')
          )}
        </View>

      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
  },
  section: {
    marginTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
    paddingBottom: spacing.xl,
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  carouselHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  carouselTitle: {
    fontWeight: '700',
  },
  carouselHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: colors.brand,
    fontWeight: '600',
    fontSize: 14,
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    width: 260,
    marginRight: spacing.md,
  },
  shortCardWrapper: {
    width: 140,
    marginRight: spacing.md,
  },
  emptyCarousel: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
});
