import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Download, ListPlus, ListMinus, Share2, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useActionMenuStore } from '@/store/useActionSheetStore';
import { useTheme, spacing, typography, radius } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { AppBottomSheet } from '@/shared/ui/AppBottomSheet';
import { useToggleWatchlist, useIsInWatchlist, useRemoveFromHistory, useIsPlaylistSaved, useToggleSavedPlaylist } from '@/services/database/useLibraryQueries';
import type { RootStackParamList } from '@/app/navigation/types';
import { shareVideo } from '@/utils/share';

function ActionButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
          borderRadius: radius.sm,
          marginHorizontal: spacing.sm,
        }
      ]}
      onPress={onPress}
    >
      {icon}
      <AppText style={{ fontSize: typography.body }}>{label}</AppText>
    </Pressable>
  );
}

export function GlobalVideoActionSheet() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const { isOpen, video, context, closeMenu } = useActionMenuStore();

  const { data: inWatchlist } = useIsInWatchlist(video?.id ?? '');
  const { mutate: toggleWatchlist } = useToggleWatchlist();
  const { mutate: removeFromHistory } = useRemoveFromHistory();

  const { data: isSavedPlaylist } = useIsPlaylistSaved(video?.id ?? '');
  const { mutate: toggleSavedPlaylist } = useToggleSavedPlaylist();

  if (!video) return null;

  return (
    <AppBottomSheet visible={isOpen} onClose={closeMenu} scrollable={true}>
      <View style={styles.header}>
        <AppText variant="subtitle" numberOfLines={1}>{video.title}</AppText>
        <AppText muted variant="caption" numberOfLines={1}>{video.channelTitle}</AppText>
      </View>
      <View style={styles.actionsList}>
        
        {/* Watchlist Action */}
        {context !== 'watchlist' && context !== 'playlist_card' && (
          <ActionButton
            icon={inWatchlist ? <ListMinus color={colors.text} size={22} /> : <ListPlus color={colors.text} size={22} />}
            label={inWatchlist ? "Remove from Watchlist" : "Save to Watchlist"}
            onPress={() => {
              toggleWatchlist({ video, inWatchlist: !!inWatchlist });
              closeMenu();
            }}
          />
        )}

        {/* Playlist Context: Save Playlist */}
        {context === 'playlist_card' && (
          <ActionButton
            icon={isSavedPlaylist ? <ListMinus color={colors.text} size={22} /> : <ListPlus color={colors.text} size={22} />}
            label={isSavedPlaylist ? "Remove Playlist" : "Save Playlist"}
            onPress={() => {
              toggleSavedPlaylist({ playlist: video, isSaved: !!isSavedPlaylist });
              closeMenu();
            }}
          />
        )}

        {/* Context: Remove from Watchlist */}
        {context === 'watchlist' && (
          <ActionButton
            icon={<ListMinus color={colors.text} size={22} />}
            label="Remove from Watchlist"
            onPress={() => {
              toggleWatchlist({ video, inWatchlist: true });
              closeMenu();
            }}
          />
        )}

        {/* Context: Remove from History */}
        {context === 'history' && (
          <ActionButton
            icon={<Trash2 color={colors.text} size={22} />}
            label="Remove from watch history"
            onPress={() => {
              removeFromHistory(video.id);
              closeMenu();
            }}
          />
        )}

        {/* Global Action: Download */}
        {context !== 'playlist_card' && (
          <ActionButton
            icon={<Download color={colors.text} size={22} />}
            label="Download video"
            onPress={() => {
              closeMenu();
              navigation.navigate('VideoDownloader', { videoId: video.id });
            }}
          />
        )}

        {/* Global Action: Share */}
        <ActionButton
          icon={<Share2 color={colors.text} size={22} />}
          label="Share"
          onPress={() => {
            closeMenu();
            shareVideo(video.id, video.title, video.isShort, context === 'playlist_card');
          }}
        />
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  actionsList: {
    flexDirection: 'column',
    paddingBottom: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    marginBottom: spacing.xs,
  },
});
