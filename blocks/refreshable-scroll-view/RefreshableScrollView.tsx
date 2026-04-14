import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { spacing, useTheme } from '../../../masicn';

interface RefreshableScrollViewProps {
  /** Content to render inside the scroll view. */
  children: React.ReactNode;
  /** Whether the scroll view is currently refreshing (shows the pull-to-refresh spinner). */
  refreshing: boolean;
  /** Called when the user pulls down to trigger a refresh. */
  onRefresh: () => void;
  /** Style applied to the scroll view's content container. */
  contentContainerStyle?: ViewStyle;
  /** Style applied to the ScrollView container itself. */
  style?: StyleProp<ViewStyle>;
  /**
   * Convenience padding applied to `contentContainerStyle`.
   * Mirrors the `contentPadding` prop on `RefreshableList`.
   */
  contentPadding?: keyof typeof spacing;
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
 * Pass `contentPadding` as a spacing token key for quick uniform padding, or use
 * `contentContainerStyle` for full control.
 *
 * @example
 * <RefreshableScrollView
 *   refreshing={isRefreshing}
 *   onRefresh={handleRefresh}
 *   contentPadding="md"
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
  style,
  contentPadding,
}: RefreshableScrollViewProps) {
  const { theme } = useTheme();

  const paddingStyle: ViewStyle | undefined = contentPadding
    ? { padding: spacing[contentPadding] }
    : undefined;

  return (
    <ScrollView
      style={style}
      contentContainerStyle={StyleSheet.flatten([paddingStyle, contentContainerStyle])}
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
