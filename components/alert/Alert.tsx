import React from 'react';
import { View, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { Text, borders, opacity as opacityTokens, radius, spacing, useTheme } from '../../../masicn';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  /** Semantic variant controlling background and icon colour — 'success', 'error', 'warning', or 'info'. Required. */
  variant: AlertVariant;
  /** Bold heading text displayed in the alert. Required. */
  title: string;
  /** Optional body copy rendered below `title` at a slightly reduced opacity. */
  description?: string;
  /** When true and `onDismiss` is also provided, a dismiss (×) button is shown on the right. Defaults to false. */
  dismissible?: boolean;
  /** Callback fired when the user presses the dismiss button. Only relevant when `dismissible` is true. */
  onDismiss?: () => void;
  /** Additional style applied to the alert container. */
  containerStyle?: ViewStyle;
  /** Custom icon character (emoji or unicode) to override the default variant icon. */
  icon?: string;
}

/**
 * Alert — an inline feedback banner for communicating status to the user.
 *
 * Renders with a semantically appropriate background and icon for each
 * variant: success (green ✓), error (red ✕), warning (amber ⚠), and info
 * (blue ℹ). The icon can be replaced with a custom character via the `icon`
 * prop. When `dismissible` is true and `onDismiss` is provided, a close
 * button appears on the right.
 *
 * @example
 * // Success alert
 * <Alert variant="success" title="Saved!" description="Your changes have been saved." />
 *
 * @example
 * // Dismissible error
 * <Alert
 *   variant="error"
 *   title="Something went wrong"
 *   description={error.message}
 *   dismissible
 *   onDismiss={clearError}
 * />
 */
export function Alert({
  variant,
  title,
  description,
  dismissible = false,
  onDismiss,
  containerStyle,
  icon,
}: AlertProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: theme.colors.success, text: theme.colors.onSuccess, icon: '✓' };
      case 'error':
        return { bg: theme.colors.error, text: theme.colors.onError, icon: '✕' };
      case 'warning':
        return { bg: theme.colors.warning, text: theme.colors.onWarning, icon: '⚠' };
      case 'info':
        return { bg: theme.colors.info, text: theme.colors.onInfo, icon: 'ℹ' };
    }
  };

  const colors = getColors();
  const displayIcon = icon !== undefined ? icon : colors.icon;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderColor: colors.bg },
        containerStyle,
      ]}>
      {displayIcon && (
        <Text variant="bodyLarge" style={[styles.icon, { color: colors.text }]}>
          {displayIcon}
        </Text>
      )}
      <View style={styles.content}>
        <Text variant="body" bold style={{ color: colors.text }}>
          {title}
        </Text>
        {description && (
          <Text variant="bodySmall" style={[styles.description, { color: colors.text }]}>
            {description}
          </Text>
        )}
      </View>
      {dismissible && onDismiss && (
        <Pressable onPress={onDismiss} style={styles.closeButton} hitSlop={spacing.sm}>
          <Text variant="body" style={{ color: colors.text }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: borders.thin,
    gap: spacing.sm,
  },
  icon: { marginTop: spacing.xxs },
  content: { flex: 1, gap: spacing.xs },
  description: { opacity: opacityTokens.hover },
  closeButton: { padding: spacing.xxs },
});
