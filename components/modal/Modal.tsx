import React, { useImperativeHandle, useState, useCallback } from 'react';
import { Pressable, StyleSheet, BackHandler, Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Text, elevation, layout, motion, radius, spacing, useFocusTrap, useReducedMotion, useTheme, Masicn } from '../../../masicn'

/** Imperative handle exposed via `ref` for programmatic open/close control. */
export interface ModalRef {
  /** Opens the modal. */
  open: () => void;
  /** Closes the modal and fires `onClose`. */
  close: () => void;
}

interface ModalProps {
  /** Controlled visibility. Omit to use the imperative `ref.open()` / `ref.close()` API instead. */
  visible?: boolean;
  /** Called when the modal should close (overlay press, close button, or Android back). Required so the parent can sync state. */
  onClose: () => void;
  /** Content rendered inside the modal panel. */
  children: React.ReactNode;
  /** Accessibility label announced by screen readers when the dialog gains focus. Defaults to 'Dialog'. */
  accessibilityLabel?: string;
  /** Maximum width of the modal panel — 'narrow' is more compact, 'medium' is the default width. Defaults to 'medium'. */
  maxWidth?: 'narrow' | 'medium';
  /** Whether to render the × close button in the top-right corner. Defaults to true. */
  showCloseButton?: boolean;
  /** Whether tapping outside the panel dismisses the modal. Defaults to true. */
  closeOnOverlayPress?: boolean;
}

/**
 * Modal — a centred dialog overlay with animated backdrop and spring entry.
 *
 * Can be driven by a controlled `visible` prop or imperatively via a `ref`
 * (call `ref.current.open()` / `ref.current.close()`). Animates in/out with a
 * spring scale and opacity fade, and falls back to an instant transition when
 * the user has reduced-motion enabled. Automatically intercepts the Android
 * hardware back button while open and traps focus inside the panel.
 *
 * @example
 * // Controlled usage
 * const [open, setOpen] = useState(false);
 * <Modal visible={open} onClose={() => setOpen(false)}>
 *   <Text>Hello from modal</Text>
 * </Modal>
 *
 * @example
 * // Imperative usage via ref
 * const modalRef = useRef<ModalRef>(null);
 * <Button onPress={() => modalRef.current?.open()}>Open</Button>
 * <Modal ref={modalRef} onClose={() => {}}>
 *   <Text>Modal content</Text>
 * </Modal>
 *
 * @example
 * // Narrow modal with close button hidden (user must interact with content to dismiss)
 * <Modal visible={open} onClose={() => setOpen(false)} maxWidth="narrow" showCloseButton={false}>
 *   <PinEntry onSuccess={() => setOpen(false)} />
 * </Modal>
 *
 * @example
 * // Modal that cannot be dismissed by tapping the overlay
 * <Modal
 *   visible={open}
 *   onClose={() => setOpen(false)}
 *   closeOnOverlayPress={false}
 *   accessibilityLabel="Terms of Service"
 * >
 *   <TermsContent onAccept={() => setOpen(false)} />
 * </Modal>
 */
const Modal = React.forwardRef<ModalRef, ModalProps>(function Modal(
  {
    visible: controlledVisible,
    onClose,
    children,
    accessibilityLabel,
    maxWidth = 'medium',
    showCloseButton = true,
    closeOnOverlayPress = true,
  },
  ref,
) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [internalVisible, setInternalVisible] = useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);

  const isVisible = controlledVisible ?? internalVisible;

  const { containerRef } = useFocusTrap({ active: isVisible });

  const backdropOpacity = useSharedValue(0);
  const contentScale = useSharedValue<number>(motion.enter.scaleFrom);
  const contentOpacity = useSharedValue(0);

  const handleClose = useCallback(() => {
    setInternalVisible(false);
    onClose();
  }, [onClose]);

  useImperativeHandle(
    ref,
    () => ({
      open: () => setInternalVisible(true),
      close: handleClose,
    }),
    [handleClose],
  );

  React.useEffect(() => {
    const dur = reducedMotion ? motion.duration.instant : motion.duration.normal;

    if (isVisible) {
      setShouldRender(true);
      backdropOpacity.value = withTiming(1, { duration: dur });
      contentOpacity.value = withTiming(1, { duration: dur });
      contentScale.value = reducedMotion
        ? withTiming(1, { duration: dur })
        : withSpring(1, motion.spring.dialog);
    } else {
      backdropOpacity.value = withTiming(0, { duration: dur });
      contentScale.value = withTiming(motion.enter.scaleFrom, { duration: dur });
      contentOpacity.value = withTiming(0, { duration: dur });
      const timeout = setTimeout(() => setShouldRender(false), dur);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, reducedMotion, backdropOpacity, contentOpacity, contentScale]);

  React.useEffect(() => {
    if (!isVisible || Platform.OS !== 'android') { return; }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });

    return () => subscription.remove();
  }, [isVisible, handleClose]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  if (!shouldRender) {
    return null;
  }

  return (
    <Masicn>
      <Animated.View
        style={[styles.overlay, animatedBackdropStyle, { backgroundColor: theme.colors.overlay }]}
        pointerEvents="box-none">
        <Pressable
          style={styles.backdrop}
          onPress={closeOnOverlayPress ? handleClose : undefined}
          accessible={false}
        />
        <Animated.View
          ref={containerRef}
          style={[
            styles.sheet,
            elevation.xl,
            {
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.shadow,
              maxWidth: layout.overlayMaxWidth[maxWidth],
            },
            animatedContentStyle,
          ]}
          accessible={true}
          accessibilityLabel={accessibilityLabel ?? 'Dialog'}
          accessibilityViewIsModal={true}
          onStartShouldSetResponder={() => true}>
          {showCloseButton && (
            <View style={styles.closeRow}>
              <Pressable
                onPress={handleClose}
                hitSlop={spacing.sm}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                style={[styles.closeButton, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text variant="body" color="textSecondary">
                  ×
                </Text>
              </Pressable>
            </View>
          )}
          {children}
        </Animated.View>
      </Animated.View>
    </Masicn>
  );
});

Modal.displayName = 'Modal';

export { Modal };
export type { ModalProps };

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    position: 'absolute',
    top: spacing.none,
    left: spacing.none,
    right: spacing.none,
    bottom: spacing.none,
  },
  sheet: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: radius.xxl,
    gap: spacing.md,
  },
  closeRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  closeButton: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
