// File: components/tag/Tag.tsx

import React from 'react';
import { View, Pressable, StyleSheet, type ViewProps } from 'react-native';
import { Text, borders, radius, rgba, spacing, useTheme } from '@masicn/ui';

type TagVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type TagSize = 'sm' | 'md' | 'lg';

interface TagProps extends ViewProps {
  label: string;
  variant?: TagVariant;
  size?: TagSize;
  removable?: boolean;
  onRemove?: () => void;
}

export function Tag({
  label,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
  style,
  ...rest
}: TagProps) {
  const { theme } = useTheme();

  const variantStyles = {
    default: {
      bg: theme.colors.surfaceSecondary,
      text: theme.colors.textPrimary,
      border: theme.colors.borderPrimary,
    },
    success: {
      bg: rgba(theme.colors.success, 0.12),
      text: theme.colors.success,
      border: theme.colors.success,
    },
    warning: {
      bg: rgba(theme.colors.warning, 0.12),
      text: theme.colors.warning,
      border: theme.colors.warning,
    },
    error: {
      bg: rgba(theme.colors.error, 0.12),
      text: theme.colors.error,
      border: theme.colors.error,
    },
    info: {
      bg: rgba(theme.colors.info, 0.12),
      text: theme.colors.info,
      border: theme.colors.info,
    },
  };

  const sizeStyles = {
    sm: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      textVariant: 'caption' as const,
    },
    md: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      textVariant: 'body' as const,
    },
    lg: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      textVariant: 'bodyLarge' as const,
    },
  };

  const colors = variantStyles[variant];
  const sizing = sizeStyles[size];

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingHorizontal: sizing.paddingHorizontal,
          paddingVertical: sizing.paddingVertical,
        },
        style,
      ]}
      {...rest}>
      <Text variant={sizing.textVariant} style={{ color: colors.text }}>
        {label}
      </Text>
      {removable && (
        <Pressable
          onPress={onRemove}
          hitSlop={spacing.sm}
          style={styles.removeButton}>
          <Text variant="caption" style={{ color: colors.text }}>
            ✕
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: borders.thin,
    alignSelf: 'flex-start',
  },
  removeButton: {
    marginLeft: spacing.xs,
    width: spacing.lg,
    height: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
