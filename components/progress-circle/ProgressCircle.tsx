// File: components/progress-circle/ProgressCircle.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { useTheme, spacing, fonts, sizes } from '@masicn/ui';
import { Text } from '@/components/ui/Text';

interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  color?: string;
  label?: string;
}

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
