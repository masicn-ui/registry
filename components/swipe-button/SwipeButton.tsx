/**
 * SwipeButton — a drag-to-confirm control where the user slides a thumb
 * across a track to trigger an irreversible action.
 *
 * The label fades as the thumb moves right; the track transitions from the
 * default surface colour to success green when the threshold is reached.
 * Respects `useReducedMotion()`.
 *
 * @example
 * // Basic usage
 * <SwipeButton label="Slide to pay" onComplete={() => processPayment()} />
 *
 * @example
 * // Disabled during processing to prevent double-submission
 * <SwipeButton
 *   label="Slide to confirm order"
 *   onComplete={handleConfirm}
 *   disabled={isProcessing}
 * />
 *
 * @example
 * // Custom style to fill available width inside a bottom sheet footer
 * <SwipeButton
 *   label="Slide to delete"
 *   onComplete={handleDelete}
 *   style={{ marginHorizontal: spacing.md }}
 * />
 *
 * @example
 * // With testID for automated testing
 * <SwipeButton
 *   label="Slide to approve"
 *   onComplete={onApprove}
 *   testID="approve-swipe-button"
 * />
 */
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import {
  Icon,
  Text,
  motion,
  opacity as opacityTokens,
  radius,
  layout,
  sizes,
  spacing,
  useTheme,
  useReducedMotion,
  CheckIcon,
  ChevronRightIcon,
} from '../../../masicn';

const THUMB_SIZE = layout.minTouchTarget; // 40
const THUMB_MARGIN = spacing.xs; // 4

export interface SwipeButtonProps {
  /** Text label displayed inside the track. Defaults to "Slide to confirm". */
  label?: string;
  /** Called once when the thumb is dragged past the completion threshold. */
  onComplete: () => void;
  /** Disables interaction. */
  disabled?: boolean;
  /** Container style. */
  style?: ViewStyle;
  testID?: string;
}

export function SwipeButton({
  label = 'Slide to confirm',
  onComplete,
  disabled = false,
  style,
  testID,
}: SwipeButtonProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  const [isCompleted, setIsCompleted] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);

  const translateX = useSharedValue(0);
  const maxDrag = useSharedValue(0);

  useEffect(() => {
    maxDrag.value = Math.max(0, trackWidth - THUMB_SIZE - THUMB_MARGIN * 2);
  }, [trackWidth, maxDrag]);

  const handleComplete = () => {
    setIsCompleted(true);
    onComplete();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .enabled(!disabled && !isCompleted && !reducedMotion)
    .onUpdate(e => {
      const newX = Math.max(0, Math.min(e.translationX, maxDrag.value));
      if (isFinite(newX)) {
        translateX.value = newX;
      }
    })
    .onEnd(() => {
      if (translateX.value >= maxDrag.value * 0.85) {
        translateX.value = withSpring(maxDrag.value, motion.spring.snap);
        scheduleOnRN(handleComplete);
      } else {
        translateX.value = withSpring(0, motion.spring.snappy);
      }
    })
    .onFinalize(() => {
      // Snap back if gesture is cancelled without reaching threshold
      if (translateX.value < maxDrag.value * 0.85) {
        translateX.value = withSpring(0, motion.spring.snappy);
      }
    });

  const thumbAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reducedMotion ? 0 : translateX.value }],
  }));

  const labelAnimStyle = useAnimatedStyle(() => ({
    opacity:
      maxDrag.value > 0
        ? interpolate(
            translateX.value,
            [0, maxDrag.value * 0.5],
            [1, 0],
            Extrapolation.CLAMP,
          )
        : 1,
  }));

  const trackAnimStyle = useAnimatedStyle(() => ({
    backgroundColor:
      maxDrag.value > 0
        ? interpolateColor(
            translateX.value,
            [0, maxDrag.value],
            [theme.colors.surfaceSecondary, theme.colors.success],
          )
        : theme.colors.surfaceSecondary,
  }));

  return (
    <Animated.View
      style={[styles.track, trackAnimStyle, disabled && styles.disabled, style]}
      onLayout={(e: LayoutChangeEvent) =>
        setTrackWidth(e.nativeEvent.layout.width)
      }
      testID={testID}
    >
      {/* Fading label centred in track */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.labelWrap, labelAnimStyle]}
        pointerEvents="none"
      >
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      </Animated.View>

      {/* Draggable thumb */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.thumb,
            thumbAnimStyle,
            {
              backgroundColor: isCompleted
                ? theme.colors.success
                : theme.colors.primary,
            },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: disabled || isCompleted }}
          accessibilityHint={
            !isCompleted && !disabled ? 'Double-tap to confirm' : undefined
          }
          onAccessibilityTap={
            !isCompleted && !disabled ? handleComplete : undefined
          }
        >
          <Icon
            icon={isCompleted ? CheckIcon : ChevronRightIcon}
            size="action"
            color={theme.colors.onPrimary}
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: sizes.buttonHeight, // 48
    borderRadius: radius.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: {
    opacity: opacityTokens.disabled,
  },
  labelWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: THUMB_MARGIN,
  },
});
