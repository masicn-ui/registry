import React, { useMemo } from 'react';
import { scheduleOnRN } from 'react-native-worklets';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Text, layout, motion, radius, sizes, spacing, type Theme, useReducedMotion, useTheme } from '../../../masicn';

export interface SwipeAction {
  /** Action label */
  label: string;
  /** Icon node — pass any React element (icon component, emoji in Text, etc.) */
  icon?: React.ReactNode;
  /** Background color — key from the theme color palette */
  backgroundColor: keyof Theme['colors'];
  /** Label/icon text color key from the theme palette — defaults to 'onPrimary' for left, 'onError' for right */
  textColor?: keyof Theme['colors'];
  /** Callback when action is triggered */
  onPress: () => void;
}

type SwipeableSize = 'sm' | 'md' | 'lg';

export interface SwipeableProps {
  /** Child content */
  children: React.ReactNode;
  /** Left swipe actions */
  leftActions?: SwipeAction[];
  /** Right swipe actions */
  rightActions?: SwipeAction[];
  /** Additional container style */
  containerStyle?: ViewStyle;
  /** Swipe threshold to trigger action */
  threshold?: number;
  /**
   * Controls the minimum height of the swipeable row and action button padding.
   * - `'sm'` — compact rows (44px min-height)
   * - `'md'` — default height (64px min-height)
   * - `'lg'` — spacious rows (80px min-height)
   */
  size?: SwipeableSize;
  /** Test identifier forwarded to the outermost container View. */
  testID?: string;
}

const sizeConfig = {
  sm: { minHeight: layout.minTouchTarget, actionPaddingH: spacing.md },
  md: { minHeight: sizes.swipeableRowMd, actionPaddingH: spacing.xl },
  lg: { minHeight: sizes.swipeableRowLg, actionPaddingH: spacing.xxl },
} satisfies Record<SwipeableSize, { minHeight: number; actionPaddingH: number }>;

/**
 * Swipeable — a gesture-driven row that reveals hidden action buttons on left or right swipe.
 *
 * Uses Reanimated + Gesture Handler. Action buttons are revealed as the user pans; exceeding
 * the `threshold` triggers the first action automatically and snaps back. Actions are also
 * tappable directly (for accessibility users who cannot swipe).
 *
 * @example
 * <Swipeable
 *   rightActions={[
 *     {
 *       label: 'Delete',
 *       backgroundColor: 'error',
 *       onPress: () => handleDelete(item.id),
 *     },
 *   ]}
 *   leftActions={[
 *     {
 *       label: 'Archive',
 *       backgroundColor: 'success',
 *       onPress: () => handleArchive(item.id),
 *     },
 *   ]}
 * >
 *   <ListItem title={item.title} />
 * </Swipeable>
 *
 * @example
 * // Right-only delete action
 * <Swipeable
 *   rightActions={[
 *     { label: 'Remove', backgroundColor: 'error', onPress: () => removeItem(item.id) },
 *   ]}
 * >
 *   <CartRow item={item} />
 * </Swipeable>
 *
 * @example
 * // Multi-action right side with icons
 * <Swipeable
 *   rightActions={[
 *     { label: 'Pin', icon: <PinIcon />, backgroundColor: 'info', onPress: () => pin(item.id) },
 *     { label: 'Delete', icon: <TrashIcon />, backgroundColor: 'error', onPress: () => del(item.id) },
 *   ]}
 * >
 *   <MessageRow message={item} />
 * </Swipeable>
 *
 * @example
 * // Compact size for a tighter list
 * <Swipeable
 *   size="sm"
 *   rightActions={[{ label: 'Done', backgroundColor: 'success', onPress: () => complete(item.id) }]}
 * >
 *   <TaskRow task={item} />
 * </Swipeable>
 */
export function Swipeable({
  children,
  leftActions = [],
  rightActions = [],
  containerStyle,
  threshold = 80,
  size = 'md',
  testID,
}: SwipeableProps) {
  const { minHeight, actionPaddingH } = sizeConfig[size];
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(0);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);

  const thresholdSV = useSharedValue(threshold);
  React.useEffect(() => { thresholdSV.value = threshold; }, [threshold, thresholdSV]);

  const hasLeftActions = useSharedValue(leftActions.length > 0);
  const hasRightActions = useSharedValue(rightActions.length > 0);
  React.useEffect(() => {
    hasLeftActions.value = leftActions.length > 0;
    hasRightActions.value = rightActions.length > 0;
  }, [leftActions, rightActions, hasLeftActions, hasRightActions]);

  const triggerLeft = React.useCallback(() => {
    if (leftActions.length > 0) {
      leftActions[0].onPress();
      translateX.value = reducedMotion ? withTiming(0, { duration: 0 }) : withSpring(0, motion.spring.snappy);
    }
  }, [leftActions, translateX, reducedMotion]);

  const triggerRight = React.useCallback(() => {
    if (rightActions.length > 0) {
      rightActions[0].onPress();
      translateX.value = reducedMotion ? withTiming(0, { duration: 0 }) : withSpring(0, motion.spring.snappy);
    }
  }, [rightActions, translateX, reducedMotion]);

  const pan = useMemo(() => Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > thresholdSV.value && hasLeftActions.value) {
        scheduleOnRN(triggerLeft);
      } else if (e.translationX < -thresholdSV.value && hasRightActions.value) {
        scheduleOnRN(triggerRight);
      } else {
        translateX.value = reducedMotion ? withTiming(0, { duration: 0 }) : withSpring(0, motion.spring.snappy);
      }
    }),
  [triggerLeft, triggerRight, translateX, thresholdSV, hasLeftActions, hasRightActions, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 1 : 0,
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
  }));

  // Note: reducedMotion is captured in closure for gesture callbacks above.

  return (
    <View
      style={[styles.container, containerStyle]}
      testID={testID}
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width);
        setContainerHeight(e.nativeEvent.layout.height);
      }}>
      {leftActions.length > 0 && (
        <Animated.View
          style={[
            styles.actionsContainer,
            styles.leftActions,
            leftActionStyle,
            {
              width: containerWidth || '100%',
              height: containerHeight || '100%',
            },
          ]}>
          {leftActions.map((action, index) => (
            <Pressable
              key={index}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={[
                styles.action,
                { backgroundColor: theme.colors[action.backgroundColor], paddingHorizontal: actionPaddingH },
              ]}>
              {action.icon}
              <Text
                variant="bodySmall"
                bold
                style={{ color: theme.colors[action.textColor ?? 'onPrimary'] }}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {rightActions.length > 0 && (
        <Animated.View
          style={[
            styles.actionsContainer,
            styles.rightActions,
            rightActionStyle,
            {
              width: containerWidth || '100%',
              height: containerHeight || '100%',
            },
          ]}>
          {rightActions.map((action, index) => (
            <Pressable
              key={index}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={[
                styles.action,
                { backgroundColor: theme.colors[action.backgroundColor], paddingHorizontal: actionPaddingH },
              ]}>
              {action.icon}
              <Text
                variant="bodySmall"
                bold
                style={{ color: theme.colors[action.textColor ?? 'onError'] }}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.content,
            { backgroundColor: theme.colors.surfacePrimary, minHeight },
            animatedStyle,
          ]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  leftActions: {
    left: 0,
  },
  rightActions: {
    right: 0,
  },
  action: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: sizes.swipeActionMinWidth,
  },
  content: {
    width: '100%',
  },
});
