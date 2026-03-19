import React from 'react';
import { ActivityIndicator, View, StyleSheet, type ViewStyle } from 'react-native';
import { Text, spacing, useTheme } from '../../../masicn';

interface SpinnerProps {
  size?: 'small' | 'large';
  label?: string;
  color?: string;
  style?: ViewStyle;
}

export function Spinner({
  size = 'large',
  label,
  color,
  style,
}: SpinnerProps) {
  const { theme } = useTheme();
  const spinnerColor = color || theme.colors.primary;

  if (label) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size={size} color={spinnerColor} />
        <Text variant="body" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      </View>
    );
  }

  return <ActivityIndicator size={size} color={spinnerColor} style={style} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    marginTop: spacing.xs,
  },
});
