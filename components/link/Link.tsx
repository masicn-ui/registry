import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Linking,
  type PressableProps,
} from 'react-native';
import {
  Text,
  opacity as opacityTokens,
  spacing,
  useTheme,
} from '../../../masicn';

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
   * - `'hover'` — underlined only while the element is pressed
   * - `'always'` — always underlined (default, clearest affordance on mobile)
   */
  underline?: 'none' | 'hover' | 'always';
  /** Override the link text color. Defaults to the theme's primary color. */
  color?: string;
  /** Optional icon character/emoji appended after the text (e.g. `'→'`, `'↗'`). */
  icon?: string;
  /** Renders the link text in bold. */
  bold?: boolean;
  /**
   * URL to open when pressed. Calls `Linking.openURL(href)` automatically.
   * Combined with `onPress` if both are provided — `onPress` fires first.
   */
  href?: string;
  /**
   * Convenience prop for external links. Automatically sets `icon="↗"` and
   * `underline="always"`. Typically used together with `href`.
   */
  external?: boolean;
}

/**
 * Link — a pressable inline text element styled as a hyperlink.
 *
 * Renders the children string using the theme's primary color (or a custom
 * `color` override). Supports three underline modes and three size presets.
 * When `disabled`, the text switches to `textDisabled` and the press handler
 * is suppressed. A subtle opacity is applied while the element is pressed.
 *
 * Pass `href` to open a URL automatically via `Linking.openURL`. Use the
 * `external` convenience prop for links that leave the app — it adds the ↗
 * icon and `underline="always"` automatically.
 *
 * On mobile `underline='always'` is the default since hover states don't exist.
 *
 * @example
 * <Link onPress={() => navigation.navigate('Details')} icon="→">
 *   View details
 * </Link>
 *
 * // External link via href
 * <Link href="https://example.com" external>Visit our website</Link>
 *
 * // No underline variant
 * <Link underline="none" bold onPress={handleTermsPress}>
 *   Terms & Conditions
 * </Link>
 *
 * @example
 * // Small caption-size link in a form footer
 * <Link size="sm" onPress={openForgotPassword}>Forgot password?</Link>
 *
 * @example
 * // Hover-only underline for a dense list of links
 * <Link underline="hover" onPress={() => openUser(user.id)}>
 *   {user.name}
 * </Link>
 *
 * @example
 * // Custom colour for a link inside a dark card
 * <Link color={theme.colors.onPrimary} href="https://docs.example.com" external>
 *   Read the docs
 * </Link>
 */
export const Link = React.memo(function Link({
  children,
  size = 'md',
  underline = 'always',
  color,
  disabled = false,
  icon,
  bold,
  href,
  external = false,
  onPress,
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

  const resolvedIcon = external ? '↗' : icon;
  const resolvedUnderline = external ? 'always' : underline;

  const handlePress = React.useCallback(
    (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      onPress?.(e);
      if (href) {
        Linking.openURL(href);
      }
    },
    [onPress, href],
  );

  return (
    <Pressable disabled={disabled} onPress={handlePress} {...rest}>
      {({ pressed }) => (
        <View style={styles.row}>
          <Text
            variant={textVariant[size]}
            bold={bold}
            style={[
              styles.link,
              { color: linkColor },
              resolvedUnderline === 'always' && styles.underline,
              resolvedUnderline === 'hover' && pressed && styles.underline,
              pressed && styles.pressed,
            ]}
          >
            {children}
          </Text>
          {resolvedIcon && (
            <Text
              variant={textVariant[size]}
              bold={bold}
              style={[
                styles.icon,
                { color: linkColor },
                pressed && styles.pressed,
              ]}
            >
              {resolvedIcon}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  link: {
    paddingVertical: spacing.xs,
  },
  icon: {
    paddingVertical: spacing.xs,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: opacityTokens.subtle,
  },
});
