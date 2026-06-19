import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme, spacing, radius } from '@/shared/theme';

export function ShortsSkeleton() {
  const { isDark, colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const skeletonBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)';

  return (
    <View style={styles.container}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>

      <View style={styles.overlayContainer}>
        <View style={styles.actionColumn}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.actionButton}>
              <View style={[styles.actionIconSkeleton, { backgroundColor: skeletonBg }]} />
              <View style={[styles.actionTextSkeleton, { backgroundColor: skeletonBg }]} />
            </View>
          ))}
        </View>

        <View style={styles.infoColumn}>
          <View style={[styles.textSkeleton, { width: '90%', height: 16, backgroundColor: skeletonBg }]} />
          <View style={[styles.textSkeleton, { width: '60%', height: 16, backgroundColor: skeletonBg }]} />

          <View style={styles.channelRow}>
            <View style={[styles.avatarSkeleton, { backgroundColor: skeletonBg }]} />
            <View style={[styles.textSkeleton, { width: 100, height: 14, backgroundColor: skeletonBg }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  actionColumn: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    gap: spacing.xl,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIconSkeleton: {
    width: 28,
    height: 28,
    borderRadius: radius.lg,
  },
  actionTextSkeleton: {
    width: 40,
    height: 10,
    borderRadius: radius.xs,
  },
  infoColumn: {
    paddingRight: 60,
    gap: spacing.sm,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  avatarSkeleton: {
    width: 32,
    height: 32,
    borderRadius: radius.lg,
  },
  textSkeleton: {
    borderRadius: radius.xs,
  },
});
