import React from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text, borders, iconSizes, radius, sizes, spacing, useReducedMotion, useTheme } from '../../../masicn';

interface CheckboxProps {
  /** Whether the checkbox is checked. Required (controlled component). */
  checked: boolean;
  /** Called with the new checked value when the user toggles the checkbox. */
  onValueChange: (checked: boolean) => void;
  /** Primary label text rendered to the right of the checkbox. */
  label?: string;
  /** Subdued description text rendered below `label`. */
  description?: string;
  /** Custom content rendered to the right of the checkbox instead of `label`/`description`. */
  children?: React.ReactNode;
  /** Disables interaction and dims the control. Defaults to false. */
  disabled?: boolean;
  /** When true renders a dash (—) instead of a tick — useful for "select all" states. Defaults to false. */
  indeterminate?: boolean;
  /** Additional style applied to the outer pressable container. */
  containerStyle?: ViewStyle;
  /** Accessibility label. Defaults to the `label` prop value. */
  accessibilityLabel?: string;
  /** Accessibility hint passed to the native element. */
  accessibilityHint?: string;
}

/**
 * Checkbox — an accessible, animated boolean toggle with optional label and description.
 *
 * The check mark animates in/out with a spring scale when `checked` changes.
 * Reduced-motion preferences are respected (instant transition). Supports an
 * `indeterminate` state (renders a dash) for "select all" scenarios. Can also
 * render arbitrary `children` to the right instead of the built-in label/description.
 *
 * @example
 * // Simple labelled checkbox
 * <Checkbox
 *   checked={agreed}
 *   onValueChange={setAgreed}
 *   label="I agree to the terms"
 * />
 *
 * @example
 * // Indeterminate state
 * <Checkbox
 *   checked={someSelected}
 *   indeterminate={!allSelected && someSelected}
 *   onValueChange={toggleAll}
 *   label="Select all"
 * />
 */
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
