import React from 'react';
import { View, Pressable, StyleSheet, type ViewProps } from 'react-native';
import { Text, borders, opacity as opacityTokens, radius, rgba, spacing, useTheme } from '../../../masicn';

type TagVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type TagSize = 'sm' | 'md' | 'lg';

interface TagProps extends ViewProps {
  /** Text content displayed inside the tag. */
  label: string;
  /** Colour scheme of the tag. Defaults to `'default'` (neutral). */
  variant?: TagVariant;
  /** Size of the tag, controlling padding and typography. Defaults to `'md'`. */
  size?: TagSize;
  /** When true, a dismiss (✕) button is rendered at the end of the tag. */
  removable?: boolean;
  /** Callback fired when the user presses the remove button. */
  onRemove?: () => void;
}

/**
 * A compact label chip used to categorise or annotate content. Supports
 * semantic colour variants (success, warning, error, info) and an optional
 * remove button for dismissible tags.
 *
 * @example
 * // Static informational tag
 * <Tag label="In Progress" variant="warning" />
 *
 * // Removable filter tag
 * <Tag label="React Native" removable onRemove={() => removeFilter('React Native')} />
 */
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
      bg: rgba(theme.colors.success, opacityTokens.tintMedium),
      text: theme.colors.success,
      border: theme.colors.success,
    },
    warning: {
      bg: rgba(theme.colors.warning, opacityTokens.tintMedium),
      text: theme.colors.warning,
      border: theme.colors.warning,
    },
    error: {
      bg: rgba(theme.colors.error, opacityTokens.tintMedium),
      text: theme.colors.error,
      border: theme.colors.error,
    },
    info: {
      bg: rgba(theme.colors.info, opacityTokens.tintMedium),
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
