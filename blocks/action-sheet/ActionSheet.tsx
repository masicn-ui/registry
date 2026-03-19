import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, borders, spacing, useTheme } from '../../../masicn';
import { BottomSheet } from '../../components';

export interface ActionSheetOption {
  label: string;
  /** Icon node — pass any React element (icon component, emoji in Text, etc.) */
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  showCancel?: boolean;
  cancelLabel?: string;
}

export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  showCancel = true,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const { theme } = useTheme();

  const handleOptionPress = (option: ActionSheetOption) => {
    if (!option.disabled) {
      option.onPress();
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {(title || message) && (
        <View style={styles.header}>
          {title && (
            <Text variant="h3" color="textPrimary" align="center">
              {title}
            </Text>
          )}
          {message && (
            <Text variant="bodySmall" color="textSecondary" align="center" style={styles.message}>
              {message}
            </Text>
          )}
        </View>
      )}

      {/* Negative margin breaks out of BottomSheet's content padding for full-width options */}
      <View style={styles.optionsWrapper}>
        {options.map((option, index) => (
          <Pressable
            key={index}
            onPress={() => handleOptionPress(option)}
            disabled={option.disabled}
            style={({ pressed }) => [
              styles.option,
              pressed && !option.disabled && { backgroundColor: theme.colors.highlight },
            ]}
          >
            {option.icon && (
              <View style={styles.optionIcon}>
                {option.icon}
              </View>
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
          style={[styles.cancelButton, { borderTopColor: theme.colors.borderSecondary }]}
        >
          <Text variant="bodyLarge" color="primary" bold>
            {cancelLabel}
          </Text>
        </Pressable>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  message: {
    marginTop: spacing.xs,
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
