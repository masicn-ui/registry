import React, { useImperativeHandle, useState, useCallback } from 'react';
import { Pressable, StyleSheet, BackHandler, Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Text, elevation, layout, motion, radius, spacing, useFocusTrap, useReducedMotion, useTheme } from '@masicn/ui';
import { Masicn } from '@masicn/ui';

export interface ModalRef {
  open: () => void;
  close: () => void;
}

interface ModalProps {
  visible?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
  maxWidth?: 'narrow' | 'medium';
  showCloseButton?: boolean;
  closeOnOverlayPress?: boolean;
}

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
  const contentScale = useSharedValue(0.92);
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
      contentScale.value = withTiming(0.92, { duration: dur });
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
        style={[styles.overlay, animatedBackdropStyle, { backgroundColor: theme.colors.backdrop }]}
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
    padding: spacing.xxl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    padding: spacing.xl,
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
