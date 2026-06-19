import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from '@/shared/ui/AppText';
import { spacing, radius, typography, type ThemeColors } from '@/shared/theme';

interface VideoContextCardProps {
  colors: ThemeColors;
  thumbnailUrl: string;
  title: string;
  channelTitle: string;
}

export function VideoContextCard({ colors, thumbnailUrl, title, channelTitle }: VideoContextCardProps) {
  const styles = getStyles(colors);
  return (
    <View style={styles.contextContainer}>
      <Image
        source={{ uri: thumbnailUrl }}
        style={styles.contextThumbnail}
        contentFit="cover"
      />
      <View style={styles.contextInfo}>
        <AppText numberOfLines={2} style={styles.contextTitle}>{title}</AppText>
        <AppText muted variant="caption" numberOfLines={1}>{channelTitle}</AppText>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  contextContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  contextThumbnail: {
    width: 140,
    height: 78,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  contextInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contextTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
});
