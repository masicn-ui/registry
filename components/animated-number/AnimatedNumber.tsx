import React from 'react';
import { Animated, type TextStyle } from 'react-native';
import { Text, motion, type TypographyVariant } from '@masicn/ui';

interface AnimatedNumberProps {
  /** Target numeric value — the component smoothly animates to this */
  value: number;
  /** Animation duration in ms (defaults to motion.duration.slow) */
  duration?: number;
  /** Formats the interpolated value to a display string (defaults to Math.round) */
  formatter?: (value: number) => string;
  /** Typography variant */
  variant?: TypographyVariant;
  /** Additional text style */
  style?: TextStyle;
  /** Text color token */
  color?: Parameters<typeof Text>[0]['color'];
}

/**
 * AnimatedNumber — smoothly animates between numeric values.
 * Useful for counters, prices, scores, and dashboard metrics.
 *
 * @example
 * <AnimatedNumber value={score} formatter={v => `${Math.round(v)} pts`} variant="h2" />
 */
export function AnimatedNumber({
  value,
  duration = motion.duration.slow,
  formatter = v => String(Math.round(v)),
  variant = 'body',
  style,
  color,
}: AnimatedNumberProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const animated = React.useRef(new Animated.Value(safeValue)).current;
  const [displayText, setDisplayText] = React.useState(() => formatter(safeValue));

  React.useEffect(() => {
    const listener = animated.addListener(({ value: v }) => {
      setDisplayText(formatter(v));
    });

    const anim = Animated.timing(animated, {
      toValue: safeValue,
      duration,
      useNativeDriver: false,
    });

    anim.start();

    return () => {
      animated.removeListener(listener);
      anim.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeValue, duration]);

  return (
    <Text variant={variant} color={color} style={style}>
      {displayText}
    </Text>
  );
}

export type { AnimatedNumberProps };
