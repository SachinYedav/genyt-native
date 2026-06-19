import React from 'react';
import { View, StyleSheet, Pressable, Linking } from 'react-native';
import { ExternalLink, AlertCircle } from 'lucide-react-native';
import { useTheme, typography, spacing, radius } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';

interface PlayerErrorStateProps {
  message: string;
  youtubeUrl: string;
}

export function PlayerErrorState({ message, youtubeUrl }: PlayerErrorStateProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const handleOpenYouTube = () => {
    Linking.openURL(youtubeUrl).catch((err) => console.error('An error occurred', err));
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AlertCircle color={colors.white} size={48} style={styles.icon} />
        <AppText style={styles.messageText}>
          {message}
        </AppText>
        <Pressable
          style={styles.button}
          onPress={handleOpenYouTube}
        >
          <AppText style={styles.buttonText}>Open on YouTube</AppText>
          <ExternalLink color={colors.black} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    paddingHorizontal: spacing.xl,
  },
  content: {
    maxWidth: 320,
    alignItems: 'center',
  },
  icon: {
    marginBottom: spacing.lg,
    opacity: 0.9,
  },
  messageText: {
    fontSize: typography.bodySm,
    fontWeight: '500',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: 8,
  },
  buttonText: {
    color: colors.black,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
});
