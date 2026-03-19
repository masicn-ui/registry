import React from 'react';
import {
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Text, borders, radius, sizes, spacing, useTheme } from '../../../masicn';

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
}

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
}: SliderProps) {
  const { theme } = useTheme();
  const [sliderWidth, setSliderWidth] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  const normalizedValue =
    (value - minimumValue) / (maximumValue - minimumValue);
  const thumbPosition = normalizedValue * sliderWidth;

  const updateValue = React.useCallback((relativeX: number) => {
    if (sliderWidth === 0) return;

    const percentage = Math.max(0, Math.min(1, relativeX / sliderWidth));
    const rawValue = minimumValue + percentage * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(
      minimumValue,
      Math.min(maximumValue, steppedValue),
    );

    if (clampedValue !== value) {
      onValueChange(clampedValue);
    }
  }, [sliderWidth, minimumValue, maximumValue, step, value, onValueChange]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .enabled(!disabled)
    .onBegin((e) => {
      setDragging(true);
      updateValue(e.x);
    })
    .onUpdate((e) => {
      updateValue(e.x);
    })
    .onEnd(() => {
      setDragging(false);
    })
    .onFinalize(() => {
      setDragging(false);
    });

  return (
    <View style={[styles.container, containerStyle]}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && (
            <Text
              variant="body"
              color={disabled ? 'textDisabled' : 'textPrimary'}>
              {label}
            </Text>
          )}
          {showValue && (
            <Text
              variant="bodySmall"
              color={disabled ? 'textDisabled' : 'textSecondary'}>
              {value}
            </Text>
          )}
        </View>
      )}
      <GestureDetector gesture={pan}>
        <View
          accessible={true}
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{
            min: minimumValue,
            max: maximumValue,
            now: value,
            text: String(value),
          }}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment') {
              const next = Math.min(maximumValue, value + step);
              if (next !== value) { onValueChange(next); }
            } else if (event.nativeEvent.actionName === 'decrement') {
              const prev = Math.max(minimumValue, value - step);
              if (prev !== value) { onValueChange(prev); }
            }
          }}
          style={styles.sliderContainer}
          onLayout={e => {
            setSliderWidth(e.nativeEvent.layout.width);
          }}>
          {/* Track */}
          <View
            style={[
              styles.track,
              { backgroundColor: theme.colors.disabled },
            ]}
          />
          {/* Active track */}
          <View
            style={[
              styles.activeTrack,
              {
                backgroundColor: disabled
                  ? theme.colors.disabled
                  : theme.colors.primary,
                width: thumbPosition,
              },
            ]}
          />
          {/* Thumb */}
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: disabled
                  ? theme.colors.disabled
                  : theme.colors.primary,
                left: thumbPosition - sizes.sliderThumb / 2,
                transform: [{ scale: dragging ? 1.2 : 1 }],
                borderColor: theme.colors.surfacePrimary,
              },
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderContainer: {
    height: sizes.touchTarget,
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
