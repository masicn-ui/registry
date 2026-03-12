
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing, radius, borders } from '@masicn/ui';
import { Text } from '@/components/ui/Text';
import { Stack } from '@/components/ui/Stack';

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  /** All available options */
  options: MultiSelectOption[];
  /** Currently selected values */
  value: string[];
  /** Called with the new selection when an option is toggled */
  onValueChange: (value: string[]) => void;
  /** Label above the list */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Disable all options */
  disabled?: boolean;
  /** Max number of items that can be selected (undefined = unlimited) */
  maxSelect?: number;
  /**
   * Custom chip renderer — receives option + selected/disabled states.
   * Replaces the default chip when provided.
   */
  renderItem?: (option: MultiSelectOption, selected: boolean, disabled: boolean) => React.ReactNode;
}

/**
 * Multi-select chip list — users can tap options to add/remove them from the selection.
 */
export function MultiSelect({
  options,
  value,
  onValueChange,
  label,
  error,
  helperText,
  disabled = false,
  maxSelect,
  renderItem,
}: MultiSelectProps) {
  const { theme } = useTheme();
  const hasError = !!error;

  const toggle = (optValue: string) => {
    if (disabled) { return; }
    if (value.includes(optValue)) {
      onValueChange(value.filter(v => v !== optValue));
    } else {
      if (maxSelect !== undefined && value.length >= maxSelect) { return; }
      onValueChange([...value, optValue]);
    }
  };

  const labelColor = hasError ? theme.colors.error : theme.colors.textPrimary;

  return (
    <Stack gap="xs">
      {label && (
        <Text variant="label" style={{ color: labelColor }}>
          {label}
        </Text>
      )}

      <View style={styles.optionRow}>
        {options.map(opt => {
          const selected = value.includes(opt.value);
          const atMax = maxSelect !== undefined && value.length >= maxSelect && !selected;
          const isDisabled = disabled || atMax;

          return (
            <Pressable
              key={opt.value}
              onPress={() => toggle(opt.value)}
              disabled={isDisabled}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected, disabled: isDisabled }}
              accessibilityLabel={opt.label}
              style={renderItem ? undefined : [
                styles.chip,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : isDisabled
                      ? theme.colors.disabled
                      : theme.colors.surfaceSecondary,
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.borderPrimary,
                },
              ]}>
              {renderItem ? renderItem(opt, selected, isDisabled) : (
                <Text
                  variant="caption"
                  style={{
                    color: selected
                      ? theme.colors.onPrimary
                      : isDisabled
                        ? theme.colors.textDisabled
                        : theme.colors.textSecondary,
                  }}>
                  {opt.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {(hasError || helperText) && (
        <Text
          variant="caption"
          color={hasError ? 'error' : 'textTertiary'}
          accessibilityLiveRegion={hasError ? 'polite' : undefined}>
          {error || helperText}
        </Text>
      )}
    </Stack>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: borders.thin,
  },
});
