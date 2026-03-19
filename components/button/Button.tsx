import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  View,
  StyleSheet,
  type ViewStyle,
  type PressableProps,
} from 'react-native';
import { Text, borders, opacity as opacityTokens, radius, spacing, useReducedMotion, useTheme } from '@masicn/ui';

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
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
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
