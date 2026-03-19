import React from 'react';
import { RefreshControl, ScrollView, type ViewStyle } from 'react-native';
import { useTheme } from '../../../masicn'

interface RefreshableScrollViewProps {
  /** Content to render inside the scroll view. */
  children: React.ReactNode;
  /** Whether the scroll view is currently refreshing (shows the pull-to-refresh spinner). */
  refreshing: boolean;
  /** Called when the user pulls down to trigger a refresh. */
  onRefresh: () => void;
  /** Style applied to the scroll view's content container. */
  contentContainerStyle?: ViewStyle;
}

/**
 * RefreshableScrollView — a `ScrollView` pre-configured with a themed
 * pull-to-refresh control.
 *
 * Injects a `RefreshControl` whose `tintColor` (iOS) and `colors` (Android) are
 * automatically set to the theme's primary color, ensuring consistent styling
 * without additional setup. Use this whenever you need pull-to-refresh
 * functionality in a scroll view that is not a `FlatList`.
 *
 * @example
 * <RefreshableScrollView
 *   refreshing={isRefreshing}
 *   onRefresh={handleRefresh}
 *   contentContainerStyle={{ padding: 16 }}
 * >
 *   <ProfileCard />
 *   <ActivityFeed />
 * </RefreshableScrollView>
 */
export function RefreshableScrollView({
  children,
  refreshing,
  onRefresh,
  contentContainerStyle,
}: RefreshableScrollViewProps) {
  const { theme } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }>
      {children}
    </ScrollView>
  );
}
