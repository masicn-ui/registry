import React from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  StyleSheet,
  type FlatListProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { spacing, useTheme } from '../../../masicn';

interface RefreshableListProps<T> extends Omit<FlatListProps<T>, 'refreshControl'> {
  /** Array of items to render in the list. */
  data: T[];
  /** Function that renders each item. Follows the same signature as `FlatList` `renderItem`. */
  renderItem: FlatListProps<T>['renderItem'];
  /** Function that returns a stable key string for each item. */
  keyExtractor: FlatListProps<T>['keyExtractor'];
  /** Whether the list is currently refreshing (shows the native pull-to-refresh spinner). */
  refreshing: boolean;
  /** Called when the user pulls down to trigger a refresh. */
  onRefresh: () => void;
  /**
   * When true, renders a themed separator line between items.
   * Ignored when `ItemSeparatorComponent` is provided. Defaults to false.
   */
  showSeparator?: boolean;
  /**
   * Color of the separator line. Defaults to the theme's `borderSecondary` color.
   * Only used when `showSeparator` is true.
   */
  separatorColor?: string;
  /**
   * Convenience padding applied to the list's `contentContainerStyle`.
   * Useful for giving the list breathing room from screen edges.
   */
  contentPadding?: keyof typeof spacing;
  /** Style applied to the `FlatList` container itself. */
  style?: StyleProp<ViewStyle>;
}

/**
 * RefreshableList — a `FlatList` pre-configured with a themed pull-to-refresh
 * control.
 *
 * Wraps the native `FlatList` and injects a `RefreshControl` whose `tintColor`
 * and `colors` (Android) are automatically set to the theme's primary color.
 *
 * Optional `showSeparator` renders a themed divider between items. Pass
 * `contentPadding` to add uniform padding inside the scroll area.
 *
 * All other `FlatListProps` (excluding `refreshControl`, which is managed
 * internally) are forwarded as-is.
 *
 * @example
 * <RefreshableList
 *   data={items}
 *   keyExtractor={(item) => item.id}
 *   renderItem={({ item }) => <ItemRow item={item} />}
 *   refreshing={isRefreshing}
 *   onRefresh={handleRefresh}
 *   showSeparator
 *   contentPadding="md"
 * />
 */
export function RefreshableList<T>({
  data,
  renderItem,
  keyExtractor,
  refreshing,
  onRefresh,
  showSeparator = false,
  separatorColor,
  contentPadding,
  contentContainerStyle,
  ItemSeparatorComponent,
  style,
  ...rest
}: RefreshableListProps<T>) {
  const { theme } = useTheme();

  const separator = ItemSeparatorComponent
    ?? (showSeparator
      ? () => (
          <View
            style={[
              styles.separator,
              { backgroundColor: separatorColor ?? theme.colors.borderSecondary },
            ]}
          />
        )
      : undefined);

  const contentStyle: ViewStyle | undefined = contentPadding
    ? { padding: spacing[contentPadding] }
    : undefined;

  return (
    <FlatList<T>
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={style}
      ItemSeparatorComponent={separator}
      contentContainerStyle={[contentStyle, contentContainerStyle as ViewStyle]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
