import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Text, borders, fonts, iconSizes, radius, sizes, spacing, typography, useTheme } from '../../../masicn'

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
  /** Custom search icon */
  searchIcon?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  onSearch,
  placeholder = 'Search...',
  containerStyle,
  searchIcon = '🔍',
  ...textInputProps
}: SearchBarProps) {
  const { theme } = useTheme();

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const handleSubmit = () => {
    onSearch?.(value);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.inputBackground,
          borderColor: theme.colors.inputBorder,
        },
        containerStyle,
      ]}>
      <Text variant="body" style={styles.icon}>
        {searchIcon}
      </Text>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inputPlaceholder}
        style={[
          styles.input,
          { color: theme.colors.textPrimary },
        ]}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        {...textInputProps}
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={spacing.sm}>
          <Text variant="body" color="textSecondary">
            ✕
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: borders.thin,
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
  },
  icon: {
    fontSize: iconSizes.default,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontFamily: fonts.ui.regular,
    fontSize: typography.body.fontSize,
  },
  clearButton: {
    padding: spacing.xs,
  },
});
