import React from 'react';
import { View, StyleSheet, type ImageSourcePropType } from 'react-native';
import { Text, borders, radius, useTheme } from '../../../masicn';
import { Avatar, sizeMap, type AvatarSize } from '../avatar/Avatar';

interface AvatarGroupItem {
  /** Image source URI or local `require()` for this avatar. */
  source?: ImageSourcePropType;
  /** Fallback initials displayed when no image is available. */
  initials?: string;
  /** Background colour token for the initials view. */
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent';
}

interface AvatarGroupProps {
  /** Ordered list of avatar data to display. */
  avatars: AvatarGroupItem[];
  /** Maximum number of avatars to show before the overflow "+N" circle is rendered. Defaults to 4. */
  max?: number;
  /** Size preset applied to every avatar in the group — 'sm', 'md', or 'lg'. Defaults to 'md'. */
  size?: AvatarSize;
  /** Horizontal overlap in pixels between adjacent avatars. Defaults to 8. */
  overlap?: number;
}

/**
 * AvatarGroup — renders a horizontally overlapping stack of avatars.
 *
 * Displays up to `max` avatars; any additional items are summarised as a
 * "+N" overflow circle at the end of the row. Each avatar is outlined with
 * the surface background colour to visually separate the overlapping layers.
 *
 * @example
 * <AvatarGroup
 *   avatars={members.map(m => ({ source: { uri: m.photo }, initials: m.initials }))}
 *   max={5}
 *   size="sm"
 * />
 *
 * @example
 * // Team display with colour-coded initials
 * <AvatarGroup
 *   avatars={[
 *     { initials: 'AL', color: 'primary' },
 *     { initials: 'BM', color: 'secondary' },
 *     { initials: 'CK', color: 'tertiary' },
 *   ]}
 *   size="md"
 * />
 *
 * @example
 * // Large avatars, tight overlap
 * <AvatarGroup
 *   avatars={reviewers.map(r => ({ source: { uri: r.avatar }, initials: r.name[0] }))}
 *   max={3}
 *   size="lg"
 *   overlap={12}
 * />
 *
 * @example
 * // Overflow summary — 8 members, only 4 shown + "+4"
 * <AvatarGroup
 *   avatars={projectMembers.map(m => ({ initials: m.initials }))}
 *   max={4}
 *   size="sm"
 * />
 */
export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  overlap = 8,
}: AvatarGroupProps) {
  const { theme } = useTheme();
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - visible.length;
  const dim = sizeMap[size];

  return (
    <View style={styles.row}>
      {visible.map((avatar, i) => (
        <View
          key={i}
          style={[
            styles.avatarWrapper,
            { width: dim, height: dim },
            i > 0 && { marginLeft: -overlap },
            {
              borderWidth: borders.thin,
              borderRadius: radius.full,
              borderColor: theme.colors.surfacePrimary,
            },
          ]}>
          <Avatar {...avatar} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.overflow,
            {
              width: dim,
              height: dim,
              marginLeft: -overlap,
              borderRadius: radius.full,
              backgroundColor: theme.colors.surfaceSecondary,
              borderWidth: borders.thin,
              borderColor: theme.colors.surfacePrimary,
            },
          ]}
          accessibilityRole="text"
          accessibilityLabel={`+${remaining} more`}>
          <Text variant="caption" color="textSecondary">
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

export type { AvatarGroupProps, AvatarGroupItem };

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    overflow: 'hidden',
  },
  overflow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
