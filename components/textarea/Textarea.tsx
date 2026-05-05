import React, { useState, useId } from 'react';
import {
  TextInput as RNTextInput,
  View,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import {
  Stack,
  Text,
  borders,
  radius,
  spacing,
  typography,
  useTheme,
} from '../../../masicn';

/** Body line height — used to compute minHeight from minRows. */
const LINE_HEIGHT = typography.body.lineHeight;

type TextareaSize = 'sm' | 'md' | 'lg';

interface TextareaProps
  extends Omit<RNTextInputProps, 'multiline' | 'numberOfLines'> {
  /** Label rendered above the textarea. */
  label?: string;
  /** Descriptive text shown below the textarea when there is no error. */
  helperText?: string;
  /** Validation error message. When set, the border and label turn red and the message replaces `helperText`. */
  error?: string;
  /** When true, the textarea is non-editable and rendered with a disabled background. Defaults to false. */
  disabled?: boolean;
  /** Size preset controlling padding. Defaults to 'md'. */
  size?: TextareaSize;
  /** Minimum number of visible text rows. The textarea starts at this height and grows upward. Defaults to 3. */
  minRows?: number;
  /** Maximum height in pixels for the textarea. Once reached the textarea becomes internally scrollable. */
  maxHeight?: number;
  /** Additional accessibility hint. Falls back to the `error` string when in an error state. */
  accessibilityHint?: string;
}

/**
 * Textarea — a styled, accessible multi-line text input for paragraphs and longer content.
 *
 * Auto-grows from `minRows` upward as the user types. Optionally capped at `maxHeight`,
 * at which point the field becomes internally scrollable. Supports label, helper text,
 * error state, disabled state, and a character counter when `maxLength` is set.
 *
 * @example
 * // Basic labelled textarea
 * <Textarea
 *   label="Description"
 *   placeholder="Enter a description…"
 *   value={description}
 *   onChangeText={setDescription}
 * />
 *
 * @example
 * // Capped height with character counter
 * <Textarea
 *   label="Bio"
 *   maxLength={300}
 *   maxHeight={200}
 *   value={bio}
 *   onChangeText={setBio}
 * />
 *
 * @example
 * // Error state
 * <Textarea
 *   label="Notes"
 *   value={notes}
 *   onChangeText={setNotes}
 *   error="Notes cannot be empty"
 * />
 *
 * @example
 * // Disabled textarea pre-filled with read-only content
 * <Textarea
 *   label="System Log"
 *   value={logOutput}
 *   onChangeText={() => {}}
 *   disabled
 *   minRows={6}
 * />
 */
const Textarea = React.forwardRef<RNTextInput, TextareaProps>(function Textarea(
  {
    label,
    helperText,
    error,
    disabled = false,
    size = 'md',
    minRows = 3,
    maxHeight,
    style,
    accessibilityLabel,
    accessibilityHint,
    onContentSizeChange,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const hasError = !!error;
  const inputId = useId();

  const { paddingVertical, paddingHorizontal } = sizeConfig[size];

  const minContentHeight = minRows * LINE_HEIGHT;
  const naturalHeight =
    contentHeight !== null
      ? Math.max(minContentHeight, contentHeight)
      : minContentHeight;
  const maxContentHeight =
    maxHeight !== undefined ? maxHeight - paddingVertical * 2 : undefined;
  const inputHeight =
    maxContentHeight !== undefined
      ? Math.min(naturalHeight, maxContentHeight)
      : naturalHeight;
  const scrollEnabled =
    maxContentHeight !== undefined && naturalHeight > maxContentHeight;

  const borderColor = hasError
    ? theme.colors.error
    : focused
    ? theme.colors.borderFocused
    : theme.colors.inputBorder;

  const labelColor = hasError
    ? theme.colors.error
    : focused
    ? theme.colors.borderFocused
    : theme.colors.textPrimary;

  const currentValue = typeof rest.value === 'string' ? rest.value : '';
  const charCount =
    rest.maxLength !== undefined
      ? `${currentValue.length} / ${rest.maxLength}`
      : null;

  const bottomRow = hasError || helperText || charCount;

  function handleContentSizeChange(
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) {
    setContentHeight(e.nativeEvent.contentSize.height);
    onContentSizeChange?.(e);
  }

  return (
    <Stack gap="xs">
      {label && (
        <Text
          variant="label"
          nativeID={`${inputId}-label`}
          style={{ color: labelColor }}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.container,
          {
            paddingVertical,
            paddingHorizontal,
            backgroundColor: disabled
              ? theme.colors.disabled
              : theme.colors.inputBackground,
            borderColor,
          },
        ]}
      >
        <RNTextInput
          ref={ref}
          multiline
          scrollEnabled={scrollEnabled}
          editable={!disabled}
          underlineColorAndroid="transparent"
          placeholderTextColor={theme.colors.inputPlaceholder}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error ? error : accessibilityHint}
          accessibilityState={{ disabled }}
          accessibilityLabelledBy={label ? `${inputId}-label` : undefined}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          onContentSizeChange={handleContentSizeChange}
          style={[
            typography.body,
            style,
            styles.input,
            {
              color: disabled
                ? theme.colors.textDisabled
                : theme.colors.textPrimary,
              height: inputHeight,
            },
          ]}
          {...rest}
        />
      </View>
      {bottomRow && (
        <View style={styles.bottomRow}>
          <Text
            variant="caption"
            color={hasError ? 'error' : 'textTertiary'}
            style={styles.helperText}
            accessibilityLiveRegion={hasError ? 'polite' : undefined}
          >
            {error || helperText || ''}
          </Text>
          {charCount && (
            <Text variant="caption" color="textTertiary">
              {charCount}
            </Text>
          )}
        </View>
      )}
    </Stack>
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps, TextareaSize };

const sizeConfig = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: borders.medium,
  },
  input: {
    textAlignVertical: 'top',
    padding: spacing.none,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: { flex: 1 },
});
