// File: components/link/Link.tsx

import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { Text, opacity as opacityTokens, spacing, useTheme } from '@masicn/ui';

type LinkSize = 'sm' | 'md' | 'lg';

interface LinkProps extends Omit<PressableProps, 'children'> {
  /** Link text */
  children: string;
  /** Size preset */
  size?: LinkSize;
  /** Underline style */
  underline?: 'none' | 'hover' | 'always';
  /** Custom color override */
  color?: string;
}

/**
 * Pressable text link component with hover states
 * Used for navigation and external links
 */
export function Link({
  children,
  size = 'md',
  underline = 'hover',
  color,
  disabled = false,
  ...rest
}: LinkProps) {
  const { theme } = useTheme();

  const linkColor = disabled
    ? theme.colors.textDisabled
    : color || theme.colors.primary;

  const textVariant = {
    sm: 'caption' as const,
    md: 'body' as const,
    lg: 'bodyLarge' as const,
  };

  return (
    <Pressable disabled={disabled} {...rest}>
      {({ pressed }) => (
        <Text
          variant={textVariant[size]}
          style={[
            styles.link,
            { color: linkColor },
            underline === 'always' && styles.underline,
            underline === 'hover' && pressed && styles.underline,
            pressed && styles.pressed,
          ]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    paddingVertical: spacing.xxs,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: opacityTokens.subtle,
  },
});
