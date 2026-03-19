import React from 'react';
import { Pressable, View, StyleSheet, type PressableProps } from 'react-native';
import { Text, opacity as opacityTokens, spacing, useTheme } from '../../../masicn'

interface ListItemProps extends Omit<PressableProps, 'children'> {
  /** Primary label displayed in the main body of the row. */
  title: string;
  /** Optional secondary description rendered below the title in a smaller, tertiary style. */
  subtitle?: string;
  /** Leading slot — typically an icon, avatar, or thumbnail rendered before the text block. */
  leading?: React.ReactNode;
  /**
   * Trailing slot — rendered after the text block.
   * Commonly used for a chevron, badge, switch, or status indicator.
   * If omitted, a default disclosure chevron ('›') is rendered.
   */
  trailing?: React.ReactNode;
  /** When true, a hairline separator is drawn below the row. Defaults to false. */
  separator?: boolean;
}

/**
 * ListItem — a single-row list cell with leading, content, and trailing slots.
 *
 * Suitable for navigation lists, settings screens, or any collection of tappable rows.
 * The row dims to `opacityTokens.pressed` while being pressed. When `leading` is
 * provided and `separator` is true, the separator is inset to align with the text
 * block (iOS-style inset separator). If no `trailing` is provided, a disclosure
 * arrow is shown automatically.
 *
 * All `PressableProps` (e.g. `onPress`, `disabled`, `accessibilityLabel`) are
 * forwarded to the underlying `Pressable`.
 *
 * @example
 * <ListItem
 *   title="Profile"
 *   subtitle="Edit your personal information"
 *   leading={<Avatar source={avatarUri} />}
 *   onPress={() => navigation.navigate('Profile')}
 *   separator
 * />
 *
 * // Custom trailing element
 * <ListItem
 *   title="Notifications"
 *   trailing={<Switch value={enabled} onValueChange={setEnabled} />}
 * />
 */
export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  separator = false,
  style,
  ...rest
}: ListItemProps) {
  const { theme } = useTheme();

  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          pressed && { opacity: opacityTokens.pressed },
          typeof style === 'function' ? style({ pressed }) : style,
        ]}
        {...rest}>
        {leading && <View style={styles.leading}>{leading}</View>}
        <View style={styles.content}>
          <Text variant="body">{title}</Text>
          {subtitle && <Text variant="caption" color="textTertiary">{subtitle}</Text>}
        </View>
        {trailing ?? (
          <Text variant="body" color="iconSecondary">
            ›
          </Text>
        )}
      </Pressable>
      {separator && (
        <View
          style={[
            styles.separator,
            { backgroundColor: theme.colors.separator },
            leading ? styles.separatorInset : undefined,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  separatorInset: {
    marginLeft: spacing.lg + spacing.xxl + spacing.md,
  },
});
