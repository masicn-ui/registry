import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, borders, opacity as opacityTokens, radius, spacing, useTheme } from '../../../masicn';

export interface ToggleButton {
  /** Button label */
  label: string;
  /** Unique value identifying this button */
  value: string;
  /**
   * Optional icon rendered before the label.
   * Pass a React element — selection state is already shown via border and background colour.
   */
  icon?: React.ReactNode;
  /** Prevents this button from being pressed */
  disabled?: boolean;
}

type SingleProps = {
  /** Exclusive single-select mode (default). `value` is a single string. */
  multi?: false;
  value: string;
  onValueChange: (value: string) => void;
};

type MultiProps = {
  /** Multi-select mode — any number of buttons can be active simultaneously. */
  multi: true;
  value: string[];
  onValueChange: (value: string[]) => void;
};

type ToggleGroupProps = {
  /** Buttons to render */
  buttons: ToggleButton[];
  /** Stretch buttons to fill the container width evenly */
  fullWidth?: boolean;
  /** Test identifier for automated testing */
  testID?: string;
} & (SingleProps | MultiProps);

/**
 * ToggleGroup — a connected row of toggleable buttons that form a single visual unit.
 *
 * Unlike Segment (which always has exactly one selection),
 * ToggleGroup supports both exclusive single-select (`multi=false`, the
 * default) and multi-select (`multi=true`) modes. Buttons share a common border
 * and are separated by thin dividers, giving them a grouped toolbar appearance.
 *
 * Icons are passed as plain React elements — pass icon color based on selection
 * state from the parent for best results.
 *
 * @example
 * // Single-select: text alignment
 * <ToggleGroup
 *   buttons={[
 *     { label: 'Left', value: 'left' },
 *     { label: 'Center', value: 'center' },
 *     { label: 'Right', value: 'right' },
 *   ]}
 *   value={align}
 *   onValueChange={setAlign}
 * />
 *
 * @example
 * // Multi-select: text formatting
 * <ToggleGroup
 *   multi
 *   buttons={[
 *     { label: 'Bold', value: 'bold' },
 *     { label: 'Italic', value: 'italic' },
 *     { label: 'Underline', value: 'underline' },
 *   ]}
 *   value={formats}
 *   onValueChange={setFormats}
 * />
 */
export function ToggleGroup({
  buttons,
  fullWidth = false,
  testID,
  ...rest
}: ToggleGroupProps) {
  const { theme } = useTheme();

  const isSelected = (buttonValue: string): boolean => {
    if (rest.multi) {
      return (rest.value as string[]).includes(buttonValue);
    }
    return (rest.value as string) === buttonValue;
  };

  const handlePress = (buttonValue: string) => {
    if (rest.multi) {
      const current = rest.value as string[];
      const next = current.includes(buttonValue)
        ? current.filter(v => v !== buttonValue)
        : [...current, buttonValue];
      (rest.onValueChange as (v: string[]) => void)(next);
    } else {
      (rest.onValueChange as (v: string) => void)(buttonValue);
    }
  };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        {
          borderColor: theme.colors.borderPrimary,
          borderRadius: radius.md,
        },
      ]}>
      {buttons.map((button, index) => {
        const selected = isSelected(button.value);
        const isLast = index === buttons.length - 1;

        return (
          <Pressable
            key={button.value}
            disabled={button.disabled}
            onPress={() => handlePress(button.value)}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: !!button.disabled }}
            accessibilityLabel={button.label}
            style={({ pressed }) => [
              styles.button,
              fullWidth && styles.buttonFull,
              !isLast && {
                borderRightWidth: borders.thin,
                borderRightColor: theme.colors.borderPrimary,
              },
              { backgroundColor: selected ? theme.colors.primaryContainer : 'transparent' },
              pressed && !selected && { opacity: opacityTokens.subtle },
              button.disabled && { opacity: opacityTokens.disabled },
            ]}
          >
            {button.icon && (
              <View style={styles.icon}>
                {button.icon}
              </View>
            )}
            <Text
              variant="label"
              style={{
                color: selected
                  ? theme.colors.primary
                  : button.disabled
                    ? theme.colors.textDisabled
                    : theme.colors.textSecondary,
              }}
            >
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
    borderWidth: borders.thin,
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  buttonFull: {
    flex: 1,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
