import React, { createContext, useContext } from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Text,
  borders,
  iconSizes,
  motion,
  radius,
  sizes,
  spacing,
  useReducedMotion,
  useTheme,
} from '../../../masicn';

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(
  undefined,
);

interface RadioGroupProps {
  /** The currently selected value within the group. */
  value: string;
  /** Callback invoked when a radio option is selected. */
  onValueChange: (value: string) => void;
  /** One or more `Radio` child components. */
  children: React.ReactNode;
  /** Disables all radio options within the group. Defaults to false. */
  disabled?: boolean;
  /** Additional style applied to the group container. */
  containerStyle?: ViewStyle;
}

/**
 * RadioGroup — a controlled container that manages exclusive selection among
 * a set of `Radio` child components.
 *
 * Provides selection state via React context so individual `Radio` items do not
 * need to manage their own selected state. Must wrap all `Radio` components that
 * belong to the same selection group. Throws if a `Radio` is rendered outside a
 * `RadioGroup`.
 *
 * @example
 * <RadioGroup value={plan} onValueChange={setPlan}>
 *   <Radio value="free" label="Free" />
 *   <Radio value="pro" label="Pro" description="Unlimited usage" />
 *   <Radio value="enterprise" label="Enterprise" disabled />
 * </RadioGroup>
 *
 * @example
 * // Entire group disabled — useful for read-only survey responses
 * <RadioGroup value="agree" onValueChange={() => {}} disabled>
 *   <Radio value="agree" label="Agree" />
 *   <Radio value="disagree" label="Disagree" />
 * </RadioGroup>
 *
 * @example
 * // Shipping method selection with descriptions
 * <RadioGroup value={shipping} onValueChange={setShipping}>
 *   <Radio value="standard" label="Standard" description="3–5 business days — free" />
 *   <Radio value="express" label="Express" description="1–2 business days — $9.99" />
 *   <Radio value="overnight" label="Overnight" description="Next business day — $24.99" />
 * </RadioGroup>
 */
export const RadioGroup = React.memo(function RadioGroup({
  value,
  onValueChange,
  children,
  disabled = false,
  containerStyle,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
      <View style={[styles.radioGroup, containerStyle]}>{children}</View>
    </RadioGroupContext.Provider>
  );
});

interface RadioProps {
  /** The value this option represents — compared against the group's current value to determine selection. */
  value: string;
  /** Primary text label displayed next to the radio button. */
  label: string;
  /** Optional secondary description rendered below the label. */
  description?: string;
  /** Disables this specific option regardless of the group-level disabled prop. Defaults to false. */
  disabled?: boolean;
  /** Additional style applied to the pressable row container. */
  containerStyle?: ViewStyle;
}

/**
 * Radio — a single radio button option intended to be used inside a `RadioGroup`.
 *
 * Renders a circular border with an animated spring-scaled inner dot that
 * appears when the option is selected. Merges the item-level `disabled` prop
 * with the group-level disabled state. Accessibility role is `radio` with
 * appropriate `checked` and `disabled` states.
 *
 * Must be rendered as a descendant of `RadioGroup` — throws an error otherwise.
 *
 * @example
 * <Radio value="dark" label="Dark mode" description="Easier on the eyes" />
 */
export const Radio = React.memo(function Radio({
  value,
  label,
  description,
  disabled = false,
  containerStyle,
}: RadioProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const context = useContext(RadioGroupContext);
  const scale = useSharedValue(0);

  if (!context) {
    throw new Error('Radio must be used within RadioGroup');
  }

  const isSelected = context.value === value;
  const isDisabled = disabled || context.disabled;

  React.useEffect(() => {
    scale.value = reducedMotion
      ? withTiming(isSelected ? 1 : 0, { duration: 0 })
      : withSpring(isSelected ? 1 : 0, motion.spring.indicator);
  }, [isSelected, scale, reducedMotion]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!isDisabled) {
      context.onValueChange(value);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={[styles.radioContainer, containerStyle]}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}
    >
      <View
        style={[
          styles.radio,
          {
            borderColor: isDisabled
              ? theme.colors.borderSecondary
              : isSelected
              ? theme.colors.primary
              : theme.colors.borderPrimary,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.radioInner,
            {
              backgroundColor: isDisabled
                ? theme.colors.disabled
                : theme.colors.primary,
            },
            animatedDotStyle,
          ]}
        />
      </View>
      <View style={styles.labelContainer}>
        <Text
          variant="body"
          color={isDisabled ? 'textDisabled' : 'textPrimary'}
        >
          {label}
        </Text>
        {description && (
          <Text
            variant="caption"
            color={isDisabled ? 'textDisabled' : 'textSecondary'}
            style={styles.description}
          >
            {description}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  radioGroup: { gap: spacing.sm },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  radio: {
    width: sizes.control,
    height: sizes.control,
    borderRadius: radius.full,
    borderWidth: borders.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: iconSizes.decorative,
    height: iconSizes.decorative,
    borderRadius: radius.full,
  },
  labelContainer: { flex: 1 },
  description: { marginTop: spacing.xxs },
});
