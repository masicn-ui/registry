import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { opacity as opacityTokens, useReducedMotion } from '../../../masicn';
import type { CarouselAnimation } from './Carousel';

// ─── Animation constants ───────────────────────────────────────────────────

const SLIDE_INACTIVE_SCALE = 0.85;
const SLIDE_SCALE_MIN_OPACITY = opacityTokens.subtle; // 0.7
const SLIDE_FADE_MIN_OPACITY = 0.3;
const PARALLAX_OFFSET_RATIO = 0.2;
const PARALLAX_INNER_WIDTH_RATIO = 1.4;

// ─── CarouselSlide ─────────────────────────────────────────────────────────

export interface CarouselSlideProps {
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
 * CarouselSlide — applies the chosen animation effect to a single carousel
 * slide using Reanimated worklets.
 *
 * All animation variants derive a normalised `progress` value:
 *   `progress = (offset - index * scrollStep) / scrollStep`
 *
 * `progress === 0` means the slide is perfectly centred; `±1` means it is
 * exactly one full step away. The `parallax` variant wraps content in a second
 * `Animated.View` whose `translateX` moves at 20% of the container width,
 * creating the layered depth effect.
 *
 * @example
 * // Parallax animation — used inside a Carousel renderItem
 * <CarouselSlide
 *   offset={scrollOffset}
 *   index={index}
 *   itemWidth={320}
 *   scrollStep={328}
 *   animation="parallax"
 *   borderRadiusValue={12}
 *   height={200}>
 *   <Image source={{ uri: slide.uri }} style={{ width: '100%', height: '100%' }} />
 * </CarouselSlide>
 *
 * @example
 * // Scale animation — inactive slides shrink to 85%
 * <CarouselSlide
 *   offset={scrollOffset}
 *   index={index}
 *   itemWidth={300}
 *   scrollStep={308}
 *   animation="scale"
 *   borderRadiusValue={8}
 *   height={180}>
 *   <SlideContent data={item} />
 * </CarouselSlide>
 *
 * @example
 * // Fade animation — inactive slides fade to 30% opacity
 * <CarouselSlide
 *   offset={scrollOffset}
 *   index={index}
 *   itemWidth={280}
 *   scrollStep={288}
 *   animation="fade"
 *   borderRadiusValue={16}
 *   height={160}>
 *   <CardContent title={item.title} />
 * </CarouselSlide>
 *
 * @example
 * // No animation — plain clip container
 * <CarouselSlide
 *   offset={scrollOffset}
 *   index={index}
 *   itemWidth={360}
 *   scrollStep={368}
 *   animation="parallax"
 *   borderRadiusValue={0}
 *   height={240}>
 *   {children}
 * </CarouselSlide>
 */
export function CarouselSlide({
  offset,
  index,
  itemWidth,
  scrollStep,
  animation,
  borderRadiusValue,
  height,
  children,
}: CarouselSlideProps) {
  const reducedMotion = useReducedMotion();

  const outerStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return {};
    }

    const progress = (offset.value - index * scrollStep) / scrollStep;
    const absP = Math.abs(progress);

    switch (animation) {
      case 'scale': {
        const scale = interpolate(
          absP,
          [0, 1],
          [1, SLIDE_INACTIVE_SCALE],
          Extrapolation.CLAMP,
        );
        const opacity = interpolate(
          absP,
          [0, 1],
          [1, SLIDE_SCALE_MIN_OPACITY],
          Extrapolation.CLAMP,
        );
        return { transform: [{ scale }], opacity };
      }
      case 'fade': {
        const opacity = interpolate(
          absP,
          [0, 1],
          [1, SLIDE_FADE_MIN_OPACITY],
          Extrapolation.CLAMP,
        );
        return { opacity };
      }
      case 'parallax':
      default:
        return {};
    }
  });

  const innerParallaxStyle = useAnimatedStyle(() => {
    if (reducedMotion || animation !== 'parallax') {
      return {};
    }
    const progress = (offset.value - index * scrollStep) / scrollStep;
    const translateX = interpolate(
      progress,
      [-1, 0, 1],
      [
        itemWidth * PARALLAX_OFFSET_RATIO,
        0,
        -(itemWidth * PARALLAX_OFFSET_RATIO),
      ],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }] };
  });

  if (animation === 'parallax') {
    const innerWidth = itemWidth * PARALLAX_INNER_WIDTH_RATIO;
    const innerMarginLeft = -(itemWidth * PARALLAX_OFFSET_RATIO);
    return (
      <Animated.View
        style={[
          outerStyle,
          styles.clip,
          { width: itemWidth, height, borderRadius: borderRadiusValue },
        ]}
      >
        <Animated.View
          style={[
            innerParallaxStyle,
            styles.inner,
            { width: innerWidth, marginLeft: innerMarginLeft },
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        outerStyle,
        styles.clip,
        { width: itemWidth, height, borderRadius: borderRadiusValue },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  inner: { height: '100%', overflow: 'hidden' },
});
