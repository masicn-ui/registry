import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, type ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text, borders, elevation, motion, opacity as opacityTokens, radius, spacing, type Elevation, useReducedMotion, useTheme } from '../../../masicn';

type CardVariant = 'elevated' | 'filled' | 'outlined';
type Surface = 'primary' | 'secondary' | 'tertiary';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type AnimationType = 'scale' | 'lift' | 'rotate' | 'none';

const DEFAULT_TEXT_THRESHOLD = 150;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CardProps extends ViewProps {
  /** Visual style — 'elevated' adds drop shadow, 'filled' uses a flat surface colour, 'outlined' adds a thin border. Defaults to 'elevated'. */
  variant?: CardVariant;
  /** Background surface token — 'primary', 'secondary', or 'tertiary'. Defaults to 'primary'. */
  surface?: Surface;
  /** Shadow depth used when `variant` is 'elevated'. Defaults to 'md'. */
  shadow?: keyof Elevation;
  /** Inner padding preset — 'none' | 'sm' | 'md' | 'lg' | 'xl'. Defaults to 'lg'. */
  padding?: CardPadding;
  /** When provided the card becomes a pressable element that calls this handler on tap. */
  onPress?: () => void;
  /** Spring-based press animation. Requires `onPress` to be set. Defaults to 'none'. */
  animation?: AnimationType;
  /** Disables interaction and reduces opacity when `onPress` is set. */
  disabled?: boolean;
  /** Node rendered at the top of the card before any text content (e.g. an image or banner). */
  media?: React.ReactNode;
  /** Bold heading text rendered in the card content area. */
  title?: string;
  /** Subdued text rendered below `title`. */
  subtitle?: string;
  /** Body copy. Automatically truncated at `textThreshold` characters with a "Show more" toggle. */
  body?: string;
  /** Character count before `body` text is truncated. Defaults to 150. */
  textThreshold?: number;
  /** Arbitrary content rendered between the heading block and the footer. */
  children?: React.ReactNode;
  /** Node rendered at the bottom of the card, separated by a divider line. */
  footer?: React.ReactNode;
  /** @deprecated Use `title` + `subtitle` or `children` instead. */
  header?: React.ReactNode;
}

const surfaceMap = {
  primary: 'surfacePrimary',
  secondary: 'surfaceSecondary',
  tertiary: 'surfaceTertiary',
} as const;

const paddingMap: Record<CardPadding, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
};

/**
 * Card — a flexible surface container for grouping related content.
 *
 * Supports three visual styles (elevated, filled, outlined), configurable
 * padding, an optional media slot at the top, structured title/subtitle/body
 * slots with automatic "Show more" truncation, a footer zone, and optional
 * press interaction. When `onPress` is provided the card becomes a fully
 * accessible pressable element. Pass `animation` to add spring-based press
 * feedback ('scale', 'lift', or 'rotate').
 *
 * @example
 * // Tappable animated card
 * <Card title="Article" onPress={open} animation="scale">
 *   <Text>Content</Text>
 * </Card>
 *
 * @example
 * // Outlined card with image media slot
 * <Card
 *   variant="outlined"
 *   media={<Image source={{ uri: post.cover }} aspectRatio="16:9" />}
 *   title={post.title}
 *   subtitle={post.author}
 *   body={post.summary}
 * />
 *
 * @example
 * // Filled card with footer actions
 * <Card
 *   variant="filled"
 *   surface="secondary"
 *   padding="md"
 *   title="Your plan"
 *   subtitle="Pro"
 *   footer={
 *     <Row gap="sm">
 *       <Button variant="outline" onPress={manage}>Manage</Button>
 *       <Button onPress={upgrade}>Upgrade</Button>
 *     </Row>
 *   }
 * />
 *
 * @example
 * // Static non-interactive card with custom children
 * <Card variant="elevated" padding="lg">
 *   <StatRow label="Revenue" value="$42,000" />
 *   <StatRow label="Orders" value="1,204" />
 * </Card>
 */
export function Card({
  variant = 'elevated',
  surface = 'primary',
  shadow = 'md',
  padding = 'lg',
  onPress,
  animation = 'none',
  disabled = false,
  style,
  media,
  title,
  subtitle,
  body,
  textThreshold = DEFAULT_TEXT_THRESHOLD,
  children,
  footer,
  header,
  ...rest
}: CardProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [bodyExpanded, setBodyExpanded] = useState(false);

  // Animation shared values — always initialised (rules of hooks)
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    if (animation === 'scale') {
      return { transform: [{ scale: scale.value }] };
    }
    if (animation === 'lift') {
      return { transform: [{ translateY: translateY.value }] };
    }
    if (animation === 'rotate') {
      return { transform: [{ scale: scale.value }, { rotateZ: `${rotate.value}deg` }] };
    }
    return {};
  });

  const handlePressIn = useCallback(() => {
    if (disabled || !onPress || reducedMotion) { return; }
    if (animation === 'scale') {
      scale.value = withSpring(motion.press.scale, motion.spring.snappy);
    } else if (animation === 'lift') {
      translateY.value = withSpring(-spacing.xs, motion.spring.snappy);
    } else if (animation === 'rotate') {
      scale.value = withSpring(motion.press.scaleLight, motion.spring.snappy);
      rotate.value = withTiming(motion.press.rotateDeg, { duration: motion.duration.fast });
    }
  }, [disabled, onPress, reducedMotion, animation, scale, translateY, rotate]);

  const handlePressOut = useCallback(() => {
    if (disabled || !onPress || reducedMotion) { return; }
    if (animation === 'scale') {
      scale.value = withSpring(1, motion.spring.snappy);
    } else if (animation === 'lift') {
      translateY.value = withSpring(0, motion.spring.snappy);
    } else if (animation === 'rotate') {
      scale.value = withSpring(1, motion.spring.snappy);
      rotate.value = withTiming(0, { duration: motion.duration.fast });
    }
  }, [disabled, onPress, reducedMotion, animation, scale, translateY, rotate]);

  const bg = theme.colors[surfaceMap[surface]];
  const pad = paddingMap[padding];

  const needsTruncation = !!body && body.length > textThreshold;
  const displayedBody =
    needsTruncation && !bodyExpanded ? `${body.slice(0, textThreshold)}…` : body;

  const hasContent = !!(header || title || subtitle || body || children || footer);
  const contentPad = hasContent && media !== undefined && pad === 0 ? spacing.md : pad;

  const baseStyle = [
    styles.base,
    { backgroundColor: bg },
    variant === 'elevated' && [
      elevation[shadow],
      { shadowColor: theme.colors.shadow },
    ],
    variant === 'outlined' && [
      styles.outlined,
      { borderColor: theme.colors.borderPrimary },
    ],
    style,
  ];

  const inner = (
    <>
      {media && <View style={styles.media}>{media}</View>}

      {hasContent && <View style={[styles.content, { padding: contentPad, gap: spacing.sm }]}>
        {header && <View>{header}</View>}

        {(title || subtitle) && (
          <View style={styles.headingBlock}>
            {title && (
              <Text variant="titleSmall" color="textPrimary">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text variant="bodySmall" color="textSecondary">
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {children}

        {displayedBody !== undefined && (
          <View style={styles.bodyBlock}>
            <Text variant="body" color="textSecondary">
              {displayedBody}
            </Text>
            {needsTruncation && (
              <Pressable
                onPress={() => setBodyExpanded(v => !v)}
                accessibilityRole="button"
                accessibilityLabel={bodyExpanded ? 'Show less' : 'Show more'}
                hitSlop={spacing.xs}
                style={[styles.toggleBtn, { borderColor: theme.colors.primary }]}>
                <Text variant="label" style={{ color: theme.colors.primary }}>
                  {bodyExpanded ? 'Show less' : 'Show more'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {footer && (
          <View style={[styles.footerBlock, { borderTopColor: theme.colors.separator }]}>
            {footer}
          </View>
        )}
      </View>}
    </>
  );

  if (onPress) {
    const useAnimation = animation !== 'none' && !reducedMotion;
    if (useAnimation) {
      return (
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          style={[
            ...baseStyle,
            disabled && styles.disabled,
            animatedStyle,
          ]}
          {...rest}>
          {inner}
        </AnimatedPressable>
      );
    }

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          ...baseStyle,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        {...rest}>
        {inner}
      </Pressable>
    );
  }

  return (
    <View style={baseStyle} {...rest}>
      {inner}
    </View>
  );
}


const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  outlined: {
    borderWidth: borders.thin,
  },
  pressed: {
    opacity: opacityTokens.pressed,
  },
  disabled: {
    opacity: opacityTokens.disabled,
  },
  media: {
    overflow: 'hidden',
  },
  content: {
    // padding and gap are set inline from props
  },
  headingBlock: {
    gap: spacing.xxs,
  },
  bodyBlock: {
    gap: spacing.xs,
  },
  toggleBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    borderWidth: borders.thin,
  },
  footerBlock: {
    borderTopWidth: borders.thin,
    paddingTop: spacing.sm,
    marginTop: spacing.xxs,
  },
});
