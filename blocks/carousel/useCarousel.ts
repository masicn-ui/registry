import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { motion, sizes } from '../../../masicn';
import type { CarouselSlideWidth } from './Carousel';

// ─── Constants ─────────────────────────────────────────────────────────────

const SNAP_SPRING = motion.spring.snap;
const VELOCITY_LOOKAHEAD = 0.15;
const RUBBER_BAND_COEFF = 0.15;
const PEEK_WIDTH_RATIO = 0.85;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UseCarouselOptions {
  dataLength: number;
  slideWidth: CarouselSlideWidth;
  aspectRatio?: number;
  gap: number;
  autoPlayInterval: number;
  reducedMotion: boolean;
  /** When true, wraps from last slide to first (and vice versa) via clone-based infinite scroll. */
  loop: boolean;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

/**
 * useCarousel — encapsulates all state, layout math, gesture, and animation
 * logic for the Carousel component.
 *
 * Keeps layout values (`scrollStep`, `maxOffset`, `dataLength`,
 * `horizontalPadding`) in shared values updated synchronously each render
 * so the gesture worklet always reads the latest layout without recreation
 * on orientation change.
 *
 * Rubber-banding (coefficient 0.15) is applied at both ends so dragging
 * past the first or last slide feels natural. Velocity lookahead (0.15 s)
 * lets a fast flick jump more than one slide.
 *
 * When `loop=true` and `dataLength > 1`, the hook uses a clone-based strategy:
 * a clone of the last item is prepended and a clone of the first is appended.
 * After the spring settles on a clone position, an instant offset jump
 * repositions to the real equivalent, making the wrap seamless.
 * `activeIndex` always reflects the real data index (0..dataLength-1).
 */
export function useCarousel({
  dataLength,
  slideWidth: slideWidthProp,
  aspectRatio,
  gap,
  autoPlayInterval,
  reducedMotion,
  loop,
}: UseCarouselOptions) {
  const { width: screenWidth } = useWindowDimensions();

  // Loop is only meaningful with 2+ items
  const effectiveLoop = loop && dataLength > 1;
  // Cloned array: [clone-of-last, ...realItems, clone-of-first]
  const clonedLength = effectiveLoop ? dataLength + 2 : dataLength;

  // activeIndex always tracks the REAL data index (0..dataLength-1)
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  // ── Layout math ────────────────────────────────────────────────────────

  const isPeekMode = slideWidthProp !== 'full';

  const itemWidth =
    slideWidthProp === 'full'
      ? screenWidth
      : slideWidthProp === 'peek'
      ? Math.round(screenWidth * PEEK_WIDTH_RATIO)
      : slideWidthProp;

  const gapValue = isPeekMode ? gap : 0;
  const scrollStep = itemWidth + gapValue;
  const horizontalPadding = isPeekMode ? (screenWidth - itemWidth) / 2 : 0;
  const maxOffset = (clonedLength - 1) * scrollStep;

  // In loop mode, real item 0 sits at cloned index 1 → initial offset = scrollStep
  const initialOffset = effectiveLoop ? scrollStep : 0;

  const resolvedSlideHeight = useMemo(() => {
    if (aspectRatio != null && isFinite(aspectRatio) && aspectRatio > 0) {
      return Math.round(itemWidth / aspectRatio);
    }
    return sizes.carouselSlideDefaultHeight;
  }, [aspectRatio, itemWidth]);

  // ── Shared values ──────────────────────────────────────────────────────

  // useSharedValue uses its argument only on first mount; subsequent renders
  // update the value via direct assignment below.
  const offset = useSharedValue(initialOffset);
  const savedOffset = useSharedValue(initialOffset);

  // Direct assignment runs synchronously each render, keeping worklet
  // reads always current without recreating the gesture.
  const scrollStepSV = useSharedValue(scrollStep);
  const maxOffsetSV = useSharedValue(maxOffset);
  const dataLengthSV = useSharedValue(dataLength);
  const clonedLengthSV = useSharedValue(clonedLength);
  const hPaddingSV = useSharedValue(horizontalPadding);
  const loopSV = useSharedValue(effectiveLoop ? 1 : 0);

  scrollStepSV.value = scrollStep;
  maxOffsetSV.value = maxOffset;
  dataLengthSV.value = dataLength;
  clonedLengthSV.value = clonedLength;
  hPaddingSV.value = horizontalPadding;
  loopSV.value = effectiveLoop ? 1 : 0;

  // ── Pan gesture ────────────────────────────────────────────────────────

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
              maxOffsetSV.value + (raw - maxOffsetSV.value) * RUBBER_BAND_COEFF;
          } else {
            offset.value = raw;
          }
        })
        .onEnd(e => {
          const projected = offset.value - e.velocityX * VELOCITY_LOOKAHEAD;
          const nearestIndex = Math.round(projected / scrollStepSV.value);
          const clamped = Math.max(
            0,
            Math.min(clonedLengthSV.value - 1, nearestIndex),
          );

          // Compute real data index from clamped cloned index
          let realIdx: number;
          if (loopSV.value) {
            if (clamped === 0) {
              realIdx = dataLengthSV.value - 1; // clone of last → real last
            } else if (clamped >= dataLengthSV.value + 1) {
              realIdx = 0; // clone of first → real first
            } else {
              realIdx = clamped - 1;
            }
          } else {
            realIdx = clamped;
          }

          // Snap to position; on completion, jump off clones to real equivalent
          offset.value = withSpring(
            clamped * scrollStepSV.value,
            SNAP_SPRING,
            finished => {
              'worklet';
              if (finished && loopSV.value) {
                if (clamped === 0) {
                  // Was clone of last → jump to real last position
                  offset.value = dataLengthSV.value * scrollStepSV.value;
                } else if (clamped === clonedLengthSV.value - 1) {
                  // Was clone of first → jump to real first position
                  offset.value = scrollStepSV.value;
                }
              }
            },
          );
          scheduleOnRN(setActiveIndex, realIdx);
        }),
    // All referenced values are stable shared value refs updated in-place above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Auto-play ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoPlayInterval <= 0 || dataLength <= 1 || reducedMotion) {
      return;
    }
    const id = setInterval(() => {
      const nextReal = (activeIndexRef.current + 1) % dataLength;
      // In loop mode, real item i sits at cloned index i+1
      const targetOffset = effectiveLoop
        ? (nextReal + 1) * scrollStep
        : nextReal * scrollStep;
      offset.value = withSpring(targetOffset, SNAP_SPRING);
      setActiveIndex(nextReal);
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [
    autoPlayInterval,
    dataLength,
    scrollStep,
    offset,
    reducedMotion,
    effectiveLoop,
  ]);

  // ── Row animated style ─────────────────────────────────────────────────

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -offset.value + hPaddingSV.value }],
  }));

  return {
    activeIndex,
    clonedLength,
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
  };
}
