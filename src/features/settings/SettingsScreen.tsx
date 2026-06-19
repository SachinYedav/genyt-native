import { Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import {
  Moon,
  Sun,
  Monitor,
  ArrowLeft,
  PlayCircle,
  Scale,
  Handshake,
  Trash2,
  Search,
  BadgeInfo,
  Code,
  ChevronRight,
  ExternalLink,
  Database,
  HardDrive,
  DownloadCloud,
  UploadCloud,
} from 'lucide-react-native';
import { useState, useRef } from 'react';
import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomSheet } from '@/shared/ui/AppBottomSheet';
import { AppConfirmModal } from '@/shared/ui/AppConfirmModal';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/app/navigation/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useClearHistory } from '@/services/database/useLibraryQueries';
import { useSearchHistoryStore } from '@/features/search/store/useSearchHistoryStore';
import Constants from 'expo-constants';
import { useStorageSize } from '@/services/storage/useStorageSize';
import { exportData, importData } from '@/services/database/backupService';

type OptionSheetConfig = {
  visible: boolean;
  title: string;
  options: { label: string; value: string; description?: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const settings = useSettingsStore();
  const { mutate: clearWatchHistory } = useClearHistory();
  const clearSearchHistory = useSearchHistoryStore(state => state.clearSearches);

  const [sheetConfig, setSheetConfig] = useState<OptionSheetConfig>({
    visible: false,
    title: '',
    options: [],
    selectedValue: '',
    onSelect: () => { },
    onClose: () => { },
  });

  const [watchHistoryConfirmVisible, setWatchHistoryConfirmVisible] = useState(false);
  const [searchHistoryConfirmVisible, setSearchHistoryConfirmVisible] = useState(false);
  const { totalSize, isCalculating, clearCache } = useStorageSize();
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleExport = async () => {
    setBackupStatus('Exporting data...');
    const success = await exportData();
    setBackupStatus(success ? 'Data exported successfully!' : 'Failed to export data.');
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const handleImport = async () => {
    setBackupStatus('Importing data...');
    const result = await importData();
    setBackupStatus(result.message);
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const closeSheet = () => setSheetConfig(prev => ({ ...prev, visible: false }));

  const openAppearanceSheet = () => {
    setSheetConfig({
      visible: true,
      title: 'Appearance',
      options: [
        { label: 'Use device theme', value: 'system' },
        { label: 'Light theme', value: 'light' },
        { label: 'Dark theme', value: 'dark' },
      ],
      selectedValue: mode,
      onSelect: (val) => setMode(val as any),
      onClose: closeSheet,
    });
  };

  const confirmClearWatchHistory = () => {
    setWatchHistoryConfirmVisible(true);
  };

  const confirmClearSearchHistory = () => {
    setSearchHistoryConfirmVisible(true);
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={28} />
          </Pressable>
          <AppText variant="title">Settings</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* SECTION: General */}
        <SettingsSectionHeader title="General" />
        <SettingsRow
          icon={mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor}
          title="Appearance"
          subtitle={mode === 'system' ? 'Device theme' : mode === 'dark' ? 'Dark theme' : 'Light theme'}
          onPress={openAppearanceSheet}
        />

        <View style={styles.divider} />

        {/* SECTION: Playback */}
        <SettingsSectionHeader title="Playback" />
        <SettingsRow
          icon={PlayCircle}
          title="Autoplay"
          subtitle="Play next video automatically"
          rightElement={
            <Switch
              value={settings.autoplay}
              onValueChange={settings.setAutoplay}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor={colors.white}
            />
          }
        />
        <View style={styles.divider} />

        {/* SECTION: History & Privacy */}
        <SettingsSectionHeader title="History & privacy" />
        <SettingsRow
          icon={Database}
          title="Pause watch history"
          subtitle="Videos you watch won't show in your history"
          rightElement={
            <Switch
              value={settings.pauseHistory}
              onValueChange={settings.setPauseHistory}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor={colors.white}
            />
          }
        />
        <SettingsRow
          icon={Trash2}
          title="Clear watch history"
          onPress={confirmClearWatchHistory}
        />
        <SettingsRow
          icon={Search}
          title="Clear search history"
          onPress={confirmClearSearchHistory}
        />

        <View style={styles.divider} />

        {/* SECTION: Data & Storage */}
        <SettingsSectionHeader title="Data & storage" />
        <SettingsRow
          icon={HardDrive}
          title="Storage usage"
          subtitle={isCalculating ? 'Calculating...' : `${totalSize} used by GenYT`}
          rightElement={<AppText variant="caption" style={{ color: colors.brand, fontWeight: '600' }}>Clear Cache</AppText>}
          onPress={async () => {
            const success = await clearCache();
            setBackupStatus(success ? 'Cache cleared successfully!' : 'Failed to clear cache.');
            setTimeout(() => setBackupStatus(null), 3000);
          }}
        />
        <SettingsRow
          icon={UploadCloud}
          title="Export data backup"
          subtitle="Save your history and playlists to a file"
          onPress={handleExport}
        />
        <SettingsRow
          icon={DownloadCloud}
          title="Import data backup"
          subtitle="Restore your history and playlists from a file"
          onPress={handleImport}
        />
        {backupStatus && (
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
            <AppText variant="caption" style={{ textAlign: 'center', color: backupStatus.includes('Failed') || backupStatus.includes('Corrupted') ? colors.brand : colors.success }}>
              {backupStatus}
            </AppText>
          </View>
        )}

        <View style={styles.divider} />

        {/* SECTION: About */}
        <SettingsSectionHeader title="About" />
        <SettingsRow
          icon={BadgeInfo}
          title="Version"
          subtitle={`${Constants.expoConfig?.version ?? '1.0.0'} (Local First Architecture)`}
        />
        <SettingsRow
          icon={Code}
          title="Open Source"
          subtitle="View project on GitHub"
          rightElement={<ExternalLink color={colors.textMuted} size={18} />}
          onPress={() => Linking.openURL('https://github.com/SachinYedav/genyt-native')}
        />

        <SettingsRow
          icon={Scale}
          title="Open source licenses"
          subtitle="View packages used in this app"
          onPress={() => navigation.navigate('Licenses')}
        />
        <SettingsRow
          icon={Handshake}
          title="Terms & Privacy Policy"
          onPress={() => navigation.navigate('TermsPrivacy')}
        />

      </ScrollView>

      {/* Shared Option Sheet */}
      <AppBottomSheet
        visible={sheetConfig.visible}
        onClose={sheetConfig.onClose}
      >
        <View style={styles.sheetContent}>
          <AppText variant="subtitle" style={styles.sheetTitle}>{sheetConfig.title}</AppText>
          {sheetConfig.options.map((opt) => {
            const isActive = sheetConfig.selectedValue === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.sheetRow, isActive && styles.sheetRowActive]}
                onPress={() => {
                  sheetConfig.onSelect(opt.value);
                  sheetConfig.onClose();
                }}
              >
                <View style={styles.radioOuter}>
                  {isActive && <View style={styles.radioInner} />}
                </View>
                <View style={styles.sheetRowCopy}>
                  <AppText>{opt.label}</AppText>
                  {opt.description && (
                    <AppText muted variant="caption">{opt.description}</AppText>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </AppBottomSheet>

      <AppConfirmModal
        visible={watchHistoryConfirmVisible}
        title="Clear watch history?"
        message="Your watch history will be cleared from this app."
        cancelText="Cancel"
        confirmText="Clear watch history"
        isDestructive
        onCancel={() => setWatchHistoryConfirmVisible(false)}
        onConfirm={() => {
          clearWatchHistory();
          setWatchHistoryConfirmVisible(false);
        }}
      />

      <AppConfirmModal
        visible={searchHistoryConfirmVisible}
        title="Clear search history?"
        message="Your search history will be cleared from this app."
        cancelText="Cancel"
        confirmText="Clear search history"
        isDestructive
        onCancel={() => setSearchHistoryConfirmVisible(false)}
        onConfirm={() => {
          clearSearchHistory();
          setSearchHistoryConfirmVisible(false);
        }}
      />
    </Screen>
  );
}

function SettingsSectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, paddingTop: spacing.md }}>
      <AppText variant="subtitle" style={{ color: colors.textMuted, fontSize: typography.captionLg, fontWeight: '600' }}>
        {title.toUpperCase()}
      </AppText>
    </View>
  );
}

type SettingsRowProps = {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
};

function SettingsRow({ icon: Icon, title, subtitle, onPress, rightElement }: SettingsRowProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const content = (
    <View style={styles.row}>
      <Icon color={colors.text} size={22} style={styles.rowIcon} />
      <View style={styles.rowCopy}>
        <AppText>{title}</AppText>
        {subtitle && (
          <AppText muted variant="caption">{subtitle}</AppText>
        )}
      </View>
      {rightElement || (onPress && <ChevronRight color={colors.textMuted} size={20} />)}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const getStyles = (colors: any) => StyleSheet.create({
  header: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  row: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  rowIcon: {
    width: 24,
    textAlign: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  sheetContent: {
    paddingBottom: spacing.lg,
  },
  sheetTitle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.subtitle,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sheetRowActive: {
    backgroundColor: colors.surfaceMuted,
  },
  sheetRowCopy: {
    flex: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
});
