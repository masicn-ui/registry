/**
 * Dock — pill-shaped floating navigation bar with icon + label items.
 *
 * A bottom navigation widget that sits elevated above the screen surface,
 * not anchored to the edge. Position it absolutely in your layout.
 * Two docks can be composed side-by-side in a Row for split-nav patterns.
 *
 * @example
 * // Basic 3-item dock
 * <Dock
 *   items={[
 *     { key: 'home', icon: HomeIcon, label: 'Home' },
 *     { key: 'search', icon: SearchIcon, label: 'Search' },
 *     { key: 'profile', icon: ProfileIcon, label: 'Profile' },
 *   ]}
 *   activeKey={activeTab}
 *   onChange={setActiveTab}
 *   style={{ position: 'absolute', bottom: spacing.xl, alignSelf: 'center' }}
 * />
 *
 * @example
 * // Two docks side by side
 * <Row gap="md" style={{ position: 'absolute', bottom: spacing.xl, alignSelf: 'center' }}>
 *   <Dock items={mainItems} activeKey={tab} onChange={setTab} />
 *   <Dock items={[addItem]} onChange={handleAdd} />
 * </Row>
 */
import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  elevation,
  Icon,
  motion,
  opacity as opacityTokens,
  radius,
  spacing,
  Text,
  useReducedMotion,
  useTheme,
  type IconComponent,
} from '../../../masicn';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DockItem {
  /** Unique identifier for this item. */
  key: string;
  /** Icon component to render above the label. */
  icon: IconComponent;
  /** Label shown below the icon. */
  label: string;
  /** Disable interaction for this item. */
  disabled?: boolean;
  /** Test identifier. */
  testID?: string;
}

export interface DockProps {
  /**
   * Navigation items to render. 1–5 items recommended.
   * @example [{ key: 'home', icon: HomeIcon, label: 'Home' }]
   */
  items: DockItem[];
  /** Key of the currently active item. */
  activeKey?: string;
  /** Called when the user taps an item. */
  onChange?: (key: string) => void;
  style?: ViewStyle;
  testID?: string;
}

// ── DockItem (internal) ───────────────────────────────────────────────────────

interface DockItemProps {
  item: DockItem;
  active: boolean;
  onPress: () => void;
}

function DockItem({ item, active, onPress }: DockItemProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = reducedMotion
      ? (active ? 1 : 0)
      : withSpring(active ? 1 : 0, motion.spring.snappy);
  }, [active, reducedMotion, progress]);

  const blobStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const iconColor = active
    ? theme.colors.primary
    : theme.colors.textTertiary;

  const labelColor = active
    ? theme.colors.primary
    : theme.colors.textTertiary;

  return (
    <Pressable
      onPress={onPress}
      disabled={item.disabled}
      testID={item.testID}
      style={({ pressed }) => [
        styles.item,
        pressed && !item.disabled && styles.itemPressed,
        item.disabled && { opacity: opacityTokens.disabled },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active, disabled: item.disabled }}
      accessibilityLabel={item.label}
    >
      {/* Active background blob */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.blob,
          blobStyle,
          { backgroundColor: theme.colors.surfaceSecondary },
        ]}
      />
      <Icon icon={item.icon} size="action" color={iconColor} />
      <Text variant="captionSmall" style={{ color: labelColor }} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

// ── Dock ──────────────────────────────────────────────────────────────

export function Dock({
  items,
  activeKey,
  onChange,
  style,
  testID,
}: DockProps) {
  const { theme } = useTheme();

  const handleItemPress = useCallback((key: string) => {
    onChange?.(key);
  }, [onChange]);

  return (
    <View
      style={[
        styles.dock,
        {
          backgroundColor: theme.colors.surfacePrimary,
          ...elevation.lg,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}
      accessibilityRole="tablist"
      testID={testID}
    >
      {items.map((item) => (
        <DockItem
          key={item.key}
          item={item}
          active={item.key === activeKey}
          onPress={() => handleItemPress(item.key)}
        />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  blob: {
    borderRadius: radius.full,
  },
  itemPressed: {
    transform: [{ scale: motion.press.scale }],
    opacity: opacityTokens.pressed,
  },
});
