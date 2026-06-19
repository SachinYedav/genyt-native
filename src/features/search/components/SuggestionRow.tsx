import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme, type ThemeColors, spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { getHighlightedSearchParts } from '../utils/searchBarUtils';

export type SuggestionRowProps = {
  suggestion: string;
  query: string;
  onPress: () => void;
};

export const SuggestionRow = React.memo(function SuggestionRow({ suggestion, query: currentQuery, onPress }: SuggestionRowProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const parts = getHighlightedSearchParts(suggestion, currentQuery);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Search color={colors.textMuted} size={18} />
      <View style={styles.rowCopy}>
        <AppText numberOfLines={1}>
          {parts.map((part, index) => (
            <AppText
              key={`${part.text}-${index}`}
              style={part.isMatch ? styles.highlightBold : undefined}
            >
              {part.text}
            </AppText>
          ))}
        </AppText>
      </View>
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
  highlightBold: {
    fontWeight: 'bold',
  },
});
