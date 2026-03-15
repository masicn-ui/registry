// File: components/avatar/Avatar.tsx

import React from 'react';
import { View, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import { Text, radius, sizes, type Typography, useTheme } from '@masicn/ui';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  source?: ImageSourcePropType;
  initials?: string;
  size?: AvatarSize;
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  fallback?: string | React.ReactNode;
  badge?: React.ReactNode;
}

export const sizeMap: Record<AvatarSize, number> = {
  sm: sizes.avatarSm,
  md: sizes.avatarMd,
  lg: sizes.avatarLg,
};

const textVariantMap: Record<AvatarSize, keyof Typography> = {
  sm: 'caption',
  md: 'body',
  lg: 'h3',
};

const onColorMap = {
  primary: 'onPrimary',
  secondary: 'onSecondary',
  tertiary: 'onTertiary',
  accent: 'onPrimary',
} as const;

export function Avatar({
  source,
  initials,
  size = 'md',
  color = 'primary',
  fallback,
  badge,
}: AvatarProps) {
  const { theme } = useTheme();
  const [imageError, setImageError] = React.useState(false);
  const dim = sizeMap[size];
  const label = initials ?? (typeof fallback === 'string' ? fallback : 'Avatar');

  const renderInitialsView = () => {
    const content =
      typeof fallback === 'string'
        ? fallback
        : typeof fallback !== 'undefined'
          ? null
          : (initials ?? '?');

    return (
      <View
        accessible={true}
        accessibilityLabel={label}
        accessibilityRole="image"
        style={[
          styles.base,
          {
            width: dim,
            height: dim,
            borderRadius: radius.full,
            backgroundColor: theme.colors[color],
          },
        ]}>
        {typeof fallback !== 'undefined' && typeof fallback !== 'string'
          ? fallback
          : (
            <Text
              variant={textVariantMap[size]}
              style={{ color: theme.colors[onColorMap[color]] }}>
              {content}
            </Text>
          )}
      </View>
    );
  };

  const avatarNode = source && !imageError ? (
    <Image
      source={source}
      accessible={true}
      accessibilityLabel={label}
      accessibilityRole="image"
      onError={() => setImageError(true)}
      style={[
        styles.base,
        { width: dim, height: dim, borderRadius: radius.full },
      ]}
    />
  ) : renderInitialsView();

  if (!badge) { return avatarNode; }

  return (
    <View style={styles.wrapper}>
      {avatarNode}
      <View style={styles.badge}>{badge}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
