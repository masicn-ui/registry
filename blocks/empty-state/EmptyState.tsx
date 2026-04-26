import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Text, layout, sizes, spacing } from '../../../masicn';
import { Button } from '../../components';

export interface EmptyStateProps {
  /** Main title */
  title: string;
  /** Description text shown below the title */
  description?: string;
  /** Icon or illustration rendered above the title — accepts an emoji string or any text (default "📭") */
  icon?: string;
  /** Label for the primary call-to-action button; button is hidden when omitted */
  actionLabel?: string;
  /** Callback fired when the action button is pressed; button is hidden when omitted */
  onAction?: () => void;
  /** Additional container style */
  containerStyle?: ViewStyle;
  /** Test identifier — forwarded as `${testID}-action` to the action button. */
  testID?: string;
}

/**
 * EmptyState — a centred placeholder shown when a list or view has no content.
 *
 * Renders a large icon (emoji or text), a heading, an optional description,
 * and an optional primary call-to-action button. Both `actionLabel` and
 * `onAction` must be provided together for the button to appear.
 *
 * Use this component in place of an empty list, search results with no matches,
 * or any screen that has no data to show yet.
 *
 * @example
 * // Basic empty list
 * <EmptyState
 *   title="No tasks yet"
 *   description="Tap the button below to create your first task."
 *   actionLabel="Create task"
 *   onAction={handleCreate}
 * />
 *
 * @example
 * // Custom icon, no action
 * <EmptyState
 *   icon="🔍"
 *   title="No results found"
 *   description="Try adjusting your search terms."
 * />
 *
 * @example
 * // Error state with retry action
 * <EmptyState
 *   icon="⚠️"
 *   title="Failed to load"
 *   description="Check your internet connection and try again."
 *   actionLabel="Retry"
 *   onAction={refetch}
 * />
 *
 * @example
 * // No notifications placeholder with custom container style
 * <EmptyState
 *   icon="🔔"
 *   title="All caught up"
 *   description="You have no new notifications."
 *   containerStyle={{ flex: 1, justifyContent: 'center' }}
 * />
 */
export const EmptyState = React.memo(function EmptyState({
  title,
  description,
  icon = '📭',
  actionLabel,
  onAction,
  containerStyle,
  testID,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text variant="h3" color="textPrimary" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text
          variant="body"
          color="textSecondary"
          align="center"
          style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onPress={onAction}
          containerStyle={styles.action}
          testID={testID ? `${testID}-action` : undefined}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  icon: {
    fontSize: sizes.emptyStateIcon,
    lineHeight: sizes.emptyStateIconLineHeight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    marginBottom: spacing.xl,
    maxWidth: layout.contentMaxWidth,
  },
  action: {
    marginTop: spacing.md,
  },
});
