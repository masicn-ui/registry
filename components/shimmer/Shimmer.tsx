import React, { useContext, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme, useReducedMotion, rgba, opacity as opacityTokens } from '../../../masicn';

interface ShimmerContextValue {
  progress: SharedValue<number>;
}

const ShimmerContext = React.createContext<ShimmerContextValue | null>(null);

interface ShimmerGroupProps {
  /** Child `Shimmer` elements whose animations will be synchronised. */
  children: React.ReactNode;
  /** Duration of one full sweep cycle in milliseconds. Defaults to 1200. */
  duration?: number;
}

/**
 * Synchronises the shimmer animation across multiple `Shimmer` children by
 * sharing a single animated progress value through context. Wrap a group of
 * skeleton placeholders in `ShimmerGroup` so they all sweep in unison.
 *
 * @example
 * <ShimmerGroup>
 *   <Shimmer borderRadius={8} style={{ height: 20, marginBottom: 8 }}>
 *     <View style={{ height: 20 }} />
 *   </Shimmer>
 *   <Shimmer borderRadius={8} style={{ height: 20 }}>
 *     <View style={{ height: 20 }} />
 *   </Shimmer>
 * </ShimmerGroup>
 */
export function ShimmerGroup({ children, duration = 1200 }: ShimmerGroupProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.5;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [reducedMotion, duration, progress]);

  const value = useMemo(() => ({ progress }), [progress]);
  return <ShimmerContext.Provider value={value}>{children}</ShimmerContext.Provider>;
}

interface ShimmerProps {
  /** Optional content rendered inside the shimmer container. When omitted the container itself acts as the placeholder (sized via `style`). */
  children?: React.ReactNode;
  /** Border radius applied to the shimmer container to match the shape of the real content. */
  borderRadius?: number;
  /** Additional styles applied to the container view. */
  style?: StyleProp<ViewStyle>;
  /** Duration of one full sweep cycle in milliseconds when used standalone. Defaults to 1200. */
  duration?: number;
}

/**
 * Renders a repeating horizontal light-sweep animation over its children to
 * indicate that content is loading. Can be used standalone or nested inside a
 * `ShimmerGroup` to synchronise the animation with sibling shimmers.
 *
 * @example
 * // Standalone
 * <Shimmer borderRadius={8} style={{ height: 20, width: '80%' }}>
 *   <View style={{ height: 20 }} />
 * </Shimmer>
 */
export function Shimmer({ children, borderRadius, style, duration = 1200 }: ShimmerProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const ctx = useContext(ShimmerContext);

  const containerWidth = useSharedValue(0);

  const ownProgress = useSharedValue(0);
  const progress = ctx?.progress ?? ownProgress;

  React.useEffect(() => {
    if (ctx) { return; }

    if (reducedMotion) {
      ownProgress.value = 0.5;
      return;
    }
    ownProgress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [ctx, reducedMotion, duration, ownProgress]);

  const sweepColor = theme.dark
    ? rgba(theme.colors.textPrimary, opacityTokens.shimmerSweepDark)
    : rgba(theme.colors.textInverse, opacityTokens.shimmerSweepLight);

  const sweepStyle = useAnimatedStyle(() => {
    const cw = containerWidth.value;
    const sweepW = cw * 0.45;
    const tx = progress.value * (cw + sweepW) - sweepW;
    return { width: sweepW, transform: [{ translateX: tx }] };
  });

  return (
    <View
      style={[styles.container, { borderRadius }, style]}
      onLayout={e => { containerWidth.value = e.nativeEvent.layout.width; }}
      renderToHardwareTextureAndroid
    >
      {children}
      <Animated.View style={[styles.sweep, { backgroundColor: sweepColor }, sweepStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  sweep: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
  },
});
