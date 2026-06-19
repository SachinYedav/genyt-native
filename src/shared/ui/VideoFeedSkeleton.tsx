import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, spacing } from '@/shared/theme';

const SHIMMER_DURATION = 1200;

export function ShimmerBone({
  style,
  delay = 0,
}: {
  style: StyleProp<ViewStyle>;
  delay?: number;
}) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(0.8, { duration: SHIMMER_DURATION }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[style, animatedStyle]} />;
}

function VideoCardSkeleton({ index }: { index: number }) {
  const delay = index * 80;
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <ShimmerBone style={styles.thumbnail} delay={delay} />
      <View style={styles.metaRow}>
        <ShimmerBone style={styles.avatar} delay={delay + 40} />
        <View style={styles.copy}>
          <ShimmerBone style={styles.titleLine} delay={delay + 80} />
          <ShimmerBone style={styles.titleLineShort} delay={delay + 120} />
          <ShimmerBone style={styles.subtitleLine} delay={delay + 160} />
        </View>
      </View>
    </View>
  );
}

export function VideoFeedSkeleton({ count = 3 }: { count?: number }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <VideoCardSkeleton key={i} index={i} />
      ))}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  card: {
    gap: spacing.md,
    paddingBottom: 28,
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    width: '100%',
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  titleLine: {
    height: 14,
    width: '92%',
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
  },
  titleLineShort: {
    height: 14,
    width: '60%',
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
  },
  subtitleLine: {
    height: 11,
    width: '45%',
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
    marginTop: 2,
  },
});
