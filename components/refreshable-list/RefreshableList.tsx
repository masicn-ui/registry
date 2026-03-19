import React from 'react';
import {
  FlatList,
  RefreshControl,
  type FlatListProps,
} from 'react-native';
import { useTheme } from '../../../masicn'

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
}

/**
 * RefreshableList — a `FlatList` pre-configured with a themed pull-to-refresh
 * control.
 *
 * Wraps the native `FlatList` component and injects a `RefreshControl` whose
 * `tintColor` and `colors` (Android) are automatically set to the theme's
 * primary color. All other `FlatListProps` (excluding `refreshControl`, which
 * is managed internally) are forwarded as-is.
 *
 * Use this instead of manually wiring a `RefreshControl` to ensure consistent
 * spinner theming across the app.
 *
 * @example
 * <RefreshableList
 *   data={items}
 *   keyExtractor={(item) => item.id}
 *   renderItem={({ item }) => <ItemRow item={item} />}
 *   refreshing={isRefreshing}
 *   onRefresh={handleRefresh}
 * />
 */
export function RefreshableList<T>({
  data,
  renderItem,
  keyExtractor,
  refreshing,
  onRefresh,
  ...rest
}: RefreshableListProps<T>) {
  const { theme } = useTheme();

  return (
    <FlatList<T>
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
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
