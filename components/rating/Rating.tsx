import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, spacing, useTheme } from '@masicn/ui';

export interface RatingProps {
  /** Current rating value (0–max) */
  value: number;
  /** Total number of icons (default 5) */
  max?: number;
  /** Called with the selected value when a user taps */
  onValueChange?: (value: number) => void;
  /** Read-only mode — no tap interaction */
  readOnly?: boolean;
  /** Allow half-value granularity (tap left half → x.5, right half → x) */
  allowHalf?: boolean;
  /** Size of each icon in pixels (default 28) */
  size?: number;
  /** Icon character — any string or emoji (default '★') */
  icon?: string;
  /** Color of filled icons (default: theme.colors.warning) */
  filledColor?: string;
  /** Color of empty / unfilled icons (default: theme.colors.borderPrimary) */
  emptyColor?: string;
  /** Label shown above the rating row */
  label?: string;
}

export function Rating({
  value,
  max = 5,
  onValueChange,
  readOnly = false,
  allowHalf = false,
  size = 28,
  icon = '★',
  filledColor,
  emptyColor,
  label,
}: RatingProps) {
  const { theme } = useTheme();

  const resolvedFilledColor = filledColor ?? theme.colors.warning;
  const resolvedEmptyColor = emptyColor ?? theme.colors.borderPrimary;

  const handleIconPress = (starIndex: number, half: boolean) => {
    if (readOnly || !onValueChange) { return; }
    onValueChange(half ? starIndex + 0.5 : starIndex + 1);
  };

  return (
    <View>
      {label && (
        <Text variant="label" color="textPrimary" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={styles.row}
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel={label ?? 'Rating'}
        accessibilityValue={{ min: 0, max, now: value, text: `${value} of ${max}` }}
        onAccessibilityAction={e => {
          if (readOnly || !onValueChange) { return; }
          const step = allowHalf ? 0.5 : 1;
          if (e.nativeEvent.actionName === 'increment') {
            onValueChange(Math.min(max, value + step));
          } else if (e.nativeEvent.actionName === 'decrement') {
            onValueChange(Math.max(0, value - step));
          }
        }}>
        {Array.from({ length: max }, (_, i) => {
          const filled = i + 1 <= value;
          const halfFilled = allowHalf && !filled && i + 0.5 <= value;

          return (
            <Pressable
              key={i}
              disabled={readOnly}
              hitSlop={spacing.xs}
              accessibilityRole="button"
              accessibilityLabel={`${i + 1} out of ${max}`}
              accessibilityState={{ selected: filled || halfFilled }}
              onPress={readOnly ? undefined : () => handleIconPress(i, false)}
              style={styles.iconWrapper}>
              {/* Base (empty) icon */}
              <Text style={{ fontSize: size, color: resolvedEmptyColor }}>
                {icon}
              </Text>
              {/* Filled overlay — full or half */}
              {(filled || halfFilled) && (
                <View
                  style={[
                    styles.fillOverlay,
                    halfFilled && styles.fillOverlayHalf,
                  ]}>
                  <Text style={{ fontSize: size, color: resolvedFilledColor }}>
                    {icon}
                  </Text>
                </View>
              )}
              {/* Half-icon left tap zone */}
              {allowHalf && !readOnly && (
                <Pressable
                  style={styles.halfLeft}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                  onPress={() => handleIconPress(i, true)}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconWrapper: {
    position: 'relative',
  },
  fillOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    width: '100%',
  },
  fillOverlayHalf: {
    width: '50%',
  },
  halfLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
  },
});
