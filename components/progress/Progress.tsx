import React from 'react';
import { View, StyleSheet, type ViewStyle, Animated } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Text, borders, motion, radius, sizes, spacing, useTheme } from '../../../masicn'

type ProgressVariant = 'linear' | 'circular';

interface ProgressProps {
  value: number;
  variant?: ProgressVariant;
  showValue?: boolean;
  label?: string;
  height?: number;
  size?: number;
  indeterminate?: boolean;
  containerStyle?: ViewStyle;
}

const INDETERMINATE_FILL = 0.35;

export function Progress({
  value,
  variant = 'linear',
  showValue = false,
  label,
  height = sizes.progressBarDefault,
  size = 48,
  indeterminate = false,
  containerStyle,
}: ProgressProps) {
  const { theme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = React.useState(0);

  React.useEffect(() => {
    if (!indeterminate) {
      Animated.timing(animatedValue, {
        toValue: value,
        duration: motion.duration.slow,
        useNativeDriver: false,
      }).start();
    }
  }, [value, animatedValue, indeterminate]);

  const indAnim = useSharedValue(0);

  React.useEffect(() => {
    if (indeterminate && trackWidth > 0) {
      const fillPx = trackWidth * INDETERMINATE_FILL;
      indAnim.value = -fillPx;
      indAnim.value = withRepeat(
        withTiming(trackWidth, { duration: 1400 }),
        -1,
        false,
      );
    } else {
      cancelAnimation(indAnim);
      indAnim.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeterminate, trackWidth]);

  const indAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indAnim.value }],
  }));

  const width = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (variant === 'circular') {
    return (
      <View style={[styles.circularContainer, { width: size, height: size }, containerStyle]}>
        <View
          style={[
            styles.circularTrack,
            { width: size, height: size, borderRadius: size / 2, borderColor: theme.colors.disabled },
          ]}
        />
        {showValue && (
          <View style={styles.circularValue}>
            <Text variant="bodySmall" color="textPrimary">{Math.round(value)}%</Text>
          </View>
        )}
      </View>
    );
  }

  const trackBorderRadius = height / 2;

  return (
    <View style={[styles.container, containerStyle]}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && <Text variant="body" color="textPrimary">{label}</Text>}
          {showValue && !indeterminate && (
            <Text variant="bodySmall" color="textSecondary">{Math.round(value)}%</Text>
          )}
        </View>
      )}
      <View
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
        style={[
          styles.track,
          { height, backgroundColor: theme.colors.disabled, borderRadius: trackBorderRadius },
        ]}>
        {indeterminate ? (
          <Reanimated.View
            style={[
              {
                width: trackWidth * INDETERMINATE_FILL,
                height,
                backgroundColor: theme.colors.primary,
                borderRadius: trackBorderRadius,
              },
              indAnimStyle,
            ]}
          />
        ) : (
          <Animated.View
            style={[
              styles.fill,
              { width, height, backgroundColor: theme.colors.primary, borderRadius: trackBorderRadius },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { overflow: 'hidden' },
  fill: { borderRadius: radius.full },
  circularContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  circularTrack: { borderWidth: borders.thick },
  circularValue: { position: 'absolute' },
});
