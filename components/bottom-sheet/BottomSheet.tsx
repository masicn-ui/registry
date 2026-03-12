// File: components/bottom-sheet/BottomSheet.tsx

import React, { useImperativeHandle, useState, useCallback } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type ViewStyle,
  useWindowDimensions,
  BackHandler,
  Platform,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme, spacing, radius, elevation, sizes, motion, motionEasing, useReducedMotion, useFocusTrap } from '@masicn/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Masicn } from '@masicn/ui';

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
}

interface BottomSheetProps {
  visible?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
  showHandle?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const DISMISS_THRESHOLD = 0.3;

const BottomSheet = React.forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet(
    {
      visible: controlledVisible,
      onClose,
      children,
      maxHeight = 0.8,
      showHandle = true,
      style,
      accessibilityLabel,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const reducedMotion = useReducedMotion();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const maxSheetHeight = SCREEN_HEIGHT * maxHeight;
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const opacity = useSharedValue(0);
    const [internalVisible, setInternalVisible] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const isVisible = controlledVisible ?? internalVisible;
    const [shouldRender, setShouldRender] = React.useState(isVisible);

    const { containerRef } = useFocusTrap({ active: isVisible });

    const handleClose = useCallback(() => {
      Keyboard.dismiss();
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
      const showEvent =
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent =
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const showSub = Keyboard.addListener(showEvent, (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      });
      const hideSub = Keyboard.addListener(hideEvent, () => {
        setKeyboardHeight(0);
      });

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    React.useEffect(() => {
      if (!isVisible || Platform.OS !== 'android') {
        return;
      }

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleClose();
          return true;
        },
      );

      return () => subscription.remove();
    }, [isVisible, handleClose]);

    const sheetHeight = Math.min(
      contentHeight + (showHandle ? spacing.md * 2 + sizes.bottomSheetHandle : 0),
      maxSheetHeight,
    );

    const effectiveSheetHeight = Math.min(
      sheetHeight + keyboardHeight,
      SCREEN_HEIGHT * 0.95,
    );

    React.useEffect(() => {
      if (isVisible) {
        setShouldRender(true);

        if (reducedMotion) {
          translateY.value = withTiming(0, { duration: motion.duration.instant });
          opacity.value = withTiming(1, { duration: motion.duration.instant });
        } else {
          translateY.value = withSpring(0, motion.spring.sheet);
          opacity.value = withTiming(1, { duration: motion.duration.slow });
        }
      } else {
        if (reducedMotion) {
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: motion.duration.instant });
          opacity.value = withTiming(0, { duration: motion.duration.instant });
        } else {
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: motion.duration.normal, easing: motionEasing.accelerate });
          opacity.value = withTiming(0, { duration: motion.duration.normal, easing: motionEasing.accelerate });
        }
        const duration = reducedMotion ? motion.duration.instant : motion.duration.normal;
        const timeout = setTimeout(() => setShouldRender(false), duration);
        return () => clearTimeout(timeout);
      }
    }, [isVisible, translateY, opacity, reducedMotion, SCREEN_HEIGHT]);

    const dismissThresholdSV = useSharedValue(0);
    React.useEffect(() => {
      dismissThresholdSV.value = sheetHeight * DISMISS_THRESHOLD;
    }, [sheetHeight, dismissThresholdSV]);

    const pan = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetY([-5, 5])
      .onUpdate((e) => {
        if (e.translationY > 0) {
          translateY.value = e.translationY;
        }
      })
      .onEnd((e) => {
        if (e.translationY > dismissThresholdSV.value || e.velocityY > 500) {
          handleClose();
        } else {
          translateY.value = withSpring(0, motion.spring.sheet);
        }
      });

    const animatedSheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    if (!shouldRender) {
      return null;
    }

    return (
      <Masicn>
        <View style={styles.overlay}>
          <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle]}>
            <Pressable
              style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}
              onPress={handleClose}
              accessible={false}
            />
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View
              ref={containerRef}
              style={[
                styles.sheet,
                elevation.xl,
                {
                  maxHeight: maxSheetHeight,
                  height: effectiveSheetHeight || undefined,
                  backgroundColor: theme.colors.surfacePrimary,
                  shadowColor: theme.colors.shadow,
                  paddingBottom: insets.bottom,
                },
                style,
                animatedSheetStyle,
              ]}
              accessible={true}
              accessibilityLabel={accessibilityLabel ?? 'Bottom sheet'}
              accessibilityViewIsModal={true}>
              {showHandle && (
                <View style={styles.handleContainer}>
                  <View
                    style={[
                      styles.handle,
                      { backgroundColor: theme.colors.borderPrimary },
                    ]}
                  />
                </View>
              )}
              <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={SCREEN_HEIGHT - effectiveSheetHeight}>
                <ScrollView
                  style={styles.flex1}
                  contentContainerStyle={[
                    styles.contentContainer,
                    { paddingBottom: spacing.lg },
                  ]}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  onContentSizeChange={(_w, h) => {
                    setContentHeight(h);
                  }}>
                  {children}
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
          </GestureDetector>
        </View>
      </Masicn>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';

export { BottomSheet };
export type { BottomSheetProps };

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: sizes.bottomSheetHandleWidth,
    height: sizes.bottomSheetHandle,
    borderRadius: radius.full,
  },
  flex1: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
});
