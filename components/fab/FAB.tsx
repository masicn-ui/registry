import React from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, elevation, iconSizes, opacity as opacityTokens, radius, sizes, spacing, useTheme } from '@masicn/ui';

type FABSize = 'small' | 'medium' | 'large';
type FABPosition = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left';
type FABVariant = 'circular' | 'extended';

interface FABProps {
  /** Icon character (emoji or unicode) */
  icon?: string;
  /** Label to display (for extended variant or accessibility) */
  label?: string;
  /** On press handler */
  onPress: () => void;
  /** Size variant */
  size?: FABSize;
  /** Position on screen */
  position?: FABPosition;
  /** Variant */
  variant?: FABVariant;
  /** Custom style */
  style?: ViewStyle;
  /** Disabled state */
  disabled?: boolean;
}

export function FAB({
  label,
  icon = '+',
  onPress,
  size = 'medium',
  position = 'bottom-right',
  variant = 'circular',
  style,
  disabled = false,
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

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.fab,
        !isExtended && sizeStyles[size],
        isExtended && styles.extended,
        getPositionStyle(),
        {
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
        {icon && (
          <Text
            color="onPrimary"
            style={[
              styles.icon,
              {
                fontSize: iconSizeMap[size],
                lineHeight: iconSizeMap[size],
              },
            ]}>
            {icon}
          </Text>
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
  icon: {
    textAlign: 'center',
  },
  label: {
    textAlign: 'center',
  },
  pressed: {
    opacity: opacityTokens.pressed,
    transform: [{ scale: 0.95 }],
  },
});
