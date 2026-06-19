import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { CheckCircle2, Circle, ArrowLeft, ChevronRight, Gauge, MonitorPlay } from 'lucide-react-native';
import { useTheme, spacing, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { AppBottomSheet } from '@/shared/ui/AppBottomSheet';

export interface QualityOption {
  id: string;
  qualityLabel: string;
  sizeLabel?: string;
}

export const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

interface PlayerSettingsSheetProps {
  visible: boolean;
  qualities: QualityOption[];
  currentQualityId: string;
  currentSpeed: PlaybackSpeed;
  onSelectQuality: (id: string) => void;
  onSelectSpeed: (speed: PlaybackSpeed) => void;
  onClose: () => void;
}

type SheetPage = 'main' | 'quality' | 'speed';

export function PlayerSettingsSheet({
  visible,
  qualities,
  currentQualityId,
  currentSpeed,
  onSelectQuality,
  onSelectSpeed,
  onClose,
}: PlayerSettingsSheetProps) {
  const [page, setPage] = useState<SheetPage>('main');
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      setPage('main');
    }
  }, [visible]);

  const currentQuality = qualities.find(q => q.id === currentQualityId);
  const speedLabel = currentSpeed === 1 ? 'Normal' : `${currentSpeed}x`;

  const MAX_SHEET_HEIGHT = height * 0.75;

  const renderHeader = () => {
    if (page === 'quality') {
      return (
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={() => setPage('main')}>
            <ArrowLeft color={colors.text} size={24} />
          </Pressable>
          <AppText variant="subtitle" style={styles.headerTitle}>
            Quality
          </AppText>
        </View>
      );
    }
    if (page === 'speed') {
      return (
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={() => setPage('main')}>
            <ArrowLeft color={colors.text} size={24} />
          </Pressable>
          <AppText variant="subtitle" style={styles.headerTitle}>
            Playback speed
          </AppText>
        </View>
      );
    }
    return null;
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      scrollable={true}
      maxDynamicContentSize={MAX_SHEET_HEIGHT}
      headerComponent={renderHeader()}
    >
      <View style={styles.sheetContent}>
        {page === 'main' && (
          <View>
            <AppText variant="subtitle" style={styles.sheetTitle}>
              Settings
            </AppText>
            <View style={styles.menuList}>
              <Pressable style={styles.menuRow} onPress={() => setPage('quality')}>
                <MonitorPlay color={colors.textMuted} size={22} />
                <View style={styles.menuRowCenter}>
                  <AppText style={styles.menuLabel}>Quality</AppText>
                  <AppText muted variant="caption">
                    {currentQuality?.qualityLabel ?? 'Auto'}
                  </AppText>
                </View>
                <ChevronRight color={colors.textMuted} size={20} />
              </Pressable>

              <Pressable style={styles.menuRow} onPress={() => setPage('speed')}>
                <Gauge color={colors.textMuted} size={22} />
                <View style={styles.menuRowCenter}>
                  <AppText style={styles.menuLabel}>Playback speed</AppText>
                  <AppText muted variant="caption">
                    {speedLabel}
                  </AppText>
                </View>
                <ChevronRight color={colors.textMuted} size={20} />
              </Pressable>
            </View>
          </View>
        )}

        {page === 'quality' && (
          <View style={styles.optionsList}>
            {qualities.map((q) => {
              const isActive = q.id === currentQualityId;
              return (
                <Pressable
                  key={q.id}
                  style={[styles.sheetRow, isActive && styles.sheetRowActive]}
                  onPress={() => {
                    onSelectQuality(q.id);
                    onClose();
                  }}
                >
                  <View style={styles.radioOuter}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.sheetRowCopy}>
                    <AppText style={[styles.radioLabel, isActive && styles.radioLabelActive]}>
                      {q.qualityLabel}
                    </AppText>
                    {q.sizeLabel ? (
                      <AppText muted variant="caption">
                        {q.sizeLabel}
                      </AppText>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {page === 'speed' && (
          <View style={styles.optionsList}>
            {SPEED_OPTIONS.map((speed) => {
              const isActive = speed === currentSpeed;
              const label = speed === 1 ? 'Normal' : `${speed}x`;
              return (
                <Pressable
                  key={speed}
                  style={[styles.sheetRow, isActive && styles.sheetRowActive]}
                  onPress={() => {
                    onSelectSpeed(speed);
                    onClose();
                  }}
                >
                  <View style={styles.radioOuter}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.sheetRowCopy}>
                    <AppText style={[styles.radioLabel, isActive && styles.radioLabelActive]}>
                      {label}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </AppBottomSheet>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  sheetContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  menuList: {
    gap: spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  menuRowCenter: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuLabel: {
    fontSize: typography.bodyLg,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  optionsList: {
    gap: 0,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginVertical: 2,
  },
  sheetRowActive: {
    backgroundColor: colors.surfaceMuted,
  },
  sheetRowCopy: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    marginLeft: spacing.md,
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
  radioLabel: {
    fontSize: typography.bodyLg,
    color: colors.text,
  },
  radioLabelActive: {
    fontWeight: '600',
  },
});
