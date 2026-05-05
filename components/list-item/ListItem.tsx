import React from 'react';
import { Pressable, View, StyleSheet, type PressableProps } from 'react-native';
import {
  Stack,
  Text,
  opacity as opacityTokens,
  spacing,
  useTheme,
} from '../../../masicn';

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
 *
 * @example
 * // No trailing arrow — informational row
 * <ListItem
 *   title="Version"
 *   subtitle="2.1.0"
 *   trailing={<Text variant="body" color="textTertiary">2.1.0</Text>}
 *   separator
 * />
 *
 * @example
 * // Disabled row for locked features
 * <ListItem
 *   title="Export data"
 *   subtitle="Available on Pro plan"
 *   leading={<ExportIcon />}
 *   disabled
 * />
 *
 * @example
 * // Row with badge trailing indicator
 * <ListItem
 *   title="Messages"
 *   leading={<MessageIcon />}
 *   trailing={<Badge label="3" variant="error" circular />}
 *   onPress={() => navigation.navigate('Messages')}
 *   separator
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
        {...rest}
      >
        {leading && <View style={styles.leading}>{leading}</View>}
        <Stack gap="xxs" style={styles.content}>
          <Text variant="body">{title}</Text>
          {subtitle && (
            <Text variant="caption" color="textTertiary">
              {subtitle}
            </Text>
          )}
        </Stack>
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
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  separatorInset: {
    marginLeft: spacing.lg + spacing.xxl + spacing.md,
  },
});
