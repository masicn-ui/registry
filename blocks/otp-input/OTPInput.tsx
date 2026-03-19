import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Text, borders, opacity as opacityTokens, radius, sizes, spacing, typography, useTheme } from '../../../masicn';

interface OTPInputProps {
  /** Number of digits (default: 6) */
  length?: number;
  /** Current OTP value */
  value: string;
  /** Callback when OTP changes */
  onChangeText: (otp: string) => void;
  /** Callback when OTP is complete */
  onComplete?: (otp: string) => void;
  /** Error state */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * OTP Input component for one-time password entry
 * Uses a hidden input for smooth typing experience
 */
export function OTPInput({
  length = 6,
  value,
  onChangeText,
  onComplete,
  error,
  disabled = false,
}: OTPInputProps) {
  const { theme } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const completedRef = useRef(false);

  // Ensure value is properly formatted
  const sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, length);
  const digits = sanitizedValue.padEnd(length, ' ').split('');

  useEffect(() => {
    if (sanitizedValue.length === length && onComplete && !completedRef.current) {
      completedRef.current = true;
      onComplete(sanitizedValue);
    } else if (sanitizedValue.length < length) {
      completedRef.current = false;
    }
  }, [sanitizedValue, length, onComplete]);

  const handleTextChange = (text: string) => {
    // Only allow digits
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(cleaned);
    setFocusedIndex(cleaned.length < length ? cleaned.length : length - 1);
  };

  const handleBoxPress = (index: number) => {
    if (!disabled) {
      inputRef.current?.focus();
      setFocusedIndex(index);
    }
  };

  const handleFocus = () => {
    setFocusedIndex(sanitizedValue.length < length ? sanitizedValue.length : length - 1);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  return (
    <View>
      <View style={styles.container}>
        {/* Hidden TextInput for smooth typing */}
        <TextInput
          ref={inputRef}
          value={sanitizedValue}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={length}
          keyboardType="number-pad"
          editable={!disabled}
          style={styles.hiddenInput}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
        />

        {/* Visual display boxes */}
        {digits.map((digit, index) => (
          <Pressable
            key={index}
            onPress={() => handleBoxPress(index)}
            style={[
              styles.box,
              {
                backgroundColor: theme.colors.surfacePrimary,
                borderColor: error
                  ? theme.colors.error
                  : focusedIndex === index
                    ? theme.colors.borderFocused
                    : theme.colors.borderPrimary,
              },
              focusedIndex === index && styles.boxFocused,
              error && styles.boxError,
              disabled && styles.boxDisabled,
            ]}>
            <Text
              variant="h2"
              style={[
                styles.digit,
                { color: theme.colors.textPrimary },
                digit === ' ' && styles.digitEmpty,
              ]}>
              {digit === ' ' ? '' : digit}
            </Text>
          </Pressable>
        ))}
      </View>
      {error && (
        <Text variant="caption" color="error" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  box: {
    flex: 1,
    height: sizes.otpBoxHeight,
    borderRadius: radius.md,
    borderWidth: borders.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderWidth: borders.medium,
  },
  boxError: {
    borderWidth: borders.medium,
  },
  boxDisabled: {
    opacity: opacityTokens.disabled,
  },
  digit: {
    fontFamily: typography.h2.fontFamily,
  },
  digitEmpty: {
    opacity: 0,
  },
  error: {
    marginTop: spacing.xs,
  },
});
