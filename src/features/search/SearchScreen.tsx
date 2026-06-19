import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { RootStackParamList } from '@/app/navigation/types';
import type { VideoSummary } from '@/entities/video/types';
import { usePlayerStore } from '@/features/watch/store/usePlayerStore';
import { sourceAdapter } from '@/services/source';
import { useSearchHistoryStore } from '@/features/search/store/useSearchHistoryStore';
import { useTheme, spacing, radius, typography, type ThemeColors } from '@/shared/theme';
import { useNetworkStore } from '@/store/useNetworkStore';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { AppConfirmModal } from '@/shared/ui/AppConfirmModal';
import { SearchRow } from './components/SearchRow';
import { SuggestionRow } from './components/SuggestionRow';
import { HistoryRow } from './components/HistoryRow';
import { FeedbackRow } from './components/FeedbackRow';
import { VideoCard } from '@/shared/ui/VideoCard';
import { ShortsShelf } from '@/shared/ui/ShortsShelf';
import {
  SEARCH_HISTORY_VISIBLE_LIMIT,
  SEARCH_RESULT_LIMIT,
} from './constants/searchConstants';
import { extractYouTubeVideoId, normalizeSearchTerm, parseYouTubeUrl } from './utils/searchUrl';
import { useSearchSuggestions } from './hooks/useSearchSuggestions';

const searchQueryKey = ['search-v2'];

type SearchListItem =
  | { type: 'direct-url'; videoId: string; label: string }
  | { type: 'history-header' }
  | { type: 'history'; query: string }
  | { type: 'suggestion'; query: string }
  | { type: 'feedback'; variant: 'offline' | 'error' | 'empty' | 'no-results' | 'no-suggestions' | 'searching' | 'initial'; message?: string; subMessage?: string }
  | { type: 'video'; video: VideoSummary }
  | { type: 'shorts_shelf'; videos: VideoSummary[] };

export function SearchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const playVideo = usePlayerStore(state => state.playVideo);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInputType>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);

  // Ref to guard against onBlur racing with list item taps.
  // When a list row is pressed, we set this to true so the
  // onBlur handler skips its delayed setIsFocused(false).
  const pendingActionRef = useRef(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searches = useSearchHistoryStore((state) => state.searches);
  const addSearch = useSearchHistoryStore((state) => state.addSearch);
  const removeSearch = useSearchHistoryStore((state) => state.removeSearch);
  const clearSearches = useSearchHistoryStore((state) => state.clearSearches);
  const directVideoId = extractYouTubeVideoId(query);
  const normalizedQuery = normalizeSearchTerm(query);

  const suggestions = useSearchSuggestions({
    focused: isFocused,
    query,
  });

  const searchResults = useInfiniteQuery({
    queryKey: [...searchQueryKey, submittedQuery],
    queryFn: async ({ pageParam, signal }) => {
      if (pageParam) {
        return sourceAdapter.fetchNextPage(pageParam, signal);
      }
      return sourceAdapter.search({ query: submittedQuery, limit: SEARCH_RESULT_LIMIT, signal });
    },
    enabled: submittedQuery.length > 0,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.continuationToken || undefined,
  });


  const historyItems = useMemo(
    () => searches.slice(0, SEARCH_HISTORY_VISIBLE_LIMIT),
    [searches],
  );

  const submitSearch = useCallback(async (searchTerm: string) => {
    const nextQuery = normalizeSearchTerm(searchTerm);
    if (!nextQuery) return;

    const parsedUrl = parseYouTubeUrl(nextQuery);

    if (parsedUrl) {
      if (parsedUrl.type === 'video') {
        Keyboard.dismiss();
        setIsFocused(false);
        addSearch(nextQuery);

        if (parsedUrl.isShort) {
          navigation.navigate('Shorts', {
            initialIndex: 0,
            initialShorts: [{
              id: parsedUrl.videoId,
              title: 'YouTube Short',
              isShort: true,
              source: 'youtube',
              formats: [],
              related: []
            } as any],
          });
        } else {
          usePlayerStore.getState().playVideo({
            id: parsedUrl.videoId,
            title: 'YouTube Video',
            author: 'Unknown Channel',
            views: '',
            duration: '',
            thumbnailUrl: `https://i.ytimg.com/vi/${parsedUrl.videoId}/hqdefault.jpg`,
            formats: [],
            related: []
          } as any);
        }
        return;
      }

      if (parsedUrl.type === 'playlist') {
        Keyboard.dismiss();
        setIsFocused(false);
        addSearch(nextQuery);
        navigation.navigate('Playlist', { id: parsedUrl.playlistId });
        return;
      }

      if (parsedUrl.type === 'channel') {
        Keyboard.dismiss();
        setIsFocused(false);
        addSearch(nextQuery);
        navigation.navigate('Channel', { id: parsedUrl.channelIdOrUrl });
        return;
      }
    }

    await queryClient.cancelQueries({ queryKey: searchQueryKey });
    Keyboard.dismiss();
    setIsFocused(false);

    addSearch(nextQuery);
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
  }, [addSearch, navigation, queryClient]);

  const handleSuggestionPress = useCallback((text: string) => {
    pendingActionRef.current = true;
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    submitSearch(text);
    requestAnimationFrame(() => {
      pendingActionRef.current = false;
    });
  }, [submitSearch]);

  const handleHistoryPress = useCallback((text: string) => {
    pendingActionRef.current = true;
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    submitSearch(text);
    requestAnimationFrame(() => {
      pendingActionRef.current = false;
    });
  }, [submitSearch]);

  const handleHistoryDelete = useCallback((text: string) => {
    pendingActionRef.current = true;
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    removeSearch(text);
    // Keep the suggestion surface open.
    setIsFocused(true);
    requestAnimationFrame(() => {
      pendingActionRef.current = false;
    });
  }, [removeSearch]);

  const confirmClearAll = useCallback(() => {
    setShowClearHistoryModal(true);
  }, []);

  const handleClearAll = useCallback(() => {
    pendingActionRef.current = true;
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    clearSearches();
    setShowClearHistoryModal(false);
    setIsFocused(true);
    requestAnimationFrame(() => {
      pendingActionRef.current = false;
    });
  }, [clearSearches]);

  const clearInput = useCallback(() => {
    queryClient.cancelQueries({ queryKey: searchQueryKey });
    queryClient.removeQueries({ queryKey: searchQueryKey });
    setQuery('');
    setSubmittedQuery('');
    inputRef.current?.focus();
    setIsFocused(true);
  }, [queryClient]);

  const handleBlur = useCallback(() => {
    blurTimerRef.current = setTimeout(() => {
      blurTimerRef.current = null;
      if (!pendingActionRef.current) {
        setIsFocused(false);
      }
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  const showHistory = !normalizedQuery && historyItems.length > 0;
  const showSuggestions = normalizedQuery.length > 0 && !directVideoId && suggestions.suggestions.length > 0;
  const showNoSuggestions = !directVideoId && suggestions.hasNoSuggestions;
  const showDirectUrlAction = Boolean(directVideoId);
  const hasSubmittedSearch = submittedQuery.length > 0;
  const isInitial = !hasSubmittedSearch && !normalizedQuery;

  const listData = useMemo(() => {
    const items: SearchListItem[] = [];

    if (isFocused) {
      if (showDirectUrlAction) {
        items.push({ type: 'direct-url', videoId: directVideoId!, label: 'Open this YouTube video' });
      }

      if (showHistory) {
        items.push({ type: 'history-header' });
        historyItems.forEach((item) => items.push({ type: 'history', query: item }));
      }

      if (showSuggestions) {
        suggestions.suggestions.forEach((item) => items.push({ type: 'suggestion', query: item }));
      }

      if (suggestions.errorState) {
        items.push({
          type: 'feedback',
          variant: suggestions.errorState.variant,
          message: suggestions.errorState.message,
          subMessage: suggestions.errorState.subMessage,
        });
      } else if (showNoSuggestions) {
        items.push({ type: 'feedback', variant: 'no-suggestions', message: 'No suggestions found.' });
      }
    } else {
      if (isInitial) {
        items.push({ type: 'feedback', variant: 'initial' });
      } else if (searchResults.isLoading) {
        items.push({ type: 'feedback', variant: 'searching' });
      } else if (searchResults.isError) {
        const isOffline = useNetworkStore.getState().isOffline;
        const rawMessage = searchResults.error instanceof Error ? searchResults.error.message : String(searchResults.error);
        if (isOffline || rawMessage.includes('UnknownHostException') || rawMessage.includes('Network') || rawMessage.includes('ConnectException')) {
          items.push({ type: 'feedback', variant: 'offline' });
        } else {
          items.push({ type: 'feedback', variant: 'error', message: 'Search failed', subMessage: 'Something went wrong.' });
        }
      } else if (hasSubmittedSearch && (!searchResults.data || searchResults.data.pages[0].items.length === 0)) {
        items.push({ type: 'feedback', variant: 'no-results' });
      } else if (normalizedQuery && !directVideoId && !hasSubmittedSearch) {
        items.push({ type: 'feedback', variant: 'empty', message: 'Submit your search to see results.' });
      } else if (searchResults.data) {
        let lastShelfIndex = -1;

        searchResults.data.pages.forEach((page, pageIndex) => {
          const pageShorts = page.items.filter(v => v.isShort);
          const pageVideos = page.items.filter(v => !v.isShort);

          for (let i = 0; i < pageVideos.length; i++) {
            items.push({ type: 'video', video: pageVideos[i] });

            // For the first page, insert the shelf early (after 3rd video)
            if (pageIndex === 0 && i === 2 && pageShorts.length > 0) {
              items.push({ type: 'shorts_shelf', videos: [...pageShorts] });
              lastShelfIndex = items.length - 1;
              pageShorts.length = 0; // Clear the array
            }
          }

          if (pageShorts.length === 0) return;

          // Smart Merge Check
          if (lastShelfIndex !== -1) {
            const lastShelf = items[lastShelfIndex];
            if (lastShelf.type === 'shorts_shelf') {
              if (lastShelf.videos.length < 2 || pageShorts.length < 2) {
                lastShelf.videos.push(...pageShorts);
                return;
              }
            }
          }

          // Otherwise, create a new shelf for this incoming page's batch
          items.push({ type: 'shorts_shelf', videos: [...pageShorts] });
          lastShelfIndex = items.length - 1;
        });
      }
    }

    return items;
  }, [
    isFocused, showDirectUrlAction, directVideoId, showHistory, historyItems,
    showSuggestions, suggestions.suggestions, suggestions.errorState, showNoSuggestions,
    isInitial, searchResults.isLoading, searchResults.isError, searchResults.error,
    hasSubmittedSearch, searchResults.data, normalizedQuery,
  ]);

  const renderItem = useCallback(({ item }: { item: SearchListItem }) => {
    switch (item.type) {
      case 'direct-url':
        return (
          <Animated.View entering={FadeIn.duration(200)}>
            <SearchRow
              icon={<Search color={colors.blue} size={18} />}
              label={item.label}
              mutedLabel={item.videoId}
              onPress={() => submitSearch(query)}
            />
          </Animated.View>
        );
      case 'history-header':
        return (
          <View style={styles.panelHeader}>
            <AppText muted variant="caption">Recent searches</AppText>
            <Pressable accessibilityLabel="Clear search history" hitSlop={12} onPress={confirmClearAll}>
              <Trash2 color={colors.textMuted} size={16} />
            </Pressable>
          </View>
        );
      case 'history':
        return (
          <HistoryRow
            query={item.query}
            onPress={handleHistoryPress}
            onDelete={handleHistoryDelete}
          />
        );
      case 'suggestion':
        return (
          <SuggestionRow
            suggestion={item.query}
            query={query}
            onPress={() => handleSuggestionPress(item.query)}
          />
        );
      case 'video':
        // No entering animation on video items — FlashList recycles cells
        // and FadeIn on recycled cells causes visible scroll glitches.
        return (
          <VideoCard
            video={item.video}
            onPress={(video) => {
              playVideo(video);
            }}
          />
        );
      case 'shorts_shelf':
        return <ShortsShelf shorts={item.videos} />;
      case 'feedback':
        return <FeedbackRow item={item} />;
    }
  }, [query, submitSearch, handleHistoryPress, handleHistoryDelete, handleSuggestionPress, navigation, colors.textMuted, colors.blue, confirmClearAll, styles.panelHeader]);

  return (
    <Screen padded={false}>
      <View style={styles.searchBar}>
        <Search color={colors.textMuted} size={20} />
        <TextInput
          ref={inputRef}
          value={query}
          onBlur={handleBlur}
          onChangeText={(value) => {
            setQuery(value);
            if (!value.trim()) setSubmittedQuery('');
          }}
          onFocus={() => setIsFocused(true)}
          onSubmitEditing={() => submitSearch(query)}
          placeholder="Search YouTube"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          returnKeyType="search"
        />
        {suggestions.isLoading && normalizedQuery && !directVideoId ? (
          <ActivityIndicator color={colors.textMuted} size="small" />
        ) : null}
        {query ? (
          <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={clearInput} style={styles.iconButton}>
            <X color={colors.textMuted} size={18} />
          </Pressable>
        ) : null}
      </View>

      <FlashList
        data={listData}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        getItemType={(item) => item.type}
        keyExtractor={(item, index) => {
          if (item.type === 'video') return `video-${item.video.id}-${index}`;
          if (item.type === 'shorts_shelf') return `shorts_shelf-${item.videos[0]?.id}-${index}`;
          if (item.type === 'history') return `history-${item.query}-${index}`;
          if (item.type === 'suggestion') return `suggestion-${item.query}-${index}`;
          if (item.type === 'direct-url') return `direct-url-${item.videoId}-${index}`;
          if (item.type === 'history-header') return `history-header-${index}`;
          return `feedback-${item.variant}-${index}`;
        }}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        renderItem={renderItem}
        onEndReached={() => {
          if (!isFocused && searchResults.hasNextPage && !searchResults.isFetchingNextPage) {
            searchResults.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          !isFocused && searchResults.isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          ) : null
        }
      />

      <AppConfirmModal
        visible={showClearHistoryModal}
        title="Clear search history?"
        message="Your search history will be cleared from this app."
        cancelText="Cancel"
        confirmText="Clear search history"
        isDestructive
        onConfirm={handleClearAll}
        onCancel={() => setShowClearHistoryModal(false)}
      />
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  searchBar: {
    height: 46,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.bodyLg,
    letterSpacing: 0,
    minWidth: 0,
  },
  iconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelHeader: {
    height: 38,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  panelMessage: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  historyRowContent: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deleteButton: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  centerState: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    textAlign: 'center',
  },
  highlightBold: {
    fontWeight: '600',
    color: colors.blue,
  },
});
