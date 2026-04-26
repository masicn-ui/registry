import React, { useCallback } from 'react';
import { type TextStyle } from 'react-native';
import { useSharedValue, withTiming, cancelAnimation, useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text, motion, useReducedMotion, type TypographyVariant } from '../../../masicn';

export interface TickerProps {
  /** Target numeric value — the component smoothly animates to this */
  value: number;
  /** Animation duration in ms. Defaults to motion.duration.slow. */
  duration?: number;
  /** Formats the interpolated value to a display string. Defaults to `Math.round`. */
  formatter?: (value: number) => string;
  /** Typography variant */
  variant?: TypographyVariant;
  /** Additional text style */
  style?: TextStyle;
  /** Text color token */
  color?: Parameters<typeof Text>[0]['color'];
}

/**
 * Ticker — smoothly animates between numeric values.
 *
 * Useful for counters, live scores, prices, and dashboard metrics. Pass a
 * custom `formatter` to render the animated value as currency, percentages,
 * or any other string format.
 *
 * @example
 * // Score counter
 * <Ticker value={score} formatter={v => `${Math.round(v)} pts`} variant="h2" />
 *
 * @example
 * // Currency
 * <Ticker value={price} formatter={v => `$${v.toFixed(2)}`} variant="bodyLarge" />
 *
 * @example
 * // Percentage stat on a dashboard
 * <Ticker value={conversionRate} formatter={v => `${v.toFixed(1)}%`} variant="h3" color="success" />
 *
 * @example
 * // Live viewer count with slow animation
 * <Ticker value={viewerCount} duration={2000} formatter={v => `${Math.round(v).toLocaleString()} viewers`} />
 */
export function Ticker({
  value,
  duration = motion.duration.slow,
  formatter = v => String(Math.round(v)),
  variant = 'body',
  style,
  color,
}: TickerProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const reducedMotion = useReducedMotion();
  const animated = useSharedValue(safeValue);
  const [displayText, setDisplayText] = React.useState(() => formatter(safeValue));

  const updateDisplay = useCallback((v: number) => {
    setDisplayText(formatter(v));
  }, [formatter]);

  useAnimatedReaction(
    () => animated.value,
    (v) => scheduleOnRN(updateDisplay, v),
    [updateDisplay],
  );

  React.useEffect(() => {
    const dur = reducedMotion ? motion.duration.instant : duration;
    animated.value = withTiming(safeValue, { duration: dur });
    return () => cancelAnimation(animated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeValue, duration, reducedMotion]);

  return (
    <Text variant={variant} color={color} style={style}>
      {displayText}
    </Text>
  );
}
