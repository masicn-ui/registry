import React from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text, borders, iconSizes, radius, sizes, spacing, useReducedMotion, useTheme } from '@masicn/ui';

interface CheckboxProps {
  checked: boolean;
  onValueChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  indeterminate?: boolean;
  containerStyle?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const Checkbox = React.forwardRef<View, CheckboxProps>(function Checkbox(
  {
    checked,
    onValueChange,
    label,
    description,
    children,
    disabled = false,
    indeterminate = false,
    containerStyle,
    accessibilityLabel,
    accessibilityHint,
  },
  ref,
) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(checked || indeterminate ? 1 : 0);

  React.useEffect(() => {
    const target = checked || indeterminate ? 1 : 0;
    scale.value = reducedMotion
      ? withTiming(target, { duration: 0 })
      : withSpring(target, { damping: 12, stiffness: 200 });
  }, [checked, indeterminate, scale, reducedMotion]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!disabled) { onValueChange(!checked); }
  };

  const borderColor = disabled
    ? theme.colors.borderSecondary
    : checked || indeterminate
      ? theme.colors.primary
      : theme.colors.borderPrimary;

  const backgroundColor =
    checked || indeterminate
      ? disabled ? theme.colors.disabled : theme.colors.primary
      : 'transparent';

  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, containerStyle]}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked, disabled }}>
      <View style={[styles.checkbox, { borderColor, backgroundColor }]}>
        <Animated.View style={[styles.checkmark, animatedCheckStyle]}>
          {indeterminate ? (
            <View style={[styles.indeterminateLine, { backgroundColor: theme.colors.onPrimary }]} />
          ) : (
            checked && (
              <Text variant="bodySmall" color="onPrimary" style={styles.check}>✓</Text>
            )
          )}
        </Animated.View>
      </View>
      {children
        ? <View style={styles.labelContainer}>{children}</View>
        : (label || description) && (
          <View style={styles.labelContainer}>
            {label && (
              <Text variant="body" color={disabled ? 'textDisabled' : 'textPrimary'}>{label}</Text>
            )}
            {description && (
              <Text variant="caption" color={disabled ? 'textDisabled' : 'textSecondary'} style={styles.description}>
                {description}
              </Text>
            )}
          </View>
        )}
    </Pressable>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export type { CheckboxProps };

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: sizes.control, height: sizes.control, borderRadius: radius.xs, borderWidth: borders.medium, alignItems: 'center', justifyContent: 'center' },
  checkmark: { alignItems: 'center', justifyContent: 'center' },
  check: {},
  indeterminateLine: { width: iconSizes.decorative, height: spacing.xxs, borderRadius: radius.xs },
  labelContainer: { flex: 1 },
  description: { marginTop: spacing.xxs },
});
