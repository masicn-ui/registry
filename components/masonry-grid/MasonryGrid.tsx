import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native';
import { spacing } from '../../../masicn'

interface MasonryGridProps<T> {
  /** Number of columns */
  columns?: number;
  /** Gap between items */
  gap?: keyof typeof spacing;
  /** Array of items to render */
  data: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Additional container style */
  style?: ViewStyle;
  /** Key extractor */
  keyExtractor?: (item: T, index: number) => string;
}

/**
 * MasonryGrid — a Pinterest-style multi-column layout that balances items across
 * columns based on measured item heights.
 *
 * Items are distributed greedily: each new item is placed into the column whose
 * cumulative height is currently the smallest, creating a visually balanced
 * staggered grid. Heights are captured via `onLayout` and the distribution
 * recalculates whenever they change.
 *
 * The component is fully generic (`MasonryGrid<T>`) so `data`, `renderItem`, and
 * `keyExtractor` are all type-safe.
 *
 * Note: Because column distribution depends on layout measurements, items may
 * reposition after the first render. Avoid using this inside a `ScrollView`
 * without a fixed container height, as `onLayout` requires a bounded parent.
 *
 * @example
 * <MasonryGrid
 *   data={photos}
 *   columns={2}
 *   gap="sm"
 *   keyExtractor={(item) => item.id}
 *   renderItem={(item) => (
 *     <Image source={{ uri: item.url }} style={{ height: item.height }} />
 *   )}
 * />
 */
export function MasonryGrid<T>({
  columns = 2,
  gap = 'md',
  data,
  renderItem,
  style,
  keyExtractor = (_, index) => `masonry-item-${index}`,
}: MasonryGridProps<T>) {
  const [itemHeights, setItemHeights] = useState<Map<string, number>>(new Map());

  const gapValue = spacing[gap];

  // Distribute items across columns based on current heights
  const distributeItems = useCallback(() => {
    const columnItems: Array<Array<{ item: T; index: number; key: string }>> = Array(columns)
      .fill(null)
      .map(() => []);
    const heights = Array(columns).fill(0);

    data.forEach((item, index) => {
      const key = keyExtractor(item, index);
      const itemHeight = itemHeights.get(key) || 0;

      // Find column with minimum height
      const minHeightIndex = heights.indexOf(Math.min(...heights));
      columnItems[minHeightIndex].push({ item, index, key });
      heights[minHeightIndex] += itemHeight + gapValue;
    });

    return columnItems;
  }, [data, columns, itemHeights, keyExtractor, gapValue]);

  const handleItemLayout = useCallback(
    (key: string) => (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      setItemHeights((prev) => {
        const newMap = new Map(prev);
        newMap.set(key, height);
        return newMap;
      });
    },
    []
  );

  const columnItems = distributeItems();

  return (
    <View style={[styles.container, { gap: gapValue }, style]}>
      {columnItems.map((items, columnIndex) => (
        <View
          key={`column-${columnIndex}`}
          style={styles.column}>
          {items.map(({ item, index, key }, itemIndex) => (
            <View
              key={key}
              onLayout={handleItemLayout(key)}
              style={itemIndex > 0 ? { marginTop: gapValue } : undefined}>
              {renderItem(item, index)}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
});
