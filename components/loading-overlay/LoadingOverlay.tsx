import React from 'react';
import { View, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, elevation, radius, sizes, spacing, useTheme } from '../../../masicn'

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  backdrop?: boolean;
}

export function LoadingOverlay({
  visible,
  message,
  backdrop = true,
}: LoadingOverlayProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.overlay, backdrop && { backgroundColor: theme.colors.backdrop }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.surfacePrimary, ...elevation.xl, shadowColor: theme.colors.shadow },
          ]}>
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
          {message && (
            <Text variant="body" color="textPrimary" align="center">{message}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    minWidth: sizes.loadingOverlayMinWidth,
    alignItems: 'center',
    gap: spacing.md,
  },
  spinner: { marginBottom: spacing.sm },
});
