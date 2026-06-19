import { FlashList } from '@shopify/flash-list';
import { Download, FileAudio, FileImage, FileVideo, Pause, Play, Trash2, CheckCircle2, PlayCircle, MoreVertical, X, Settings2, FolderTree } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system';
import { useDownloadStore, type DownloadTask } from '@/store/useDownloadStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { cancelDownload, pauseDownload, resumeDownload } from '@/services/downloads/downloadService';
import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { AppConfirmModal } from '@/shared/ui/AppConfirmModal';
import { AppBottomSheet } from '@/shared/ui/AppBottomSheet';

type FilterType = 'all' | 'video' | 'audio' | 'thumbnail';

export function DownloadsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const tasks = useDownloadStore((state) => state.tasks);
  const clearCompleted = useDownloadStore((state) => state.clearCompleted);
  const settings = useSettingsStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showClearModal, setShowClearModal] = useState(false);
  const [taskToCancel, setTaskToCancel] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const [sheetConfig, setSheetConfig] = useState({
    visible: false,
    title: '',
    options: [] as any[],
    selectedValue: '',
    onSelect: (v: string) => { },
    onClose: () => setSheetConfig(prev => ({ ...prev, visible: false })),
  });

  const openPlayerConfig = () => {
    setSheetConfig({
      visible: true,
      title: 'Default Video Player',
      options: [
        { label: 'System Default', value: '' },
        { label: 'VLC Media Player', value: 'org.videolan.vlc' },
        { label: 'MX Player', value: 'com.mxtech.videoplayer.ad' },
      ],
      selectedValue: settings.defaultPlayerPackage || '',
      onSelect: (val) => settings.setDefaultPlayerPackage(val || undefined),
      onClose: () => setSheetConfig(prev => ({ ...prev, visible: false })),
    });
  };

  const openStorageConfig = async () => {
    try {
      const directory = await FileSystem.Directory.pickDirectoryAsync();
      if (directory) {
        settings.setDownloadSavePath(directory.uri);
      }
    } catch (e) {
      // User cancelled the picker or it failed, safely ignore without crashing
      console.log('Storage picker cancelled or failed:', e);
    }
  };

  // Filter and sort tasks — newest first within each status group
  const taskList = useMemo(() => {
    let filtered = Object.values(tasks);
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.format.category === filter);
    }
    // Reverse so newest additions come first, then stable-sort by status weight
    return filtered.reverse().sort((a, b) => {
      const weight = (status: string) => {
        if (status === 'downloading') return 3;
        if (status === 'pending' || status === 'paused') return 2;
        if (status === 'error') return 1;
        return 0; // completed
      };
      return weight(b.status) - weight(a.status);
    });
  }, [tasks, filter]);

  const completedCount = useMemo(() => Object.values(tasks).filter(t => t.status === 'completed').length, [tasks]);

  const handleClearCompleted = () => {
    if (completedCount === 0) return;
    setShowClearModal(true);
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText variant="title">Downloads</AppText>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerChip} onPress={openPlayerConfig}>
            <Settings2 color={colors.textMuted} size={16} />
            <AppText style={styles.headerChipText}>Player</AppText>
          </Pressable>
          <Pressable style={styles.headerChip} onPress={openStorageConfig}>
            <FolderTree color={colors.textMuted} size={16} />
            <AppText style={styles.headerChipText}>Storage</AppText>
          </Pressable>
          {completedCount > 0 && (
            <Pressable style={styles.clearButton} onPress={handleClearCompleted}>
              <Trash2 color={colors.textMuted} size={20} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'video', 'audio', 'thumbnail'] as FilterType[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <AppText style={filter === f ? styles.filterTextActive : styles.filterText}>
              {f === 'all' ? 'All' : f === 'video' ? 'Videos' : f === 'audio' ? 'Audio' : 'Images'}
            </AppText>
          </Pressable>
        ))}
      </View>

      <FlashList
        data={taskList}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        // @ts-ignore
        estimatedItemSize={110}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <DownloadRow
            task={item}
            onCancelClick={() => setTaskToCancel(item.id)}
            onDeleteClick={() => setTaskToDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Download color={colors.textMuted} size={42} style={{ marginBottom: spacing.md }} />
            <AppText muted>No downloads found.</AppText>
          </View>
        }
      />

      <AppConfirmModal
        visible={showClearModal}
        title="Clear Completed"
        message="Are you sure you want to remove completed downloads from this list? The files will remain on your device."
        cancelText="Cancel"
        confirmText="Clear"
        isDestructive
        onCancel={() => setShowClearModal(false)}
        onConfirm={() => {
          clearCompleted();
          setShowClearModal(false);
        }}
      />

      <AppConfirmModal
        visible={!!taskToCancel}
        title="Cancel Download"
        message="Are you sure you want to cancel and delete this download?"
        cancelText="No"
        confirmText="Yes"
        isDestructive
        onCancel={() => setTaskToCancel(null)}
        onConfirm={() => {
          if (taskToCancel) cancelDownload(taskToCancel);
          setTaskToCancel(null);
        }}
      />

      <AppConfirmModal
        visible={!!taskToDelete}
        title="Delete Download"
        message="Are you sure you want to delete this downloaded file?"
        cancelText="No"
        confirmText="Yes"
        isDestructive
        onCancel={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            useDownloadStore.getState().removeTask(taskToDelete);
          }
          setTaskToDelete(null);
        }}
      />

      <AppBottomSheet visible={sheetConfig.visible} onClose={sheetConfig.onClose}>
        <View style={{ paddingBottom: spacing.lg }}>
          <AppText variant="subtitle" style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: typography.subtitle }}>{sheetConfig.title}</AppText>
          {sheetConfig.options.map((opt) => {
            const isActive = sheetConfig.selectedValue === opt.value;
            return (
              <Pressable key={opt.value} style={[styles.sheetRow, isActive && { backgroundColor: colors.surfaceMuted }]} onPress={() => { sheetConfig.onSelect(opt.value); sheetConfig.onClose(); }}>
                <View style={[styles.radioOuter, { borderColor: colors.textMuted }]}>{isActive && <View style={[styles.radioInner, { backgroundColor: colors.brand }]} />}</View>
                <AppText style={{ flex: 1 }}>{opt.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </AppBottomSheet>
    </Screen>
  );
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function DownloadRow({ task, onCancelClick, onDeleteClick }: { task: DownloadTask; onCancelClick: () => void; onDeleteClick: () => void }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const isDownloading = task.status === 'downloading';
  const isPaused = task.status === 'paused';
  const isCompleted = task.status === 'completed';
  const isError = task.status === 'error';
  const settings = useSettingsStore();

  const progressPercent = Math.max(0, Math.min(100, Math.round(task.progress * 100)));
  const sizeText = task.bytesExpected ? formatBytes(task.bytesExpected) : 'Unknown size';

  const handlePlay = async () => {
    if (task.localUri) {
      try {
        const file = new FileSystem.File(task.localUri);
        let mimeType = '*/*';
        const ext = task.localUri.split('.').pop()?.toLowerCase();
        if (task.format.category === 'video') mimeType = ext === 'webm' ? 'video/webm' : 'video/mp4';
        else if (task.format.category === 'audio') mimeType = (ext === 'm4a' || ext === 'aac') ? 'audio/mp4' : 'audio/mpeg';
        else if (task.format.category === 'thumbnail') mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        const intentParams: IntentLauncher.IntentLauncherParams = {
          data: file.contentUri,
          flags: 1,
          type: mimeType,
        };
        if (settings.defaultPlayerPackage && task.format.category === 'video') {
          intentParams.packageName = settings.defaultPlayerPackage;
        }
        try {
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', intentParams);
        } catch (intentErr) {
          if (intentParams.packageName) {
            delete intentParams.packageName;
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', intentParams);
          } else {
            throw intentErr;
          }
        }
      } catch (err) {
        try {
          await Sharing.shareAsync(task.localUri, { dialogTitle: 'Open File' });
        } catch (shareErr) {
          Alert.alert('Error', 'Could not open the file. No compatible app found.');
        }
      }
    }
  };

  return (
    <Pressable style={styles.rowContainer} onPress={isCompleted ? handlePlay : undefined}>
      <View style={styles.thumbnailContainer}>
        {task.thumbnailUrl ? (
          <Image source={{ uri: task.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            {task.format.category === 'video' ? <FileVideo color={colors.textMuted} size={24} /> : <FileAudio color={colors.textMuted} size={24} />}
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <AppText numberOfLines={2} style={styles.title}>{task.videoTitle}</AppText>
        <AppText muted variant="caption" numberOfLines={1}>
          {task.format.qualityLabel} • {sizeText}
          {isCompleted ? ' • Downloaded' : ''}
          {isError ? ' • Failed' : ''}
        </AppText>

        {!isCompleted && !isError && (
          <View style={styles.progressWrapper}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <AppText variant="caption" muted style={{ minWidth: 35 }}>{progressPercent}%</AppText>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {isDownloading && (
          <Pressable style={styles.actionButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={() => pauseDownload(task.id)}>
            <Pause color={colors.text} size={24} />
          </Pressable>
        )}
        {isPaused && (
          <Pressable style={styles.actionButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={() => resumeDownload(task.id)}>
            <Play color={colors.text} size={24} />
          </Pressable>
        )}
        {isCompleted ? (
          <Pressable style={styles.actionButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={onDeleteClick}>
            <X color={colors.textMuted} size={24} />
          </Pressable>
        ) : (
          <Pressable style={styles.actionButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={onCancelClick}>
            <X color={colors.textMuted} size={24} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  headerChipText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  clearButton: {
    padding: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: colors.text,
  },
  filterText: {
    color: colors.text,
    fontSize: typography.bodySm,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.background,
    fontSize: typography.bodySm,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  rowContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceMuted,
  },
  thumbnailContainer: {
    width: 120,
    height: 68,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    marginRight: spacing.md,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.bodySm,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.text,
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.sm,
    gap: spacing.md,
  },
  actionButton: {
    padding: 4,
  },
  empty: {
    paddingTop: 100,
    alignItems: 'center',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
