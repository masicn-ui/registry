import React, { useCallback } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Text, spacing, useTheme } from '../../../masicn';
import { Checkbox } from '../checkbox/Checkbox';

export interface CheckboxGroupOption {
  /** Display label for the checkbox option. */
  label: string;
  /** Unique value string that will be included in / excluded from the selected array. */
  value: string;
  /** Optional descriptive sub-text rendered below the label. */
  description?: string;
  /** Disables this individual option regardless of the group-level `disabled` prop. */
  disabled?: boolean;
}

interface CheckboxGroupProps {
  /** List of selectable options to render as checkboxes. */
  options: CheckboxGroupOption[];
  /** Currently selected option values (controlled). */
  value: string[];
  /** Called with the updated selection array whenever an option is toggled. */
  onValueChange: (value: string[]) => void;
  /** Group heading label rendered above all checkboxes. */
  label?: string;
  /** Validation error message shown below the group; turns the label red when set. */
  error?: string;
  /** Helper text shown below the group when there is no error. */
  helperText?: string;
  /** Disables all checkboxes in the group. Individual options may also carry their own `disabled` flag. Defaults to false. */
  disabled?: boolean;
  /** Additional style applied to the outer container. Alias: `containerStyle`. */
  style?: ViewStyle;
  /** Additional style applied to the outer container. */
  containerStyle?: ViewStyle;
}

/**
 * CheckboxGroup — a labelled list of checkboxes backed by a multi-select value array.
 *
 * Manages the toggle logic (add/remove from the array) internally and
 * exposes the updated array via `onValueChange`. Supports a group label,
 * validation error state, helper text, and per-option or group-wide disabled
 * state.
 *
 * @example
 * const [selected, setSelected] = useState<string[]>([]);
 * <CheckboxGroup
 *   label="Interests"
 *   options={[
 *     { label: 'Design', value: 'design' },
 *     { label: 'Engineering', value: 'eng' },
 *     { label: 'Marketing', value: 'mkt', disabled: true },
 *   ]}
 *   value={selected}
 *   onValueChange={setSelected}
 * />
 *
 * @example
 * // Pre-selected options
 * const [perms, setPerms] = useState(['read', 'write']);
 * <CheckboxGroup
 *   label="Permissions"
 *   options={[
 *     { label: 'Read', value: 'read' },
 *     { label: 'Write', value: 'write' },
 *     { label: 'Delete', value: 'delete' },
 *   ]}
 *   value={perms}
 *   onValueChange={setPerms}
 * />
 *
 * @example
 * // Group-wide disabled state
 * <CheckboxGroup
 *   label="Features (read-only)"
 *   options={features.map(f => ({ label: f.name, value: f.id }))}
 *   value={enabledFeatures}
 *   onValueChange={() => {}}
 *   disabled
 * />
 *
 * @example
 * // With error and helper text
 * <CheckboxGroup
 *   label="Notifications"
 *   options={notificationOptions}
 *   value={selected}
 *   onValueChange={setSelected}
 *   error={selected.length === 0 ? 'Select at least one' : undefined}
 *   helperText="Choose what you want to be notified about"
 * />
 */
export function CheckboxGroup({
  options,
  value,
  onValueChange,
  label,
  error,
  helperText,
  disabled = false,
  style,
  containerStyle,
}: CheckboxGroupProps) {
  const { theme } = useTheme();
  const hasError = !!error;

  const toggle = useCallback(
    (optValue: string) => {
      if (value.includes(optValue)) {
        onValueChange(value.filter(v => v !== optValue));
      } else {
        onValueChange([...value, optValue]);
      }
    },
    [value, onValueChange],
  );

  return (
    <View style={[styles.container, style, containerStyle]}>
      {label && (
        <Text
          variant="label"
          style={{
            color: hasError ? theme.colors.error : theme.colors.textPrimary,
          }}
        >
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
          accessibilityLiveRegion={hasError ? 'polite' : undefined}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});
