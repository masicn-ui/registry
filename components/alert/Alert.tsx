import React from 'react';
import { View, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import {
  Text,
  borders,
  iconSizes,
  opacity as opacityTokens,
  radius,
  spacing,
  useTheme,
  CheckIcon,
  XIcon,
  WarningIcon,
  InfoIcon,
} from '../../../masicn';

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
  /** Additional style applied to the alert container. Alias: `containerStyle`. */
  style?: ViewStyle;
  /** Additional style applied to the alert container. */
  containerStyle?: ViewStyle;
  /** Custom icon element to override the default variant icon. */
  icon?: React.ReactNode;
  /** Test identifier forwarded to the alert container. */
  testID?: string;
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
 *
 * @example
 * // Info alert with a custom icon
 * <Alert
 *   variant="info"
 *   title="New features available"
 *   description="Update to version 2.0 to unlock the latest improvements."
 *   icon={<SparkleIcon />}
 * />
 *
 * @example
 * // Warning without description — compact single-line layout
 * <Alert variant="warning" title="Low storage space" />
 */
export const Alert = React.memo(function Alert({
  variant,
  title,
  description,
  dismissible = false,
  onDismiss,
  style,
  containerStyle,
  icon,
  testID,
}: AlertProps) {
  const { theme } = useTheme();

  const variantMap = {
    success: {
      bg: theme.colors.success,
      text: theme.colors.onSuccess,
      Icon: CheckIcon,
    },
    error: { bg: theme.colors.error, text: theme.colors.onError, Icon: XIcon },
    warning: {
      bg: theme.colors.warning,
      text: theme.colors.onWarning,
      Icon: WarningIcon,
    },
    info: { bg: theme.colors.info, text: theme.colors.onInfo, Icon: InfoIcon },
  } as const;

  const { bg, text, Icon: DefaultIcon } = variantMap[variant];
  const resolvedIcon =
    icon !== undefined ? (
      icon
    ) : (
      <DefaultIcon size={iconSizes.action} color={text} />
    );

  return (
    <View
      accessibilityRole="alert"
      testID={testID}
      style={[
        styles.container,
        { backgroundColor: bg, borderColor: bg },
        style,
        containerStyle,
      ]}
    >
      {resolvedIcon && (
        <View style={styles.icon}>
          {typeof resolvedIcon === 'string' ? (
            <Text style={{ color: text }}>{resolvedIcon}</Text>
          ) : (
            resolvedIcon
          )}
        </View>
      )}
      <View style={styles.content}>
        <Text variant="body" bold style={{ color: text }}>
          {title}
        </Text>
        {description && (
          <Text
            variant="bodySmall"
            style={[styles.description, { color: text }]}
          >
            {description}
          </Text>
        )}
      </View>
      {dismissible && onDismiss && (
        <Pressable
          onPress={onDismiss}
          style={styles.closeButton}
          hitSlop={spacing.sm}
          accessibilityRole="button"
          accessibilityLabel="Dismiss alert"
          accessibilityHint="Removes this alert"
        >
          <XIcon size={iconSizes.action} color={text} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: borders.thin,
    gap: spacing.sm,
  },
  icon: { alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: spacing.xs },
  description: { opacity: opacityTokens.hover },
  closeButton: { padding: spacing.xxs },
});
