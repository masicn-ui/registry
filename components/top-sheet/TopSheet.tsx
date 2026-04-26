import React, { useImperativeHandle } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type ViewStyle,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme, spacing, radius, elevation, sizes, motion, motionEasing, useReducedMotion, useFocusTrap, Masicn } from '../../../masicn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Imperative handle exposed via `ref` for programmatic open/close control. */
export interface TopSheetRef {
  /** Slides the sheet down into view. */
  open: () => void;
  /** Dismisses the sheet and fires `onClose`. */
  close: () => void;
}

interface TopSheetProps {
  /** Controls whether the sheet is visible. Omit to drive via the imperative `ref` API. */
  visible?: boolean;
  /** Callback fired when the user dismisses the sheet (backdrop press or swipe up). */
  onClose: () => void;
  /** Content rendered inside the scrollable area of the sheet. */
  children: React.ReactNode;
  /** Maximum height as a fraction of the screen height (0–1). Defaults to `0.8`. */
  maxHeight?: number;
  /** Whether to show the drag handle at the bottom of the sheet. Defaults to `true`. */
  showHandle?: boolean;
  /** Additional styles applied to the sheet surface. */
  style?: ViewStyle;
  /** Accessibility label announced by screen readers when the sheet gains focus. Defaults to 'Top sheet'. */
  accessibilityLabel?: string;
}

const DISMISS_THRESHOLD = 0.3;

/**
 * A panel that slides down from the top of the screen. Supports swipe-up-to-
 * dismiss, backdrop tap, and `KeyboardAvoidingView` for forms. The sheet
 * springs open and eases closed with a configurable maximum height.
 *
 * Supports both controlled (`visible` prop) and imperative (`ref`) APIs.
 * On Android the hardware back button dismisses the sheet.
 *
 * @example
 * const [open, setOpen] = useState(false);
 * <TopSheet visible={open} onClose={() => setOpen(false)}>
 *   <Text>Sheet content</Text>
 * </TopSheet>
 *
 * @example
 * // Imperative usage
 * const sheetRef = useRef<TopSheetRef>(null);
 * <TopSheet ref={sheetRef} onClose={() => {}}>
 *   <Text>Sheet content</Text>
 * </TopSheet>
 *
 * @example
 * // Smaller max height for a notification banner
 * <TopSheet visible={open} onClose={() => setOpen(false)} maxHeight={0.35}>
 *   <NotificationDetail />
 * </TopSheet>
 *
 * @example
 * // Without handle pill for a custom drag area inside the content
 * <TopSheet visible={open} onClose={() => setOpen(false)} showHandle={false}>
 *   <SearchHeader onClose={() => setOpen(false)} />
 * </TopSheet>
 */
export const TopSheet = React.forwardRef<TopSheetRef, TopSheetProps>(
  function TopSheet({
    visible: controlledVisible,
    onClose,
    children,
    maxHeight = 0.8,
    showHandle = true,
    style,
    accessibilityLabel,
  }: TopSheetProps, ref) {
    const { theme } = useTheme();
    const reducedMotion = useReducedMotion();
    // Snapshot into a ref so the async resolution never re-triggers the animation effect mid-spring.
    const reducedMotionRef = React.useRef(reducedMotion);
    React.useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);

    const insets = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const maxSheetHeight = SCREEN_HEIGHT * maxHeight;
    const translateY = useSharedValue(-SCREEN_HEIGHT);
    const opacity = useSharedValue(0);
    const [internalVisible, setInternalVisible] = React.useState(false);
    const isVisible = controlledVisible ?? internalVisible;
    const [shouldRender, setShouldRender] = React.useState(isVisible);
    const [contentHeight, setContentHeight] = React.useState(0);
    const hasMeasured = React.useRef(false);

    const { containerRef } = useFocusTrap({ active: isVisible });

    const sheetHeight = Math.min(
      contentHeight + (showHandle ? spacing.md * 2 + sizes.bottomSheetHandle : 0),
      maxSheetHeight,
    );

    const handleDismiss = React.useCallback(() => {
      Keyboard.dismiss();
      setInternalVisible(false);
      onClose();
    }, [onClose]);

    useImperativeHandle(ref, () => ({
      open: () => setInternalVisible(true),
      close: handleDismiss,
    }), [handleDismiss]);

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
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: exitDuration, easing: motionEasing.accelerate });
        opacity.value = withTiming(0, { duration: exitDuration, easing: motionEasing.accelerate },
          (finished) => { if (finished) scheduleOnRN(setShouldRender, false); },
        );
      }
    }, [isVisible, translateY, opacity, SCREEN_HEIGHT]);

    React.useEffect(() => {
      if (!isVisible || Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleDismiss();
        return true;
      });
      return () => sub.remove();
    }, [isVisible, handleDismiss]);

    const pan = Gesture.Pan()
      .activeOffsetY([-5, 5])
      .onUpdate((e) => {
        if (e.translationY < 0) {
          translateY.value = e.translationY;
        }
      })
      .onEnd((e) => {
        if (e.translationY < -(sheetHeight * DISMISS_THRESHOLD) || e.velocityY < -500) {
          scheduleOnRN(handleDismiss);
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
              onPress={handleDismiss}
            />
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View
              ref={containerRef}
              accessibilityRole="menu"
              accessibilityViewIsModal={true}
              accessibilityLabel={accessibilityLabel ?? 'Top sheet'}
              style={[
                styles.sheet,
                elevation.xl,
                {
                  maxHeight: maxSheetHeight,
                  height: hasMeasured.current ? sheetHeight : undefined,
                  backgroundColor: theme.colors.surfacePrimary,
                  shadowColor: theme.colors.shadow,
                },
                style,
                animatedSheetStyle,
              ]}>
              <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                  style={styles.flex1}
                  contentContainerStyle={[
                    styles.contentContainer,
                    { paddingTop: insets.top + spacing.lg },
                  ]}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  onContentSizeChange={(_w, h) => {
                    hasMeasured.current = true;
                    setContentHeight(h);
                  }}>
                  {children}
                </ScrollView>
              </KeyboardAvoidingView>
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
            </Animated.View>
          </GestureDetector>
        </View>
      </Masicn>
    );
  },
);

TopSheet.displayName = 'TopSheet';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
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
