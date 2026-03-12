
import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { spacing, sizes, layout } from '@masicn/ui';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Icon or illustration (emoji or text) */
  icon?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Additional container style */
  containerStyle?: ViewStyle;
}

export function EmptyState({
  title,
  description,
  icon = '📭',
  actionLabel,
  onAction,
  containerStyle,
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
          containerStyle={styles.action}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

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
