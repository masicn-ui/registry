import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, spacing, radius, elevation, borders, motion, type Elevation, opacity as opacityTokens } from '../../../masicn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type AnimationType = 'scale' | 'lift' | 'rotate' | 'none';
type CardVariant = 'elevated' | 'filled' | 'outlined';
type Surface = 'primary' | 'secondary' | 'tertiary';

interface AnimatedCardProps {
  /** Content rendered inside the card. */
  children: React.ReactNode;
  /** Optional press handler. When omitted the card is non-interactive and no animation plays. */
  onPress?: () => void;
  /** Press animation type — 'scale' shrinks slightly, 'lift' moves up, 'rotate' tilts and scales, 'none' skips animation. Defaults to 'scale'. */
  animation?: AnimationType;
  /** Visual style — 'elevated' adds a shadow, 'filled' uses a flat surface colour, 'outlined' adds a border. Defaults to 'elevated'. */
  variant?: CardVariant;
  /** Surface colour token — 'primary', 'secondary', or 'tertiary'. Defaults to 'primary'. */
  surface?: Surface;
  /** Shadow depth when `variant` is 'elevated'. Defaults to 'lg'. */
  shadow?: keyof Elevation;
  /** Disables interaction and reduces opacity. Defaults to false. */
  disabled?: boolean;
  /** Additional style applied to the card. */
  style?: ViewStyle;
}

const surfaceMap = {
  primary: 'surfacePrimary',
  secondary: 'surfaceSecondary',
  tertiary: 'surfaceTertiary',
} as const;

/**
 * AnimatedCard — a pressable surface card with spring-based press animations.
 *
 * Wraps content in an animated `Pressable` that plays one of four animations
 * on press-in/out: 'scale' (slight shrink), 'lift' (upward translate),
 * 'rotate' (tilt + scale), or 'none'. Supports the same visual variants as
 * `<Card>` (elevated, filled, outlined) and honours the disabled state.
 *
 * @example
 * // Scale animation (default)
 * <AnimatedCard onPress={() => navigate('detail')}>
 *   <Text>Tap me</Text>
 * </AnimatedCard>
 *
 * @example
 * // Lift animation with outlined style
 * <AnimatedCard variant="outlined" animation="lift" onPress={handlePress}>
 *   <ProductInfo />
 * </AnimatedCard>
 */
export function AnimatedCard({
  children,
  onPress,
  animation = 'scale',
  variant = 'elevated',
  surface = 'primary',
  shadow = 'lg',
  disabled = false,
  style,
}: AnimatedCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: any[] = [];

    if (animation === 'scale') {
      transforms.push({ scale: scale.value });
    } else if (animation === 'lift') {
      transforms.push({ translateY: translateY.value });
    } else if (animation === 'rotate') {
      transforms.push({ scale: scale.value });
      transforms.push({ rotateZ: `${rotate.value}deg` });
    }

    return {
      transform: transforms,
    };
  });

  const handlePressIn = () => {
    if (disabled || !onPress) return;

    if (animation === 'scale') {
      scale.value = withSpring(0.96, motion.spring.snappy);
    } else if (animation === 'lift') {
      translateY.value = withSpring(-spacing.xs, motion.spring.snappy);
    } else if (animation === 'rotate') {
      scale.value = withSpring(0.98, motion.spring.snappy);
      rotate.value = withTiming(2, { duration: motion.duration.fast });
    }
  };

  const handlePressOut = () => {
    if (disabled || !onPress) return;

    if (animation === 'scale') {
      scale.value = withSpring(1, motion.spring.snappy);
    } else if (animation === 'lift') {
      translateY.value = withSpring(0, motion.spring.snappy);
    } else if (animation === 'rotate') {
      scale.value = withSpring(1, motion.spring.snappy);
      rotate.value = withTiming(0, { duration: motion.duration.fast });
    }
  };

  const bg = theme.colors[surfaceMap[surface]];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      style={[
        styles.card,
        {
          backgroundColor: bg,
          shadowColor: theme.colors.shadow,
        },
        variant === 'elevated' && elevation[shadow],
        variant === 'outlined' && [
          styles.outlined,
          { borderColor: theme.colors.borderPrimary },
        ],
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}>
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  outlined: {
    borderWidth: borders.thin,
  },
  disabled: {
    opacity: opacityTokens.disabled,
  },
});
