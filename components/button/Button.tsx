import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  View,
  StyleSheet,
  type ViewStyle,
  type PressableProps,
} from 'react-native';
import { Text, borders, opacity as opacityTokens, radius, spacing, useReducedMotion, useTheme } from '../../../masicn';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'destructive';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends Omit<PressableProps, 'children'> {
  /** Button content — supports text, icons, or any composition */
  children?: React.ReactNode;
  /** Visual style — 'primary' fills with brand color, 'secondary' uses secondary brand color, 'tertiary' uses tertiary color, 'outline' shows a bordered transparent button, 'ghost' has no border or fill, 'destructive' uses error color. Defaults to 'primary'. */
  variant?: ButtonVariant;
  /** Size preset — 'sm' is compact, 'md' is default, 'lg' is larger touch target. Defaults to 'md'. */
  size?: ButtonSize;
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Icon rendered before the label */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label */
  rightIcon?: React.ReactNode;
  /** Additional container style */
  containerStyle?: ViewStyle;
  /** Accessibility label (defaults to string children) */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

/**
 * Button — the primary interactive element for triggering actions.
 *
 * Supports 6 visual variants (primary, secondary, tertiary, outline, ghost, destructive),
 * 3 size presets (sm, md, lg), optional left/right icon slots, and a loading state
 * that shows a spinner and blocks interaction.
 *
 * Automatically respects reduced-motion preferences via `useReducedMotion`.
 *
 * @example
 * // Primary button with icon
 * <Button variant="primary" leftIcon={<Icon />} onPress={handleSubmit}>
 *   Save Changes
 * </Button>
 *
 * @example
 * // Loading state
 * <Button loading onPress={handleSubmit}>Submit</Button>
 *
 * @example
 * // Destructive outline button
 * <Button variant="destructive" size="sm" onPress={handleDelete}>
 *   Delete
 * </Button>
 */
const Button = React.forwardRef<View, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    leftIcon,
    rightIcon,
    containerStyle,
    style,
    accessibilityLabel,
    accessibilityHint,
    hitSlop = spacing.sm,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const fillMap = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    tertiary: theme.colors.tertiary,
    outline: 'transparent',
    ghost: 'transparent',
    destructive: theme.colors.error,
  } as const;

  const textColorMap = {
    primary: theme.colors.onPrimary,
    secondary: theme.colors.onSecondary,
    tertiary: theme.colors.onTertiary,
    outline: theme.colors.primary,
    ghost: theme.colors.tertiary,
    destructive: theme.colors.onError,
  } as const;

  const sizeStyle = sizeStyles[size];
  const textColor = isDisabled ? theme.colors.textDisabled : textColorMap[variant];

  const resolvedLabel =
    accessibilityLabel ??
    (typeof children === 'string' ? children : undefined);

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={textColor} size="small" />;
    }

    const label = children
      ? typeof children === 'string'
        ? <Text variant="label" style={{ color: textColor }}>{children}</Text>
        : <>{children}</>
      : null;

    if (!leftIcon && !rightIcon) { return label; }

    return (
      <>
        {leftIcon}
        {label}
        {rightIcon}
      </>
    );
  };

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        { backgroundColor: isDisabled ? theme.colors.disabled : fillMap[variant] },
        variant === 'outline' && {
          borderWidth: borders.medium,
          borderColor: isDisabled
            ? theme.colors.borderSecondary
            : theme.colors.primary,
        },
        pressed && !isDisabled && !reducedMotion && { opacity: opacityTokens.pressed },
        containerStyle,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...rest}>
      {renderContent()}
    </Pressable>
  );
});

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: spacing.xxl,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    minHeight: spacing.xxxl,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    minHeight: spacing.xxxl + spacing.sm,
  },
});
