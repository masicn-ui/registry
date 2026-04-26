import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  Text,
  borders,
  layout,
  motion,
  opacity as opacityTokens,
  radius,
  sizes,
  spacing,
  useTheme,
} from '../../../masicn';

// ─── Types ─────────────────────────────────────────────────────────────────

interface SliderProps {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onValueChange: (value: number) => void;
  /** Minimum value */
  minimumValue?: number;
  /** Maximum value */
  maximumValue?: number;
  /** Step size */
  step?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Show value label */
  showValue?: boolean;
  /** Optional label */
  label?: string;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Test identifier for automated testing */
  testID?: string;
}

/**
 * Slider — a single-thumb slider for selecting a value from a continuous range.
 *
 * The GestureDetector wraps the full track container so `e.x` maps directly to
 * track position with no positional jump. Thumb position and drag-scale are driven
 * by Reanimated shared values for smooth native-thread updates.
 *
 * @example
 * const [volume, setVolume] = useState(70);
 * <Slider label="Volume" value={volume} onValueChange={setVolume} showValue />
 *
 * @example
 * // Brightness control, 1–100 with step of 5
 * <Slider
 *   label="Brightness"
 *   value={brightness}
 *   onValueChange={setBrightness}
 *   minimumValue={1}
 *   maximumValue={100}
 *   step={5}
 *   showValue
 * />
 *
 * @example
 * // Disabled slider for read-only display
 * <Slider
 *   label="Battery level"
 *   value={batteryLevel}
 *   onValueChange={() => {}}
 *   disabled
 * />
 *
 * @example
 * // Compact slider without label for inline use
 * <Slider
 *   value={opacity}
 *   onValueChange={setOpacity}
 *   minimumValue={0}
 *   maximumValue={1}
 *   step={0.01}
 * />
 */
export function Slider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  disabled = false,
  showValue = false,
  label,
  containerStyle,
  testID,
}: SliderProps) {
  const { theme } = useTheme();

  // ── Shared values ──────────────────────────────────────────────────────

  // Slider width in a shared value so the worklet can read it without JS.
  const sliderWidthSV = useSharedValue(0);
  const thumbPos = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const range = maximumValue - minimumValue;

  // Sync controlled value → shared thumb position whenever props change.
  useEffect(() => {
    const w = sliderWidthSV.value;
    if (w > 0 && range > 0) {
      thumbPos.value = ((value - minimumValue) / range) * w;
    }
  // sliderWidthSV and thumbPos are stable refs — safe to omit from deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minimumValue, range]);

  // ── Animated styles ────────────────────────────────────────────────────

  const thumbStyle = useAnimatedStyle(() => ({
    left: thumbPos.value - sizes.sliderThumb / 2,
    transform: [{ scale: isDragging.value ? motion.press.scaleLarge : 1 }],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    width: thumbPos.value,
  }));

  // ── Value commit (JS thread) ───────────────────────────────────────────

  // Stable JS function that converts a pixel position to a stepped value
  // and fires onValueChange. Dispatched via scheduleOnRN from the UI-thread worklet.
  const commitValue = useCallback((pos: number) => {
    const w = sliderWidthSV.value;
    if (w === 0) { return; }
    const pct = Math.max(0, Math.min(1, pos / w));
    const raw = minimumValue + pct * range;
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.max(minimumValue, Math.min(maximumValue, stepped));
    if (clamped !== value) { onValueChange(clamped); }
  // sliderWidthSV is a stable shared value ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimumValue, maximumValue, range, step, value, onValueChange]);

  // ── Gesture ────────────────────────────────────────────────────────────

  // Wrap commitValue in a ref so the gesture worklet always calls the latest
  // version without needing to recreate the gesture on every render.
  const commitValueRef = React.useRef(commitValue);
  commitValueRef.current = commitValue;
  const stableCommit = useCallback((pos: number) => {
    commitValueRef.current(pos);
  }, []);

  const pan = Gesture.Pan()
    .minDistance(0)
    .enabled(!disabled)
    .onBegin(e => {
      isDragging.value = true;
      const clamped = Math.max(0, Math.min(sliderWidthSV.value, e.x));
      thumbPos.value = clamped;
      scheduleOnRN(stableCommit, clamped);
    })
    .onUpdate(e => {
      const clamped = Math.max(0, Math.min(sliderWidthSV.value, e.x));
      thumbPos.value = clamped;
      scheduleOnRN(stableCommit, clamped);
    })
    .onEnd(() => { isDragging.value = false; })
    .onFinalize(() => { isDragging.value = false; });

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, disabled && styles.disabled, containerStyle]}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && (
            <Text variant="body" color={disabled ? 'textDisabled' : 'textPrimary'}>
              {label}
            </Text>
          )}
          {showValue && (
            <Text variant="bodySmall" color={disabled ? 'textDisabled' : 'textSecondary'}>
              {value}
            </Text>
          )}
        </View>
      )}

      <GestureDetector gesture={pan}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{
            min: minimumValue,
            max: maximumValue,
            now: value,
            text: String(value),
          }}
          onAccessibilityAction={event => {
            if (event.nativeEvent.actionName === 'increment') {
              const next = Math.min(maximumValue, value + step);
              if (next !== value) { onValueChange(next); }
            } else if (event.nativeEvent.actionName === 'decrement') {
              const prev = Math.max(minimumValue, value - step);
              if (prev !== value) { onValueChange(prev); }
            }
          }}
          testID={testID}
          style={styles.sliderContainer}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            sliderWidthSV.value = w;
            // Set initial thumb position when layout is first known.
            if (range > 0) {
              thumbPos.value = ((value - minimumValue) / range) * w;
            }
          }}>
          {/* Track */}
          <View style={[styles.track, { backgroundColor: theme.colors.disabled }]} />
          {/* Active track */}
          <Animated.View
            style={[
              styles.activeTrack,
              activeTrackStyle,
              { backgroundColor: theme.colors.primary },
            ]}
          />
          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              thumbStyle,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.surfacePrimary,
              },
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  disabled: {
    opacity: opacityTokens.disabled,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderContainer: {
    height: layout.minTouchTarget,
    justifyContent: 'center',
  },
  track: {
    height: sizes.sliderTrack,
    borderRadius: radius.xs,
  },
  activeTrack: {
    position: 'absolute',
    height: sizes.sliderTrack,
    borderRadius: radius.xs,
  },
  thumb: {
    position: 'absolute',
    width: sizes.sliderThumb,
    height: sizes.sliderThumb,
    borderRadius: radius.full,
    borderWidth: borders.medium,
  },
});
