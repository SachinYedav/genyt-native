import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Clock, X } from 'lucide-react-native';
import { useTheme, type ThemeColors, spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';

export type HistoryRowProps = {
  query: string;
  onPress: (query: string) => void;
  onDelete: (query: string) => void;
};

export const HistoryRow = React.memo(function HistoryRow({ query: historyQuery, onPress, onDelete }: HistoryRowProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.historyRow}>
      <Pressable style={styles.historyRowContent} onPress={() => onPress(historyQuery)}>
        <Clock color={colors.textMuted} size={18} />
        <View style={styles.rowCopy}>
          <AppText numberOfLines={1}>{historyQuery}</AppText>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel={`Remove ${historyQuery} from search history`}
        hitSlop={8}
        style={styles.historyRowDelete}
        onPress={() => onDelete(historyQuery)}
      >
        <X color={colors.textMuted} size={18} />
      </Pressable>
    </View>
  );
});

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  historyRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyRowDelete: {
    padding: 4,
    marginLeft: spacing.md,
  },
  rowCopy: {
    flex: 1,
    flexDirection: 'column',
  },
});
