import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, borders, radius, rgba, spacing, useTheme } from '../../../masicn';
import { Button, Modal } from '../../components';

export interface ConfirmProps {
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
 * Confirm — opinionated Modal variant with title + message + confirm/cancel actions.
 *
 * Use `destructive` to trigger the danger visual mode — red accent banner,
 * error-coloured title, and a prominent outlined cancel button.
 *
 * In standard mode the confirm button uses the `primary` variant and the cancel
 * button uses `ghost`. In destructive mode the layout flips: cancel gets `outline`
 * so it reads as the "safe" escape, and confirm uses `destructive` to clearly
 * communicate the severity.
 *
 * Pressing cancel calls `onCancel` (if provided) and then `onClose`. Pressing
 * confirm calls `onConfirm` only — the caller is responsible for closing the
 * dialog afterwards (or keeping it open while `loading` is true).
 *
 * @example
 * // Standard
 * <Confirm
 *   visible={visible}
 *   onClose={onClose}
 *   title="Save changes?"
 *   message="Your edits will be saved."
 *   onConfirm={handleSave}
 * />
 *
 * @example
 * // Destructive
 * <Confirm
 *   visible={visible}
 *   onClose={onClose}
 *   title="Delete account"
 *   message="This action is permanent and cannot be undone."
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   destructive
 * />
 */
export function Confirm({
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
}: ConfirmProps) {
  const { theme } = useTheme();

  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose();
  }, [onCancel, onClose]);

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
    borderLeftWidth: borders.thick,
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
