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

export type CarouselAnimation = 'scale' | 'fade' | 'parallax' | 'cube';
export type CarouselDotVariant = 'pill' | 'dot' | 'line';
export type CarouselSlideWidth = 'full' | 'peek' | number;

export interface CarouselProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  animation?: CarouselAnimation;
  slideWidth?: CarouselSlideWidth;
  slideHeight?: number;
  slideBorderRadius?: keyof typeof radius;
  gap?: number;
  showDots?: boolean;
  dotVariant?: CarouselDotVariant;
  autoPlayInterval?: number;
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
  offset: SharedValue<number>;
  index: number;
  itemWidth: number;
  scrollStep: number;
  animation: CarouselAnimation;
  borderRadiusValue: number;
  height: number;
  children: React.ReactNode;
}

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
  count: number;
  activeIndex: number;
  variant: CarouselDotVariant;
}

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
 * Horizontal carousel built on Gesture.Pan() + Reanimated.
 *
 * Scroll math (single source of truth):
 *   scrollStep  = itemWidth + gap
 *   progress_i  = (offset - i * scrollStep) / scrollStep
 *   snap target = index * scrollStep
 *
 * Active index is derived from the snap target in onEnd.
 * All animation variants share the same progress formula.
 *
 * Note: slides render eagerly (no virtualization). Suitable for ~30 slides.
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
