import React from 'react';
import { RefreshControl, ScrollView, type ViewStyle } from 'react-native';
import { useTheme } from '@masicn/ui';

interface RefreshableScrollViewProps {
  children: React.ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  contentContainerStyle?: ViewStyle;
}

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
