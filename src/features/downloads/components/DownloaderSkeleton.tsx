import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, spacing, radius } from '@/shared/theme';

export function DownloaderSkeleton() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* Skeleton Context Info */}
      <View style={styles.contextContainer}>
        <View style={styles.skeletonThumbnail} />
        <View style={styles.contextInfo}>
          <View style={[styles.skeletonLine, { width: '90%', height: 18, marginBottom: 8 }]} />
          <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
        </View>
      </View>

      {/* Skeleton Filter Row */}
      <View style={styles.filterRow}>
        <View style={[styles.skeletonChip, { width: 80 }]} />
        <View style={[styles.skeletonChip, { width: 90 }]} />
        <View style={[styles.skeletonChip, { width: 70 }]} />
      </View>

      {/* Skeleton Format Rows (flat list, no cards) */}
      <View style={styles.listContent}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <View key={i} style={styles.formatRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.formatInfo}>
              <View style={[styles.skeletonLine, { width: '40%', height: 16 }]} />
              <View style={[styles.skeletonLine, { width: '60%', height: 12, marginTop: 6 }]} />
            </View>
            <View style={styles.skeletonButton} />
          </View>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => {
  const skeletonBg = isDark ? '#2A2A2A' : '#E5E5E5';

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    contextContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    skeletonThumbnail: {
      width: 140,
      height: 78,
      borderRadius: radius.md,
      backgroundColor: skeletonBg,
    },
    contextInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    skeletonChip: {
      height: 32,
      borderRadius: radius.full,
      backgroundColor: skeletonBg,
    },
    listContent: {
      paddingTop: 0,
    },
    formatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    skeletonIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: skeletonBg,
      marginRight: spacing.md,
    },
    formatInfo: {
      flex: 1,
    },
    skeletonLine: {
      borderRadius: radius.sm,
      backgroundColor: skeletonBg,
    },
    skeletonButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: skeletonBg,
    },
  });
};
