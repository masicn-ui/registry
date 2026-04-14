import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, spacing, radius, borders } from '../../../masicn';

export type PinVariant = 'default' | 'error' | 'success';

interface PinProps {
  /** Total number of dots (pin length). */
  length: number;
  /** Number of filled dots (characters entered so far). */
  filled: number;
  /**
   * Visual state of the dots.
   * - `'default'` — filled dots use the primary color (default)
   * - `'error'` — filled dots use the error/red color
   * - `'success'` — filled dots use the success/green color
   */
  variant?: PinVariant;
  /**
   * Diameter of each dot.
   * - `'sm'` → 8 px
   * - `'md'` → 12 px (default)
   * - `'lg'` → 16 px
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Spacing between dots.
   * - `'sm'` → spacing.sm
   * - `'md'` → spacing.md (default)
   * - `'lg'` → spacing.lg
   */
  gap?: 'sm' | 'md' | 'lg';
}

const DOT_SIZES = { sm: 8, md: 12, lg: 16 } as const;
const GAP_SIZES = { sm: spacing.sm, md: spacing.md, lg: spacing.lg } as const;

/**
 * Pin — a row of circular dot indicators used to visualise PIN entry progress.
 *
 * Renders `length` dots in a horizontal row. The first `filled` dots are drawn
 * as solid circles in the active color dictated by `variant`; the remaining
 * dots appear as outlined empty circles. The component carries appropriate
 * accessibility semantics (`progressbar` role with min/max/now values).
 *
 * Pair this with a hidden `TextInput` (or a custom numpad) to build a PIN
 * entry screen.
 *
 * @example
 * // 4-digit PIN with 2 digits entered
 * <Pin length={4} filled={pin.length} />
 *
 * // Error state after a failed attempt
 * <Pin length={4} filled={4} variant="error" size="lg" />
 */
export function Pin({
  length,
  filled,
  variant = 'default',
  size = 'md',
  gap = 'md',
}: PinProps) {
  const { theme } = useTheme();

  const dotSize = DOT_SIZES[size];
  const gapSize = GAP_SIZES[gap];

  const filledColors: Record<PinVariant, string> = {
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
