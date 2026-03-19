import React from 'react';
import { View, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, elevation, radius, sizes, spacing, useTheme } from '../../../masicn'

interface LoadingOverlayProps {
  /** Controls whether the overlay modal is shown. */
  visible: boolean;
  /** Optional text displayed below the spinner to describe the ongoing operation. */
  message?: string;
  /**
   * When true (default), a semi-transparent backdrop fills the screen behind the
   * loading card, preventing interaction with the underlying UI.
   */
  backdrop?: boolean;
}

/**
 * LoadingOverlay — a full-screen modal overlay with a centered spinner card.
 *
 * Renders a native `Modal` with `transparent` background and a fade animation.
 * The spinner uses the theme's primary color. An optional `message` string is
 * shown below the spinner for contextual feedback (e.g. "Saving…").
 *
 * Use this component to block the UI during async operations such as form
 * submissions, network requests, or file uploads.
 *
 * @example
 * <LoadingOverlay visible={isSubmitting} message="Saving your changes…" />
 *
 * // Without backdrop (spinner only, UI remains interactive)
 * <LoadingOverlay visible={loading} backdrop={false} />
 */
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
