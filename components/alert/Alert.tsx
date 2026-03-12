// File: components/alert/Alert.tsx

import React from 'react';
import { View, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { useTheme, spacing, radius, borders, opacity as opacityTokens } from '@masicn/ui';
import { Text } from '@/components/ui/Text';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  containerStyle?: ViewStyle;
  icon?: string;
}

export function Alert({
  variant,
  title,
  description,
  dismissible = false,
  onDismiss,
  containerStyle,
  icon,
}: AlertProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: theme.colors.success, text: theme.colors.onSuccess, icon: '✓' };
      case 'error':
        return { bg: theme.colors.error, text: theme.colors.onError, icon: '✕' };
      case 'warning':
        return { bg: theme.colors.warning, text: theme.colors.onWarning, icon: '⚠' };
      case 'info':
        return { bg: theme.colors.info, text: theme.colors.onInfo, icon: 'ℹ' };
    }
  };

  const colors = getColors();
  const displayIcon = icon !== undefined ? icon : colors.icon;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderColor: colors.bg },
        containerStyle,
      ]}>
      {displayIcon && (
        <Text variant="bodyLarge" style={[styles.icon, { color: colors.text }]}>
          {displayIcon}
        </Text>
      )}
      <View style={styles.content}>
        <Text variant="body" bold style={{ color: colors.text }}>
          {title}
        </Text>
        {description && (
          <Text variant="bodySmall" style={[styles.description, { color: colors.text }]}>
            {description}
          </Text>
        )}
      </View>
      {dismissible && onDismiss && (
        <Pressable onPress={onDismiss} style={styles.closeButton} hitSlop={spacing.sm}>
          <Text variant="body" style={{ color: colors.text }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: borders.thin,
    gap: spacing.sm,
  },
  icon: { marginTop: spacing.xxs },
  content: { flex: 1, gap: spacing.xs },
  description: { opacity: opacityTokens.hover },
  closeButton: { padding: spacing.xxs },
});
