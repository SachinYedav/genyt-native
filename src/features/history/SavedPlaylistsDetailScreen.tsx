import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft, ListVideo, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';

import type { RootStackParamList } from '@/app/navigation/types';
import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { VideoCard } from '@/shared/ui/VideoCard';
import { AppConfirmModal } from '@/shared/ui/AppConfirmModal';
import { useSavedPlaylists, useClearSavedPlaylists } from '@/services/database/useLibraryQueries';

export function SavedPlaylistsDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: savedPlaylists } = useSavedPlaylists();
  const { mutate: clearSavedPlaylists, isPending: isClearing } = useClearSavedPlaylists();
  const [showClearModal, setShowClearModal] = useState(false);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={28} />
          </Pressable>
          <AppText variant="subtitle">Saved Playlists</AppText>
        </View>
        <View style={styles.headerRight}>
          {savedPlaylists && savedPlaylists.length > 0 && (
            <Pressable 
              style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.7 }]}
              onPress={() => setShowClearModal(true)}
            >
              <Trash2 color={colors.text} size={20} />
            </Pressable>
          )}
        </View>
      </View>

      <FlashList
        data={savedPlaylists ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // @ts-ignore
        estimatedItemSize={110}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ListVideo color={colors.textMuted} size={48} />
            <AppText muted style={styles.emptyText}>You haven't saved any playlists yet.</AppText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <VideoCard
              video={item}
              onPress={() => navigation.navigate('Playlist', { id: item.id })}
              layout="compact"
              context="playlist_card"
              isPlaylist={true}
              playlistVideoCount={parseInt(item.videoCountLabel || '0')}
            />
          </View>
        )}
      />

      <AppConfirmModal
        visible={showClearModal}
        title="Clear saved playlists?"
        message="This will remove all saved playlists from your library."
        confirmText="Clear"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          clearSavedPlaylists();
          setShowClearModal(false);
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </Screen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.xs,
  },
  clearButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  cardWrapper: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
