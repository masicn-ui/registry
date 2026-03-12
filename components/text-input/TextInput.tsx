// File: components/text-input/TextInput.tsx

import React, { useState, useId } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Pressable,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { useTheme, spacing, radius, typography, borders, iconSizes, sizes } from '@masicn/ui';
import { Text } from '@/components/ui/Text';
import { Stack } from '@/components/ui/Stack';

type TextInputSize = 'sm' | 'md' | 'lg';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  size?: TextInputSize;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  clearButton?: boolean;
  accessibilityHint?: string;
}

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
