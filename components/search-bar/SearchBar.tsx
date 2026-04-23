import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { borders, fonts, iconSizes, radius, sizes, spacing, typography, useTheme, type IconComponent, SearchIcon, XIcon } from '../../../masicn';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChangeText: (text: string) => void;
  /** Callback when clear button is pressed */
  onClear?: () => void;
  /** Callback when search is submitted */
  onSearch?: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional container style */
  containerStyle?: ViewStyle;
  /** Custom search icon component. Defaults to SearchIcon. */
  searchIcon?: IconComponent;
  /** Border radius override. Defaults to radius.full (pill). */
  borderRadius?: number;
  /** Test identifier; clear button receives `{testID}-clear`. */
  testID?: string;
}

/**
 * SearchBar — a styled text input designed for search interactions.
 *
 * Renders a pill-shaped input row with a leading search icon, a native text
 * field, and an "×" clear button that appears whenever the field is non-empty.
 * Pressing the clear button sets `value` to `''` via `onChangeText` and also
 * calls the optional `onClear` callback. Submitting the keyboard's search action
 * triggers `onSearch` with the current value.
 *
 * All standard `TextInputProps` (except `style`, which is controlled internally)
 * are forwarded to the underlying `RNTextInput` for full customisation.
 *
 * @example
 * const [query, setQuery] = React.useState('');
 *
 * <SearchBar
 *   value={query}
 *   onChangeText={setQuery}
 *   onSearch={(text) => fetchResults(text)}
 *   placeholder="Search products…"
 * />
 */
export function SearchBar({
  value,
  onChangeText,
  onClear,
  onSearch,
  placeholder = 'Search...',
  containerStyle,
  searchIcon: SearchIconProp = SearchIcon,
  borderRadius: borderRadiusProp,
  testID,
  onFocus,
  onBlur,
  ...textInputProps
}: SearchBarProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const handleSubmit = () => {
    onSearch?.(value);
  };

  const borderColor = focused
    ? theme.colors.borderFocused
    : theme.colors.inputBorder;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.inputBackground,
          borderColor,
          borderRadius: borderRadiusProp ?? radius.full,
        },
        containerStyle,
      ]}>
      <SearchIconProp size={iconSizes.action} color={theme.colors.inputPlaceholder} />
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inputPlaceholder}
        underlineColorAndroid="transparent"
        testID={testID}
        style={[
          styles.input,
          { color: theme.colors.textPrimary },
        ]}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...textInputProps}
      />
      <Pressable
        onPress={handleClear}
        style={[styles.clearButton, value.length === 0 && styles.clearButtonHidden]}
        hitSlop={spacing.sm}
        accessibilityRole="button"
        accessibilityLabel="Clear search"
        pointerEvents={value.length > 0 ? 'auto' : 'none'}
        testID={testID ? `${testID}-clear` : undefined}>
        <XIcon size={iconSizes.action} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: borders.thin,
    gap: spacing.sm,
    height: sizes.inputLg,
  },
  input: {
    flex: 1,
    padding: spacing.none,
    margin: spacing.none,
    fontFamily: fonts.ui.regular,
    fontSize: typography.body.fontSize,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearButtonHidden: {
    opacity: 0,
  },
});
