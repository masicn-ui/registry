import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, radius, sizes, spacing, useTheme } from '../../../masicn';

type BadgeVariant = 'error' | 'success' | 'warning' | 'info';

interface BadgeProps {
  /** Text to display inside the badge. When omitted a small coloured dot is rendered instead. */
  label?: string;
  /** Semantic colour variant — 'error' (red), 'success' (green), 'warning' (amber), 'info' (blue). Defaults to 'error'. */
  variant?: BadgeVariant;
  /** When true renders the badge as a fixed-size circle instead of a pill. Defaults to false. */
  circular?: boolean;
  /** Size of the badge — 'sm', 'md', or 'lg'. Affects the circular diameter. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Overrides the default accessibility label. Defaults to "{label} {variant}" or just "{variant}" for dot mode. */
  accessibilityLabel?: string;
}

const onColorMap: Record<BadgeVariant, 'onError' | 'onSuccess' | 'textInverse' | 'onTertiary'> = {
  error: 'onError',
  success: 'onSuccess',
  warning: 'textInverse',
  info: 'onTertiary',
};

const circularSizes = {
  sm: sizes.controlSm,
  md: sizes.control,
  lg: sizes.avatarSm,
} as const;

/**
 * Badge — a compact status indicator.
 *
 * Renders in three modes depending on props:
 * - **Dot** — small coloured circle (no `label`).
 * - **Pill** — rounded pill with text (`label`, `circular = false`).
 * - **Circular** — fixed-size filled circle with text (`label`, `circular = true`).
 *
 * Commonly used to show notification counts on `<Avatar />` or inline status
 * indicators on list items.
 *
 * @example
 * // Notification dot on avatar
 * <Avatar initials="JD" badge={<Badge variant="error" />} />
 *
 * @example
 * // Count badge
 * <Badge label="12" variant="error" circular />
 *
 * @example
 * // Inline status pill
 * <Badge label="Active" variant="success" />
 */
export function Badge({ label, variant = 'error', circular = false, size = 'md', accessibilityLabel }: BadgeProps) {
  const { theme } = useTheme();
  const a11yLabel = accessibilityLabel ?? (label ? `${label} ${variant}` : variant);

  if (!label) {
    return (
      <View
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}
        style={[styles.dot, { backgroundColor: theme.colors[variant] }]}
      />
    );
  }

  if (circular) {
    const dim = circularSizes[size];
    return (
      <View
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}
        style={[
          styles.circular,
          {
            backgroundColor: theme.colors[variant],
            width: dim,
            height: dim,
            borderRadius: dim / 2,
          },
        ]}>
        <Text
          variant="captionSmall"
          bold
          style={{ color: theme.colors[onColorMap[variant]] }}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
      style={[styles.badge, { backgroundColor: theme.colors[variant] }]}>
      <Text variant="captionSmall" style={{ color: theme.colors[onColorMap[variant]] }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.full,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circular: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
