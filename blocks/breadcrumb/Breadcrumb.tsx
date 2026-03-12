
import React from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme, spacing } from '@masicn/ui';
import { Text } from '@/components/ui/Text';

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** If provided, the item is pressable */
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
 * Breadcrumb — horizontal navigation trail.
 * The last item is treated as the current page (non-pressable, primary text).
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
