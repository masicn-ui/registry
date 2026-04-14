import React from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, elevation, iconSizes, motion, opacity as opacityTokens, radius, sizes, spacing, useTheme, type IconComponent, PlusIcon } from '../../../masicn';

type FABSize = 'small' | 'medium' | 'large';
type FABPosition = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left';
type FABVariant = 'circular' | 'extended';
type FABShape = 'circular' | 'square';

interface FABProps {
  /** Icon component to render inside the FAB. Defaults to PlusIcon. */
  icon?: IconComponent;
  /** Label to display (for extended variant or accessibility) */
  label?: string;
  /** On press handler */
  onPress: () => void;
  /** Size variant */
  size?: FABSize;
  /** Position on screen */
  position?: FABPosition;
  /** Variant — circular (icon-only) or extended (icon + label) */
  variant?: FABVariant;
  /** Shape — circular (pill) or square (rounded rectangle) */
  shape?: FABShape;
  /** Custom style */
  style?: ViewStyle;
  /** Disabled state */
  disabled?: boolean;
  /** Test identifier for automated testing */
  testID?: string;
}

/**
 * FAB — Floating Action Button for the primary action on a screen.
 *
 * Renders a circular or extended (icon + label) button anchored to a corner
 * or center edge of the screen. Automatically accounts for safe-area insets
 * so the button stays above the home indicator on notched devices.
 *
 * @example
 * // Circular (icon-only) at bottom-right
 * <FAB onPress={handleCreate} />
 *
 * @example
 * // Extended with label and custom icon
 * <FAB
 *   variant="extended"
 *   label="New post"
 *   icon={EditIcon}
 *   position="bottom-center"
 *   onPress={handleCreate}
 * />
 */
export function FAB({
  label,
  icon: FabIcon = PlusIcon,
  onPress,
  size = 'medium',
  position = 'bottom-right',
  variant = 'circular',
  shape = 'circular',
  style,
  disabled = false,
  testID,
}: FABProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const sizeStyles = {
    small: styles.sizeSmall,
    medium: styles.sizeMedium,
    large: styles.sizeLarge,
  };

  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'bottom-right':
        return { bottom: insets.bottom + spacing.xl, right: spacing.xl };
      case 'bottom-left':
        return { bottom: insets.bottom + spacing.xl, left: spacing.xl };
      case 'bottom-center':
        return { bottom: insets.bottom + spacing.xl, alignSelf: 'center' };
      case 'top-right':
        return { top: insets.top + spacing.xl, right: spacing.xl };
      case 'top-left':
        return { top: insets.top + spacing.xl, left: spacing.xl };
    }
  };

  const iconSizeMap = {
    small: iconSizes.default,
    medium: iconSizes.large,
    large: iconSizes.hero,
  };

  const isExtended = variant === 'extended' && label;
  const borderRadius = shape === 'square' ? radius.xl : radius.full;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.fab,
        !isExtended && sizeStyles[size],
        isExtended && styles.extended,
        getPositionStyle(),
        {
          borderRadius,
          backgroundColor: disabled
            ? theme.colors.disabled
            : theme.colors.primary,
          ...elevation.lg,
          shadowColor: theme.colors.shadow,
        },
        pressed && !disabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label || 'Floating action button'}
      accessibilityState={{ disabled }}>
      <View style={[styles.content, isExtended && styles.extendedContent]}>
        {FabIcon && (
          <FabIcon size={iconSizeMap[size]} color={theme.colors.onPrimary} />
        )}
        {isExtended && label && (
          <Text variant="label" color="onPrimary" style={styles.label}>
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  extendedContent: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  sizeSmall: {
    width: sizes.fabSm,
    height: sizes.fabSm,
  },
  sizeMedium: {
    width: sizes.fabMd,
    height: sizes.fabMd,
  },
  sizeLarge: {
    width: sizes.fabLg,
    height: sizes.fabLg,
  },
  extended: {
    width: 'auto',
    height: 'auto',
    minHeight: sizes.fabMd,
  },
  label: {
    textAlign: 'center',
  },
  pressed: {
    opacity: opacityTokens.pressed,
    transform: [{ scale: motion.press.scale }],
  },
});
