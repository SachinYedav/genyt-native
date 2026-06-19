import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, spacing } from '@/shared/theme';

type ScreenProps = PropsWithChildren<
  ViewProps & {
    padded?: boolean;
    safeAreaEdges?: readonly ('top' | 'right' | 'bottom' | 'left')[];
  }
>;

export function Screen({ children, padded = true, safeAreaEdges, style, ...props }: ScreenProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
      <View {...props} style={[styles.container, padded && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
