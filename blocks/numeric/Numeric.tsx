import React, { useState, forwardRef, useCallback } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Stack, Text, borders, layout, opacity as opacityTokens, radius, spacing, typography, useTheme } from '../../../masicn';

export interface NumericProps {
  /** Current numeric value */
  value: number;
  /** Called whenever the value changes */
  onValueChange: (value: number) => void;
  /** Minimum allowed value (default `-Infinity`) */
  min?: number;
  /** Maximum allowed value (default `Infinity`) */
  max?: number;
  /** Amount added or subtracted on each button press (default `1`) */
  step?: number;
  /** Field label shown above */
  label?: string;
  /** Helper text shown below */
  helperText?: string;
  /** Error message — activates error border and label colour */
  error?: string;
  /** Disable all interaction */
  disabled?: boolean;
  /** Outer container style */
  containerStyle?: ViewStyle;
  /** Stable selector for tests */
  testID?: string;
}

/**
 * Numeric — a numeric stepper with two bordered increment/decrement buttons
 * flanking a centred, directly-editable text input.
 *
 * The `−` and `+` buttons are automatically disabled when the value is at `min`
 * or `max` respectively, and the step buttons call `onValueChange` with the
 * clamped next value. Direct keyboard entry is supported — the raw text is kept
 * in local state while the user is typing to avoid jumpy cursor behaviour. On
 * blur the displayed text snaps to the actual clamped value.
 *
 * Both the stepper row and the text input meet WCAG 2.1 touch-target size (48px).
 *
 * @example
 * <Numeric
 *   label="Quantity"
 *   value={qty}
 *   onValueChange={setQty}
 *   min={1}
 *   max={99}
 *   step={1}
 * />
 */
export const Numeric = forwardRef<RNTextInput, NumericProps>(function Numeric({
  value,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  label,
  helperText,
  error,
  disabled = false,
  containerStyle,
  testID,
}, ref) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  // Keep a local text string while the user is typing to avoid jumpy behaviour
  const [localText, setLocalText] = useState(String(value));

  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  const decrement = useCallback(() => {
    const next = clampValue(value - step, min, max);
    setLocalText(String(next));
    onValueChange(next);
  }, [value, step, min, max, onValueChange]);

  const increment = useCallback(() => {
    const next = clampValue(value + step, min, max);
    setLocalText(String(next));
    onValueChange(next);
  }, [value, step, min, max, onValueChange]);

  const handleChangeText = useCallback((text: string) => {
    setLocalText(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      onValueChange(clampValue(parsed, min, max));
    }
  }, [min, max, onValueChange]);

  // Commit on blur — re-sync to the actual clamped value
  const handleBlur = useCallback(() => {
    setFocused(false);
    setLocalText(String(value));
  }, [value]);

  const hasError = !!error;

  const borderColor = hasError
    ? theme.colors.error
    : focused
      ? theme.colors.borderFocused
      : theme.colors.inputBorder;

  const activeButtonBg = theme.colors.surfaceSecondary;
  const disabledButtonBg = theme.colors.disabled;

  return (
    <Stack gap="xs" style={containerStyle}>
      {label && (
        <Text
          variant="label"
          style={{
            color: hasError
              ? theme.colors.error
              : focused
                ? theme.colors.borderFocused
                : theme.colors.textPrimary,
          }}>
          {label}
        </Text>
      )}

      <View style={styles.row} accessibilityRole="spinbutton" accessibilityValue={{ min, max, now: value, text: String(value) }}>
        {/* Decrement button */}
        <Pressable
          onPress={decrement}
          disabled={!canDecrement}
          accessibilityRole="button"
          accessibilityLabel="Decrease value"
          accessibilityState={{ disabled: !canDecrement }}
          style={[
            styles.stepButton,
            canDecrement ? styles.stepButtonActive : styles.stepButtonDimmed,
            {
              borderColor: theme.colors.inputBorder,
              backgroundColor: canDecrement ? activeButtonBg : disabledButtonBg,
            },
          ]}>
          <Text variant="h3" style={{ color: canDecrement ? theme.colors.textPrimary : theme.colors.textDisabled }}>
            −
          </Text>
        </Pressable>

        {/* Value input */}
        <View
          style={[
            styles.inputContainer,
            focused && styles.inputContainerFocused,
            {
              borderColor,
              backgroundColor: disabled ? theme.colors.disabled : theme.colors.inputBackground,
            },
          ]}>
          <RNTextInput
            ref={ref}
            testID={testID}
            value={localText}
            onChangeText={handleChangeText}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            keyboardType="numeric"
            editable={!disabled}
            selectTextOnFocus
            textAlign="center"
            accessibilityLabel={label ?? 'Number input'}
            accessibilityState={{ disabled }}
            style={[
              typography.body,
              styles.input,
              { color: disabled ? theme.colors.textDisabled : theme.colors.textPrimary },
            ]}
          />
        </View>

        {/* Increment button */}
        <Pressable
          onPress={increment}
          disabled={!canIncrement}
          accessibilityRole="button"
          accessibilityLabel="Increase value"
          accessibilityState={{ disabled: !canIncrement }}
          style={[
            styles.stepButton,
            canIncrement ? styles.stepButtonActive : styles.stepButtonDimmed,
            {
              borderColor: theme.colors.inputBorder,
              backgroundColor: canIncrement ? activeButtonBg : disabledButtonBg,
            },
          ]}>
          <Text variant="h3" style={{ color: canIncrement ? theme.colors.textPrimary : theme.colors.textDisabled }}>
            +
          </Text>
        </Pressable>
      </View>

      {(hasError || helperText) && (
        <Text
          variant="caption"
          color={hasError ? 'error' : 'textTertiary'}
          accessibilityLiveRegion={hasError ? 'polite' : undefined}>
          {error || helperText}
        </Text>
      )}
    </Stack>
  );
});

function clampValue(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

const STEP_BUTTON_SIZE = layout.comfortableTouchTarget; // 48px — meets WCAG touch target

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepButton: {
    width: STEP_BUTTON_SIZE,
    height: STEP_BUTTON_SIZE,
    borderRadius: radius.md,
    borderWidth: borders.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonActive: {
    opacity: 1,
  },
  stepButtonDimmed: {
    opacity: opacityTokens.disabled,
  },
  inputContainer: {
    flex: 1,
    height: STEP_BUTTON_SIZE,
    borderRadius: radius.md,
    borderWidth: borders.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderWidth: borders.medium,
  },
  input: {
    width: '100%',
    textAlign: 'center',
  },
});
