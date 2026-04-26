import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TextInput as RNTextInput,
  type ViewStyle,
} from 'react-native';
import { Text, borders, iconSizes, radius, spacing, typography, useFocusTrap, useTheme, ChevronUpIcon, ChevronDownIcon } from '../../../masicn';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface SelectProps {
  /** Current selected value */
  value: string;
  /** Callback when selection changes */
  onValueChange: (value: string) => void;
  /** Options to display */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Optional label */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Custom trigger — receives selected option for rendering */
  children?: (selectedOption: SelectOption | undefined) => React.ReactNode;
  /**
   * Custom option row renderer — receives option + selected state.
   * Replaces the default label/description layout.
   */
  renderItem?: (option: SelectOption, selected: boolean) => React.ReactNode;
  /** Show a search input inside the picker to filter options */
  searchable?: boolean;
  /** Accessibility label (defaults to label prop) */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Test identifier for automated testing */
  testID?: string;
}

/**
 * Select — controlled dropdown picker with a modal option list.
 *
 * Supports optional search filtering, custom trigger rendering via a children
 * render prop, custom option row rendering, error states, and focus trapping
 * inside the picker modal for accessibility.
 *
 * @example
 * // Basic controlled select
 * const [country, setCountry] = useState('');
 * <Select
 *   label="Country"
 *   value={country}
 *   onValueChange={setCountry}
 *   options={[
 *     { label: 'Australia', value: 'au' },
 *     { label: 'New Zealand', value: 'nz' },
 *   ]}
 * />
 *
 * @example
 * // Searchable select
 * <Select
 *   label="City"
 *   value={city}
 *   onValueChange={setCity}
 *   options={cities}
 *   searchable
 *   placeholder="Search cities…"
 * />
 *
 * @example
 * // Custom trigger via children render prop
 * <Select value={role} onValueChange={setRole} options={roles}>
 *   {(selected) => (
 *     <Chip label={selected?.label ?? 'Pick a role'} />
 *   )}
 * </Select>
 *
 * @example
 * // Error state with validation message
 * <Select
 *   label="Priority"
 *   value={priority}
 *   onValueChange={setPriority}
 *   options={priorityOptions}
 *   error={!priority}
 *   errorMessage="Please select a priority"
 * />
 */
const Select = React.forwardRef<View, SelectProps>(function Select(
  {
    value,
    onValueChange,
    options,
    placeholder = 'Select an option',
    label,
    disabled = false,
    error = false,
    errorMessage,
    containerStyle,
    children,
    renderItem,
    searchable = false,
    accessibilityLabel,
    accessibilityHint,
    testID,
  },
  ref,
) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { containerRef } = useFocusTrap({ active: isOpen });

  const selectedOption = React.useMemo(
    () => options.find(opt => opt.value === value),
    [options, value],
  );

  const filteredOptions = React.useMemo(
    () =>
      searchable && query
        ? options.filter(opt => opt.label.toLowerCase().includes(query.toLowerCase()))
        : options,
    [searchable, query, options],
  );

  const handleSelect = React.useCallback((optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setQuery('');
  }, [onValueChange]);

  const handleOpen = React.useCallback(() => {
    if (!disabled) {
      setQuery('');
      setIsOpen(true);
    }
  }, [disabled]);

  const resolvedA11yLabel = accessibilityLabel ?? label ?? placeholder;

  return (
    <View ref={ref} style={[styles.container, containerStyle]}>
      {label && (
        <Text
          variant="body"
          color={disabled ? 'textDisabled' : 'textPrimary'}
          style={styles.label}>
          {label}
        </Text>
      )}
      {children ? (
        <Pressable
          onPress={handleOpen}
          disabled={disabled}
          testID={testID}
          accessibilityRole="combobox"
          accessibilityLabel={resolvedA11yLabel}
          accessibilityHint={accessibilityHint ?? 'Double tap to open selection'}
          accessibilityState={{ disabled, expanded: isOpen }}>
          {children(selectedOption)}
        </Pressable>
      ) : (
        <Pressable
          onPress={handleOpen}
          disabled={disabled}
          testID={testID}
          style={[
            styles.select,
            {
              backgroundColor: theme.colors.inputBackground,
              borderColor: error
                ? theme.colors.error
                : disabled
                  ? theme.colors.borderSecondary
                  : theme.colors.inputBorder,
            },
          ]}
          accessibilityRole="combobox"
          accessibilityLabel={resolvedA11yLabel}
          accessibilityHint={accessibilityHint ?? 'Double tap to open selection'}
          accessibilityState={{ disabled, expanded: isOpen }}>
          <Text
            variant="body"
            color={
              selectedOption
                ? disabled
                  ? 'textDisabled'
                  : 'textPrimary'
                : 'inputPlaceholder'
            }>
            {selectedOption?.label || placeholder}
          </Text>
          {isOpen
            ? <ChevronUpIcon size={iconSizes.action} color={theme.colors.textSecondary} />
            : <ChevronDownIcon size={iconSizes.action} color={theme.colors.textSecondary} />}
        </Pressable>
      )}
      {error && errorMessage && (
        <Text
          variant="caption"
          color="error"
          style={styles.errorText}
          accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => { setIsOpen(false); setQuery(''); }}>
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
          onPress={() => { setIsOpen(false); setQuery(''); }}>
          <View
            ref={containerRef}
            onStartShouldSetResponder={() => true}
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surfacePrimary },
            ]}
            accessibilityRole="list"
            accessibilityViewIsModal={true}
            accessibilityLabel={`${label ?? 'Select'} options`}>
            {searchable && (
              <View style={[styles.searchContainer, { borderBottomColor: theme.colors.separator }]}>
                <RNTextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search…"
                  placeholderTextColor={theme.colors.inputPlaceholder}
                  autoFocus
                  style={[
                    typography.body,
                    styles.searchInput,
                    { color: theme.colors.textPrimary },
                  ]}
                />
              </View>
            )}
            <ScrollView>
              {filteredOptions.map(option => (
                <Pressable
                  key={option.value}
                  onPress={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  style={[
                    styles.option,
                    value === option.value && { backgroundColor: theme.colors.highlight },
                  ]}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: value === option.value, disabled: option.disabled }}
                  accessibilityLabel={option.label}>
                  {renderItem ? (
                    renderItem(option, value === option.value)
                  ) : (
                    <>
                      <View style={styles.optionContent}>
                        <Text
                          variant="body"
                          color={
                            option.disabled
                              ? 'textDisabled'
                              : value === option.value
                                ? 'primary'
                                : 'textPrimary'
                          }>
                          {option.label}
                        </Text>
                        {option.description && (
                          <Text
                            variant="caption"
                            color={option.disabled ? 'textDisabled' : 'textSecondary'}
                            style={styles.optionDescription}>
                            {option.description}
                          </Text>
                        )}
                      </View>
                      {value === option.value && (
                        <Text variant="body" color="primary">✓</Text>
                      )}
                    </>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

Select.displayName = 'Select';

export { Select };
export type { SelectProps };

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    marginBottom: spacing.xxs,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: borders.thin,
  },
  errorText: {
    marginTop: spacing.xxs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: radius.xl,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  searchContainer: {
    borderBottomWidth: borders.thin,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  optionContent: {
    flex: 1,
  },
  optionDescription: {
    marginTop: spacing.xxs,
  },
});
