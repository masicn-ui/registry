import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, opacity as opacityTokens, radius, sizes, spacing, useTheme } from '@masicn/ui';

export interface ToggleButton {
  /** Button label */
  label: string;
  /** Button value/id */
  value: string;
  /** Optional icon (emoji or text) */
  icon?: string;
  /** Disabled state */
  disabled?: boolean;
}

interface ToggleButtonGroupProps {
  /** Buttons to display */
  buttons: ToggleButton[];
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onValueChange: (value: string) => void;
  /** Full width buttons */
  fullWidth?: boolean;
}

/**
 * Toggle Button Group component (iOS segmented control style)
 * Exclusive selection - only one button can be active at a time
 */
export function ToggleButtonGroup({
  buttons,
  value,
  onValueChange,
  fullWidth = false,
}: ToggleButtonGroupProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceSecondary }]}>
      {buttons.map((button, index) => {
        const isSelected = button.value === value;
        const isFirst = index === 0;
        const isLast = index === buttons.length - 1;

        return (
          <Pressable
            key={button.value}
            disabled={button.disabled}
            onPress={() => onValueChange(button.value)}
            style={({ pressed }) => [
              styles.button,
              fullWidth && styles.buttonFullWidth,
              isSelected && [
                styles.buttonSelected,
                { backgroundColor: theme.colors.surfacePrimary },
              ],
              isFirst && styles.buttonFirst,
              isLast && styles.buttonLast,
              pressed && !isSelected && { backgroundColor: theme.colors.ripple },
              button.disabled && { opacity: opacityTokens.disabled },
            ]}>
            {button.icon && (
              <Text
                variant="body"
                color={isSelected ? 'textPrimary' : 'textSecondary'}
                style={styles.icon}>
                {button.icon}
              </Text>
            )}
            <Text
              variant="button"
              color={isSelected ? 'textPrimary' : 'textSecondary'}>
              {button.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.xxs,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: sizes.touchTarget,
  },
  buttonFullWidth: {
    flex: 1,
  },
  buttonSelected: {
    borderRadius: radius.sm,
  },
  buttonFirst: {
    borderTopLeftRadius: radius.sm,
    borderBottomLeftRadius: radius.sm,
  },
  buttonLast: {
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
});
