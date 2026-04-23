import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Text, borders, radius, sizes, spacing, useTheme } from '../../../masicn';

export interface TimelineItem {
  /** Stable key for list reconciliation. Falls back to index when omitted. */
  id?: string;
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

export interface TimelineProps {
  /** Timeline items */
  items: TimelineItem[];
  /** Show connecting line */
  showLine?: boolean;
  /** Additional style applied to the outermost container. */
  containerStyle?: ViewStyle;
  /** Test identifier — forwarded as `${testID}-item-${index}` to each item. */
  testID?: string;
}

/**
 * Timeline — a vertical list of chronological events with status-coloured dots and connecting lines.
 *
 * Each item renders a coloured dot (driven by `status`), an optional icon inside the dot,
 * a title, timestamp, and description. Items are connected by a vertical line unless
 * `showLine` is false or the item is the last one.
 *
 * @example
 * <Timeline
 *   items={[
 *     { title: 'Order placed', timestamp: '9:00 AM', status: 'success' },
 *     { title: 'Payment confirmed', timestamp: '9:05 AM', status: 'success' },
 *     { title: 'Preparing', timestamp: '9:10 AM', status: 'info' },
 *     { title: 'Out for delivery', status: 'default' },
 *   ]}
 * />
 */
export const Timeline = React.memo(function Timeline({ items, showLine = true, containerStyle, testID }: TimelineProps) {
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
    <View style={[styles.container, containerStyle]} accessibilityRole="list" testID={testID}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const statusColor = getStatusColor(item.status);

        return (
          <View
            key={item.id ?? String(index)}
            style={styles.itemContainer}
            accessibilityRole="none"
            accessibilityLabel={`${item.title}${item.timestamp ? ', ' + item.timestamp : ''}`}
            testID={testID ? `${testID}-item-${index}` : undefined}
          >
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
});

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
