import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme, spacing, radius, sizes } from '../../../masicn';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'avatar' | 'button' | 'card' | 'listItem' | 'image';

interface SkeletonProps {
  /**
   * Pre-built shape variant. Each variant has sensible default dimensions:
   * - `text` — full-width text line placeholder
   * - `circular` / `avatar` — round shape for avatars or icons
   * - `button` — pill-shaped button placeholder
   * - `card` — large rounded rectangle
   * - `listItem` — avatar + two text lines side by side
   * - `image` — wide rectangle with rounded corners
   * - `rectangular` — generic large block
   */
  variant?: SkeletonVariant;
  /** Override the default width for the chosen variant. */
  width?: number | string;
  /** Override the default height for the chosen variant. */
  height?: number;
  /** Additional styles merged onto the outermost view. */
  style?: ViewStyle;
}

const styles = StyleSheet.create({
  listItemContainer: {},
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listItemAvatar: {
    width: sizes.avatarMd,
    height: sizes.avatarMd,
    borderRadius: radius.full,
  },
  listItemContent: {
    flex: 1,
    gap: spacing.xs,
  },
  listItemTitle: {
    width: '70%',
    height: spacing.md,
    borderRadius: radius.xs,
  },
  listItemSubtitle: {
    width: '50%',
    height: spacing.sm,
    borderRadius: radius.xs,
  },
});

/**
 * A static loading-state placeholder that renders a theme-coloured shape in
 * place of content that hasn't arrived yet. Unlike `Shimmer`, `Skeleton` has
 * no animation — use `Shimmer` to add a sweep effect on top of it when needed.
 *
 * @example
 * // Simple text line placeholder
 * <Skeleton variant="text" width="60%" />
 *
 * // Full list-item placeholder
 * <Skeleton variant="listItem" />
 *
 * @example
 * // Avatar placeholder
 * <Skeleton variant="avatar" />
 *
 * @example
 * // Button-sized placeholder in a form footer
 * <Skeleton variant="button" width="100%" />
 *
 * @example
 * // Card skeleton for an article feed
 * <Skeleton variant="card" />
 */
export const Skeleton = React.memo(function Skeleton({
  variant = 'text',
  width,
  height,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();

  const baseStyle: ViewStyle = {
    backgroundColor: theme.colors.skeleton,
  };

  const a11yProps = {
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel: 'Loading',
    accessible: true,
  };

  if (variant === 'avatar') {
    const size = (width || sizes.avatarMd) as number;
    return (
      <View
        {...a11yProps}
        style={[
          baseStyle,
          { width: size, height: size, borderRadius: radius.full },
          style,
        ]}
      />
    );
  }

  if (variant === 'button') {
    return (
      <View
        {...a11yProps}
        style={[
          baseStyle,
          {
            width: (width || sizes.skeletonButtonWidth) as number,
            height: height || sizes.buttonHeight,
            borderRadius: radius.full,
          },
          style,
        ]}
      />
    );
  }

  if (variant === 'card') {
    return (
      <View
        {...a11yProps}
        style={[
          baseStyle,
          {
            width: (width || '100%') as any,
            height: height || sizes.skeletonCardHeight,
            borderRadius: radius.xl,
          },
          style,
        ]}
      />
    );
  }

  if (variant === 'listItem') {
    return (
      <View {...a11yProps} style={[styles.listItemContainer, { width: (width || '100%') as any }, style]}>
        <View style={styles.listItemRow}>
          <View style={[baseStyle, styles.listItemAvatar]} />
          <View style={styles.listItemContent}>
            <View style={[baseStyle, styles.listItemTitle]} />
            <View style={[baseStyle, styles.listItemSubtitle]} />
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'image') {
    return (
      <View
        {...a11yProps}
        style={[
          baseStyle,
          {
            width: (width || '100%') as any,
            height: height || sizes.skeletonImageHeight,
            borderRadius: radius.lg,
          },
          style,
        ]}
      />
    );
  }

  if (variant === 'circular') {
    const size = (width || spacing.xxxl) as number;
    return (
      <View
        {...a11yProps}
        style={[
          baseStyle,
          { width: size, height: size, borderRadius: radius.full },
          style,
        ]}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <View
        {...a11yProps}
        style={[
          baseStyle,
          {
            width: (width || '100%') as any,
            height: height || spacing.xxxl * 2,
            borderRadius: radius.md,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      {...a11yProps}
      style={[
        baseStyle,
        {
          width: (width || '80%') as any,
          height: height || spacing.md,
          borderRadius: radius.xs,
        },
        style,
      ]}
    />
  );
});
