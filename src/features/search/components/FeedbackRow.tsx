import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Search, SearchX, WifiOff } from 'lucide-react-native';
import { useTheme, spacing, typography, ThemeColors } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { VideoFeedSkeleton } from '@/shared/ui/VideoFeedSkeleton';

export type FeedbackVariant = 'offline' | 'error' | 'empty' | 'no-results' | 'no-suggestions' | 'searching' | 'initial';

export interface FeedbackRowProps {
  item: {
    variant: FeedbackVariant;
    message?: string;
    subMessage?: string;
  };
}

export function FeedbackRow({ item }: FeedbackRowProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (item.variant === 'offline') {
    return (
      <View style={styles.centerState}>
        <WifiOff color={colors.textMuted} size={48} />
        <AppText variant="subtitle">You're offline</AppText>
        <AppText muted>Check your connection and try again.</AppText>
      </View>
    );
  }
  if (item.variant === 'no-results') {
    return (
      <View style={styles.centerState}>
        <SearchX color={colors.textMuted} size={48} />
        <AppText variant="subtitle">No results found</AppText>
        <AppText muted>Try searching for something else.</AppText>
      </View>
    );
  }
  if (item.variant === 'initial') {
    return (
      <View style={styles.centerState}>
        <Search color={colors.textMuted} size={48} />
        <AppText variant="subtitle">Search GenYT</AppText>
        <AppText muted>Find your favorite videos and channels.</AppText>
      </View>
    );
  }
  if (item.variant === 'searching') {
    return <VideoFeedSkeleton />;
  }
  if (item.variant === 'no-suggestions' || item.variant === 'empty' || item.variant === 'error') {
    return (
      <View style={styles.panelMessage}>
        <AppText muted variant="caption">{item.message}</AppText>
        {item.subMessage && <AppText muted variant="caption">{item.subMessage}</AppText>}
      </View>
    );
  }
  return null;
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  centerState: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    textAlign: 'center',
  },
  panelMessage: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
