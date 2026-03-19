import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text, borders, radius, spacing, useTheme } from '@masicn/ui';
import { TextInput, type TextInputProps } from '@/components/ui/TextInput';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry' | 'endAdornment'> {}

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
