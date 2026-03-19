import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme, spacing, radius, sizes, borders, motion } from '../../../masicn';

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * Visual transition style applied to each slide as it moves in/out of focus.
 *
 * - `'scale'`    — active slide is full-size; adjacent slides shrink and fade slightly.
 * - `'fade'`     — adjacent slides fade to near-transparent.
 * - `'parallax'` — the slide's inner content scrolls at a slower rate than the container,
 *                  creating a depth effect (inner layer is 1.4× wide with offset margins).
 * - `'cube'`     — slides rotate on the Y-axis as if faces of a 3-D cube (perspective 800).
 */
export type CarouselAnimation = 'scale' | 'fade' | 'parallax' | 'cube';

/**
 * Shape of the page-progress indicator rendered below the carousel.
 *
 * - `'pill'` — active dot expands into a wider pill; inactive dots are small circles.
 * - `'dot'`  — uniform circles; active dot changes colour only.
 * - `'line'` — full-width bars that span the available width equally; active bar is taller.
 */
export type CarouselDotVariant = 'pill' | 'dot' | 'line';

/**
 * How wide each slide should be.
 *
 * - `'full'`   — slide fills the entire screen width (no peeking).
 * - `'peek'`   — slide is 85% of screen width, revealing the edges of adjacent slides.
 * - `number`   — explicit pixel width.
 */
export type CarouselSlideWidth = 'full' | 'peek' | number;

/**
 * Props for the generic `Carousel` component.
 */
export interface CarouselProps<T> {
  /** Array of data items to render; one slide is created per item. */
  data: T[];
  /** Renders the content of a single slide; receives the item and its index. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Returns a stable string key for each item (defaults to `carousel-{index}`). */
  keyExtractor?: (item: T, index: number) => string;
  /** Visual transition style applied while swiping (default `'scale'`). */
  animation?: CarouselAnimation;
  /** Width strategy for each slide (default `'full'`). */
  slideWidth?: CarouselSlideWidth;
  /** Fixed height of every slide in pixels (default from `sizes.carouselSlideDefaultHeight`). */
  slideHeight?: number;
  /** Border radius token applied to every slide (default `'lg'`). */
  slideBorderRadius?: keyof typeof radius;
  /** Gap in pixels between slides — only applied in peek/fixed-width modes (default `spacing.sm`). */
  gap?: number;
  /** Whether to render the dot/line progress indicator below the carousel (default `true`). */
  showDots?: boolean;
  /** Visual style of the dot indicator (default `'pill'`). */
  dotVariant?: CarouselDotVariant;
  /**
   * Auto-advance interval in milliseconds. Set to `0` (default) to disable.
   * Auto-play restarts from the beginning once the last slide is reached.
   */
  autoPlayInterval?: number;
  /** Called when a slide is pressed (requires `onItemPress` to be defined to make slides pressable). */
  onItemPress?: (item: T, index: number) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const SNAP_SPRING = motion.spring.snap;
const VELOCITY_LOOKAHEAD = 0.15;
const RUBBER_BAND_COEFF = 0.15;

// ─── Slide static styles ───────────────────────────────────────────────────

const slideStyles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  inner: { height: '100%', overflow: 'hidden' },
});

// ─── AnimatedSlide ─────────────────────────────────────────────────────────

interface AnimatedSlideProps {
  /** Shared value tracking the current scroll offset in pixels. */
  offset: SharedValue<number>;
  /** Zero-based position of this slide in the data array. */
  index: number;
  /** Pixel width of this slide. */
  itemWidth: number;
  /** Pixel distance between consecutive snap points (`itemWidth + gap`). */
  scrollStep: number;
  /** Animation variant to apply. */
  animation: CarouselAnimation;
  /** Resolved border radius value in pixels. */
  borderRadiusValue: number;
  /** Slide height in pixels. */
  height: number;
  /** Slide content. */
  children: React.ReactNode;
}

/**
 * AnimatedSlide — internal wrapper that applies the chosen animation effect
 * to a single carousel slide using Reanimated worklets.
 *
 * All animation variants derive a normalised `progress` value:
 *   `progress = (offset - index * scrollStep) / scrollStep`
 *
 * `progress === 0` means the slide is perfectly centred; `±1` means it is
 * exactly one full step away. The `parallax` variant wraps content in a second
 * `Animated.View` whose `translateX` moves at 20% of the container width,
 * creating the layered depth effect.
 */
function AnimatedSlide({
  offset,
  index,
  itemWidth,
  scrollStep,
  animation,
  borderRadiusValue,
  height,
  children,
}: AnimatedSlideProps) {
  const hw = itemWidth / 2;

  const outerStyle = useAnimatedStyle(() => {
    const progress = (offset.value - index * scrollStep) / scrollStep;
    const absP = Math.abs(progress);

    switch (animation) {
      case 'scale': {
        const scale = interpolate(absP, [0, 1], [1, 0.85], Extrapolation.CLAMP);
        const opacity = interpolate(absP, [0, 1], [1, 0.7], Extrapolation.CLAMP);
        return { transform: [{ scale }], opacity };
      }
      case 'fade': {
        const opacity = interpolate(absP, [0, 1], [1, 0.3], Extrapolation.CLAMP);
        return { opacity };
      }
      case 'cube': {
        const deg = interpolate(
          progress,
          [-1, 0, 1],
          [90, 0, -90],
          Extrapolation.CLAMP,
        );
        const pivot = interpolate(
          progress,
          [-1, 0, 1],
          [hw, 0, -hw],
          Extrapolation.CLAMP,
        );
        return {
          transform: [
            { perspective: 800 },
            { translateX: pivot },
            { rotateY: `${deg}deg` },
          ],
        };
      }
      case 'parallax':
      default:
        return {};
    }
  });

  const innerParallaxStyle = useAnimatedStyle(() => {
    if (animation !== 'parallax') { return {}; }
    const progress = (offset.value - index * scrollStep) / scrollStep;
    const translateX = interpolate(
      progress,
      [-1, 0, 1],
      [itemWidth * 0.2, 0, -(itemWidth * 0.2)],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }] };
  });

  if (animation === 'parallax') {
    const innerWidth = itemWidth * 1.4;
    const innerMarginLeft = -(itemWidth * 0.2);
    return (
      <Animated.View
        style={[
          outerStyle,
          slideStyles.clip,
          { width: itemWidth, height, borderRadius: borderRadiusValue },
        ]}>
        <Animated.View
          style={[
            innerParallaxStyle,
            slideStyles.inner,
            { width: innerWidth, marginLeft: innerMarginLeft },
          ]}>
          {children}
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        outerStyle,
        slideStyles.clip,
        { width: itemWidth, height, borderRadius: borderRadiusValue },
      ]}>
      {children}
    </Animated.View>
  );
}

// ─── Dot Indicators ────────────────────────────────────────────────────────

interface DotsProps {
  /** Total number of slides. */
  count: number;
  /** Zero-based index of the currently visible slide. */
  activeIndex: number;
  /** Visual style variant for the indicators. */
  variant: CarouselDotVariant;
}

/**
 * Dots — internal progress indicator row rendered below the carousel.
 * Renders `count` indicators and highlights the one at `activeIndex`.
 * The `line` variant stretches each indicator to fill equal horizontal space.
 */
function Dots({ count, activeIndex, variant }: DotsProps) {
  const { theme } = useTheme();

  if (variant === 'line') {
    return (
      <View style={dotStyles.row} accessibilityElementsHidden>
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            style={[
              dotStyles.line,
              i === activeIndex ? dotStyles.lineActive : dotStyles.lineInactive,
              {
                backgroundColor:
                  i === activeIndex
                    ? theme.colors.primary
                    : theme.colors.borderPrimary,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (variant === 'dot') {
    return (
      <View style={dotStyles.row} accessibilityElementsHidden>
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            style={[
              dotStyles.circle,
              {
                backgroundColor:
                  i === activeIndex
                    ? theme.colors.primary
                    : theme.colors.borderPrimary,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={dotStyles.row} accessibilityElementsHidden>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <View
            key={i}
            style={[
              dotStyles.pill,
              {
                width: active ? sizes.carouselDotActive : sizes.carouselDot,
                backgroundColor: active
                  ? theme.colors.primary
                  : theme.colors.borderPrimary,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── Carousel ──────────────────────────────────────────────────────────────

/**
 * Carousel — horizontal swipe-based slide viewer built on Gesture.Pan() + Reanimated.
 *
 * Scroll math (single source of truth):
 *   scrollStep  = itemWidth + gap
 *   progress_i  = (offset - i * scrollStep) / scrollStep
 *   snap target = index * scrollStep
 *
 * Active index is derived from the snap target in onEnd.
 * All animation variants share the same progress formula.
 *
 * Layout values (`scrollStep`, `maxOffset`, `dataLength`, `horizontalPadding`) are
 * kept in sync via shared values updated synchronously on every render, so the
 * gesture worklet always reads the latest layout without needing to be recreated
 * on orientation change.
 *
 * Rubber-banding is applied at both ends (coefficient 0.15) so the gesture feels
 * natural when the user drags past the first or last slide. Velocity lookahead
 * (0.15 s) lets a fast flick jump more than one slide.
 *
 * Note: slides render eagerly (no virtualization). Suitable for ~30 slides.
 *
 * @example
 * // Full-width scale carousel with auto-play
 * <Carousel
 *   data={slides}
 *   renderItem={(item) => <Image source={{ uri: item.image }} style={{ flex: 1 }} />}
 *   animation="scale"
 *   autoPlayInterval={3000}
 * />
 *
 * @example
 * // Peek mode with cube animation
 * <Carousel
 *   data={cards}
 *   renderItem={(card) => <Card {...card} />}
 *   slideWidth="peek"
 *   animation="cube"
 *   dotVariant="dot"
 * />
 */
export function Carousel<T>({
  data,
  renderItem,
  keyExtractor = (_, i) => `carousel-${i}`,
  animation = 'scale',
  slideWidth: slideWidthProp = 'full',
  slideHeight = sizes.carouselSlideDefaultHeight,
  slideBorderRadius = 'lg',
  gap = spacing.sm,
  showDots = true,
  dotVariant = 'pill',
  autoPlayInterval = 0,
  onItemPress,
}: CarouselProps<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  // Ref avoids stale closure in the auto-play interval without adding
  // activeIndex as a dep (which would restart the interval on every tick).
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  // ── Layout math ──────────────────────────────────────────────────────

  const isPeekMode = slideWidthProp !== 'full';

  const itemWidth =
    slideWidthProp === 'full'
      ? screenWidth
      : slideWidthProp === 'peek'
        ? Math.round(screenWidth * 0.85)
        : slideWidthProp;

  const gapValue = isPeekMode ? gap : 0;
  const scrollStep = itemWidth + gapValue;
  const horizontalPadding = isPeekMode ? (screenWidth - itemWidth) / 2 : 0;
  const maxOffset = (data.length - 1) * scrollStep;
  const borderRadiusValue = radius[slideBorderRadius];

  // ── Shared values ────────────────────────────────────────────────────

  const offset = useSharedValue(0);
  const savedOffset = useSharedValue(0);

  // Layout SVs let gesture worklets always read the current layout without
  // requiring the gesture object to be recreated on orientation change.
  const scrollStepSV = useSharedValue(scrollStep);
  const maxOffsetSV = useSharedValue(maxOffset);
  const dataLengthSV = useSharedValue(data.length);
  const hPaddingSV = useSharedValue(horizontalPadding);

  // Direct assignment is intentional — runs synchronously each render.
  scrollStepSV.value = scrollStep;
  maxOffsetSV.value = maxOffset;
  dataLengthSV.value = data.length;
  hPaddingSV.value = horizontalPadding;

  // ── Pan gesture ──────────────────────────────────────────────────────

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-15, 15])
        .onBegin(() => {
          savedOffset.value = offset.value;
        })
        .onUpdate(e => {
          const raw = savedOffset.value - e.translationX;
          if (raw < 0) {
            offset.value = raw * RUBBER_BAND_COEFF;
          } else if (raw > maxOffsetSV.value) {
            offset.value =
              maxOffsetSV.value +
              (raw - maxOffsetSV.value) * RUBBER_BAND_COEFF;
          } else {
            offset.value = raw;
          }
        })
        .onEnd(e => {
          const projected = offset.value - e.velocityX * VELOCITY_LOOKAHEAD;
          const nearestIndex = Math.round(projected / scrollStepSV.value);
          const clamped = Math.max(
            0,
            Math.min(dataLengthSV.value - 1, nearestIndex),
          );
          offset.value = withSpring(clamped * scrollStepSV.value, SNAP_SPRING);
          runOnJS(setActiveIndex)(clamped);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // All referenced values are stable shared value refs updated in-place.
  );

  // ── Auto-play ────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoPlayInterval <= 0 || data.length <= 1) { return; }
    const id = setInterval(() => {
      const next = (activeIndexRef.current + 1) % data.length;
      offset.value = withSpring(next * scrollStep, SNAP_SPRING);
      setActiveIndex(next);
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlayInterval, data.length, scrollStep, offset]);

  // ── Animated row ─────────────────────────────────────────────────────

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -offset.value + hPaddingSV.value }],
  }));

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <View>
      <GestureDetector gesture={panGesture}>
        <View
          style={[styles.container, { width: screenWidth, height: slideHeight }]}
          accessibilityRole="adjustable"
          accessibilityValue={{ min: 0, max: data.length - 1, now: activeIndex }}>
          <Animated.View style={[styles.row, rowStyle]}>
            {data.map((item, index) => (
              <View
                key={keyExtractor(item, index)}
                style={
                  index < data.length - 1 && gapValue > 0
                    ? { marginRight: gapValue }
                    : undefined
                }>
                <Pressable
                  onPress={
                    onItemPress ? () => onItemPress(item, index) : undefined
                  }
                  disabled={!onItemPress}>
                  <AnimatedSlide
                    offset={offset}
                    index={index}
                    itemWidth={itemWidth}
                    scrollStep={scrollStep}
                    animation={animation}
                    borderRadiusValue={borderRadiusValue}
                    height={slideHeight}>
                    <View style={styles.slideContent}>
                      {renderItem(item, index)}
                    </View>
                  </AnimatedSlide>
                </Pressable>
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>

      {showDots && data.length > 1 && (
        <View
          style={[
            styles.dotsContainer,
            dotVariant === 'line' && {
              paddingHorizontal: isPeekMode ? horizontalPadding : spacing.lg,
            },
          ]}>
          <Dots
            count={data.length}
            activeIndex={activeIndex}
            variant={dotVariant}
          />
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  slideContent: {
    flex: 1,
  },
  dotsContainer: {
    paddingTop: spacing.sm,
  },
});

const dotStyles = StyleSheet.create({
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
  lineActive: { height: 3 },
  lineInactive: { height: 2 },
});
