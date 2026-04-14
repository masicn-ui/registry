import React, { useState, useCallback } from 'react';
import { Pressable, View, StyleSheet, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Text, borders, iconSizes, motion, motionEasing, radius, spacing, useReducedMotion, useTheme } from '../../../masicn';

interface CollapsibleProps {
  /** Header text */
  title: string;
  /** Collapsible body content */
  children: React.ReactNode;
  /** Start expanded */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Called when the header is pressed */
  onToggle?: (open: boolean) => void;
  /** Custom chevron/icon to replace the default ▾ glyph */
  icon?: React.ReactNode;
  /** Additional style applied to the outermost container. */
  style?: ViewStyle;
  /** Additional style applied to the body content area. */
  containerStyle?: ViewStyle;
  /** Test identifier forwarded to the header Pressable. */
  testID?: string;
}

/**
 * Collapsible — a lightweight expandable section with an animated height transition.
 *
 * Renders a pressable header row with a title and a chevron that rotates
 * 180° when expanded. The body content animates its height using Reanimated,
 * with a reduced-motion fallback (instant toggle). Supports both controlled
 * (`open` + `onToggle`) and uncontrolled (`defaultOpen`) modes. The default
 * chevron can be replaced with any node via the `icon` prop.
 *
 * @example
 * // Uncontrolled, starts expanded
 * <Collapsible title="Advanced Settings" defaultOpen>
 *   <Toggle label="Enable debug mode" />
 * </Collapsible>
 *
 * @example
 * // Controlled
 * <Collapsible
 *   title="Filters"
 *   open={filtersOpen}
 *   onToggle={setFiltersOpen}
 * >
 *   <FilterPanel />
 * </Collapsible>
 */
export function Collapsible({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  icon,
  style,
  containerStyle,
  testID,
}: CollapsibleProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isOpen = controlledOpen ?? internalOpen;

  // ── Height animation (mirrors AccordionItem pattern) ───────────────────────
  const contentHeightRef = React.useRef(0);
  const hasMeasured = React.useRef(false);
  const isOpenRef = React.useRef(isOpen);
  isOpenRef.current = isOpen;

  const heightSV = useSharedValue(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    contentHeightRef.current = h;
    if (!hasMeasured.current) {
      hasMeasured.current = true;
      heightSV.value = isOpenRef.current ? h : 0;
      return;
    }
    if (isOpenRef.current) {
      heightSV.value = h;
    }
  }, [heightSV]);

  React.useEffect(() => {
    if (!hasMeasured.current) { return; }
    heightSV.value = withTiming(
      isOpen ? contentHeightRef.current : 0,
      { duration: reducedMotion ? 0 : motion.duration.normal, easing: motionEasing.standard },
    );
  }, [isOpen, heightSV, reducedMotion]);

  const animatedBodyStyle = useAnimatedStyle(() => ({
    height: heightSV.value,
    overflow: 'hidden',
  }));
  // ────────────────────────────────────────────────────────────────────────────

  const handleToggle = () => {
    const next = !isOpen;
    setInternalOpen(next);
    onToggle?.(next);
  };

  return (
    <View
      style={[
        styles.container,
        { borderColor: theme.colors.borderSecondary },
        style,
      ]}>
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={title}
        testID={testID}
        style={({ pressed }) => [
          styles.header,
          { backgroundColor: pressed ? theme.colors.highlight : theme.colors.surfacePrimary },
        ]}>
        <Text variant="label" color="textPrimary" style={styles.headerTitle}>
          {title}
        </Text>
        {icon ?? (
          <Text
            variant="body"
            style={[
              styles.chevron,
              { color: theme.colors.textSecondary, transform: [{ rotate: isOpen ? '180deg' : '0deg' }] },
            ]}>
            ▾
          </Text>
        )}
      </Pressable>

      <Animated.View style={animatedBodyStyle}>
        <View
          onLayout={handleLayout}
          style={[
            styles.body,
            { borderTopColor: theme.colors.borderSecondary },
            containerStyle,
          ]}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: borders.thin,
    borderRadius: radius.none,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  chevron: {
    fontSize: iconSizes.decorative,
  },
  body: {
    padding: spacing.md,
    borderTopWidth: borders.thin,
  },
});
