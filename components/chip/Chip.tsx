import React from 'react';
import { Pressable, View, StyleSheet, type PressableProps } from 'react-native';
import { Text, borders, radius, spacing, useTheme } from '../../../masicn';

type ChipVariant = 'filled' | 'outline';

interface ChipProps extends Omit<PressableProps, 'children'> {
  /** Text label displayed inside the chip. Required. */
  label: string;
  /** Visual style — 'filled' uses a surface background, 'outline' shows a bordered transparent chip. Defaults to 'filled'. */
  variant?: ChipVariant;
  /** When true the chip background turns to the primary brand colour to indicate selection. Defaults to false. */
  selected?: boolean;
  /** Optional node (e.g. icon component) rendered before the label. */
  icon?: React.ReactNode;
  /** When provided a × remove button is appended inside the chip and calls this handler on press. */
  onRemove?: () => void;
}

/**
 * Chip — a compact, pill-shaped interactive tag for filters, selections, or labels.
 *
 * Supports two visual variants (filled, outline), a selected state that
 * highlights with the primary brand colour, an optional leading icon, and an
 * optional inline remove button. Extends `PressableProps` so any standard
 * press handler (`onPress`, `onLongPress`, etc.) can be passed directly.
 *
 * @example
 * // Filter chip with toggle
 * <Chip
 *   label="React Native"
 *   selected={isSelected}
 *   onPress={() => toggleFilter('react-native')}
 * />
 *
 * @example
 * // Removable tag
 * <Chip label="TypeScript" onRemove={() => removeTag('ts')} />
 *
 * @example
 * // Chip with icon
 * <Chip label="Starred" icon={<StarIcon />} variant="outline" />
 */
export function Chip({
  label,
  variant = 'filled',
  selected = false,
  disabled = false,
  icon,
  onRemove,
  testID,
  ...rest
}: ChipProps) {
  const { theme } = useTheme();

  const bgColor =
    disabled
      ? theme.colors.disabled
      : selected && variant === 'filled'
        ? theme.colors.primary
        : selected && variant === 'outline'
          ? theme.colors.primaryContainer
          : variant === 'filled'
            ? theme.colors.surfaceSecondary
            : 'transparent';

  const textColor =
    disabled
      ? theme.colors.textDisabled
      : selected && variant === 'filled'
        ? theme.colors.onPrimary
        : selected && variant === 'outline'
          ? theme.colors.primary
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
      testID={testID}
      hitSlop={spacing.sm}
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
            testID={testID ? `${testID}-remove` : undefined}
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
