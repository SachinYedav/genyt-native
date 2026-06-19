import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors, spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';

export type SearchRowProps = {
  icon: React.ReactNode;
  label: string;
  mutedLabel?: string;
  onPress: () => void;
  trailing?: React.ReactNode;
};

export const SearchRow = React.memo(function SearchRow({ icon, label, mutedLabel, onPress, trailing }: SearchRowProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {icon}
      <View style={styles.rowCopy}>
        <AppText numberOfLines={1}>{label}</AppText>
        {mutedLabel ? (
          <AppText muted numberOfLines={1} variant="caption">{mutedLabel}</AppText>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
});

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 16,
  },
  rowCopy: {
    flex: 1,
    flexDirection: 'column',
  },
});
