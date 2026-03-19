import React, { useState, useEffect, useCallback } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Stack, Text, borders, iconSizes, radius, rgba, sizes, spacing, typography, useTheme } from '../../../masicn';
import { Modal as PickerModal } from '../../components';

/** Full country entry — pass via `countries` for name-in-picker support. */
export interface CountryOption {
  /** E.164-style dial code prefix, e.g. `"+91"` or `"+1"`. */
  dialCode: string;
  /** Country name shown in the picker list (not shown in the input row) */
  name?: string;
}

export interface PhoneInputProps {
  /** Phone number digits — no country code prefix */
  value: string;
  /** Called with updated phone digits whenever input changes */
  onValueChange: (value: string) => void;
  /**
   * Rich country list — preferred over `countryCodes`.
   * Each entry may include a `name` which is displayed in the picker.
   */
  countries?: CountryOption[];
  /**
   * Simple dial-code list — used when `countries` is not provided.
   * When more than one entry is given, a picker is shown.
   */
  countryCodes?: string[];
  /** Currently selected dial code (controlled). Defaults to first entry. */
  dialCode?: string;
  /** Called when the user selects a different dial code */
  onDialCodeChange?: (code: string) => void;
  /** Maximum number of digits the user can enter (default 10) */
  maxDigits?: number;
  /** Field label shown above the input */
  label?: string;
  /** Placeholder text inside the number field */
  placeholder?: string;
  /** Error message — activates error colour */
  error?: string;
  /** Helper text shown below the field */
  helperText?: string;
  /** Disable all interaction */
  disabled?: boolean;
  /** Outer container style */
  containerStyle?: ViewStyle;
  /** Stable selector for tests */
  testID?: string;
}

/**
 * PhoneInput — phone number field with an integrated country dial-code selector.
 *
 * The component accepts both a controlled (`dialCode` + `onDialCodeChange`) and
 * an uncontrolled internal-state model for the dial code. The phone digits are
 * always controlled via `value` / `onValueChange`.
 *
 * Picker behaviour:
 * - Pass `countries` for a rich picker that shows the country name alongside the code.
 * - Pass `countryCodes` (string array) for a code-only picker — each string is
 *   normalised into a `CountryOption` internally.
 * - If only one entry is present the dial-code area is non-pressable (no picker needed).
 *
 * Paste handling:
 * - Auto-strips the dial code when the user pastes a full international number
 *   (e.g. `+918789338305` becomes `8789338305` with `+91` selected).
 * - `maxLength` is intentionally omitted from the native `TextInput` so the full
 *   pasted string reaches `handleChangeText` before being clipped to `maxDigits`.
 *
 * @example
 * <PhoneInput
 *   label="Mobile number"
 *   value={phone}
 *   onValueChange={setPhone}
 *   countries={[
 *     { dialCode: '+91', name: 'India' },
 *     { dialCode: '+1',  name: 'United States' },
 *     { dialCode: '+44', name: 'United Kingdom' },
 *   ]}
 * />
 */
export const PhoneInput = React.forwardRef<RNTextInput, PhoneInputProps>(
  function PhoneInput(
    {
      value,
      onValueChange,
      countries: countriesProp,
      countryCodes,
      dialCode: controlledDialCode,
      onDialCodeChange,
      maxDigits = 10,
      label,
      placeholder = 'Enter phone number',
      error,
      helperText,
      disabled = false,
      containerStyle,
      testID,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [focused, setFocused] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);

    // Normalise to CountryOption[] regardless of which prop was passed
    const normalizedCountries: CountryOption[] = countriesProp
      ?? (countryCodes ?? ['+91']).map(code => ({ dialCode: code }));

    const isControlledCode = controlledDialCode !== undefined;
    const [internalCode, setInternalCode] = useState(
      controlledDialCode ?? normalizedCountries[0]?.dialCode ?? '+91',
    );
    const selectedCode = isControlledCode ? controlledDialCode : internalCode;

    // Sync internal code when controlled prop changes
    useEffect(() => {
      if (isControlledCode && controlledDialCode !== internalCode) {
        setInternalCode(controlledDialCode);
      }
    }, [controlledDialCode, isControlledCode, internalCode]);

    const showPicker = normalizedCountries.length > 1 && !disabled;

    const selectCode = useCallback(
      (option: CountryOption) => {
        if (!isControlledCode) { setInternalCode(option.dialCode); }
        onDialCodeChange?.(option.dialCode);
        setPickerVisible(false);
      },
      [isControlledCode, onDialCodeChange],
    );

    const handleChangeText = (text: string) => {
      // Strip anything that isn't a digit
      let digits = text.replace(/\D/g, '');

      // Auto-slice: if the user pasted a full international number, strip the
      // country code prefix so only local digits remain.
      // NOTE: maxLength is NOT set on the native TextInput so the full pasted
      // string reaches here before we truncate — this is intentional.
      for (const option of normalizedCountries) {
        const codeDigits = option.dialCode.replace(/\D/g, '');
        if (digits.startsWith(codeDigits) && digits.length > codeDigits.length) {
          digits = digits.slice(codeDigits.length);
          if (!isControlledCode) { setInternalCode(option.dialCode); }
          onDialCodeChange?.(option.dialCode);
          break;
        }
      }

      onValueChange(digits.slice(0, maxDigits));
    };

    const hasError = !!error;

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

    return (
      <Stack gap="xs" style={containerStyle}>
        {label && (
          <Text variant="label" style={{ color: labelColor }}>
            {label}
          </Text>
        )}

        {/* ── Input row ── */}
        <View
          style={[
            styles.inputRow,
            {
              borderColor,
              backgroundColor: disabled
                ? theme.colors.disabled
                : theme.colors.inputBackground,
            },
          ]}>

          {/* Country code selector — shows dial code only */}
          <Pressable
            onPress={showPicker ? () => setPickerVisible(true) : undefined}
            disabled={disabled}
            accessibilityRole={showPicker ? 'button' : 'none'}
            accessibilityLabel={`Dial code ${selectedCode}. ${showPicker ? 'Tap to change.' : ''}`}
            style={[
              styles.dialCodeArea,
              { borderRightColor: theme.colors.inputBorder },
            ]}>
            <Text
              variant="label"
              style={{ color: disabled ? theme.colors.textDisabled : theme.colors.textPrimary }}>
              {selectedCode}
            </Text>
            {showPicker && (
              <Text
                variant="caption"
                style={[styles.chevron, { color: theme.colors.textSecondary }]}>
                ▾
              </Text>
            )}
          </Pressable>

          {/* Phone number field */}
          {/* maxLength is intentionally omitted — handleChangeText clips to maxDigits
              after stripping the country code, so a pasted full-international number
              (e.g. +918789338305) is correctly stripped before being truncated. */}
          <RNTextInput
            ref={ref}
            testID={testID}
            value={value}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.inputPlaceholder}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            importantForAutofill="yes"
            editable={!disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            accessibilityLabel={label ?? 'Phone number'}
            accessibilityState={{ disabled }}
            style={[
              typography.body,
              styles.input,
              { color: disabled ? theme.colors.textDisabled : theme.colors.textPrimary },
            ]}
          />
        </View>

        {/* Error / helper row */}
        {(hasError || helperText) && (
          <Text
            variant="caption"
            color={hasError ? 'error' : 'textTertiary'}
            accessibilityLiveRegion={hasError ? 'polite' : undefined}>
            {error || helperText}
          </Text>
        )}

        {/* Country code picker modal */}
        <PickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          showCloseButton={false}
          accessibilityLabel="Select country"
          maxWidth="narrow">
          <Text variant="label" color="textSecondary">
            Select country
          </Text>
          {/* Negative margins negate the shared Modal's padding so items reach card edges */}
          <View style={styles.pickerListWrapper}>
            <ScrollView
              style={styles.pickerList}
              bounces={false}
              showsVerticalScrollIndicator={false}>
              {normalizedCountries.map(option => {
                const isSelected = option.dialCode === selectedCode;
                return (
                  <Pressable
                    key={option.dialCode}
                    onPress={() => selectCode(option)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${option.name ?? option.dialCode}`}
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.pickerItem,
                      isSelected && {
                        backgroundColor: rgba(theme.colors.primary, 0.08),
                      },
                    ]}>
                    {/* Country name (shown only when provided) */}
                    {option.name ? (
                      <View style={styles.pickerItemContent}>
                        <Text
                          variant="body"
                          style={[
                            isSelected ? styles.itemTextSelected : styles.itemTextDefault,
                            { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                          ]}>
                          {option.name}
                        </Text>
                        <Text variant="caption" color="textSecondary">
                          {option.dialCode}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        variant="body"
                        style={[
                          isSelected ? styles.itemTextSelected : styles.itemTextDefault,
                          { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                        ]}>
                        {option.dialCode}
                      </Text>
                    )}
                    {isSelected && (
                      <Text variant="body" style={{ color: theme.colors.primary }}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </PickerModal>
      </Stack>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';


const PICKER_MAX_HEIGHT = sizes.actionSheetMaxHeight / 2;

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.md,
    // Always borders.medium — stable layout, only color changes on focus.
    borderWidth: borders.medium,
    overflow: 'hidden',
    minHeight: sizes.inputMd,
  },
  dialCodeArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    borderRightWidth: borders.thin,
    minWidth: iconSizes.hero, // 48px — prevents collapse on short codes
  },
  chevron: {
    lineHeight: iconSizes.action,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'center', // Android: keep text centered in the row
  },
  pickerListWrapper: {
    // Negate the shared Modal's padding so list items reach the card edges
    marginHorizontal: spacing.negXl,
    marginBottom: spacing.negXl,
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  pickerList: {
    maxHeight: PICKER_MAX_HEIGHT,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pickerItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemTextSelected: {
    fontWeight: '600',
  },
  itemTextDefault: {
    fontWeight: 'normal',
  },
});
