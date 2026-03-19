import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text, borders, radius, spacing, useTheme } from '../../../masicn'
import { TextInput, type TextInputProps } from '../text-input/TextInput';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry' | 'endAdornment'> { }

/**
 * PasswordInput — a secure text input with a toggleable show/hide button.
 *
 * Extends the base `TextInput` component, pre-configuring `secureTextEntry`,
 * `autoCapitalize="none"`, and `autoCorrect={false}` for password fields.
 * A "Show" / "Hide" button is injected as the `endAdornment`; tapping it
 * toggles the `secureTextEntry` state so users can verify what they typed.
 *
 * All other `TextInput` props (e.g. `label`, `error`, `onChangeText`,
 * `placeholder`) are forwarded as-is.
 *
 * The component is implemented with `React.forwardRef` so a `ref` can be
 * attached to the underlying input for programmatic focus management.
 *
 * @example
 * <PasswordInput
 *   label="Password"
 *   value={password}
 *   onChangeText={setPassword}
 *   placeholder="Enter your password"
 *   error={!!errors.password}
 *   errorMessage={errors.password}
 * />
 */
export const PasswordInput = React.forwardRef<any, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const { theme } = useTheme();
    const [visible, setVisible] = useState(false);

    return (
      <TextInput
        ref={ref}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        endAdornment={
          <Pressable
            onPress={() => setVisible(v => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={spacing.sm}
            style={[styles.toggle, { borderColor: theme.colors.inputBorder }]}>
            <Text variant="label" style={{ color: theme.colors.primary }}>
              {visible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        }
        {...props}
      />
    );
  },
);

 PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  toggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    borderWidth: borders.thin,
  },
});
