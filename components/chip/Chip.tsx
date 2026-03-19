import React from 'react';
import { Pressable, View, StyleSheet, type PressableProps } from 'react-native';
import { Text, borders, radius, spacing, useTheme } from '@masicn/ui';

type ChipVariant = 'filled' | 'outline';

interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  icon?: React.ReactNode;
  onRemove?: () => void;
}

export function Chip({
  label,
  variant = 'filled',
  selected = false,
  disabled = false,
  icon,
  onRemove,
  ...rest
}: ChipProps) {
  const { theme } = useTheme();

  const bgColor =
    disabled
      ? theme.colors.disabled
      : selected
        ? theme.colors.primary
        : variant === 'filled'
          ? theme.colors.surfaceSecondary
          : 'transparent';

  const textColor =
    disabled
      ? theme.colors.textDisabled
      : selected
        ? theme.colors.onPrimary
        : theme.colors.textSecondary;

  const borderColor =
    variant === 'outline'
      ? selected
        ? theme.colors.primary
        : theme.colors.borderPrimary
      : undefined;

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      {...rest}>
      <View
        style={[
          styles.chip,
          { backgroundColor: bgColor },
          borderColor !== undefined && [styles.outlined, { borderColor }],
        ]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text variant="caption" style={{ color: textColor }}>
          {label}
        </Text>
        {onRemove && (
          <Pressable
            onPress={onRemove}
            hitSlop={spacing.xs}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${label}`}
            style={styles.remove}>
            <Text variant="caption" style={{ color: textColor }}>
              ×
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xxs,
  },
  outlined: {
    borderWidth: borders.thin,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  remove: {
    marginLeft: spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
