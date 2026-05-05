import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { Stack, Text, borders, spacing, useTheme } from '../../../masicn';
import { BottomSheet } from '../../components';

/**
 * Represents a single tappable row inside an ActionSheet.
 */
export interface ActionSheetOption {
  /** Display text for the option row. */
  label: string;
  /** Icon node — pass any React element (icon component, emoji in Text, etc.) */
  icon?: React.ReactNode;
  /** When true, renders the label in error/red colour to signal a dangerous action. */
  destructive?: boolean;
  /** Prevents the option from being pressed; renders it dimmed. */
  disabled?: boolean;
  /** Called when the user taps this option. The sheet is automatically closed after this fires. */
  onPress: () => void;
}

interface ActionSheetProps {
  /** Controls whether the sheet is visible. */
  visible: boolean;
  /** Called when the sheet should close (backdrop tap, cancel press, or after an option fires). */
  onClose: () => void;
  /** Optional heading shown above the options list. */
  title?: string;
  /** Optional descriptive message shown below the title. */
  message?: string;
  /** Ordered list of action rows rendered in the sheet. */
  options: ActionSheetOption[];
  /** Whether to show the cancel button at the bottom (default true). */
  showCancel?: boolean;
  /** Label for the cancel button (default "Cancel"). */
  cancelLabel?: string;
  /** Additional style forwarded to the underlying `BottomSheet` container. */
  style?: ViewStyle;
  /** Test identifier; options receive `{testID}-option-{index}`, cancel receives `{testID}-cancel`. */
  testID?: string;
}

/**
 * ActionSheet — an iOS-style bottom sheet presenting a list of contextual actions.
 *
 * Built on top of `BottomSheet`. Each option can carry an icon, be marked
 * destructive (renders in error colour), or disabled (dimmed, unresponsive).
 * Tapping a non-disabled option fires its `onPress` callback and then
 * automatically dismisses the sheet via `onClose`.
 *
 * An optional cancel button is rendered below the options, separated by a
 * hairline border, and always calls `onClose` when pressed.
 *
 * @example
 * <ActionSheet
 *   visible={sheetVisible}
 *   onClose={() => setSheetVisible(false)}
 *   title="Choose an action"
 *   options={[
 *     { label: 'Edit',   icon: <EditIcon />, onPress: handleEdit },
 *     { label: 'Share',  icon: <ShareIcon />, onPress: handleShare },
 *     { label: 'Delete', destructive: true,  onPress: handleDelete },
 *   ]}
 * />
 *
 * @example
 * // No cancel button — when a header provides a cancel affordance instead
 * <ActionSheet
 *   visible={visible}
 *   onClose={onClose}
 *   showCancel={false}
 *   options={[
 *     { label: 'Save draft', onPress: saveDraft },
 *     { label: 'Discard changes', destructive: true, onPress: discard },
 *   ]}
 * />
 *
 * @example
 * // With title and message for additional context
 * <ActionSheet
 *   visible={visible}
 *   onClose={onClose}
 *   title="Move to folder"
 *   message="Select the destination folder for this file."
 *   options={folders.map(f => ({ label: f.name, onPress: () => moveFile(f.id) }))}
 * />
 *
 * @example
 * // With a disabled option
 * <ActionSheet
 *   visible={visible}
 *   onClose={onClose}
 *   options={[
 *     { label: 'Download', onPress: download },
 *     { label: 'Print', onPress: print, disabled: !isPrintSupported },
 *     { label: 'Remove', destructive: true, onPress: remove },
 *   ]}
 * />
 */
export const ActionSheet = React.memo(function ActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  showCancel = true,
  cancelLabel = 'Cancel',
  style,
  testID,
}: ActionSheetProps) {
  const { theme } = useTheme();

  const handleOptionPress = useCallback(
    (option: ActionSheetOption) => {
      if (!option.disabled) {
        option.onPress();
        onClose();
      }
    },
    [onClose],
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} style={style}>
      {(title || message) && (
        <Stack gap="md" style={styles.header}>
          {title && (
            <Text variant="h3" color="textPrimary" align="center">
              {title}
            </Text>
          )}
          {message && (
            <Text variant="bodySmall" color="textSecondary" align="center">
              {message}
            </Text>
          )}
        </Stack>
      )}

      {/* Negative margin breaks out of BottomSheet's content padding for full-width options */}
      <View style={styles.optionsWrapper}>
        {options.map((option, index) => (
          <Pressable
            key={index}
            onPress={() => handleOptionPress(option)}
            disabled={option.disabled}
            testID={testID ? `${testID}-option-${index}` : undefined}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!option.disabled }}
            accessibilityLabel={option.label}
            hitSlop={spacing.sm}
            style={({ pressed }) => [
              styles.option,
              pressed &&
                !option.disabled && { backgroundColor: theme.colors.highlight },
            ]}
          >
            {option.icon && (
              <View style={styles.optionIcon}>{option.icon}</View>
            )}
            <Text
              variant="bodyLarge"
              color={
                option.disabled
                  ? 'textDisabled'
                  : option.destructive
                  ? 'error'
                  : 'textPrimary'
              }
              style={styles.optionLabel}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {showCancel && (
        <Pressable
          onPress={onClose}
          testID={testID ? `${testID}-cancel` : undefined}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          hitSlop={spacing.sm}
          style={[
            styles.cancelButton,
            { borderTopColor: theme.colors.borderSecondary },
          ]}
        >
          <Text variant="bodyLarge" color="primary" bold>
            {cancelLabel}
          </Text>
        </Pressable>
      )}
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.md,
  },
  optionsWrapper: {
    marginHorizontal: spacing.negLg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: spacing.xxxl,
  },
  optionIcon: {
    width: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    textAlign: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: borders.thin,
    // BottomSheet's content padding provides spacing.lg inset on each side — no marginHorizontal needed
  },
});
