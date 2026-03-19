import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme, radius, useReducedMotion } from '../../../masicn';

export type StatusDotStatus = 'online' | 'away' | 'busy' | 'offline';

interface StatusDotProps {
  status: StatusDotStatus;
  /** Dot diameter. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Show a ripple pulse ring. Only active for 'online' status. */
  pulse?: boolean;
}

const DOT_SIZES = { sm: 8, md: 12, lg: 16 } as const;

export function StatusDot({ status, size = 'md', pulse = false }: StatusDotProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  const dotSize = DOT_SIZES[size];
  const showPulse = pulse && status === 'online' && !reducedMotion;

  const statusColors: Record<StatusDotStatus, string> = {
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
      withTiming(2.5, { duration: 1100, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1100, easing: Easing.out(Easing.ease) }),
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
