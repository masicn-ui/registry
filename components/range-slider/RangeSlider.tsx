import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
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
  opacity as opacityTokens,
  radius,
  sizes,
  spacing,
  useTheme,
} from '../../../masicn';

// ─── Types ─────────────────────────────────────────────────────────────────

interface RangeSliderProps {
  /** Current low (start) value */
  minValue: number;
  /** Current high (end) value */
  maxValue: number;
  /** Callback when either thumb moves — receives updated [min, max] */
  onRangeChange: (min: number, max: number) => void;
  /** Absolute minimum the low thumb can reach */
  min?: number;
  /** Absolute maximum the high thumb can reach */
  max?: number;
  /** Step increment for both thumbs */
  step?: number;
  /** Minimum gap between the two thumbs (in value units) */
  minGap?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Show current values above the thumbs */
  showValues?: boolean;
  /** Optional label rendered above the slider */
  label?: string;
  /** Container style */
  containerStyle?: ViewStyle;
}

/**
 * RangeSlider — a two-thumb slider for selecting a numeric range.
 *
 * Both thumbs are gesture-driven (GestureDetector + Pan). Thumb positions are
 * tracked with Reanimated shared values so visual updates happen on the UI thread
 * (smooth 60 fps) while value commits go through the JS callback. Gesture uses
 * `translationX` from the saved position at gesture start — no jump on touch.
 *
 * @example
 * const [range, setRange] = React.useState({ min: 200, max: 800 });
 *
 * <RangeSlider
 *   label="Price range"
 *   minValue={range.min}
 *   maxValue={range.max}
 *   min={0}
 *   max={1000}
 *   step={50}
 *   showValues
 *   onRangeChange={(lo, hi) => setRange({ min: lo, max: hi })}
 * />
 *
 * @example
 * // Age range filter with no step
 * const [ages, setAges] = useState({ min: 18, max: 65 });
 * <RangeSlider
 *   label="Age range"
 *   minValue={ages.min}
 *   maxValue={ages.max}
 *   min={18}
 *   max={80}
 *   showValues
 *   onRangeChange={(lo, hi) => setAges({ min: lo, max: hi })}
 * />
 *
 * @example
 * // Rating range (1–5) with minGap of 1
 * <RangeSlider
 *   minValue={minRating}
 *   maxValue={maxRating}
 *   min={1}
 *   max={5}
 *   step={1}
 *   minGap={1}
 *   onRangeChange={setRatingRange}
 * />
 *
 * @example
 * // Disabled range display
 * <RangeSlider
 *   label="Locked range"
 *   minValue={0}
 *   maxValue={100}
 *   onRangeChange={() => {}}
 *   disabled
 * />
 */
export function RangeSlider({
  minValue,
  maxValue,
  onRangeChange,
  min = 0,
  max = 100,
  step = 1,
  minGap = step,
  disabled = false,
  showValues = false,
  label,
  containerStyle,
}: RangeSliderProps) {
  const { theme } = useTheme();
  const [sliderWidth, setSliderWidth] = React.useState(0);

  // ── Position math ─────────────────────────────────────────────────────

  const range = max - min;
  const toPos = useCallback(
    (v: number) => (range === 0 ? 0 : ((v - min) / range) * sliderWidth),
    [min, range, sliderWidth],
  );
  const toValue = useCallback(
    (pos: number) => min + Math.max(0, Math.min(1, pos / sliderWidth)) * range,
    [min, range, sliderWidth],
  );
  const snap = useCallback(
    (raw: number) =>
      Math.max(min, Math.min(max, Math.round(raw / step) * step)),
    [min, max, step],
  );
  const minGapPx = (minGap / range) * sliderWidth;

  // ── Shared values — drive visual position on UI thread ────────────────

  const lowPosShared = useSharedValue(0);
  const highPosShared = useSharedValue(0);
  const lowDragging = useSharedValue(false);
  const highDragging = useSharedValue(false);

  // Sync from controlled prop when sliderWidth is ready or value changes.
  useEffect(() => {
    if (sliderWidth > 0) {
      lowPosShared.value = toPos(minValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minValue, sliderWidth]);

  useEffect(() => {
    if (sliderWidth > 0) {
      highPosShared.value = toPos(maxValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxValue, sliderWidth]);

  // ── Animated styles ───────────────────────────────────────────────────

  const lowThumbStyle = useAnimatedStyle(() => ({
    left: lowPosShared.value - sizes.sliderThumb / 2,
    transform: [{ scale: lowDragging.value ? 1.2 : 1 }],
  }));

  const highThumbStyle = useAnimatedStyle(() => ({
    left: highPosShared.value - sizes.sliderThumb / 2,
    transform: [{ scale: highDragging.value ? 1.2 : 1 }],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    left: lowPosShared.value,
    width: Math.max(0, highPosShared.value - lowPosShared.value),
  }));

  // ── Gestures ──────────────────────────────────────────────────────────

  // Saved track positions at the moment each gesture begins — avoids the
  // jump caused by e.x being relative to the thumb view, not the track.
  const lowSavedPos = useRef(0);
  const highSavedPos = useRef(0);

  // Stable ref to current prop values so worklets can read without stale closure.
  const maxValueRef = useRef(maxValue);
  const minValueRef = useRef(minValue);
  maxValueRef.current = maxValue;
  minValueRef.current = minValue;

  const commitLow = useCallback(
    (pos: number) => {
      const next = snap(toValue(pos));
      const clamped = Math.min(next, maxValueRef.current - minGap);
      if (clamped !== minValueRef.current) {
        onRangeChange(clamped, maxValueRef.current);
      }
    },
    [snap, toValue, minGap, onRangeChange],
  );

  const commitHigh = useCallback(
    (pos: number) => {
      const next = snap(toValue(pos));
      const clamped = Math.max(next, minValueRef.current + minGap);
      if (clamped !== maxValueRef.current) {
        onRangeChange(minValueRef.current, clamped);
      }
    },
    [snap, toValue, minGap, onRangeChange],
  );

  const lowGesture = Gesture.Pan()
    .minDistance(0)
    .enabled(!disabled)
    .onBegin(() => {
      lowSavedPos.current = lowPosShared.value;
      lowDragging.value = true;
    })
    .onUpdate(e => {
      const raw = lowSavedPos.current + e.translationX;
      const clamped = Math.max(
        0,
        Math.min(highPosShared.value - minGapPx, raw),
      );
      lowPosShared.value = clamped;
      scheduleOnRN(commitLow, clamped);
    })
    .onEnd(() => {
      lowDragging.value = false;
    })
    .onFinalize(() => {
      lowDragging.value = false;
    });

  const highGesture = Gesture.Pan()
    .minDistance(0)
    .enabled(!disabled)
    .onBegin(() => {
      highSavedPos.current = highPosShared.value;
      highDragging.value = true;
    })
    .onUpdate(e => {
      const raw = highSavedPos.current + e.translationX;
      const clamped = Math.max(
        lowPosShared.value + minGapPx,
        Math.min(sliderWidth, raw),
      );
      highPosShared.value = clamped;
      scheduleOnRN(commitHigh, clamped);
    })
    .onEnd(() => {
      highDragging.value = false;
    })
    .onFinalize(() => {
      highDragging.value = false;
    });

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <View
      style={[styles.container, disabled && styles.disabled, containerStyle]}
    >
      {(label || showValues) && (
        <View style={styles.header}>
          {label && (
            <Text
              variant="body"
              color={disabled ? 'textDisabled' : 'textPrimary'}
            >
              {label}
            </Text>
          )}
          {showValues && (
            <Text
              variant="bodySmall"
              color={disabled ? 'textDisabled' : 'textSecondary'}
            >
              {minValue} – {maxValue}
            </Text>
          )}
        </View>
      )}

      <View
        style={styles.sliderContainer}
        onLayout={e => setSliderWidth(e.nativeEvent.layout.width)}
      >
        {/* Full track */}
        <View
          style={[styles.track, { backgroundColor: theme.colors.disabled }]}
        />

        {/* Active range between thumbs */}
        <Animated.View
          style={[
            styles.activeTrack,
            activeTrackStyle,
            { backgroundColor: theme.colors.primary },
          ]}
        />

        {/* Low thumb */}
        <GestureDetector gesture={lowGesture}>
          <Animated.View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={label ? `${label} minimum` : 'Minimum value'}
            accessibilityValue={{
              min,
              max,
              now: minValue,
              text: String(minValue),
            }}
            onAccessibilityAction={e => {
              if (e.nativeEvent.actionName === 'increment') {
                const next = Math.min(maxValue - minGap, minValue + step);
                if (next !== minValue) {
                  onRangeChange(next, maxValue);
                }
              } else if (e.nativeEvent.actionName === 'decrement') {
                const next = Math.max(min, minValue - step);
                if (next !== minValue) {
                  onRangeChange(next, maxValue);
                }
              }
            }}
            style={[
              styles.thumb,
              lowThumbStyle,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.surfacePrimary,
              },
            ]}
          />
        </GestureDetector>

        {/* High thumb */}
        <GestureDetector gesture={highGesture}>
          <Animated.View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={label ? `${label} maximum` : 'Maximum value'}
            accessibilityValue={{
              min,
              max,
              now: maxValue,
              text: String(maxValue),
            }}
            onAccessibilityAction={e => {
              if (e.nativeEvent.actionName === 'increment') {
                const next = Math.min(max, maxValue + step);
                if (next !== maxValue) {
                  onRangeChange(minValue, next);
                }
              } else if (e.nativeEvent.actionName === 'decrement') {
                const next = Math.max(minValue + minGap, maxValue - step);
                if (next !== maxValue) {
                  onRangeChange(minValue, next);
                }
              }
            }}
            style={[
              styles.thumb,
              highThumbStyle,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.surfacePrimary,
              },
            ]}
          />
        </GestureDetector>
      </View>
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
