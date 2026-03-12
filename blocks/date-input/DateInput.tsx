// File: blocks/date-input/DateInput.tsx


import React, { useState, useEffect, useRef } from 'react';
import {
  TextInput as RNTextInput,
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme, spacing, radius, borders, typography } from '@masicn/ui';
import { Text } from '@/components/ui/Text';
import { Stack } from '@/components/ui/Stack';

export interface DateInputProps {
  /** ISO date string value (YYYY-MM-DD) */
  value?: string;
  /** Called with ISO date string when a valid date is fully typed */
  onValueChange?: (value: string) => void;
  /** Label above the field */
  label?: string;
  /** Placeholder shown when the field is empty */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text shown below the field */
  helperText?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Outer container style */
  containerStyle?: ViewStyle;
  /** Stable selector for tests */
  testID?: string;
}

/**
 * Date input with keyboard-driven DD/MM/YYYY masking.
 * Automatically inserts slashes as the user types and calls `onValueChange`
 * with an ISO `YYYY-MM-DD` string once a valid date is entered.
 *
 * @example
 * <DateInput
 *   label="Date of birth"
 *   value={date}
 *   onValueChange={setDate}
 * />
 */
export function DateInput({
  value,
  onValueChange,
  label,
  placeholder = 'DD/MM/YYYY',
  error,
  helperText,
  disabled = false,
  containerStyle,
  testID,
}: DateInputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  // Formats an ISO string (YYYY-MM-DD) into display format (DD/MM/YYYY)
  const isoToDisplay = (iso: string): string => {
    const parts = iso.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return `${dd}/${mm}/${yyyy}`;
    }
    return '';
  };

  const [displayValue, setDisplayValue] = useState(() =>
    value ? isoToDisplay(value) : '',
  );

  // Sync display from external value changes (resets, controlled form)
  const lastSyncedRef = useRef(value ?? '');
  useEffect(() => {
    const incoming = value ?? '';
    if (incoming !== lastSyncedRef.current) {
      lastSyncedRef.current = incoming;
      setDisplayValue(incoming ? isoToDisplay(incoming) : '');
    }
  }, [value]);

  // Auto-inserts slashes: digits only → DD/MM/YYYY
  const formatAsDate = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 2) { return digits; }
    if (digits.length <= 4) { return `${digits.slice(0, 2)}/${digits.slice(2)}`; }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const handleChangeText = (text: string) => {
    const formatted = formatAsDate(text);
    setDisplayValue(formatted);

    if (formatted.length === 10) {
      const [dd, mm, yyyy] = formatted.split('/');
      const day = parseInt(dd, 10);
      const month = parseInt(mm, 10);
      const year = parseInt(yyyy, 10);
      const iso = `${yyyy}-${mm}-${dd}`;
      const date = new Date(iso);
      const isValidRange = month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1000;
      // getTime() and toISOString() cross-checks for invalid combos like Feb 30
      const isRealDate =
        isValidRange &&
        !isNaN(date.getTime()) &&
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day;

      if (isRealDate) {
        lastSyncedRef.current = iso;
        onValueChange?.(iso);
      }
    }
  };

  const hasError = !!error;

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

  return (
    <Stack gap="xs" style={containerStyle}>
      {label && (
        <Text variant="label" style={{ color: labelColor }}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.container,
          focused && styles.focused,
          {
            backgroundColor: disabled
              ? theme.colors.disabled
              : theme.colors.inputBackground,
            borderColor,
          },
        ]}>
        <RNTextInput
          testID={testID}
          value={displayValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.inputPlaceholder}
          keyboardType="numeric"
          maxLength={10}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label ?? 'Date input'}
          accessibilityValue={{ text: displayValue || placeholder }}
          accessibilityState={{ disabled }}
          style={[
            typography.body,
            styles.input,
            { color: disabled ? theme.colors.textDisabled : theme.colors.textPrimary },
          ]}
        />
        <Text
          variant="caption"
          style={[
            styles.formatHint,
            { color: displayValue ? theme.colors.textTertiary : theme.colors.inputPlaceholder },
          ]}>
          📅
        </Text>
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
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: borders.thin,
    gap: spacing.sm,
  },
  focused: {
    borderWidth: borders.medium,
  },
  input: {
    flex: 1,
  },
  formatHint: {
    flexShrink: 0,
  },
});
