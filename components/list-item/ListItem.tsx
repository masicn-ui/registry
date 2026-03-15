// File: components/list-item/ListItem.tsx

import React from 'react';
import { Pressable, View, StyleSheet, type PressableProps } from 'react-native';
import { Text, opacity as opacityTokens, spacing, useTheme } from '@masicn/ui';

interface ListItemProps extends Omit<PressableProps, 'children'> {
  /** Primary label */
  title: string;
  /** Secondary description */
  subtitle?: string;
  /** Leading element (icon, avatar, etc.) */
  leading?: React.ReactNode;
  /** Trailing element (chevron, switch, badge, etc.) */
  trailing?: React.ReactNode;
  /** Show bottom separator */
  separator?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  separator = false,
  style,
  ...rest
}: ListItemProps) {
  const { theme } = useTheme();

  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          pressed && { opacity: opacityTokens.pressed },
          typeof style === 'function' ? style({ pressed }) : style,
        ]}
        {...rest}>
        {leading && <View style={styles.leading}>{leading}</View>}
        <View style={styles.content}>
          <Text variant="body">{title}</Text>
          {subtitle && <Text variant="caption" color="textTertiary">{subtitle}</Text>}
        </View>
        {trailing ?? (
          <Text variant="body" color="iconSecondary">
            ›
          </Text>
        )}
      </Pressable>
      {separator && (
        <View
          style={[
            styles.separator,
            { backgroundColor: theme.colors.separator },
            leading ? styles.separatorInset : undefined,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  separatorInset: {
    marginLeft: spacing.lg + spacing.xxl + spacing.md,
  },
});
