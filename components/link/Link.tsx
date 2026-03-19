import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { Text, opacity as opacityTokens, spacing, useTheme } from '../../../masicn'

type LinkSize = 'sm' | 'md' | 'lg';

interface LinkProps extends Omit<PressableProps, 'children'> {
  /** Link text */
  children: string;
  /**
   * Size preset that maps to a text variant.
   * - `'sm'` → caption
   * - `'md'` → body (default)
   * - `'lg'` → bodyLarge
   */
  size?: LinkSize;
  /**
   * Controls when the underline decoration is applied.
   * - `'none'` — never underlined
   * - `'hover'` — underlined only while the element is pressed (default)
   * - `'always'` — always underlined
   */
  underline?: 'none' | 'hover' | 'always';
  /** Override the link text color. Defaults to the theme's primary color. */
  color?: string;
}

/**
 * Link — a pressable inline text element styled as a hyperlink.
 *
 * Renders the children string using the theme's primary color (or a custom
 * `color` override). Supports three underline modes and three size presets.
 * When `disabled`, the text switches to `textDisabled` and the press handler
 * is suppressed. A subtle opacity is applied while the element is pressed.
 *
 * All additional `PressableProps` (e.g. `onPress`, `accessibilityLabel`) are
 * forwarded to the underlying `Pressable`.
 *
 * @example
 * <Link onPress={() => Linking.openURL('https://example.com')} size="md">
 *   Visit our website
 * </Link>
 *
 * // Always-underlined, large variant
 * <Link size="lg" underline="always" onPress={handleTermsPress}>
 *   Terms & Conditions
 * </Link>
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
