import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  type ViewStyle,
  type LayoutRectangle,
} from 'react-native';
import { Masicn, Text, elevation, radius, sizes, spacing, useTheme } from '@masicn/ui';

interface TooltipProps {
  /** Tooltip content */
  content: string;
  /** Trigger element */
  children: React.ReactElement;
  /** Additional container style */
  containerStyle?: ViewStyle;
}

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Positioned tooltip that renders near its trigger element. */
export function Tooltip({
  content,
  children,
  containerStyle,
}: TooltipProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [trigger, setTrigger] = useState<TriggerLayout | null>(null);
  const triggerRef = React.useRef<View>(null);

  const handlePressIn = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTrigger({ x, y, width, height });
      setVisible(true);
    });
  };

  return (
    <View ref={triggerRef} style={containerStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={() => setVisible(false)}>
        {children}
      </Pressable>

      {visible && trigger && (
        <Masicn>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}>
            <TooltipBubble
              content={content}
              trigger={trigger}
              theme={theme}
            />
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
  const showAbove = layout ? (fitsAbove || spaceAbove >= spaceBelow) : true;

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
          backgroundColor: theme.colors.surfacePrimary,
          ...elevation.md,
          shadowColor: theme.colors.shadow,
          top: finalTop,
          left,
        },
      ]}>
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
