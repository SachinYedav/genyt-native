import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { spacing, radius, typography, type ThemeColors } from '@/shared/theme';

type TabOption = 'video' | 'audio' | 'thumbnail';

interface FormatFilterBarProps {
  colors: ThemeColors;
  activeTab: TabOption;
  onSelect: (tab: TabOption) => void;
  counts: { video: number; audio: number; thumbnail: number };
}

export function FormatFilterBar({ colors, activeTab, onSelect, counts }: FormatFilterBarProps) {
  const styles = getStyles(colors);
  return (
    <View style={styles.filterRow}>
      {(['video', 'audio', 'thumbnail'] as TabOption[]).map((f) => {
        const count = counts[f];
        return (
          <Pressable
            key={f}
            style={[styles.filterChip, activeTab === f && styles.filterChipActive]}
            onPress={() => onSelect(f)}
          >
            <AppText style={activeTab === f ? styles.filterTextActive : styles.filterText}>
              {f === 'video' ? 'Videos' : f === 'audio' ? 'Audio' : 'Images'} ({count})
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: colors.text,
  },
  filterText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '600',
  },
});
