
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme, spacing, radius, borders, sizes, typography } from '@masicn/ui';
import { Text } from '@/components/ui/Text';
import { Stack } from '@/components/ui/Stack';

interface TagInputProps {
  /** Current tags */
  value: string[];
  /** Called with the updated tag array */
  onValueChange: (value: string[]) => void;
  /** Placeholder shown inside the text field */
  placeholder?: string;
  /** Field label */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Disable adding/removing tags */
  disabled?: boolean;
  /** Max number of tags (undefined = unlimited) */
  maxTags?: number;
  /** Container style */
  containerStyle?: ViewStyle;
}

/**
 * TagInput — a text input that converts entries into Tag chips on Enter or comma.
 * Supports removal of individual tags via the × dismiss button on each chip.
 */
// Minimum width for the inline text field — wide enough to show ~10 chars
const TAG_INPUT_MIN_WIDTH = spacing.xxl + spacing.xl + spacing.xl; // 32+24+24 = 80
// Explicit chip height — shared between tag chips and the inline text field
// so flexWrap row alignment is perfectly consistent.
const CHIP_HEIGHT = sizes.inputSm; // 32px

export function TagInput({
  value,
  onValueChange,
  placeholder = 'Add a tag…',
  label,
  error,
  helperText,
  disabled = false,
  maxTags,
  containerStyle,
}: TagInputProps) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<RNTextInput>(null);
  const hasError = !!error;
  const atMax = maxTags !== undefined && value.length >= maxTags;

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/, '');
    if (!tag || value.includes(tag) || atMax) { return; }
    onValueChange([...value, tag]);
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onValueChange(value.filter(t => t !== tag));
  };

  const handleChangeText = (text: string) => {
    if (text.endsWith(',')) {
      addTag(text.slice(0, -1));
    } else {
      setInputValue(text);
    }
  };

  const handleSubmit = () => {
    addTag(inputValue);
  };

  const borderColor = hasError
    ? theme.colors.error
    : theme.colors.inputBorder;

  const labelColor = hasError
    ? theme.colors.error
    : theme.colors.textPrimary;

  return (
    <Stack gap="xs" style={containerStyle}>
      {label && (
        <Text variant="label" style={{ color: labelColor }}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.container,
          {
            backgroundColor: disabled
              ? theme.colors.disabled
              : theme.colors.inputBackground,
            borderColor,
          },
        ]}>
        {/* Wrapping chip row — tags flow to a new line when full-width is reached */}
        <View style={styles.chipRow}>
          {value.map(tag => (
            <View
              key={tag}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.borderPrimary,
                },
              ]}>
              <Text variant="caption" color="textSecondary">
                {tag}
              </Text>
              {!disabled && (
                <Pressable
                  onPress={() => removeTag(tag)}
                  hitSlop={spacing.xs}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove tag ${tag}`}
                  style={styles.removeBtn}>
                  <Text variant="caption" color="textTertiary">
                    ×
                  </Text>
                </Pressable>
              )}
            </View>
          ))}
          {!atMax && (
            <RNTextInput
              ref={inputRef}
              value={inputValue}
              onChangeText={handleChangeText}
              onSubmitEditing={handleSubmit}
              placeholder={value.length === 0 ? placeholder : undefined}
              placeholderTextColor={theme.colors.inputPlaceholder}
              editable={!disabled}
              returnKeyType="done"
              blurOnSubmit={false}
              style={[
                typography.body,
                styles.input,
                { color: disabled ? theme.colors.textDisabled : theme.colors.textPrimary },
              ]}
            />
          )}
        </View>
      </Pressable>
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

export type { TagInputProps };

const styles = StyleSheet.create({
  container: {
    borderWidth: borders.thin,
    borderRadius: radius.md,
    minHeight: sizes.inputMd,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CHIP_HEIGHT,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: borders.thin,
    gap: spacing.xxs,
  },
  removeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    minWidth: TAG_INPUT_MIN_WIDTH,
    paddingVertical: spacing.xs,
    textAlignVertical: 'center',
    flexShrink: 1,
  },
});
