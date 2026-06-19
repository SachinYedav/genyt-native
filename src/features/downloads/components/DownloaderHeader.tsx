import React, { useRef } from 'react';
import { View, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react-native';
import AnimatedReanimated from 'react-native-reanimated';
import { AppText } from '@/shared/ui/AppText';
import { spacing, radius, typography, type ThemeColors } from '@/shared/theme';

interface DownloaderHeaderProps {
  colors: ThemeColors;
  onBack: () => void;
  onNavigateDownloads: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isError: boolean;
  headerAnimatedStyle: any;
}

export function DownloaderHeader({
  colors,
  onBack,
  onNavigateDownloads,
  onRefresh,
  isLoading,
  isError,
  headerAnimatedStyle,
}: DownloaderHeaderProps) {
  const styles = getStyles(colors);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const handleRefresh = () => {
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      spinAnim.setValue(0);
    });
    onRefresh();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <ArrowLeft color={colors.text} size={28} />
      </Pressable>
      <AppText variant="subtitle" style={styles.headerTitle}>Download</AppText>
      <View style={styles.headerRight}>
        {!isLoading && !isError && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <AnimatedReanimated.View style={headerAnimatedStyle}>
              <Pressable style={[styles.headerChip, styles.headerChipBrand]} onPress={onNavigateDownloads}>
                <Download color={colors.white} size={16} />
                <AppText style={[styles.headerChipText, styles.headerChipTextWhite]}>Downloads</AppText>
              </Pressable>
            </AnimatedReanimated.View>
            <Pressable style={styles.headerChip} onPress={handleRefresh}>
              <Animated.View style={{ transform: [{ rotate: spin }], paddingVertical: spacing.xs }}>
                <RefreshCw color={colors.text} size={16} />
              </Animated.View>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  headerTitle: {
    marginLeft: spacing.sm,
    fontWeight: '700',
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  headerChipBrand: {
    backgroundColor: colors.brand,
  },
  headerChipText: {
    fontSize: typography.captionLg,
    fontWeight: '600',
    color: colors.text,
  },
  headerChipTextWhite: {
    color: colors.white,
  },
});
