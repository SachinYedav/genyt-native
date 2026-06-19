import React, { useRef, useState, useMemo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { VideoSummary } from '@/entities/video/types';
import { ShortsPlayerItem } from './ShortsPlayerItem';
import { useAddHistory } from '@/services/database/useLibraryQueries';
import { useTheme } from '@/shared/theme';

interface ShortsFeedProps {
  videos: VideoSummary[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onEndReached?: () => void;
  isEndReachedLoading?: boolean;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ShortsFeed({ videos, initialIndex = 0, onIndexChange, onEndReached, isEndReachedLoading }: ShortsFeedProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [containerHeight, setContainerHeight] = useState(0);
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { mutate: addHistory } = useAddHistory();

  useEffect(() => {
    if (videos.length > 0 && videos[activeIndex]) {
      addHistory(videos[activeIndex]);
    }
  }, [activeIndex, videos, addHistory]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const active = viewableItems.reduce((prev: any, current: any) => {
        return (prev.isViewable && prev.itemVisiblePercent > current.itemVisiblePercent) ? prev : current;
      });
      setActiveIndex(active.index);
      onIndexChange?.(active.index);
    }
  }).current;

  return (
    <View style={styles.root} onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}>
      {containerHeight > 0 && videos.length > 0 && (
        <FlashList
          data={videos}
          keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : index.toString()}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          // @ts-ignore: estimatedItemSize is a valid FlashList prop
          estimatedItemSize={containerHeight}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50, minimumViewTime: 50 }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => {
            const isActive = index === activeIndex;
            const isAdjacent = Math.abs(index - activeIndex) === 1;

            return (
              <View style={{ height: containerHeight }}>
                <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
                  <ShortsPlayerItem
                    video={item}
                    isActive={isActive}
                    isAdjacent={isAdjacent}
                  />
                </View>
              </View>
            );
          }}
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
});
