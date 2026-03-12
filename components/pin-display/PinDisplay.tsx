// File: components/pin-display/PinDisplay.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, spacing, radius, borders } from '@masicn/ui';

export type PinDisplayVariant = 'default' | 'error' | 'success';

interface PinDisplayProps {
  /** Total number of dots (pin length). */
  length: number;
  /** Number of filled dots (characters entered so far). */
  filled: number;
  variant?: PinDisplayVariant;
  size?: 'sm' | 'md' | 'lg';
  gap?: 'sm' | 'md' | 'lg';
}

const DOT_SIZES = { sm: 8, md: 12, lg: 16 } as const;
const GAP_SIZES = { sm: spacing.sm, md: spacing.md, lg: spacing.lg } as const;

export function PinDisplay({
  length,
  filled,
  variant = 'default',
  size = 'md',
  gap = 'md',
}: PinDisplayProps) {
  const { theme } = useTheme();

  const dotSize = DOT_SIZES[size];
  const gapSize = GAP_SIZES[gap];

  const filledColors: Record<PinDisplayVariant, string> = {
    default: theme.colors.primary,
    error: theme.colors.error,
    success: theme.colors.success,
  };
  const activeColor = filledColors[variant];

  return (
    <View
      style={[styles.row, { gap: gapSize }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: length, now: filled }}
      accessibilityLabel={`${filled} of ${length} digits entered`}
    >
      {Array.from({ length }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderColor: isFilled ? activeColor : theme.colors.borderPrimary,
                backgroundColor: isFilled ? activeColor : undefined,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    borderRadius: radius.full,
    borderWidth: borders.thin,
  },
});
