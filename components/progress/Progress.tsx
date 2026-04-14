import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Text, borders, motion, radius, sizes, spacing, useReducedMotion, useTheme } from '../../../masicn';

type ProgressVariant = 'linear' | 'circular';

interface ProgressProps {
  /** Current progress value from 0 to 100. */
  value: number;
  /**
   * Layout variant.
   * - `'linear'` — horizontal bar (default)
   * - `'circular'` — circular track (placeholder; full SVG arc not yet implemented)
   */
  variant?: ProgressVariant;
  /** Show the numeric percentage label alongside the bar. Defaults to false. */
  showValue?: boolean;
  /** Descriptive label rendered above the bar on the left. */
  label?: string;
  /** Height of the linear track in pixels. Defaults to `sizes.progressBarDefault`. */
  height?: number;
  /** Diameter of the circular variant in pixels. Defaults to 48. */
  size?: number;
  /**
   * When true, the bar animates in a looping sweep to indicate an unknown
   * duration. The `value` prop is ignored while `indeterminate` is active.
   * Defaults to false.
   */
  indeterminate?: boolean;
  /** Additional style applied to the outermost container. */
  containerStyle?: ViewStyle;
}

const INDETERMINATE_FILL = 0.35;

/**
 * Progress — a linear or circular progress indicator.
 *
 * In determinate mode (`indeterminate={false}`) the fill width animates smoothly
 * to the current `value` (0–100) using `Animated.timing`. In indeterminate mode
 * a fixed-width sweep tile translates continuously across the track using
 * Reanimated to convey ongoing but unmeasured progress.
 *
 * The circular variant renders a bordered ring with an optional centered
 * percentage label; a full SVG arc fill is not yet implemented in this variant.
 *
 * @example
 * // Determinate linear bar with label and value
 * <Progress value={uploadProgress} label="Uploading…" showValue />
 *
 * // Indeterminate loading bar
 * <Progress value={0} indeterminate />
 *
 * // Circular indicator
 * <Progress value={72} variant="circular" size={64} showValue />
 */
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
  const reducedMotion = useReducedMotion();
  const animWidth = useSharedValue(0);
  const hasMeasured = React.useRef(false);
  const [trackWidth, setTrackWidth] = React.useState(0);

  React.useEffect(() => {
    if (!indeterminate && trackWidth > 0) {
      const targetWidth = (value / 100) * trackWidth;
      if (!hasMeasured.current) {
        hasMeasured.current = true;
        animWidth.value = targetWidth;
      } else {
        animWidth.value = withTiming(targetWidth, {
          duration: reducedMotion ? motion.duration.instant : motion.duration.slow,
        });
      }
    }
  }, [value, trackWidth, indeterminate, reducedMotion, animWidth]);

  const indAnim = useSharedValue(0);

  React.useEffect(() => {
    if (indeterminate && trackWidth > 0) {
      const fillPx = trackWidth * INDETERMINATE_FILL;
      indAnim.value = -fillPx;
      indAnim.value = withRepeat(
        withTiming(trackWidth, { duration: motion.duration.sweep }),
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

  const animWidthStyle = useAnimatedStyle(() => ({
    width: animWidth.value,
  }));

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
          <Reanimated.View
            style={[
              styles.fill,
              { height, backgroundColor: theme.colors.primary, borderRadius: trackBorderRadius },
              animWidthStyle,
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
