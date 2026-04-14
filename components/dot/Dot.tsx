import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { motion, motionEasing, sizes, useTheme, radius, useReducedMotion } from '../../../masicn';

export type DotStatus = 'online' | 'away' | 'busy' | 'offline';

interface DotProps {
  status: DotStatus;
  /** Dot diameter. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Show a ripple pulse ring. Only active for 'online' status. */
  pulse?: boolean;
}

const DOT_SIZES = { sm: sizes.statusDotSm, md: sizes.statusDotMd, lg: sizes.statusDotLg } as const;

export function Dot({ status, size = 'md', pulse = false }: DotProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  const dotSize = DOT_SIZES[size];
  const showPulse = pulse && status === 'online' && !reducedMotion;

  const statusColors: Record<DotStatus, string> = {
    online: theme.colors.success,
    away: theme.colors.warning,
    busy: theme.colors.error,
    offline: theme.colors.textDisabled,
  };
  const color = statusColors[status];

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.7);

  React.useEffect(() => {
    if (!showPulse) {
      pulseScale.value = 1;
      pulseOpacity.value = 0;
      return;
    }
    pulseScale.value = withRepeat(
      withTiming(2.5, { duration: motion.duration.pulse, easing: motionEasing.decelerate }),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: motion.duration.pulse, easing: motionEasing.decelerate }),
      -1,
      false,
    );
  }, [showPulse, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View
      style={[styles.wrapper, { width: dotSize, height: dotSize }]}
      accessibilityLabel={status}
      accessibilityRole="image"
    >
      {showPulse && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.pulseRing,
            { backgroundColor: color },
            pulseStyle,
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    borderRadius: radius.full,
  },
  pulseRing: {
    borderRadius: radius.full,
  },
});
