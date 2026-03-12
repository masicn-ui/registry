// File: components/divider/Divider.tsx

import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme, spacing } from '@masicn/ui';

interface DividerProps extends ViewProps {
  /** Horizontal margin on both sides */
  inset?: boolean;
  /** Vertical spacing above and below */
  vertical?: boolean;
}

export function Divider({ inset = false, vertical = false, style, ...rest }: DividerProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: theme.colors.separator },
        inset && styles.inset,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  inset: {
    marginHorizontal: spacing.lg,
  },
});
