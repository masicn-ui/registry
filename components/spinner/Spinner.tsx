import React from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Text, spacing, useTheme } from '../../../masicn';

interface SpinnerProps {
  /** Size of the activity indicator. Defaults to `'large'`. */
  size?: 'small' | 'large';
  /** Optional text displayed below the spinner. When provided, the component is wrapped in a centred column layout. */
  label?: string;
  /** Overrides the spinner colour. Defaults to the theme primary colour. */
  color?: string;
  /** Additional styles applied to the outer container (or directly to the indicator when no label is provided). */
  style?: ViewStyle;
}

/**
 * A thin wrapper around React Native's `ActivityIndicator` that applies
 * the theme primary colour by default and optionally renders a label below
 * the spinner for full-screen loading states.
 *
 * @example
 * // Inline spinner
 * <Spinner size="small" />
 *
 * // Full-screen loading state
 * <Spinner label="Loading your data…" />
 *
 * @example
 * // Custom color matching a specific brand context
 * <Spinner size="small" color={theme.colors.secondary} />
 *
 * @example
 * // Spinner inside a button when submitting
 * {isSubmitting ? <Spinner size="small" /> : <Button onPress={submit}>Send</Button>}
 *
 * @example
 * // Centered in a screen as a fallback loading state
 * <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
 *   <Spinner label="Fetching results…" />
 * </View>
 */
export const Spinner = React.memo(function Spinner({
  size = 'large',
  label,
  color,
  style,
}: SpinnerProps) {
  const { theme } = useTheme();
  const spinnerColor = color || theme.colors.primary;

  if (label) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size={size} color={spinnerColor} />
        <Text variant="body" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      </View>
    );
  }

  return <ActivityIndicator size={size} color={spinnerColor} style={style} />;
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    marginTop: spacing.xs,
  },
});
