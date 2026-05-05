import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  type ImageSourcePropType,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import {
  Text,
  radius,
  sizes,
  type Typography,
  useTheme,
} from '../../../masicn';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  /** Image source URI or local `require()`. When provided and loads successfully, the image is shown. On error falls back to initials/fallback. */
  source?: ImageSourcePropType;
  /** 1–2 character string shown when no image is available. Defaults to '?' if neither initials nor fallback is set. */
  initials?: string;
  /** Size preset — 'sm', 'md', or 'lg'. Defaults to 'md'. */
  size?: AvatarSize;
  /** Background fill colour token used for the initials view. Defaults to 'primary'. */
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  /** Override the initials fallback with a custom string or arbitrary React node. */
  fallback?: string | React.ReactNode;
  /** Optional overlay node (e.g. a `<Badge />`) positioned at the bottom-right of the avatar. */
  badge?: React.ReactNode;
  /** Additional style applied to the outermost View element (initials view or badge wrapper). */
  style?: ViewStyle;
  /** Additional style applied to the Image element when rendering a photo. */
  imageStyle?: ImageStyle;
  /** Test identifier forwarded to the outermost element. */
  testID?: string;
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

/**
 * Avatar — a circular user representation that shows a photo, initials, or custom fallback.
 *
 * When `source` is provided the image is rendered; if it fails to load the
 * component falls back to the `initials` string or the `fallback` prop. An
 * optional `badge` node (e.g. a status indicator or `<Badge />`) can be
 * overlaid at the bottom-right corner.
 *
 * @example
 * // Image avatar
 * <Avatar source={{ uri: user.avatarUrl }} initials="JD" size="lg" />
 *
 * @example
 * // Initials-only with badge
 * <Avatar initials="AB" color="secondary" badge={<Badge variant="success" />} />
 *
 * @example
 * // Small avatar used in a chat header
 * <Avatar source={{ uri: contact.photo }} initials={contact.initials} size="sm" />
 *
 * @example
 * // Custom fallback node when no image or initials are available
 * <Avatar fallback={<PersonIcon />} size="md" color="tertiary" />
 */
export const Avatar = React.memo(function Avatar({
  source,
  initials,
  size = 'md',
  color = 'primary',
  fallback,
  badge,
  style,
  imageStyle,
  testID,
}: AvatarProps) {
  const { theme } = useTheme();
  const [imageError, setImageError] = React.useState(false);
  const dim = sizeMap[size];
  const label =
    initials ?? (typeof fallback === 'string' ? fallback : 'Avatar');

  const renderInitialsView = (extraStyle?: ViewStyle) => {
    const content =
      typeof fallback === 'string'
        ? fallback
        : typeof fallback !== 'undefined'
        ? null
        : initials ?? '?';

    return (
      <View
        accessible={true}
        accessibilityLabel={label}
        accessibilityRole="image"
        testID={!badge ? testID : undefined}
        style={[
          styles.base,
          {
            width: dim,
            height: dim,
            borderRadius: radius.full,
            backgroundColor: theme.colors[color],
          },
          extraStyle,
        ]}
      >
        {typeof fallback !== 'undefined' && typeof fallback !== 'string' ? (
          fallback
        ) : (
          <Text
            variant={textVariantMap[size]}
            style={{ color: theme.colors[onColorMap[color]] }}
          >
            {content}
          </Text>
        )}
      </View>
    );
  };

  const avatarNode =
    source && !imageError ? (
      <Image
        source={source}
        accessible={true}
        accessibilityLabel={label}
        accessibilityRole="image"
        onError={() => setImageError(true)}
        testID={!badge ? testID : undefined}
        style={[
          styles.base,
          { width: dim, height: dim, borderRadius: radius.full },
          imageStyle,
        ]}
      />
    ) : (
      renderInitialsView(!badge ? style : undefined)
    );

  if (!badge) {
    return avatarNode;
  }

  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      {avatarNode}
      <View style={styles.badge}>{badge}</View>
    </View>
  );
});

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
