import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { borders, motion, radius, sizes, spacing, useReducedMotion, useTheme } from '../../../masicn';
import type { CarouselDotVariant } from './Carousel';

// ─── AnimatedDot ───────────────────────────────────────────────────────────

interface AnimatedDotProps {
  active: boolean;
  variant: CarouselDotVariant;
}

function AnimatedDot({ active, variant }: AnimatedDotProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const width = useSharedValue<number>(active ? sizes.carouselDotActive : sizes.carouselDot);
  const height = useSharedValue<number>(active ? spacing.xs : spacing.xxs);

  React.useEffect(() => {
    const spring = reducedMotion
      ? (v: number) => withTiming(v, { duration: 0 })
      : (v: number) => withSpring(v, motion.spring.snappy);

    if (variant === 'pill') {
      width.value = spring(active ? sizes.carouselDotActive : sizes.carouselDot);
    } else if (variant === 'line') {
      height.value = spring(active ? spacing.xs : spacing.xxs);
    }
  }, [active, variant, reducedMotion, width, height]);

  const animStyle = useAnimatedStyle(() => {
    if (variant === 'pill') { return { width: width.value }; }
    if (variant === 'line') { return { height: height.value }; }
    return {};
  });

  const bgColor = active ? theme.colors.primary : theme.colors.borderPrimary;

  if (variant === 'line') {
    return <Animated.View style={[styles.line, animStyle, { backgroundColor: bgColor }]} />;
  }

  if (variant === 'dot') {
    return <View style={[styles.circle, { backgroundColor: bgColor }]} />;
  }

  return <Animated.View style={[styles.pill, animStyle, { backgroundColor: bgColor }]} />;
}

// ─── CarouselDots ──────────────────────────────────────────────────────────

export interface CarouselDotsProps {
  /** Total number of slides. */
  count: number;
  /** Zero-based index of the currently visible slide. */
  activeIndex: number;
  /** Visual style variant for the indicators. */
  variant: CarouselDotVariant;
}

/**
 * CarouselDots — progress indicator row rendered below a carousel.
 *
 * Renders `count` indicators and highlights the one at `activeIndex`.
 * The `pill` variant animates the active dot width with a spring.
 * The `line` variant animates bar heights. The `dot` variant changes colour only.
 *
 * @example
 * // Pill variant — active dot expands horizontally
 * <CarouselDots count={5} activeIndex={currentIndex} variant="pill" />
 *
 * @example
 * // Dot variant — simple colour-only indicator
 * <CarouselDots count={3} activeIndex={0} variant="dot" />
 *
 * @example
 * // Line variant — active bar grows taller
 * <CarouselDots count={4} activeIndex={2} variant="line" />
 *
 * @example
 * // Driven by state for use alongside a manual pager
 * const [page, setPage] = useState(0);
 * <CarouselDots count={slides.length} activeIndex={page} variant="pill" />
 */
export function CarouselDots({ count, activeIndex, variant }: CarouselDotsProps) {
  return (
    <View style={styles.row} accessibilityElementsHidden>
      {Array.from({ length: count }).map((_, i) => (
        <AnimatedDot key={i} active={i === activeIndex} variant={variant} />
      ))}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pill: {
    height: sizes.carouselDot,
    borderRadius: radius.full,
  },
  circle: {
    width: sizes.carouselDot + 2,
    height: sizes.carouselDot + 2,
    borderRadius: radius.full,
  },
  line: {
    flex: 1,
    borderRadius: borders.thin,
  },
});
