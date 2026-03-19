import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme, spacing, radius, sizes } from '@masicn/ui';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'avatar' | 'button' | 'card' | 'listItem' | 'image';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number;
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

export function Skeleton({
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
}
