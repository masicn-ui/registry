import React, { useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Stack, Text, borders, radius, sizes, spacing, typography, useTheme } from '../../../masicn';
import { Chip } from '../../components';

type ChipInputSize = 'sm' | 'md' | 'lg';

const sizeConfig = {
  sm: { minHeight: sizes.inputSm, padding: spacing.xs },
  md: { minHeight: sizes.inputMd, padding: spacing.sm },
  lg: { minHeight: sizes.inputLg, padding: spacing.md },
} as const;

interface ChipInputProps {
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
  /** Size preset controlling minimum height and chip row padding. @default 'md' */
  size?: ChipInputSize;
  /** Container style */
  containerStyle?: ViewStyle;
}

/**
 * ChipInput — a text input that converts entries into Chip tags on Enter or comma.
 *
 * Entries are committed when the user presses Return or types a comma. Each committed
 * tag is shown as a dismissible Chip inside the input container. Tapping the × on a
 * chip removes it from the array. Focuses the hidden TextInput when the container is
 * tapped anywhere.
 *
 * Supports a `maxTags` limit — the text field is hidden once the limit is reached.
 * Exposes a `focus()` method via `ref` for programmatic focus.
 *
 * @example
 * <ChipInput
 *   label="Skills"
 *   value={skills}
 *   onValueChange={setSkills}
 *   placeholder="Add a skill…"
 *   maxTags={5}
 * />
 *
 * @example
 * // With error state and helper text
 * <ChipInput
 *   label="Interests"
 *   value={interests}
 *   onValueChange={setInterests}
 *   error={interests.length === 0 ? 'Add at least one interest' : undefined}
 *   helperText="Press Enter or comma to add"
 * />
 *
 * @example
 * // Disabled — tags shown but input is locked
 * <ChipInput
 *   label="Assigned labels"
 *   value={assignedLabels}
 *   onValueChange={() => {}}
 *   disabled
 * />
 *
 * @example
 * // Large size with programmatic focus via ref
 * const chipInputRef = useRef<ChipInputRef>(null);
 * <ChipInput
 *   ref={chipInputRef}
 *   size="lg"
 *   label="Tags"
 *   value={tags}
 *   onValueChange={setTags}
 * />
 */
// Minimum width for the inline text field — wide enough to show ~10 chars
const TAG_INPUT_MIN_WIDTH = spacing.xxl + spacing.xl + spacing.xl; // 32+24+24 = 80

export interface ChipInputRef {
  /** Focus the internal text input */
  focus: () => void;
}

export const ChipInput = forwardRef<ChipInputRef, ChipInputProps>(function ChipInput({
  value,
  onValueChange,
  placeholder = 'Add a tag…',
  label,
  error,
  helperText,
  disabled = false,
  maxTags,
  size = 'md',
  containerStyle,
}, ref) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<RNTextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));
  const hasError = !!error;
  const atMax = maxTags !== undefined && value.length >= maxTags;

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().replace(/,+$/, '');
    if (!tag || value.includes(tag) || atMax) { return; }
    onValueChange([...value, tag]);
    setInputValue('');
  }, [value, onValueChange, atMax]);

  const removeTag = useCallback((tag: string) => {
    onValueChange(value.filter(t => t !== tag));
  }, [value, onValueChange]);

  const handleChangeText = useCallback((text: string) => {
    if (text.endsWith(',')) {
      addTag(text.slice(0, -1));
    } else {
      setInputValue(text);
    }
  }, [addTag]);

  const handleSubmit = useCallback(() => {
    addTag(inputValue);
  }, [addTag, inputValue]);

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
        accessibilityRole="none"
        accessibilityLabel={label ?? 'Tag input'}
        style={[
          styles.container,
          {
            backgroundColor: disabled
              ? theme.colors.disabled
              : theme.colors.inputBackground,
            borderColor,
            minHeight: sizeConfig[size].minHeight,
          },
        ]}>
        {/* Wrapping chip row — tags flow to a new line when full-width is reached */}
        <View style={[styles.chipRow, { padding: sizeConfig[size].padding }]}>
          {value.map(tag => (
            <Chip
              key={tag}
              label={tag}
              onRemove={!disabled ? () => removeTag(tag) : undefined}
            />
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
              accessibilityLabel={label ?? 'Tag input'}
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
});

export type { ChipInputProps };

const styles = StyleSheet.create({
  container: {
    borderWidth: borders.thin,
    borderRadius: radius.md,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  input: {
    minWidth: TAG_INPUT_MIN_WIDTH,
    paddingVertical: spacing.xs,
    textAlignVertical: 'center',
    flexShrink: 1,
  },
});
