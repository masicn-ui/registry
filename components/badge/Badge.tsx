// File: components/badge/Badge.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, radius, sizes, spacing, useTheme } from '@masicn/ui';

type BadgeVariant = 'error' | 'success' | 'warning' | 'info';

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  circular?: boolean;
  size?: 'sm' | 'md' | 'lg';
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
