import React, { useState, useCallback, memo } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Download, FileVideo, Headphones, Image as ImageIcon, AlertTriangle } from 'lucide-react-native';
import { AppText } from '@/shared/ui/AppText';
import { spacing, radius, typography, type ThemeColors } from '@/shared/theme';
import type { MediaFormat } from '@/entities/video/types';

export type EnhancedMediaFormat = MediaFormat & { uiLabel: 'RECOMMENDED' | 'NO_AUDIO' | null };
type TabOption = 'video' | 'audio' | 'thumbnail';

interface FormatCardProps {
  item: EnhancedMediaFormat;
  activeTab: TabOption;
  colors: ThemeColors;
  isDark: boolean;
  onDownload: (format: MediaFormat, x: number, y: number) => void;
}

export const FormatCard = memo(({ item, activeTab, colors, isDark, onDownload }: FormatCardProps) => {
  const styles = getStyles(colors, isDark);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePress = useCallback((e: any) => {
    if (isProcessing) return;
    setIsProcessing(true);
    onDownload(item, e.nativeEvent.pageX, e.nativeEvent.pageY);

    // Automatically reset visual loading state after animation concludes
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  }, [isProcessing, item, onDownload]);

  return (
    <View style={styles.formatCard}>
      <View style={styles.formatIconContainer}>
        {activeTab === 'video' ? <FileVideo color={colors.brand} size={24} /> :
          activeTab === 'audio' ? <Headphones color={colors.blue} size={24} /> :
            <ImageIcon color={colors.success} size={24} />}
      </View>

      <View style={styles.formatInfo}>
        <View style={styles.formatTitleRow}>
          <AppText style={styles.qualityText}>{item.qualityLabel}</AppText>
          {item.uiLabel === 'RECOMMENDED' && (
            <View style={styles.recommendedBadge}>
              <AppText style={styles.recommendedText}>Recommended</AppText>
            </View>
          )}
          {item.uiLabel === 'NO_AUDIO' && (
            <View style={styles.noAudioBadge}>
              <AlertTriangle color={colors.warning} size={10} />
              <AppText style={styles.noAudioText}>No Audio</AppText>
            </View>
          )}
        </View>
        <AppText muted variant="caption">
          {item.extension.toUpperCase()} {item.sizeLabel ? `• ${item.sizeLabel}` : ''}
        </AppText>
      </View>

      <Pressable
        style={[styles.downloadButton, isProcessing && { opacity: 0.8 }]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={handlePress}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Download color={colors.white} size={20} />
        )}
      </Pressable>
    </View>
  );
});

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  },
  formatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  formatInfo: {
    flex: 1,
    gap: 2,
  },
  formatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qualityText: {
    fontWeight: '700',
    fontSize: typography.body,
    color: colors.text,
  },
  noAudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
    gap: spacing.xs,
  },
  noAudioText: {
    color: colors.warning,
    fontSize: typography.tiny,
    fontWeight: '600',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  recommendedText: {
    color: colors.success,
    fontSize: typography.tiny,
    fontWeight: '600',
  },
  downloadButton: {
    padding: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
