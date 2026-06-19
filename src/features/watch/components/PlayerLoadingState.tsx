import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme, spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';

interface Props {
  thumbnailUrl?: string;
  isError?: boolean;
}

export function PlayerLoadingState({ thumbnailUrl, isError }: Props) {
  const { colors } = useTheme();

  if (isError) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' }]}>
        <AlertTriangle size={32} color={colors.white} style={{ marginBottom: spacing.sm }} />
        <AppText style={{ color: colors.white, fontWeight: '600' }}>Playback Error</AppText>
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.black }]}>
      {thumbnailUrl && (
        <Image
          source={{ uri: thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    </View>
  );
}
