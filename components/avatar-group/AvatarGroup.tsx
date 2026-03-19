import React from 'react';
import { View, StyleSheet, type ImageSourcePropType } from 'react-native';
import { Text, borders, radius, useTheme } from '../../../masicn';
import { Avatar, sizeMap, type AvatarSize } from '../avatar/Avatar';

interface AvatarGroupItem {
  source?: ImageSourcePropType;
  initials?: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent';
}

interface AvatarGroupProps {
  avatars: AvatarGroupItem[];
  max?: number;
  size?: AvatarSize;
  overlap?: number;
}

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
          accessibilityLabel={`${remaining} more`}>
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
