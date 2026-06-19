import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, spacing, radius } from '@/shared/theme';

export function WatchSkeleton({ hideMeta = false }: { hideMeta?: boolean }) {
  const { colors, isDark } = useTheme();
  const skeletonBg = isDark ? '#2A2A2A' : '#E5E5E5';

  return (
    <View style={styles.container}>
      <View style={styles.metadataWrapper}>
        {!hideMeta && (
          <>
            {/* Title Area */}
            <View style={styles.titleBlock}>
              <View style={[styles.skeletonLine, { width: '90%', height: 24, backgroundColor: skeletonBg }]} />
              <View style={[styles.skeletonLine, { width: '60%', height: 24, marginTop: spacing.xs, backgroundColor: skeletonBg }]} />
            </View>

            {/* Action Row */}
            <View style={styles.actionRow}>
              <View style={[styles.skeletonPill, { width: 100, backgroundColor: skeletonBg }]} />
              <View style={[styles.skeletonPill, { width: 85, backgroundColor: skeletonBg }]} />
              <View style={[styles.skeletonPill, { width: 110, backgroundColor: skeletonBg }]} />
            </View>

            {/* Channel Row */}
            <View style={styles.channelRow}>
              <View style={[styles.skeletonAvatar, { backgroundColor: skeletonBg }]} />
              <View style={styles.channelInfo}>
                <View style={[styles.skeletonLine, { width: '40%', height: 16, backgroundColor: skeletonBg }]} />
                <View style={[styles.skeletonLine, { width: '25%', height: 12, marginTop: spacing.xs, backgroundColor: skeletonBg }]} />
              </View>
            </View>
          </>
        )}

        {/* Description Box */}
        <View style={[styles.skeletonDescription, { backgroundColor: skeletonBg }]} />

        {/* Related Text */}
        <View style={[styles.skeletonLine, { width: 70, height: 20, marginTop: spacing.md, backgroundColor: skeletonBg }]} />
      </View>

      {/* Related Section */}
      <View style={styles.relatedSection}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.relatedCard}>
            <View style={[styles.relatedThumbnail, { backgroundColor: skeletonBg }]} />
            <View style={styles.relatedMetaRow}>
              <View style={[styles.skeletonAvatarSmall, { backgroundColor: skeletonBg }]} />
              <View style={styles.relatedInfo}>
                <View style={[styles.skeletonLine, { width: '90%', height: 14, backgroundColor: skeletonBg }]} />
                <View style={[styles.skeletonLine, { width: '60%', height: 14, backgroundColor: skeletonBg }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  metadataWrapper: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  channelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonDescription: {
    width: '100%',
    height: 80,
    borderRadius: radius.md,
  },
  relatedSection: {
    gap: spacing.xl,
  },
  relatedCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  relatedThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
  },
  relatedMetaRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  relatedInfo: {
    flex: 1,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  skeletonLine: {
    borderRadius: radius.sm,
  },
  skeletonPill: {
    height: 38,
    borderRadius: radius.sm,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
