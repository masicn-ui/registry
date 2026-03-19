import React from 'react';
import {
  FlatList,
  RefreshControl,
  type FlatListProps,
} from 'react-native';
import { useTheme } from '../../../masicn'

interface RefreshableListProps<T> extends Omit<FlatListProps<T>, 'refreshControl'> {
  data: T[];
  renderItem: FlatListProps<T>['renderItem'];
  keyExtractor: FlatListProps<T>['keyExtractor'];
  refreshing: boolean;
  onRefresh: () => void;
}

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
