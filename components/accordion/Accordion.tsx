import React, { useState, useCallback, createContext, useContext } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle, type LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Text, borders, motion, motionEasing, radius, spacing, useTheme } from '../../../masicn';

// ─── Context ─────────────────────────────────────────────────────────────────

interface AccordionContextValue {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

// ─── AccordionItem ────────────────────────────────────────────────────────────

interface AccordionItemProps {
  /** Title of the accordion item — used as unique key when inside Accordion */
  title: string;
  /** Content to display when expanded */
  children: React.ReactNode;
  /** Is initially expanded (uncontrolled; ignored inside Accordion) */
  defaultExpanded?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Callback when expansion changes */
  onToggle?: (expanded: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Custom container style */
  containerStyle?: ViewStyle;
}

/**
 * AccordionItem — a single collapsible section with an animated height transition.
 *
 * Can be used standalone (uncontrolled via `defaultExpanded`, or fully
 * controlled via `expanded` + `onToggle`) or composed inside an `<Accordion>`
 * wrapper which manages the expand/collapse state for all children and
 * optionally enforces single-open behaviour.
 *
 * @example
 * // Standalone uncontrolled item
 * <AccordionItem title="FAQ Question" defaultExpanded>
 *   <Text>Answer text here</Text>
 * </AccordionItem>
 *
 * @example
 * // Controlled item
 * <AccordionItem
 *   title="Details"
 *   expanded={isOpen}
 *   onToggle={setIsOpen}
 * >
 *   <Text>Details content</Text>
 * </AccordionItem>
 */
export function AccordionItem({
  title,
  children,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  disabled = false,
  containerStyle,
}: AccordionItemProps) {
  const { theme } = useTheme();
  const ctx = useContext(AccordionContext);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Context wins over internal state when inside <Accordion>
  const isExpanded = controlledExpanded !== undefined
    ? controlledExpanded
    : ctx
      ? ctx.isOpen(title)
      : internalExpanded;

  // ── Animation ──────────────────────────────────────────────────────────────
  const contentHeightRef = React.useRef(0);
  const hasMeasured = React.useRef(false);
  const isExpandedRef = React.useRef(isExpanded);
  isExpandedRef.current = isExpanded;

  const heightSV = useSharedValue(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    contentHeightRef.current = h;

    if (!hasMeasured.current) {
      hasMeasured.current = true;
      heightSV.value = isExpandedRef.current ? h : 0;
      return;
    }

    if (isExpandedRef.current) {
      heightSV.value = h;
    }
  }, [heightSV]);

  React.useEffect(() => {
    if (!hasMeasured.current) { return; }
    heightSV.value = withTiming(
      isExpanded ? contentHeightRef.current : 0,
      { duration: motion.duration.normal, easing: motionEasing.standard },
    );
  }, [isExpanded, heightSV]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    height: heightSV.value,
  }));
  // ──────────────────────────────────────────────────────────────────────────

  const handleToggle = () => {
    if (disabled) { return; }
    const newExpanded = !isExpanded;
    if (controlledExpanded === undefined) {
      if (ctx) {
        ctx.toggle(title);
      } else {
        setInternalExpanded(newExpanded);
      }
    }
    onToggle?.(newExpanded);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfacePrimary,
          borderColor: theme.colors.borderPrimary,
        },
        containerStyle,
      ]}>
      <Pressable
        onPress={handleToggle}
        disabled={disabled}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded, disabled }}>
        <Text
          variant="body"
          color={disabled ? 'textDisabled' : 'textPrimary'}
          style={styles.title}>
          {title}
        </Text>
        <Text variant="body" color={disabled ? 'textDisabled' : 'textSecondary'}>
          {isExpanded ? '−' : '+'}
        </Text>
      </Pressable>

      <Animated.View style={[styles.contentWrapper, animatedContentStyle]}>
        <View
          style={[styles.contentPositioned, { borderTopColor: theme.colors.separator }]}
          onLayout={handleLayout}>
          <View style={styles.content}>{children}</View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────

interface AccordionProps {
  /** Accordion items */
  children: React.ReactNode;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Allow multiple items expanded simultaneously */
  allowMultiple?: boolean;
}

/**
 * Accordion — a container that coordinates expand/collapse state across multiple `<AccordionItem>` children.
 *
 * By default only one item can be open at a time. Set `allowMultiple` to
 * allow several items to be expanded simultaneously. Each child `AccordionItem`
 * uses its `title` as a unique key within the group.
 *
 * @example
 * <Accordion allowMultiple>
 *   <AccordionItem title="Section 1">
 *     <Text>Content A</Text>
 *   </AccordionItem>
 *   <AccordionItem title="Section 2">
 *     <Text>Content B</Text>
 *   </AccordionItem>
 * </Accordion>
 */
export function Accordion({
  children,
  containerStyle,
  allowMultiple = false,
}: AccordionProps) {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());

  const isOpen = useCallback((id: string) => openSet.has(id), [openSet]);

  const toggle = useCallback((id: string) => {
    setOpenSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  }, [allowMultiple]);

  return (
    <AccordionContext.Provider value={{ isOpen, toggle }}>
      <View style={[styles.accordion, containerStyle]}>{children}</View>
    </AccordionContext.Provider>
  );
}

const styles = StyleSheet.create({
  accordion: {
    gap: spacing.sm,
  },
  container: {
    borderRadius: radius.md,
    borderWidth: borders.thin,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  title: {
    flex: 1,
  },
  contentWrapper: {
    overflow: 'hidden',
  },
  contentPositioned: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopWidth: borders.thin,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
});
