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
import { useTheme, spacing, radius, elevation, sizes, motion, motionEasing, useReducedMotion, useFocusTrap, Masicn } from '../../../masicn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Imperative handle exposed via `ref` for programmatic open/close control. */
export interface BottomSheetRef {
  /** Slides the sheet up into view. */
  open: () => void;
  /** Dismisses the sheet and fires `onClose`. */
  close: () => void;
}

interface BottomSheetProps {
  /** Controlled visibility. Omit to drive the sheet via the imperative `ref` API. */
  visible?: boolean;
  /** Called when the sheet should close (backdrop press, swipe-down, or Android back). */
  onClose: () => void;
  /** Content rendered inside the scrollable sheet body. */
  children: React.ReactNode;
  /** Maximum height as a fraction of screen height (0–1). Defaults to 0.8. */
  maxHeight?: number;
  /** Whether to render the drag handle pill at the top of the sheet. Defaults to true. */
  showHandle?: boolean;
  /** Additional style applied to the sheet panel. */
  style?: ViewStyle;
  /** Accessibility label announced by screen readers when the sheet gains focus. Defaults to 'Bottom sheet'. */
  accessibilityLabel?: string;
  /** Test identifier for automated testing */
  testID?: string;
}

const DISMISS_THRESHOLD = 0.3;

/**
 * BottomSheet — a gesture-driven panel that slides up from the bottom of the screen.
 *
 * Supports swipe-to-dismiss (configurable threshold), keyboard avoidance so
 * that form fields inside the sheet remain visible, safe-area-aware bottom
 * padding, and both controlled (`visible` prop) and imperative (`ref`) APIs.
 * Respects reduced-motion preferences. On Android the hardware back button
 * dismisses the sheet.
 *
 * @example
 * // Imperative usage
 * const sheetRef = useRef<BottomSheetRef>(null);
 * <Button onPress={() => sheetRef.current?.open()}>Open Sheet</Button>
 * <BottomSheet ref={sheetRef} onClose={() => {}}>
 *   <Text>Sheet content</Text>
 * </BottomSheet>
 *
 * @example
 * // Controlled with custom max height
 * <BottomSheet visible={open} onClose={() => setOpen(false)} maxHeight={0.5}>
 *   <FilterOptions />
 * </BottomSheet>
 */
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
      testID,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const reducedMotion = useReducedMotion();
    // Snapshot into a ref so the async resolution never re-triggers the animation effect mid-spring.
    const reducedMotionRef = React.useRef(reducedMotion);
    React.useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);

    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const maxSheetHeight = SCREEN_HEIGHT * maxHeight;
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const opacity = useSharedValue(0);
    const [internalVisible, setInternalVisible] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);

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

    // reducedMotion intentionally omitted from deps — read via ref to prevent
    // the async AccessibilityInfo resolution from killing an in-progress spring.
    React.useEffect(() => {
      const rm = reducedMotionRef.current;
      if (isVisible) {
        setShouldRender(true);
        translateY.value = rm
          ? withTiming(0, { duration: motion.duration.instant })
          : withSpring(0, motion.spring.sheet);
        opacity.value = withTiming(1, { duration: rm ? motion.duration.instant : motion.duration.slow });
      } else {
        const exitDuration = rm ? motion.duration.instant : motion.duration.normal;
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: exitDuration, easing: motionEasing.accelerate });
        opacity.value = withTiming(0, { duration: exitDuration, easing: motionEasing.accelerate });
        const timeout = setTimeout(() => setShouldRender(false), exitDuration);
        return () => clearTimeout(timeout);
      }
    }, [isVisible, translateY, opacity, SCREEN_HEIGHT]);

    const pan = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetY([-5, 5])
      .onUpdate((e) => {
        if (e.translationY > 0) {
          translateY.value = e.translationY;
        }
      })
      .onEnd((e) => {
        if (e.translationY > sheetHeight * DISMISS_THRESHOLD || e.velocityY > 500) {
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
              style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
              onPress={handleClose}
              accessible={false}
            />
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View
              ref={containerRef}
              testID={testID}
              style={[
                styles.sheet,
                elevation.xl,
                {
                  maxHeight: maxSheetHeight,
                  height: sheetHeight || undefined,
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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
