import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { Text, radius, spacing, useReducedMotion } from '../../../masicn';
import { useCarousel } from './useCarousel';
import { CarouselSlide } from './CarouselSlide';
import { CarouselDots } from './CarouselDots';

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * Visual transition style applied to each slide as it moves in/out of focus.
 *
 * - `'scale'`    — active slide is full-size; adjacent slides shrink and fade slightly.
 * - `'fade'`     — adjacent slides fade to near-transparent.
 * - `'parallax'` — the slide's inner content scrolls at a slower rate than the container,
 *                  creating a depth effect (inner layer is 1.4× wide with offset margins).
 */
export type CarouselAnimation = 'scale' | 'fade' | 'parallax';

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
  /** Renders the content of a single slide; receives the item and its real data index. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Returns a stable string key for each item (defaults to `carousel-{index}`). */
  keyExtractor?: (item: T, index: number) => string;
  /** Visual transition style applied while swiping (default `'scale'`). */
  animation?: CarouselAnimation;
  /** Width strategy for each slide (default `'full'`). */
  slideWidth?: CarouselSlideWidth;
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
   * Auto-play is automatically disabled when the system reduce-motion preference is active.
   */
  autoPlayInterval?: number;
  /** Called when a slide is pressed; receives the real item and its real data index. */
  onItemPress?: (item: T, index: number) => void;
  /** Test identifier forwarded to each slide Pressable as `{testID}-slide-{index}`. */
  testID?: string;
  /**
   * Aspect ratio (width ÷ height) for each slide. Height is computed as
   * `Math.round(itemWidth / aspectRatio)`. When omitted, falls back to
   * `sizes.carouselSlideDefaultHeight`.
   *
   * @example aspectRatio={16 / 9}  // landscape photo/video
   * @example aspectRatio={4 / 3}   // standard photo
   * @example aspectRatio={1}       // square
   */
  aspectRatio?: number;
  /**
   * When `true` (default), wraps from the last slide back to the first and vice versa
   * using a clone-based infinite scroll strategy. Requires at least 2 items.
   * @default true
   */
  loop?: boolean;
  /**
   * Optional function that returns a label string for the active slide.
   * When provided, the label is rendered below the dot indicator.
   *
   * @example
   * getLabel={(item, index) => `${index + 1} of ${data.length} — ${item.title}`}
   */
  getLabel?: (item: T, index: number) => string;
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
 * When `loop=true` (default), the rendered list is
 * `[clone-of-last, ...data, clone-of-first]`. After landing on a clone,
 * an instant offset jump repositions to the real equivalent, making the
 * wrap seamless. `activeIndex` always reflects the real data index.
 *
 * Note: slides render eagerly (no virtualization). Suitable for ~30 slides.
 *
 * @example
 * // Full-width scale carousel with auto-play and loop
 * <Carousel
 *   data={slides}
 *   renderItem={(item) => <Image source={{ uri: item.image }} style={{ flex: 1 }} />}
 *   animation="scale"
 *   autoPlayInterval={3000}
 * />
 *
 * @example
 * // Peek mode with parallax and a slide label
 * <Carousel
 *   data={cards}
 *   renderItem={(card) => <Card {...card} />}
 *   slideWidth="peek"
 *   animation="parallax"
 *   aspectRatio={4 / 3}
 *   dotVariant="dot"
 *   getLabel={(item) => item.title}
 * />
 */
export function Carousel<T>({
  data,
  renderItem,
  keyExtractor = (_, i) => `carousel-${i}`,
  animation = 'scale',
  slideWidth = 'full',
  slideBorderRadius = 'lg',
  gap = spacing.sm,
  showDots = true,
  dotVariant = 'pill',
  autoPlayInterval = 0,
  onItemPress,
  testID,
  aspectRatio,
  loop = true,
  getLabel,
}: CarouselProps<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const {
    activeIndex,
    effectiveLoop,
    itemWidth,
    scrollStep,
    gapValue,
    horizontalPadding,
    resolvedSlideHeight,
    isPeekMode,
    rowStyle,
    panGesture,
    offset,
  } = useCarousel({
    dataLength: data.length,
    slideWidth,
    aspectRatio,
    gap,
    autoPlayInterval,
    reducedMotion,
    loop,
  });

  const borderRadiusValue = radius[slideBorderRadius];

  // Build display list: when looping, prepend clone of last + append clone of first
  const displayData = useMemo(() => {
    if (!effectiveLoop || data.length === 0) {
      return data;
    }
    return [data[data.length - 1], ...data, data[0]] as T[];
  }, [data, effectiveLoop]);

  // Map a display index back to the real data index
  const toRealIndex = (displayIndex: number): number => {
    if (!effectiveLoop) {
      return displayIndex;
    }
    if (displayIndex === 0) {
      return data.length - 1;
    }
    if (displayIndex === displayData.length - 1) {
      return 0;
    }
    return displayIndex - 1;
  };

  return (
    <View>
      <GestureDetector gesture={panGesture}>
        <View
          style={[
            styles.container,
            { width: screenWidth, height: resolvedSlideHeight },
          ]}
          accessibilityRole="adjustable"
          accessibilityValue={{
            min: 0,
            max: data.length - 1,
            now: activeIndex,
          }}
        >
          <Animated.View style={[styles.row, rowStyle]}>
            {displayData.map((_, displayIndex) => {
              const realIndex = toRealIndex(displayIndex);
              const realItem = data[realIndex];
              // Stable key: clones get a suffix so they don't collide with the real item
              const isClone =
                effectiveLoop &&
                (displayIndex === 0 || displayIndex === displayData.length - 1);
              const key = isClone
                ? `clone-${displayIndex}-${keyExtractor(realItem, realIndex)}`
                : keyExtractor(realItem, realIndex);

              return (
                <View
                  key={key}
                  style={
                    displayIndex < displayData.length - 1 && gapValue > 0
                      ? { marginRight: gapValue }
                      : undefined
                  }
                >
                  <Pressable
                    onPress={
                      onItemPress
                        ? () => onItemPress(realItem, realIndex)
                        : undefined
                    }
                    disabled={!onItemPress}
                    testID={
                      testID && !isClone
                        ? `${testID}-slide-${realIndex}`
                        : undefined
                    }
                  >
                    <CarouselSlide
                      offset={offset}
                      index={displayIndex}
                      itemWidth={itemWidth}
                      scrollStep={scrollStep}
                      animation={animation}
                      borderRadiusValue={borderRadiusValue}
                      height={resolvedSlideHeight}
                    >
                      <View style={styles.slideContent}>
                        {renderItem(realItem, realIndex)}
                      </View>
                    </CarouselSlide>
                  </Pressable>
                </View>
              );
            })}
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
          ]}
        >
          <CarouselDots
            count={data.length}
            activeIndex={activeIndex}
            variant={dotVariant}
          />
        </View>
      )}

      {getLabel != null && data.length > 0 && (
        <Text variant="caption" color="textSecondary" style={styles.label}>
          {getLabel(data[activeIndex], activeIndex)}
        </Text>
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
    paddingTop: spacing.md,
  },
  label: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
