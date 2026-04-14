import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Text, borders, motion, opacity as opacityTokens, radius, sizes, spacing, useReducedMotion, useTheme } from '../../../masicn';

type OTPVariant = 'box' | 'underline';
type OTPSize = 'sm' | 'md' | 'lg';

export interface CodeInputProps {
  /** Number of digits. Defaults to 6. */
  length?: number;
  /** Current OTP value — controlled; digits only. */
  value: string;
  /** Called with the updated digit string on every keystroke. */
  onChangeText: (otp: string) => void;
  /** Called once when the OTP reaches `length`. Resets when a digit is deleted. */
  onComplete?: (otp: string) => void;
  /** Error message — activates error-coloured borders. */
  error?: string;
  /** Success state — activates success-coloured borders. */
  success?: boolean;
  /** Disabled state. */
  disabled?: boolean;
  /** Visual style: 'box' shows full borders, 'underline' shows bottom border only. Defaults to 'box'. */
  variant?: OTPVariant;
  /** Size preset controlling box height. Defaults to 'md'. */
  size?: OTPSize;
  /** Accessibility label for the hidden TextInput. Defaults to "One-time password". */
  accessibilityLabel?: string;
  /** Additional style applied to the outermost container View. */
  containerStyle?: ViewStyle;
  /** Test identifier forwarded to the hidden TextInput. */
  testID?: string;
}

const sizeHeights: Record<OTPSize, number> = {
  sm: sizes.otpBoxHeight * 0.75,
  md: sizes.otpBoxHeight,
  lg: sizes.otpBoxHeight * 1.25,
};

const sizeTextVariants: Record<OTPSize, 'h4' | 'h3' | 'h2'> = {
  sm: 'h4',
  md: 'h3',
  lg: 'h2',
};

/**
 * CodeInput — one-time password entry with individual digit boxes.
 *
 * Uses a single hidden `TextInput` as the true focus target for smooth native
 * typing (paste, auto-fill, backspace all work). Visual boxes are decorative,
 * showing a blinking cursor in the active empty box.
 *
 * Supports two visual variants: `'box'` (fully bordered) and `'underline'`
 * (bottom border only — a common modern style).
 *
 * @example
 * <CodeInput
 *   length={6}
 *   value={otp}
 *   onChangeText={setOtp}
 *   onComplete={(code) => verifyCode(code)}
 *   error={otpError}
 * />
 */
export function CodeInput({
  length = 6,
  value,
  onChangeText,
  onComplete,
  error,
  success = false,
  disabled = false,
  variant = 'box',
  size = 'md',
  accessibilityLabel = 'One-time password',
  containerStyle,
  testID,
}: CodeInputProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const completedRef = useRef(false);

  // Cursor blink animation
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    if (focusedIndex !== null && !reducedMotion) {
      cursorOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: motion.duration.slower }),
          withTiming(1, { duration: motion.duration.micro }),
        ),
        -1,
        false,
      );
    } else {
      cursorOpacity.value = 0;
    }
  }, [focusedIndex, reducedMotion, cursorOpacity]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

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

  const handleTextChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(cleaned);
    setFocusedIndex(cleaned.length < length ? cleaned.length : length - 1);
  }, [length, onChangeText]);

  const handleBoxPress = useCallback(() => {
    if (!disabled) { inputRef.current?.focus(); }
  }, [disabled]);

  const handleFocus = useCallback(() => {
    setFocusedIndex(sanitizedValue.length < length ? sanitizedValue.length : length - 1);
  }, [sanitizedValue.length, length]);

  const handleBlur = useCallback(() => {
    setFocusedIndex(null);
  }, []);

  const boxHeight = sizeHeights[size];
  const textVariant = sizeTextVariants[size];

  const getBorderColor = (index: number) => {
    if (error) { return theme.colors.error; }
    if (success) { return theme.colors.success; }
    if (focusedIndex === index) { return theme.colors.borderFocused; }
    if (sanitizedValue.length > index) { return theme.colors.borderPrimary; }
    return theme.colors.borderSecondary;
  };

  return (
    <View style={containerStyle}>
      <Pressable onPress={handleBoxPress} style={styles.container} accessibilityRole="none" testID={testID ? `${testID}-container` : undefined}>
        {/* Hidden TextInput for smooth native input */}
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
          caretHidden
          accessibilityLabel={accessibilityLabel}
          testID={testID}
        />

        {digits.map((digit, index) => {
          const isFocused = focusedIndex === index;
          const isEmpty = digit === ' ';
          const borderColor = getBorderColor(index);
          const showCursor = isFocused && isEmpty;

          return (
            <View
              key={index}
              style={[
                variant === 'box' ? styles.box : styles.underline,
                { height: boxHeight },
                variant === 'box' && {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor,
                  borderWidth: isFocused ? borders.medium : borders.thin,
                },
                variant === 'underline' && {
                  borderBottomColor: borderColor,
                  borderBottomWidth: isFocused ? borders.medium : borders.thin,
                },
                disabled && styles.disabled,
              ]}>
              {showCursor ? (
                <Animated.View
                  style={[
                    styles.cursor,
                    { backgroundColor: theme.colors.primary, height: boxHeight * 0.55 },
                    cursorStyle,
                  ]}
                />
              ) : (
                <Text
                  variant={textVariant}
                  style={{ color: error ? theme.colors.error : success ? theme.colors.success : theme.colors.textPrimary }}>
                  {isEmpty ? '' : digit}
                </Text>
              )}
            </View>
          );
        })}
      </Pressable>

      {error && (
        <Text variant="caption" color="error" style={styles.message}>
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
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  underline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cursor: {
    width: 2,
    borderRadius: 1,
  },
  disabled: {
    opacity: opacityTokens.disabled,
  },
  message: {
    marginTop: spacing.xs,
  },
});
