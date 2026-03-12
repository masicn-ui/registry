// File: blocks/confirm-dialog/ConfirmDialog.tsx


import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, spacing, radius, rgba } from '@masicn/ui';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

export interface ConfirmDialogProps {
  /** Controls visibility */
  visible: boolean;
  /** Called when the dialog is dismissed */
  onClose: () => void;
  /** Dialog heading */
  title: string;
  /** Explanatory message */
  message: string;
  /** Confirm button label (default "Confirm") */
  confirmLabel?: string;
  /** Cancel button label (default "Cancel") */
  cancelLabel?: string;
  /** Called when the confirm button is pressed */
  onConfirm: () => void;
  /** Called when cancel is pressed (falls back to onClose) */
  onCancel?: () => void;
  /**
   * Visual mode:
   * - `'standard'`    — primary confirm button, ghost cancel (default)
   * - `'destructive'` — red warning banner, destructive confirm, outlined cancel
   */
  destructive?: boolean;
  /** Disable the confirm button (e.g. while a request is in-flight) */
  loading?: boolean;
}

/**
 * ConfirmDialog — opinionated Modal variant with title + message + confirm/cancel actions.
 *
 * Use `destructive` to trigger the danger visual mode — red accent banner,
 * error-coloured title, and a prominent outlined cancel button.
 *
 * @example
 * // Standard
 * <ConfirmDialog
 *   visible={visible}
 *   onClose={onClose}
 *   title="Save changes?"
 *   message="Your edits will be saved."
 *   onConfirm={handleSave}
 * />
 *
 * @example
 * // Destructive
 * <ConfirmDialog
 *   visible={visible}
 *   onClose={onClose}
 *   title="Delete account"
 *   message="This action is permanent and cannot be undone."
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   destructive
 * />
 */
export function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const { theme } = useTheme();

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      accessibilityLabel={title}
      showCloseButton={false}
      maxWidth="narrow">

      {/* Destructive-mode warning banner */}
      {destructive && (
        <View
          style={[
            styles.warningBanner,
            {
              backgroundColor: rgba(theme.colors.error, 0.1),
              borderLeftColor: theme.colors.error,
            },
          ]}>
          <Text variant="label" style={{ color: theme.colors.error }}>
            This action cannot be undone
          </Text>
        </View>
      )}

      <Text
        variant="titleSmall"
        style={{ color: destructive ? theme.colors.error : theme.colors.textPrimary }}>
        {title}
      </Text>

      <Text
        variant="body"
        style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>

      <View style={styles.actions}>
        <Button
          variant={destructive ? 'outline' : 'ghost'}
          onPress={handleCancel}
          containerStyle={styles.action}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'primary'}
          loading={loading}
          onPress={onConfirm}
          containerStyle={styles.action}>
          {confirmLabel}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  warningBanner: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  message: {
    marginTop: spacing.xxs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  action: {
    flexShrink: 1,
  },
});
