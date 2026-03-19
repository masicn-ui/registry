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
import { useTheme, spacing, radius, elevation, borders, sizes } from '../../../masicn'

type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';
type PopoverTrigger = 'press' | 'longPress';

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PopoverProps {
  /** Content to display inside the popover */
  content: React.ReactNode;
  /** Element that opens the popover when triggered */
  children: React.ReactElement;
  /** Preferred placement relative to the trigger element */
  placement?: PopoverPlacement;
  /** Interaction that opens the popover */
  trigger?: PopoverTrigger;
  /** Show an arrow pointing toward the trigger element */
  showArrow?: boolean;
  /** Controlled visibility */
  visible?: boolean;
  /** Callback fired when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
  /** Additional style applied to the popover container */
  contentStyle?: ViewStyle;
  /** Stable selector for tests */
  testID?: string;
}

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

    const OFFSET = spacing.sm;
    const SCREEN_PAD = spacing.md;

    let left = 0;
    let top = 0;
    let translateX = 0;
    let translateY = 0;

    switch (placement) {
      case 'top':
        left = triggerLayout.x + triggerLayout.width / 2;
        top = triggerLayout.y - OFFSET;
        translateX = -popoverLayout.width / 2;
        translateY = -popoverLayout.height;
        break;
      case 'bottom':
        left = triggerLayout.x + triggerLayout.width / 2;
        top = triggerLayout.y + triggerLayout.height + OFFSET;
        translateX = -popoverLayout.width / 2;
        translateY = 0;
        break;
      case 'left':
        left = triggerLayout.x - OFFSET;
        top = triggerLayout.y + triggerLayout.height / 2;
        translateX = -popoverLayout.width;
        translateY = -popoverLayout.height / 2;
        break;
      case 'right':
        left = triggerLayout.x + triggerLayout.width + OFFSET;
        top = triggerLayout.y + triggerLayout.height / 2;
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

    return {
      position: 'absolute',
      left: finalX,
      top: finalY,
    };
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
                backgroundColor: theme.colors.surfacePrimary,
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
                popoverFinalLeft={(() => {
                  if (!triggerLayout || !popoverLayout) { return 0; }
                  const OFFSET = spacing.sm;
                  const SCREEN_PAD = spacing.md;
                  let left = 0;
                  let translateX = 0;
                  if (placement === 'top' || placement === 'bottom') {
                    left = triggerLayout.x + triggerLayout.width / 2;
                    translateX = -popoverLayout.width / 2;
                  } else if (placement === 'left') {
                    left = triggerLayout.x - OFFSET;
                    translateX = -popoverLayout.width;
                  } else {
                    left = triggerLayout.x + triggerLayout.width + OFFSET;
                    translateX = 0;
                  }
                  let finalX = left + translateX;
                  if (finalX + popoverLayout.width > screenWidth - SCREEN_PAD) {
                    finalX = screenWidth - SCREEN_PAD - popoverLayout.width;
                  }
                  if (finalX < SCREEN_PAD) { finalX = SCREEN_PAD; }
                  return finalX;
                })()}
                color={theme.colors.surfacePrimary}
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
  popoverFinalLeft: number;
  color: string;
}

function PopoverArrow({ placement, triggerLayout, popoverFinalLeft, color }: PopoverArrowProps) {
  const ARROW = spacing.sm;

  if (placement === 'bottom') {
    const arrowLeft = triggerLayout.x + triggerLayout.width / 2 - popoverFinalLeft - ARROW;
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
    const arrowLeft = triggerLayout.x + triggerLayout.width / 2 - popoverFinalLeft - ARROW;
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
  if (placement === 'right') {
    return (
      <View
        style={[arrowStyles.arrow, arrowStyles.arrowLeft, { borderRightColor: color }]}
      />
    );
  }
  return (
    <View
      style={[arrowStyles.arrow, arrowStyles.arrowRight, { borderLeftColor: color }]}
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
    top: '50%',
    marginTop: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  arrowRight: {
    right: -ARROW_SIZE,
    top: '50%',
    marginTop: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftWidth: ARROW_SIZE,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
