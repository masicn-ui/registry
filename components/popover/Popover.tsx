import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
  type LayoutRectangle,
} from 'react-native';
import { useTheme, spacing, radius, elevation, borders, sizes } from '../../../masicn';

type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';
type PopoverTrigger = 'press' | 'longPress';

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Final clamped position of the popover panel. */
interface PopoverPosition {
  left: number;
  top: number;
}

function getTriggerCenterX(layout: TriggerLayout) {
  return layout.x + layout.width / 2;
}

function getTriggerCenterY(layout: TriggerLayout) {
  return layout.y + layout.height / 2;
}

function computePosition(
  triggerLayout: TriggerLayout,
  popoverLayout: LayoutRectangle,
  placement: PopoverPlacement,
  screenWidth: number,
  screenHeight: number,
): PopoverPosition {
  const OFFSET = spacing.sm;
  const SCREEN_PAD = spacing.md;

  let left = 0;
  let top = 0;
  let translateX = 0;
  let translateY = 0;

  switch (placement) {
    case 'top':
      left = getTriggerCenterX(triggerLayout);
      top = triggerLayout.y - OFFSET;
      translateX = -popoverLayout.width / 2;
      translateY = -popoverLayout.height;
      break;
    case 'bottom':
      left = getTriggerCenterX(triggerLayout);
      top = triggerLayout.y + triggerLayout.height + OFFSET;
      translateX = -popoverLayout.width / 2;
      translateY = 0;
      break;
    case 'left':
      left = triggerLayout.x - OFFSET;
      top = getTriggerCenterY(triggerLayout);
      translateX = -popoverLayout.width;
      translateY = -popoverLayout.height / 2;
      break;
    case 'right':
      left = triggerLayout.x + triggerLayout.width + OFFSET;
      top = getTriggerCenterY(triggerLayout);
      translateX = 0;
      translateY = -popoverLayout.height / 2;
      break;
  }

  let finalX = left + translateX;
  let finalY = top + translateY;

  if (finalX + popoverLayout.width > screenWidth - SCREEN_PAD) {
    finalX = screenWidth - SCREEN_PAD - popoverLayout.width;
  }
  if (finalX < SCREEN_PAD) {
    finalX = SCREEN_PAD;
  }
  if (finalY + popoverLayout.height > screenHeight - SCREEN_PAD) {
    finalY = screenHeight - SCREEN_PAD - popoverLayout.height;
  }
  if (finalY < SCREEN_PAD) {
    finalY = SCREEN_PAD;
  }

  return { left: finalX, top: finalY };
}

export interface PopoverProps {
  /** Content to display inside the popover */
  content: React.ReactNode;
  /** Element that opens the popover when triggered */
  children: React.ReactElement;
  /**
   * Preferred placement of the popover relative to the trigger element.
   * - `'top'` — above the trigger
   * - `'bottom'` — below the trigger (default)
   * - `'left'` — to the left of the trigger
   * - `'right'` — to the right of the trigger
   *
   * The popover is clamped to screen bounds regardless of preference.
   */
  placement?: PopoverPlacement;
  /**
   * Gesture that opens the popover.
   * - `'press'` — single tap toggles open/closed (default)
   * - `'longPress'` — long press opens the popover
   */
  trigger?: PopoverTrigger;
  /** Show an arrow pointing toward the trigger element. Defaults to true. */
  showArrow?: boolean;
  /** Controlled visibility. When provided, the component operates in controlled mode. */
  visible?: boolean;
  /** Callback fired when the popover visibility should change. */
  onVisibilityChange?: (visible: boolean) => void;
  /** Additional style applied to the popover container. */
  contentStyle?: ViewStyle;
  /** Stable selector for tests */
  testID?: string;
}

/**
 * Popover — a floating content panel anchored to a trigger element.
 *
 * Opens as a transparent `Modal` and positions itself relative to the trigger's
 * screen coordinates (measured with `measureInWindow`). The popover is clamped
 * to stay within screen bounds with `spacing.md` padding. An optional directional
 * arrow helps the user see the relationship between the popover and its trigger.
 * For left/right placements the arrow tracks the trigger centre even when the
 * popover panel has been clamped vertically.
 *
 * Supports both uncontrolled (internal state) and controlled (`visible` +
 * `onVisibilityChange`) modes. Tapping the backdrop dismisses the popover.
 *
 * @example
 * // Uncontrolled — press trigger to toggle
 * <Popover
 *   content={<Text>Hello from popover</Text>}
 *   placement="bottom"
 * >
 *   <Button>Open</Button>
 * </Popover>
 *
 * // Controlled
 * <Popover
 *   content={<FilterPanel />}
 *   visible={filterOpen}
 *   onVisibilityChange={setFilterOpen}
 *   placement="top"
 *   showArrow={false}
 * >
 *   <IconButton icon="filter" />
 * </Popover>
 *
 * @example
 * // Right placement with long-press trigger
 * <Popover
 *   content={<HelpTooltipContent />}
 *   placement="right"
 *   trigger="longPress"
 * >
 *   <InfoIcon />
 * </Popover>
 *
 * @example
 * // No arrow, custom content style
 * <Popover
 *   content={<ColorPicker value={color} onValueChange={setColor} />}
 *   placement="bottom"
 *   showArrow={false}
 *   contentStyle={{ padding: spacing.sm }}
 * >
 *   <ColorSwatch color={color} />
 * </Popover>
 *
 * @example
 * // Left placement for a settings panel
 * <Popover
 *   content={<ColumnVisibilityPanel />}
 *   placement="left"
 *   testID="column-visibility-popover"
 * >
 *   <Button variant="ghost">Columns</Button>
 * </Popover>
 */
export function Popover({
  content,
  children,
  placement = 'bottom',
  trigger = 'press',
  showArrow = true,
  visible: controlledVisible,
  onVisibilityChange,
  contentStyle,
  testID,
}: PopoverProps) {
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [internalVisible, setInternalVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null);
  const [popoverLayout, setPopoverLayout] = useState<LayoutRectangle | null>(null);
  const triggerRef = useRef<View>(null);

  const isControlled = controlledVisible !== undefined;
  const visible = isControlled ? controlledVisible : internalVisible;

  const openPopover = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setPopoverLayout(null);
      if (!isControlled) { setInternalVisible(true); }
      onVisibilityChange?.(true);
    });
  }, [isControlled, onVisibilityChange]);

  const handleClose = useCallback(() => {
    if (!isControlled) { setInternalVisible(false); }
    onVisibilityChange?.(false);
  }, [isControlled, onVisibilityChange]);

  const handlePress = () => {
    if (trigger === 'press') {
      visible ? handleClose() : openPopover();
    }
  };

  const handleLongPress = () => {
    if (trigger === 'longPress') {
      openPopover();
    }
  };

  const getPopoverStyle = (): ViewStyle => {
    if (!triggerLayout || !popoverLayout) {
      return styles.measurePass;
    }
    const { left, top } = computePosition(triggerLayout, popoverLayout, placement, screenWidth, screenHeight);
    return { position: 'absolute', left, top };
  };

  const childProps = children.props as Record<string, unknown>;
  const triggerElement = React.cloneElement<any>(children, {
    onPress: trigger === 'press' ? handlePress : childProps?.onPress,
    onLongPress: trigger === 'longPress' ? handleLongPress : childProps?.onLongPress,
  });

  return (
    <View>
      <View ref={triggerRef}>
        {triggerElement}
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable
            testID={testID}
            style={[
              styles.popover,
              getPopoverStyle(),
              {
                backgroundColor: theme.colors.surfaceOverlay,
                borderColor: theme.colors.borderPrimary,
                ...elevation.lg,
                shadowColor: theme.colors.shadow,
              },
              contentStyle,
            ]}
            onLayout={e => setPopoverLayout(e.nativeEvent.layout)}
            onPress={e => e.stopPropagation()}>
            {showArrow && triggerLayout && popoverLayout && (
              <PopoverArrow
                placement={placement}
                triggerLayout={triggerLayout}
                popoverPosition={computePosition(triggerLayout, popoverLayout, placement, screenWidth, screenHeight)}
                color={theme.colors.surfaceOverlay}
              />
            )}
            {content}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Arrow ─────────────────────────────────────────────────────────────────────

interface PopoverArrowProps {
  placement: PopoverPlacement;
  triggerLayout: TriggerLayout;
  popoverPosition: PopoverPosition;
  color: string;
}

function PopoverArrow({ placement, triggerLayout, popoverPosition, color }: PopoverArrowProps) {
  const ARROW = spacing.sm;

  if (placement === 'bottom') {
    const arrowLeft = getTriggerCenterX(triggerLayout) - popoverPosition.left - ARROW;
    return (
      <View
        style={[
          arrowStyles.arrow,
          arrowStyles.arrowTop,
          { left: arrowLeft, borderBottomColor: color },
        ]}
      />
    );
  }
  if (placement === 'top') {
    const arrowLeft = getTriggerCenterX(triggerLayout) - popoverPosition.left - ARROW;
    return (
      <View
        style={[
          arrowStyles.arrow,
          arrowStyles.arrowBottom,
          { left: arrowLeft, borderTopColor: color },
        ]}
      />
    );
  }

  // For left/right: compute dynamic `top` so the arrow tracks the trigger centre
  // even when the popover panel has been clamped vertically.
  const arrowTop = getTriggerCenterY(triggerLayout) - popoverPosition.top - ARROW;

  if (placement === 'right') {
    return (
      <View
        style={[arrowStyles.arrow, arrowStyles.arrowLeft, { top: arrowTop, borderRightColor: color }]}
      />
    );
  }
  return (
    <View
      style={[arrowStyles.arrow, arrowStyles.arrowRight, { top: arrowTop, borderLeftColor: color }]}
    />
  );
}


const ARROW_SIZE = spacing.sm;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  popover: {
    position: 'absolute',
    borderRadius: radius.md,
    borderWidth: borders.thin,
    padding: spacing.md,
    maxWidth: sizes.menuMaxWidth,
  },
  measurePass: {
    position: 'absolute',
    opacity: 0,
  },
});

const arrowStyles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  arrowTop: {
    top: -ARROW_SIZE,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowBottom: {
    bottom: -ARROW_SIZE,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowLeft: {
    left: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  arrowRight: {
    right: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftWidth: ARROW_SIZE,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
