import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from './AppText';

export interface AppConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export function AppConfirmModal({
  visible,
  title,
  message,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  onCancel,
  onConfirm,
  isDestructive = false,
}: AppConfirmModalProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors, isDestructive);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.dialog}>
          <AppText variant="title" style={styles.title}>{title}</AppText>
          <AppText style={styles.message}>{message}</AppText>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.button, styles.cancelButton]}>
              <AppText style={styles.cancelText}>{cancelText}</AppText>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.button, styles.confirmButton]}>
              <AppText style={styles.confirmText}>{confirmText}</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: any, isDestructive: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    elevation: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  title: {
    marginBottom: spacing.md,
    color: colors.text,
  },
  message: {
    color: colors.text,
    marginBottom: spacing.xl,
    lineHeight: 22,
    fontSize: typography.body,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  confirmButton: {
    backgroundColor: isDestructive ? colors.brand : colors.text,
  },
  cancelText: {
    fontWeight: '600',
    color: colors.text,
  },
  confirmText: {
    fontWeight: '600',
    color: isDestructive ? colors.white : colors.background,
  },
});
