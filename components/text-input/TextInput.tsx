import React, { useState, useId } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Pressable,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { Stack, Text, borders, iconSizes, radius, sizes, spacing, typography, useTheme } from '../../../masicn';

type TextInputSize = 'sm' | 'md' | 'lg';

interface TextInputProps extends RNTextInputProps {
  /** Floating label rendered above the input field. */
  label?: string;
  /** Descriptive text shown below the input when there is no error. */
  helperText?: string;
  /** Validation error message. When set, the border and label turn red and the message replaces `helperText`. */
  error?: string;
  /** When true, the input is non-editable and rendered with a disabled background. Defaults to false. */
  disabled?: boolean;
  /** Size preset controlling minimum height and padding — 'sm', 'md', or 'lg'. Defaults to 'md'. */
  size?: TextInputSize;
  /** Node rendered to the left of the text field, useful for search icons or currency symbols. */
  startAdornment?: React.ReactNode;
  /** Node rendered to the right of the text field, useful for password-reveal toggles or suffix icons. */
  endAdornment?: React.ReactNode;
  /** When true, a clear (×) button appears inside the field whenever it has a value. Defaults to false. */
  clearButton?: boolean;
  /** Additional accessibility hint passed to the native input. Falls back to the `error` string when in an error state. */
  accessibilityHint?: string;
}

/**
 * TextInput — a styled, accessible single-line (or multi-line) text field.
 *
 * Wraps React Native's `TextInput` with a label, helper text, error state,
 * character counter (when `maxLength` is set), optional start/end adornments,
 * and an inline clear button. Border and label colour respond to focus and
 * error states automatically.
 *
 * @example
 * // Basic labelled input
 * <TextInput
 *   label="Email"
 *   placeholder="you@example.com"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 *
 * @example
 * // Input with error and clear button
 * <TextInput
 *   label="Username"
 *   value={username}
 *   onChangeText={setUsername}
 *   error={usernameError}
 *   clearButton
 * />
 *
 * @example
 * // Input with icons and character limit
 * <TextInput
 *   label="Bio"
 *   startAdornment={<Icon name="user" />}
 *   maxLength={160}
 *   multiline
 *   value={bio}
 *   onChangeText={setBio}
 * />
 */
const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  function TextInput(
    {
      label,
      helperText,
      error,
      disabled = false,
      size = 'md',
      startAdornment,
      endAdornment,
      clearButton = false,
      style,
      accessibilityLabel,
      accessibilityHint,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [focused, setFocused] = useState(false);
    const hasError = !!error;
    const inputId = useId();

    const borderColor = hasError
      ? theme.colors.error
      : focused
        ? theme.colors.borderFocused
        : theme.colors.inputBorder;

    const labelColor = hasError
      ? theme.colors.error
      : focused
        ? theme.colors.borderFocused
        : theme.colors.textPrimary;

    const currentValue = typeof rest.value === 'string' ? rest.value : '';
    const showClear = clearButton && currentValue.length > 0 && !disabled;

    const charCount = rest.maxLength !== undefined
      ? `${currentValue.length} / ${rest.maxLength}`
      : null;

    const bottomRow = hasError || helperText || charCount;

    return (
      <Stack gap="xs">
        {label && (
          <Text variant="label" nativeID={`${inputId}-label`} style={{ color: labelColor }}>
            {label}
          </Text>
        )}
        <View
          style={[
            styles.container,
            sizeStyles[size],
            {
              backgroundColor: disabled ? theme.colors.disabled : theme.colors.inputBackground,
              borderColor,
            },
          ]}>
          {startAdornment && <View style={styles.adornment}>{startAdornment}</View>}
          <RNTextInput
            ref={ref}
            editable={!disabled}
            placeholderTextColor={theme.colors.inputPlaceholder}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={error ? error : accessibilityHint}
            accessibilityState={{ disabled }}
            accessibilityLabelledBy={label ? `${inputId}-label` : undefined}
            onFocus={e => { setFocused(true); rest.onFocus?.(e); }}
            onBlur={e => { setFocused(false); rest.onBlur?.(e); }}
            style={[
              typography.body,
              styles.input,
              { color: disabled ? theme.colors.textDisabled : theme.colors.textPrimary },
              style,
            ]}
            {...rest}
          />
          {showClear && (
            <Pressable
              onPress={() => rest.onChangeText?.('')}
              hitSlop={spacing.xs}
              accessibilityRole="button"
              accessibilityLabel="Clear text"
              style={styles.adornment}>
              <Text variant="caption" style={{ color: theme.colors.textSecondary, fontSize: iconSizes.action }}>
                ×
              </Text>
            </Pressable>
          )}
          {endAdornment && <View style={styles.adornment}>{endAdornment}</View>}
        </View>
        {bottomRow && (
          <View style={styles.bottomRow}>
            <Text
              variant="caption"
              color={hasError ? 'error' : 'textTertiary'}
              style={styles.helperText}
              accessibilityLiveRegion={hasError ? 'polite' : undefined}>
              {error || helperText || ''}
            </Text>
            {charCount && <Text variant="caption" color="textTertiary">{charCount}</Text>}
          </View>
        )}
      </Stack>
    );
  },
);

TextInput.displayName = 'TextInput';

export { TextInput };
export type { TextInputProps, TextInputSize };

const sizeStyles = StyleSheet.create({
  sm: { minHeight: sizes.inputSm, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  md: { minHeight: sizes.inputMd, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  lg: { minHeight: sizes.inputLg, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: borders.medium,
  },
  input: { flex: 1 },
  adornment: { justifyContent: 'center', marginHorizontal: spacing.xs },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helperText: { flex: 1 },
});
