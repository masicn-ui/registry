import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { Text, fonts, sizes, spacing, useTheme } from '../../../masicn'

interface ProgressCircleProps {
  /** Current progress from 0 to 100. Values outside this range are clamped. */
  value: number;
  /** Outer diameter of the SVG circle in pixels. Defaults to `sizes.progressCircleDefault`. */
  size?: number;
  /** Width of the progress arc stroke in pixels. Defaults to 8. */
  strokeWidth?: number;
  /** When true (default), renders the rounded percentage label in the center of the circle. */
  showValue?: boolean;
  /** Override the arc stroke color. Defaults to the theme's primary color. */
  color?: string;
  /** Optional text label rendered below the percentage value in the center. */
  label?: string;
}

/**
 * ProgressCircle — an SVG-based circular progress indicator with a centered value label.
 *
 * Uses `react-native-svg` to draw two concentric circles: a static background
 * track (using `surfaceSecondary`) and an animated arc whose dash offset is
 * derived from the current `value`. The arc starts at the 12 o'clock position
 * (achieved via a -90° SVG rotation) and has rounded end caps.
 *
 * The `value` is clamped to [0, 100] before rendering. When `showValue` is true,
 * the rounded integer percentage is displayed in bold in the center, with an
 * optional `label` line below it.
 *
 * @example
 * // Basic usage
 * <ProgressCircle value={75} />
 *
 * // Custom color, size, and label
 * <ProgressCircle
 *   value={completionRate}
 *   size={120}
 *   strokeWidth={10}
 *   color={theme.colors.success}
 *   label="Complete"
 * />
 */
export function ProgressCircle({
  value,
  size = sizes.progressCircleDefault,
  strokeWidth = 8,
  showValue = true,
  color,
  label,
}: ProgressCircleProps) {
  const { theme } = useTheme();

  const progress = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const progressColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
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
      </Svg>
      {showValue && (
        <View style={styles.content}>
          <Text variant="h2" style={styles.value}>{Math.round(progress)}%</Text>
          {label && (
            <Text variant="caption" color="textSecondary" style={styles.label}>{label}</Text>
          )}
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
