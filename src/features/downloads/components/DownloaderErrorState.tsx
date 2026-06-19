import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { WifiOff, AlertTriangle } from 'lucide-react-native';
import { AppText } from '@/shared/ui/AppText';
import { spacing, radius, typography, type ThemeColors } from '@/shared/theme';

interface DownloaderErrorStateProps {
  colors: ThemeColors;
  error: unknown;
  onRetry: () => void;
}

export function DownloaderErrorState({ colors, error, onRetry }: DownloaderErrorStateProps) {
  const styles = getStyles(colors);
  const errorString = String(error);

  const isNetwork = errorString.includes('Network') || errorString.includes('GENYT_NETWORK');
  const isUnavailable = errorString.includes('GENYT_VIDEO_UNAVAILABLE');

  return (
    <View style={styles.errorContainer}>
      {isNetwork ? (
        <View style={styles.inlineState}>
          <WifiOff color={colors.textMuted} size={42} style={{ marginBottom: spacing.md }} />
          <AppText variant="subtitle" style={{ marginBottom: spacing.xs }}>You're offline</AppText>
          <AppText muted style={{ marginBottom: spacing.md }}>Check your connection and try again.</AppText>
          <Pressable style={styles.retryButton} onPress={onRetry}>
            <AppText style={styles.retryButtonText}>Retry</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.inlineState}>
          <AlertTriangle color={colors.textMuted} size={42} style={{ marginBottom: spacing.md }} />
          <AppText variant="subtitle" style={{ marginBottom: spacing.xs }}>
            {isUnavailable ? 'Video Unavailable' : 'Extraction Failed'}
          </AppText>
          <AppText muted style={{ textAlign: 'center', marginBottom: spacing.md }}>
            {errorString.replace('GENYT_UNKNOWN:', '').replace('GENYT_VIDEO_UNAVAILABLE:', '').trim()}
          </AppText>
          <Pressable style={styles.retryButton} onPress={onRetry}>
            <AppText style={styles.retryButtonText}>Try Again</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  inlineState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    width: '100%',
    paddingVertical: spacing.md,
    backgroundColor: colors.text,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: typography.subtitle,
  },
});
