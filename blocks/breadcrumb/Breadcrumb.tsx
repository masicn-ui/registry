import React from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Text, spacing, useTheme } from '../../../masicn';

/**
 * A single crumb in the breadcrumb trail.
 */
export interface BreadcrumbItem {
  /** Display label shown for this crumb. */
  label: string;
  /** If provided, the item is rendered as a pressable link that calls this handler. */
  onPress?: () => void;
}

interface BreadcrumbProps {
  /** Ordered list of breadcrumb items — last item is the current page */
  items: BreadcrumbItem[];
  /** Custom separator element (defaults to "/") */
  separator?: React.ReactNode;
  /** Container style */
  containerStyle?: ViewStyle;
}

/**
 * Breadcrumb — horizontal navigation trail showing the current page's hierarchy.
 *
 * Items are rendered left-to-right separated by "/" (or a custom `separator`).
 * The last item is always treated as the active/current page: it is non-pressable
 * and rendered in `textPrimary` colour. All preceding items that carry an
 * `onPress` handler are styled as links using the theme's `secondary` colour.
 *
 * The component wraps naturally if the total width exceeds the container.
 *
 * @example
 * <Breadcrumb
 *   items={[
 *     { label: 'Home',     onPress: () => router.push('/') },
 *     { label: 'Settings', onPress: () => router.push('/settings') },
 *     { label: 'Profile' },
 *   ]}
 * />
 */
export function Breadcrumb({
  items,
  separator,
  containerStyle,
}: BreadcrumbProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.row, containerStyle]}
      accessibilityRole="none"
      accessibilityLabel="Breadcrumb navigation">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <View key={i} style={styles.item}>
            {i > 0 && (
              <View style={styles.separator}>
                {separator ?? (
                  <Text variant="caption" color="textTertiary">
                    /
                  </Text>
                )}
              </View>
            )}
            {item.onPress && !isLast ? (
              <Pressable
                onPress={item.onPress}
                accessibilityRole="link"
                accessibilityLabel={item.label}>
                <Text
                  variant="caption"
                  style={{ color: theme.colors.secondary }}>
                  {item.label}
                </Text>
              </Pressable>
            ) : (
              <Text
                variant="caption"
                color={isLast ? 'textPrimary' : 'textTertiary'}>
                {item.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    marginHorizontal: spacing.xs,
  },
});
