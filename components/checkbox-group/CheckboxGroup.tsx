import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Text, spacing, useTheme } from '../../../masicn';
import { Checkbox } from '../checkbox/Checkbox';

export interface CheckboxGroupOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  options: CheckboxGroupOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export function CheckboxGroup({
  options,
  value,
  onValueChange,
  label,
  error,
  helperText,
  disabled = false,
  containerStyle,
}: CheckboxGroupProps) {
  const { theme } = useTheme();
  const hasError = !!error;

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onValueChange(value.filter(v => v !== optValue));
    } else {
      onValueChange([...value, optValue]);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="label" style={{ color: hasError ? theme.colors.error : theme.colors.textPrimary }}>
          {label}
        </Text>
      )}
      {options.map(opt => (
        <Checkbox
          key={opt.value}
          checked={value.includes(opt.value)}
          onValueChange={() => toggle(opt.value)}
          label={opt.label}
          description={opt.description}
          disabled={disabled || opt.disabled}
        />
      ))}
      {(hasError || helperText) && (
        <Text
          variant="caption"
          color={hasError ? 'error' : 'textTertiary'}
          accessibilityLiveRegion={hasError ? 'polite' : undefined}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});
