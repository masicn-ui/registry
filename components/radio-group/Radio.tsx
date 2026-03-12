// File: components/radio-group/Radio.tsx

import React, { createContext, useContext } from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme, spacing, sizes, borders, radius, iconSizes } from '@masicn/ui';
import { Text } from '@/components/ui/Text';

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(undefined);

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export function RadioGroup({
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
}

interface RadioProps {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export function Radio({
  value,
  label,
  description,
  disabled = false,
  containerStyle,
}: RadioProps) {
  const { theme } = useTheme();
  const context = useContext(RadioGroupContext);
  const scale = useSharedValue(0);

  if (!context) {
    throw new Error('Radio must be used within RadioGroup');
  }

  const isSelected = context.value === value;
  const isDisabled = disabled || context.disabled;

  React.useEffect(() => {
    scale.value = withSpring(isSelected ? 1 : 0, { damping: 12, stiffness: 200 });
  }, [isSelected, scale]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!isDisabled) { context.onValueChange(value); }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={[styles.radioContainer, containerStyle]}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}>
      <View
        style={[
          styles.radio,
          {
            borderColor: isDisabled
              ? theme.colors.borderSecondary
              : isSelected ? theme.colors.primary : theme.colors.borderPrimary,
          },
        ]}>
        <Animated.View
          style={[
            styles.radioInner,
            { backgroundColor: isDisabled ? theme.colors.disabled : theme.colors.primary },
            animatedDotStyle,
          ]}
        />
      </View>
      <View style={styles.labelContainer}>
        <Text variant="body" color={isDisabled ? 'textDisabled' : 'textPrimary'}>{label}</Text>
        {description && (
          <Text variant="caption" color={isDisabled ? 'textDisabled' : 'textSecondary'} style={styles.description}>
            {description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  radioGroup: { gap: spacing.sm },
  radioContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  radio: { width: sizes.control, height: sizes.control, borderRadius: radius.full, borderWidth: borders.medium, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: iconSizes.decorative, height: iconSizes.decorative, borderRadius: radius.full },
  labelContainer: { flex: 1 },
  description: { marginTop: spacing.xxs },
});
