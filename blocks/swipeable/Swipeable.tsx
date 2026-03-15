// File: blocks/swipeable/Swipeable.tsx


import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Text, radius, sizes, spacing, type Theme, useTheme } from '@masicn/ui';

export interface SwipeAction {
  /** Action label */
  label: string;
  /** Icon node — pass any React element (icon component, emoji in Text, etc.) */
  icon?: React.ReactNode;
  /** Background color — key from the theme color palette */
  backgroundColor: keyof Theme['colors'];
  /** Label/icon text color — defaults to onPrimary (left) or onError (right) */
  textColor?: string;
  /** Callback when action is triggered */
  onPress: () => void;
}

interface SwipeableProps {
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
}

export function Swipeable({
  children,
  leftActions = [],
  rightActions = [],
  containerStyle,
  threshold = 80,
}: SwipeableProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);

  const thresholdSV = useSharedValue(threshold);
  React.useEffect(() => { thresholdSV.value = threshold; }, [threshold, thresholdSV]);

  const triggerLeft = React.useCallback(() => {
    if (leftActions.length > 0) {
      leftActions[0].onPress();
      translateX.value = withSpring(0);
    }
  }, [leftActions, translateX]);

  const triggerRight = React.useCallback(() => {
    if (rightActions.length > 0) {
      rightActions[0].onPress();
      translateX.value = withSpring(0);
    }
  }, [rightActions, translateX]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > thresholdSV.value && leftActions.length > 0) {
        triggerLeft();
      } else if (e.translationX < -thresholdSV.value && rightActions.length > 0) {
        triggerRight();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 1 : 0,
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
  }));

  return (
    <View
      style={[styles.container, containerStyle]}
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
            <View
              key={index}
              style={[
                styles.action,
                { backgroundColor: theme.colors[action.backgroundColor] },
              ]}>
              {action.icon}
              <Text
                variant="bodySmall"
                bold
                style={{ color: action.textColor || theme.colors.onPrimary }}>
                {action.label}
              </Text>
            </View>
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
            <View
              key={index}
              style={[
                styles.action,
                { backgroundColor: theme.colors[action.backgroundColor] },
              ]}>
              {action.icon}
              <Text
                variant="bodySmall"
                bold
                style={{ color: action.textColor || theme.colors.onError }}>
                {action.label}
              </Text>
            </View>
          ))}
        </Animated.View>
      )}

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.content,
            { backgroundColor: theme.colors.surfacePrimary },
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
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
    minWidth: sizes.swipeActionMinWidth,
  },
  content: {
    width: '100%',
  },
});
