import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text, fonts, motion, sizes, spacing, useReducedMotion, useTheme } from '../../../masicn';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface ProgressRingProps {
  /** Current progress from 0 to 100. Ignored when `indeterminate` is true. */
  value?: number;
  /** When true shows a spinning arc instead of a fixed progress value. */
  indeterminate?: boolean;
  /** Outer diameter of the SVG circle in pixels. Defaults to `sizes.progressCircleDefault`. */
  size?: number;
  /** Width of the progress arc stroke in pixels. Defaults to 8. */
  strokeWidth?: number;
  /** When true (default), renders the rounded percentage label in the center of the circle. Ignored when `indeterminate` is true. */
  showValue?: boolean;
  /** Override the arc stroke color. Defaults to the theme's primary color. */
  color?: string;
  /** Optional text label rendered below the percentage value in the center. */
  label?: string;
}

/**
 * ProgressRing — an SVG-based circular progress indicator.
 *
 * In determinate mode, draws a fixed arc from 0–100% with a centered value label.
 * In indeterminate mode (`indeterminate={true}`), the SVG rotates continuously to
 * indicate ongoing activity. Respects `useReducedMotion` — rotation stops when the
 * user prefers reduced motion.
 *
 * @example
 * // Determinate
 * <ProgressRing value={75} />
 *
 * // Indeterminate (loading)
 * <ProgressRing indeterminate />
 *
 * // Custom color and size
 * <ProgressRing value={completionRate} size={120} color={theme.colors.success} label="Complete" />
 */
export function ProgressRing({
  value = 0,
  indeterminate = false,
  size = sizes.progressCircleDefault,
  strokeWidth = sizes.progressCircleStroke,
  showValue = true,
  color,
  label,
}: ProgressRingProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (indeterminate && !reducedMotion) {
      rotation.value = withRepeat(
        withTiming(360, { duration: motion.duration.slow * 2, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      rotation.value = 0;
    }
  }, [indeterminate, reducedMotion, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const progress = indeterminate ? 30 : Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const progressColor = color || theme.colors.primary;

  const textVariant = size <= 60 ? 'bodySmall' as const : size <= 100 ? 'body' as const : 'h2' as const;
  const labelVariant = size <= 100 ? 'captionSmall' as const : 'caption' as const;

  const svgContent = (
    <>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={theme.colors.surfaceSecondary}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={progressColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </>
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {indeterminate && !reducedMotion ? (
        <AnimatedSvg width={size} height={size} style={[styles.svg, animatedStyle]}>
          {svgContent}
        </AnimatedSvg>
      ) : (
        <Svg width={size} height={size} style={styles.svg}>
          {svgContent}
        </Svg>
      )}
      {!indeterminate && showValue && (
        <View style={styles.content}>
          <Text variant={textVariant} style={styles.value}>{Math.round(progress)}%</Text>
          {label && (
            <Text variant={labelVariant} color="textSecondary" style={styles.label}>{label}</Text>
          )}
        </View>
      )}
      {indeterminate && label && (
        <View style={styles.content}>
          <Text variant={labelVariant} color="textSecondary" style={styles.label}>{label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  content: { alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: fonts.ui.bold },
  label: { marginTop: spacing.xxs },
});
