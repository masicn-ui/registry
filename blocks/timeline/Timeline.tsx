
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, spacing, radius, borders, sizes } from '@masicn/ui';
import { Text } from '@/components/ui/Text';

export interface TimelineItem {
  /** Item title */
  title: string;
  /** Item description */
  description?: string;
  /** Timestamp or date */
  timestamp?: string;
  /** Optional icon (emoji or text) */
  icon?: string;
  /** Item status color */
  status?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

interface TimelineProps {
  /** Timeline items */
  items: TimelineItem[];
  /** Show connecting line */
  showLine?: boolean;
}

/**
 * Timeline component for displaying events in chronological order
 * Vertical layout with dots and connecting lines
 */
export function Timeline({ items, showLine = true }: TimelineProps) {
  const { theme } = useTheme();

  const getStatusColor = (status?: TimelineItem['status']) => {
    switch (status) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const statusColor = getStatusColor(item.status);

        return (
          <View key={index} style={styles.itemContainer}>
            <View style={styles.leftColumn}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: statusColor,
                    borderColor: theme.colors.surfacePrimary,
                  },
                ]}>
                {item.icon && (
                  <Text variant="captionSmall" style={styles.icon}>
                    {item.icon}
                  </Text>
                )}
              </View>
              {showLine && !isLast && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: theme.colors.borderSecondary },
                  ]}
                />
              )}
            </View>
            <View style={[styles.content, isLast && styles.contentLast]}>
              <View style={styles.header}>
                <Text variant="body" style={styles.title}>
                  {item.title}
                </Text>
                {item.timestamp && (
                  <Text variant="caption" color="textTertiary">
                    {item.timestamp}
                  </Text>
                )}
              </View>
              {item.description && (
                <Text variant="bodySmall" color="textSecondary" style={styles.description}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  itemContainer: {
    flexDirection: 'row',
  },
  leftColumn: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dot: {
    width: sizes.sliderThumb,
    height: sizes.sliderThumb,
    borderRadius: radius.full,
    borderWidth: borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  icon: {
    fontSize: sizes.controlSm / 2,
  },
  line: {
    width: borders.medium,
    flex: 1,
    marginTop: spacing.xxs,
  },
  content: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  contentLast: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xxs,
  },
});
