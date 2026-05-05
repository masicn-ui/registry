import React, { useState } from 'react';
import { Pressable, TextInput as RNTextInput } from 'react-native';
import {
  EyeIcon,
  EyeOffIcon,
  iconSizes,
  spacing,
  useTheme,
} from '../../../masicn';
import { TextInput, type TextInputProps } from '../text-input/TextInput';

interface SecureInputProps
  extends Omit<TextInputProps, 'secureTextEntry' | 'endAdornment'> {
  /** Whether to render the show/hide toggle. Defaults to true. Hidden automatically when disabled. */
  showToggle?: boolean;
}

/**
 * SecureInput — a secure text input with a toggleable eye-icon visibility button.
 *
 * Extends the base `TextInput` component, pre-configuring `secureTextEntry`,
 * `autoCapitalize="none"`, and `autoCorrect={false}` for password fields.
 * An eye icon is injected as the `endAdornment`; tapping it toggles the
 * `secureTextEntry` state so users can verify what they typed.
 *
 * All other `TextInput` props (e.g. `label`, `error`, `onChangeText`,
 * `placeholder`) are forwarded as-is.
 *
 * The component is implemented with `React.forwardRef` so a `ref` can be
 * attached to the underlying input for programmatic focus management.
 *
 * @example
 * <SecureInput
 *   label="Password"
 *   value={password}
 *   onChangeText={setPassword}
 *   placeholder="Enter your password"
 *   error={!!errors.password}
 *   errorMessage={errors.password}
 * />
 *
 * @example
 * // Confirm password field without the toggle (parity with first field)
 * <SecureInput
 *   label="Confirm password"
 *   value={confirmPassword}
 *   onChangeText={setConfirmPassword}
 *   showToggle={false}
 * />
 *
 * @example
 * // Disabled field for read-only credential display
 * <SecureInput
 *   label="API Secret"
 *   value={apiSecret}
 *   onChangeText={() => {}}
 *   disabled
 * />
 *
 * @example
 * // With helper text and ref for programmatic focus
 * const passwordRef = useRef<RNTextInput>(null);
 * <SecureInput
 *   ref={passwordRef}
 *   label="New password"
 *   value={newPassword}
 *   onChangeText={setNewPassword}
 *   helperText="At least 8 characters including a number"
 * />
 */
export const SecureInput = React.forwardRef<RNTextInput, SecureInputProps>(
  function SecureInput({ showToggle = true, disabled, ...props }, ref) {
    const { theme } = useTheme();
    const [visible, setVisible] = useState(false);

    const toggle =
      showToggle && !disabled ? (
        <Pressable
          onPress={() => setVisible(v => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          hitSlop={spacing.sm}
          testID="password-toggle"
        >
          {visible ? (
            <EyeOffIcon
              size={iconSizes.action}
              color={theme.colors.textSecondary}
            />
          ) : (
            <EyeIcon
              size={iconSizes.action}
              color={theme.colors.textSecondary}
            />
          )}
        </Pressable>
      ) : undefined;

    return (
      <TextInput
        ref={ref}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        disabled={disabled}
        endAdornment={toggle}
        {...props}
      />
    );
  },
);

SecureInput.displayName = 'SecureInput';
