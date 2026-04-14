import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native';
import { spacing } from '../../../masicn'

export interface MasonryGridProps<T> {
  /** Number of columns */
  columns?: number;
  /** Gap between items */
  gap?: keyof typeof spacing;
  /** Array of items to render */
  data: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Optional height provider for each item. When supplied, the grid distributes
   * items using these heights on the first render, avoiding the layout-measurement
   * reflow that otherwise happens when heights are unknown.
   *
   * Ideal when item dimensions are known ahead of time (e.g. from an API response).
   * Falls back to `onLayout` measurement for any item that returns 0 or undefined.
   */
  getItemHeight?: (item: T, index: number) => number;
  /** Additional container style */
  style?: ViewStyle;
  /** Key extractor */
  keyExtractor?: (item: T, index: number) => string;
  /** Test identifier forwarded to each item wrapper as `{testID}-item-{index}`. */
  testID?: string;
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
  getItemHeight,
  style,
  keyExtractor = (_, index) => `masonry-item-${index}`,
  testID,
}: MasonryGridProps<T>) {
  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());

  const gapValue = spacing[gap];

  // Distribute items across columns based on known or measured heights
  const distributeItems = useCallback(() => {
    const columnItems: Array<Array<{ item: T; index: number; key: string }>> = Array(columns)
      .fill(null)
      .map(() => []);
    const heights = Array(columns).fill(0);

    data.forEach((item, index) => {
      const key = keyExtractor(item, index);
      // Prefer caller-supplied height, then fall back to measured height
      const knownHeight = getItemHeight ? getItemHeight(item, index) : 0;
      const itemHeight = knownHeight > 0 ? knownHeight : (measuredHeights.get(key) || 0);

      // Find column with minimum height
      const minHeightIndex = heights.indexOf(Math.min(...heights));
      columnItems[minHeightIndex].push({ item, index, key });
      heights[minHeightIndex] += itemHeight + gapValue;
    });

    return columnItems;
  }, [data, columns, measuredHeights, getItemHeight, keyExtractor, gapValue]);

  const handleItemLayout = useCallback(
    (key: string) => (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      setMeasuredHeights((prev) => {
        if (prev.get(key) === height) { return prev; }
        const newMap = new Map(prev);
        newMap.set(key, height);
        return newMap;
      });
    },
    []
  );

  const columnItems = distributeItems();

  return (
    <View style={[styles.container, { gap: gapValue }, style]} accessibilityRole="list">
      {columnItems.map((items, columnIndex) => (
        <View
          key={`column-${columnIndex}`}
          style={styles.column}>
          {items.map(({ item, index, key }, itemIndex) => (
            <View
              key={key}
              onLayout={handleItemLayout(key)}
              testID={testID ? `${testID}-item-${index}` : undefined}
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
