import React from 'react';
import {
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Text, borders, layout, opacity as opacityTokens, radius, sizes, spacing, useTheme } from '../../../masicn';

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
  /** Minimum gap between the two thumbs */
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
 * Both thumbs are gesture-driven (GestureDetector + Pan), constrained so
 * they never overlap (respects `minGap`). Supports steps, disabled state
 * via opacity, and optional value labels.
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
  const [draggingLow, setDraggingLow] = React.useState(false);
  const [draggingHigh, setDraggingHigh] = React.useState(false);

  const toPercent = (v: number) => (max === min ? 0 : (v - min) / (max - min));
  const snap = (raw: number) =>
    Math.max(min, Math.min(max, Math.round(raw / step) * step));

  const lowPos = sliderWidth > 0 ? toPercent(minValue) * sliderWidth : 0;
  const highPos = sliderWidth > 0 ? toPercent(maxValue) * sliderWidth : 0;

  const xToValue = (x: number) =>
    min + (Math.max(0, Math.min(1, x / sliderWidth))) * (max - min);

  const updateLow = React.useCallback((x: number) => {
    if (sliderWidth === 0) { return; }
    const next = snap(xToValue(x));
    const clamped = Math.min(next, maxValue - minGap);
    if (clamped !== minValue) { onRangeChange(clamped, maxValue); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderWidth, min, max, step, minGap, minValue, maxValue, onRangeChange]);

  const updateHigh = React.useCallback((x: number) => {
    if (sliderWidth === 0) { return; }
    const next = snap(xToValue(x));
    const clamped = Math.max(next, minValue + minGap);
    if (clamped !== maxValue) { onRangeChange(minValue, clamped); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderWidth, min, max, step, minGap, minValue, maxValue, onRangeChange]);

  const lowGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .enabled(!disabled)
    .onBegin(e => { setDraggingLow(true); updateLow(e.x); })
    .onUpdate(e => { updateLow(e.x); })
    .onEnd(() => setDraggingLow(false))
    .onFinalize(() => setDraggingLow(false));

  const highGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .enabled(!disabled)
    .onBegin(e => { setDraggingHigh(true); updateHigh(e.x); })
    .onUpdate(e => { updateHigh(e.x); })
    .onEnd(() => setDraggingHigh(false))
    .onFinalize(() => setDraggingHigh(false));

  return (
    <View style={[styles.container, disabled && styles.disabled, containerStyle]}>
      {(label || showValues) && (
        <View style={styles.header}>
          {label && (
            <Text variant="body" color={disabled ? 'textDisabled' : 'textPrimary'}>
              {label}
            </Text>
          )}
          {showValues && (
            <Text variant="bodySmall" color={disabled ? 'textDisabled' : 'textSecondary'}>
              {minValue} – {maxValue}
            </Text>
          )}
        </View>
      )}

      <View
        style={styles.sliderContainer}
        onLayout={e => setSliderWidth(e.nativeEvent.layout.width)}>
        {/* Full track */}
        <View style={[styles.track, { backgroundColor: theme.colors.disabled }]} />

        {/* Active range between thumbs */}
        <View
          style={[
            styles.activeTrack,
            {
              backgroundColor: theme.colors.primary,
              left: lowPos,
              width: Math.max(0, highPos - lowPos),
            },
          ]}
        />

        {/* Low thumb */}
        <GestureDetector gesture={lowGesture}>
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={label ? `${label} minimum` : 'Minimum value'}
            accessibilityValue={{ min, max, now: minValue, text: String(minValue) }}
            onAccessibilityAction={e => {
              if (e.nativeEvent.actionName === 'increment') {
                const next = Math.min(maxValue - minGap, minValue + step);
                if (next !== minValue) { onRangeChange(next, maxValue); }
              } else if (e.nativeEvent.actionName === 'decrement') {
                const next = Math.max(min, minValue - step);
                if (next !== minValue) { onRangeChange(next, maxValue); }
              }
            }}
            style={[
              styles.thumb,
              {
                backgroundColor: theme.colors.primary,
                left: lowPos - sizes.sliderThumb / 2,
                borderColor: theme.colors.surfacePrimary,
                transform: [{ scale: draggingLow ? 1.2 : 1 }],
              },
            ]}
          />
        </GestureDetector>

        {/* High thumb */}
        <GestureDetector gesture={highGesture}>
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={label ? `${label} maximum` : 'Maximum value'}
            accessibilityValue={{ min, max, now: maxValue, text: String(maxValue) }}
            onAccessibilityAction={e => {
              if (e.nativeEvent.actionName === 'increment') {
                const next = Math.min(max, maxValue + step);
                if (next !== maxValue) { onRangeChange(minValue, next); }
              } else if (e.nativeEvent.actionName === 'decrement') {
                const next = Math.max(minValue + minGap, maxValue - step);
                if (next !== maxValue) { onRangeChange(minValue, next); }
              }
            }}
            style={[
              styles.thumb,
              {
                backgroundColor: theme.colors.primary,
                left: highPos - sizes.sliderThumb / 2,
                borderColor: theme.colors.surfacePrimary,
                transform: [{ scale: draggingHigh ? 1.2 : 1 }],
              },
            ]}
          />
        </GestureDetector>
      </View>
    </View>
  );
}

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
