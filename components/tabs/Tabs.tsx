import React, { useState } from 'react';
import { Pressable, View, StyleSheet, ScrollView, type ViewStyle } from 'react-native';
import { useTheme, spacing, radius, borders } from '@masicn/ui';
import { Text } from '@/components/ui/Text';

const DEFAULT_TEXT_THRESHOLD = 150;

export interface TabItem {
  /** Unique key for the tab */
  key: string;
  /** Display label */
  label: string;
  /** Disabled state */
  disabled?: boolean;
  /**
   * React content to render in the panel when this tab is active.
   * Takes priority over `body` when both are provided.
   */
  content?: React.ReactNode;
  /**
   * Text content for the tab panel with automatic show-more / show-less truncation.
   * Respects the `textThreshold` set on the parent `<Tabs>` component.
   */
  body?: string;
}

export interface TabsProps {
  /** Available tabs */
  tabs: TabItem[];
  /** Currently active tab key */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (key: string) => void;
  /** Visual variant */
  variant?: 'underline' | 'filled' | 'pill';
  /** Allow horizontal scroll for many tabs */
  scrollable?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Accessibility label for the tab list */
  accessibilityLabel?: string;
  /**
   * Maximum character count before tab body text is truncated (default 150).
   * Applies to all tabs that use the `body` field.
   */
  textThreshold?: number;
  /**
   * Style applied to the content panel area (only when a tab has `content` or `body`).
   */
  panelStyle?: ViewStyle;
}

const Tabs = React.forwardRef<View, TabsProps>(function Tabs(
  {
    tabs,
    activeTab,
    onTabChange,
    variant = 'underline',
    scrollable = false,
    style,
    accessibilityLabel,
    textThreshold = DEFAULT_TEXT_THRESHOLD,
    panelStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  // Track expand/collapse per tab key
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpanded = (key: string) => {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Active tab panel ────────────────────────────────────────────────────────
  const activeItem = tabs.find(t => t.key === activeTab);
  const hasPanel = !!activeItem && (activeItem.content !== undefined || activeItem.body !== undefined);

  const renderPanel = () => {
    if (!activeItem) { return null; }

    // Custom React content takes priority
    if (activeItem.content !== undefined) {
      return (
        <View
          style={[styles.panel, { borderTopColor: theme.colors.separator }, panelStyle]}
          accessibilityRole="none">
          {activeItem.content}
        </View>
      );
    }

    if (activeItem.body) {
      const isExpanded = expandedKeys[activeItem.key] ?? false;
      const needsTruncation = activeItem.body.length > textThreshold;
      const displayedBody =
        needsTruncation && !isExpanded
          ? `${activeItem.body.slice(0, textThreshold)}…`
          : activeItem.body;

      return (
        <View
          style={[styles.panel, { borderTopColor: theme.colors.separator }, panelStyle]}
          accessibilityRole="none">
          <Text variant="body" color="textSecondary">
            {displayedBody}
          </Text>
          {needsTruncation && (
            <Pressable
              onPress={() => toggleExpanded(activeItem.key)}
              accessibilityRole="button"
              accessibilityLabel={isExpanded ? 'Show less' : 'Show more'}
              hitSlop={spacing.xs}
              style={[styles.toggleBtn, { borderColor: theme.colors.primary }]}>
              <Text variant="label" style={{ color: theme.colors.primary }}>
                {isExpanded ? 'Show less' : 'Show more'}
              </Text>
            </Pressable>
          )}
        </View>
      );
    }

    return null;
  };

  // ── Tab bar ────────────────────────────────────────────────────────────────
  const renderTabs = () =>
    tabs.map((tab, index) => {
      const isActive = activeTab === tab.key;
      const isDisabled = tab.disabled;

      return (
        <Pressable
          key={tab.key}
          onPress={() => !isDisabled && onTabChange(tab.key)}
          disabled={isDisabled}
          style={[
            styles.tab,
            variant === 'underline' && styles.tabUnderline,
            variant === 'filled' && [
              styles.tabFilled,
              { backgroundColor: isActive ? theme.colors.primary : 'transparent' },
            ],
            variant === 'pill' && [
              styles.tabPill,
              {
                backgroundColor: isActive
                  ? theme.colors.primary
                  : 'transparent',
              },
            ],
            variant === 'underline' && isActive && {
              borderBottomColor: theme.colors.primary,
            },
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive, disabled: isDisabled }}
          accessibilityHint={
            isDisabled ? 'This tab is disabled' : `Tab ${index + 1} of ${tabs.length}`
          }>
          <Text
            variant="label"
            style={{
              color: isDisabled
                ? theme.colors.textDisabled
                : isActive
                  ? variant === 'underline'
                    ? theme.colors.primary
                    : theme.colors.onPrimary
                  : theme.colors.textSecondary,
            }}>
            {tab.label}
          </Text>
        </Pressable>
      );
    });

  const containerStyle = [
    styles.container,
    variant === 'underline' && {
      borderBottomWidth: borders.thin,
      borderBottomColor: theme.colors.separator,
    },
    variant === 'filled' && [
      styles.containerFilled,
      { backgroundColor: theme.colors.surfaceSecondary },
    ],
    variant === 'pill' && [
      styles.containerPill,
      { backgroundColor: theme.colors.surfaceSecondary },
    ],
    style,
  ];

  const tabBar = scrollable ? (
    <ScrollView
      ref={ref as React.Ref<ScrollView>}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={containerStyle}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}>
      {renderTabs()}
    </ScrollView>
  ) : (
    <View
      ref={ref}
      style={containerStyle}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}>
      {renderTabs()}
    </View>
  );

  if (!hasPanel) {
    return tabBar;
  }

  return (
    <View>
      {tabBar}
      {renderPanel()}
    </View>
  );
});

Tabs.displayName = 'Tabs';

export { Tabs };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  containerFilled: {
    borderRadius: radius.lg,
    padding: spacing.xxs,
  },
  containerPill: {
    borderRadius: radius.full,
    padding: spacing.xxs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tabUnderline: {
    borderBottomWidth: borders.medium,
    borderBottomColor: 'transparent',
  },
  tabFilled: {
    borderRadius: radius.lg,
  },
  tabPill: {
    borderRadius: radius.full,
  },
  panel: {
    padding: spacing.md,
    gap: spacing.xs,
    borderTopWidth: borders.thin,
  },
  toggleBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    borderWidth: borders.thin,
  },
});
