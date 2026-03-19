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
import { useTheme, useReducedMotion } from '@masicn/ui';

interface ShimmerContextValue {
  progress: SharedValue<number>;
}

const ShimmerContext = React.createContext<ShimmerContextValue | null>(null);

interface ShimmerGroupProps {
  children: React.ReactNode;
  duration?: number;
}

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
  children: React.ReactNode;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

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
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.55)';

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
