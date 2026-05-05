import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
  type LayoutRectangle,
  type GestureResponderEvent,
} from 'react-native';
import {
  Masicn,
  Pressable,
  Text,
  elevation,
  radius,
  sizes,
  spacing,
  useTheme,
} from '../../../masicn';

interface TooltipProps {
  /** Tooltip content */
  content: string;
  /** Trigger element — must be a Pressable-compatible component (Button, Pressable, etc.) */
  children: React.ReactElement<any>;
  /** Additional container style */
  containerStyle?: ViewStyle;
}

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tooltip — shows a floating label when the trigger is pressed and held.
 *
 * Injects `onPressIn`/`onPressOut` onto its single child (via cloneElement) so the
 * tooltip works alongside the child's own press handlers without adding an extra
 * Pressable wrapper that would intercept touch events.
 *
 * @example
 * <Tooltip content="Save your changes">
 *   <Button onPress={handleSave}>Save</Button>
 * </Tooltip>
 *
 * @example
 * // Tooltip on an icon-only button to explain its purpose
 * <Tooltip content="Delete permanently">
 *   <Pressable onPress={handleDelete} accessibilityLabel="Delete">
 *     <TrashIcon size={iconSizes.action} />
 *   </Pressable>
 * </Tooltip>
 *
 * @example
 * // Tooltip wrapping a disabled button to explain why it is disabled
 * <Tooltip content="Complete all required fields first">
 *   <Button onPress={handleSubmit} disabled={!isValid}>
 *     Submit
 *   </Button>
 * </Tooltip>
 *
 * @example
 * // Tooltip with custom container style to constrain trigger width
 * <Tooltip content="Opens your profile settings" containerStyle={{ alignSelf: 'flex-start' }}>
 *   <Button variant="ghost" onPress={openProfile}>Profile</Button>
 * </Tooltip>
 */
export function Tooltip({ content, children, containerStyle }: TooltipProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [trigger, setTrigger] = useState<TriggerLayout | null>(null);
  const triggerRef = React.useRef<View>(null);

  const handlePressIn = (e: GestureResponderEvent) => {
    children.props.onPressIn?.(e);
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTrigger({ x, y, width, height });
      setVisible(true);
    });
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    children.props.onPressOut?.(e);
    setVisible(false);
  };

  // Inject handlers directly onto the child — avoids a nested Pressable that
  // would intercept touches before the child's own responder runs.
  const clonedChild = React.cloneElement(children, {
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  });

  return (
    <View ref={triggerRef} style={containerStyle}>
      {clonedChild}

      {visible && trigger && (
        <Masicn>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
            accessibilityLabel="Dismiss tooltip"
          >
            <TooltipBubble content={content} trigger={trigger} theme={theme} />
          </Pressable>
        </Masicn>
      )}
    </View>
  );
}

/** Inner bubble — measures itself, then picks above/below based on available space. */
function TooltipBubble({
  content,
  trigger,
  theme,
}: {
  content: string;
  trigger: TriggerLayout;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);

  const tooltipWidth = layout?.width ?? 0;
  const tooltipHeight = layout?.height ?? 0;

  // ── Horizontal: center on trigger, clamp to screen edges ──────────────────
  const idealLeft = trigger.x + trigger.width / 2 - tooltipWidth / 2;
  const left = Math.max(
    spacing.sm,
    Math.min(idealLeft, screenWidth - tooltipWidth - spacing.sm),
  );

  // ── Vertical: prefer above, fall back to below when not enough space ───────
  const spaceAbove = trigger.y;
  const spaceBelow = screenHeight - (trigger.y + trigger.height);
  const fitsAbove = spaceAbove >= tooltipHeight + spacing.sm;
  const showAbove = layout ? fitsAbove || spaceAbove >= spaceBelow : true;

  const finalTop = !layout
    ? trigger.y - spacing.xl
    : showAbove
    ? trigger.y - tooltipHeight - spacing.sm
    : trigger.y + trigger.height + spacing.sm;

  return (
    <View
      onLayout={e => setLayout(e.nativeEvent.layout)}
      pointerEvents="none"
      style={[
        styles.tooltip,
        layout ? styles.tooltipVisible : styles.tooltipHidden,
        {
          backgroundColor: theme.colors.surfaceOverlay,
          ...elevation.md,
          shadowColor: theme.colors.shadow,
          top: finalTop,
          left,
        },
      ]}
    >
      <Text variant="caption" color="textPrimary">
        {content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    maxWidth: sizes.tooltipMaxWidth,
  },
  tooltipVisible: {
    opacity: 1,
  },
  tooltipHidden: {
    opacity: 0,
  },
});
