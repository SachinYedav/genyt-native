import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme, typography } from '@/shared/theme';

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: 'title' | 'subtitle' | 'body' | 'caption';
    muted?: boolean;
  }
>;

export function AppText({ children, muted, style, variant = 'body', ...props }: AppTextProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Text {...props} style={[styles.base, styles[variant], muted && styles.muted, style]}>
      {children}
    </Text>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  base: {
    color: colors.text,
    letterSpacing: 0,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  body: {
    fontSize: typography.body,
    fontWeight: '500',
  },
  caption: {
    fontSize: typography.caption,
    fontWeight: '500',
  },
  muted: {
    color: colors.textMuted,
  },
});
