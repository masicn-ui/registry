import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import {
  borders,
  fonts,
  iconSizes,
  radius,
  sizes,
  spacing,
  typography,
  useTheme,
  type IconComponent,
  SearchIcon,
  XIcon,
} from '../../../masicn';

type SearchBarSize = 'sm' | 'md' | 'lg';

const sizeConfig = {
  sm: { height: sizes.inputSm, paddingHorizontal: spacing.sm },
  md: { height: sizes.inputMd, paddingHorizontal: spacing.md },
  lg: { height: sizes.inputLg, paddingHorizontal: spacing.md },
} as const;

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
  /** Size preset — controls height and horizontal padding. @default 'md' */
  size?: SearchBarSize;
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
 *
 * @example
 * // Small compact search inside a header bar
 * <SearchBar
 *   value={query}
 *   onChangeText={setQuery}
 *   size="sm"
 *   placeholder="Filter…"
 * />
 *
 * @example
 * // Large search bar with custom icon and clear callback
 * <SearchBar
 *   value={query}
 *   onChangeText={setQuery}
 *   onClear={() => { setQuery(''); clearResults(); }}
 *   placeholder="Search people…"
 *   size="lg"
 *   searchIcon={PersonSearchIcon}
 * />
 *
 * @example
 * // Square-cornered search bar inside a modal header
 * <SearchBar
 *   value={query}
 *   onChangeText={setQuery}
 *   borderRadius={radius.md}
 *   placeholder="Search…"
 *   autoFocus
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
  size = 'md',
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
          height: sizeConfig[size].height,
          paddingHorizontal: sizeConfig[size].paddingHorizontal,
        },
        containerStyle,
      ]}
    >
      <SearchIconProp
        size={iconSizes.action}
        color={theme.colors.inputPlaceholder}
      />
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inputPlaceholder}
        underlineColorAndroid="transparent"
        testID={testID}
        style={[styles.input, { color: theme.colors.textPrimary }]}
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
        style={[
          styles.clearButton,
          value.length === 0 && styles.clearButtonHidden,
        ]}
        hitSlop={spacing.sm}
        accessibilityRole="button"
        accessibilityLabel="Clear search"
        pointerEvents={value.length > 0 ? 'auto' : 'none'}
        testID={testID ? `${testID}-clear` : undefined}
      >
        <XIcon size={iconSizes.action} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: borders.thin,
    gap: spacing.sm,
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
