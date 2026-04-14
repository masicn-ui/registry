import React, { useImperativeHandle } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type ViewStyle,
  useWindowDimensions,
  KeyboardAvoidingView,
  ScrollView,
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
import { useTheme, spacing, radius, elevation, motion, motionEasing, useReducedMotion, useFocusTrap, Masicn } from '../../../masicn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Imperative handle exposed via `ref` for programmatic open/close control. */
export interface RightSheetRef {
  /** Slides the sheet in from the right. */
  open: () => void;
  /** Dismisses the sheet and fires `onClose`. */
  close: () => void;
}

interface RightSheetProps {
  /** Whether the sheet is currently open. Omit to drive via the imperative `ref` API. */
  visible?: boolean;
  /** Called when the sheet should close (backdrop press or swipe-right gesture). */
  onClose: () => void;
  /** Content rendered inside the scrollable sheet body. */
  children: React.ReactNode;
  /** Sheet width as a fraction of screen width. Defaults to 0.75 (75%). */
  width?: number;
  /** Additional style applied to the sheet panel. */
  style?: ViewStyle;
  /** When true, the semi-transparent backdrop is not rendered. Defaults to false. */
  hideBackdrop?: boolean;
  /** Accessibility label announced by screen readers when the sheet gains focus. Defaults to 'Right sheet'. */
  accessibilityLabel?: string;
}

const DISMISS_THRESHOLD = 0.3;

/**
 * RightSheet — an animated side-drawer that slides in from the right edge of the screen.
 *
 * The sheet springs open when `visible` becomes true and accelerates off-screen when
 * `visible` becomes false. Users can drag the sheet rightward to dismiss it; a swipe
 * exceeding 30% of the sheet width or a fast flick (velocityX > 500) triggers
 * `onClose`. Safe-area insets are applied automatically so content never overlaps
 * the status bar or home indicator.
 *
 * Supports both controlled (`visible` prop) and imperative (`ref`) APIs.
 * On Android the hardware back button dismisses the sheet.
 *
 * @example
 * const [open, setOpen] = React.useState(false);
 *
 * <RightSheet visible={open} onClose={() => setOpen(false)} width={0.8}>
 *   <FilterPanel />
 * </RightSheet>
 *
 * @example
 * // Imperative usage
 * const sheetRef = useRef<RightSheetRef>(null);
 * <RightSheet ref={sheetRef} onClose={() => {}}>
 *   <FilterPanel />
 * </RightSheet>
 */
export const RightSheet = React.forwardRef<RightSheetRef, RightSheetProps>(
  function RightSheet({
    visible: controlledVisible,
    onClose,
    children,
    width = 0.75,
    style,
    hideBackdrop = false,
    accessibilityLabel,
  }: RightSheetProps, ref) {
    const { theme } = useTheme();
    const reducedMotion = useReducedMotion();
    // Snapshot into a ref so the async resolution never re-triggers the animation effect mid-spring.
    const reducedMotionRef = React.useRef(reducedMotion);
    React.useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);

    const insets = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const sheetWidth = SCREEN_WIDTH * width;
    const translateX = useSharedValue(sheetWidth);
    const opacity = useSharedValue(0);
    const [internalVisible, setInternalVisible] = React.useState(false);
    const isVisible = controlledVisible ?? internalVisible;
    const [shouldRender, setShouldRender] = React.useState(isVisible);

    const { containerRef } = useFocusTrap({ active: isVisible });

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
        translateX.value = rm
          ? withTiming(0, { duration: motion.duration.instant })
          : withSpring(0, motion.spring.sheet);
        opacity.value = withTiming(1, { duration: rm ? motion.duration.instant : motion.duration.slow });
      } else {
        const exitDuration = rm ? motion.duration.instant : motion.duration.normal;
        translateX.value = withTiming(sheetWidth, { duration: exitDuration, easing: motionEasing.accelerate });
        opacity.value = withTiming(0, { duration: exitDuration, easing: motionEasing.accelerate });
        const timeout = setTimeout(() => setShouldRender(false), exitDuration);
        return () => clearTimeout(timeout);
      }
    }, [isVisible, translateX, opacity, sheetWidth]);

    React.useEffect(() => {
      if (!isVisible || Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleDismiss();
        return true;
      });
      return () => sub.remove();
    }, [isVisible, handleDismiss]);

    const pan = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetX([-10, 10])
      .onUpdate((e) => {
        if (e.translationX > 0) {
          translateX.value = e.translationX;
        }
      })
      .onEnd((e) => {
        if (e.translationX > sheetWidth * DISMISS_THRESHOLD || e.velocityX > 500) {
          handleDismiss();
        } else {
          translateX.value = withSpring(0, motion.spring.sheet);
        }
      });

    const animatedSheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    if (!shouldRender) {
      return null;
    }

    return (
      <Masicn>
        <View style={styles.overlay} pointerEvents={hideBackdrop ? 'box-none' : undefined}>
          {!hideBackdrop && (
            <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle]}>
              <Pressable
                style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
                onPress={handleDismiss}
              />
            </Animated.View>
          )}
          <GestureDetector gesture={pan}>
            <Animated.View
              ref={containerRef}
              accessibilityRole="menu"
              accessibilityViewIsModal={true}
              accessibilityLabel={accessibilityLabel ?? 'Right sheet'}
              style={[
                styles.sheet,
                elevation.xl,
                {
                  width: sheetWidth,
                  backgroundColor: theme.colors.surfacePrimary,
                  shadowColor: theme.colors.shadow,
                  paddingTop: insets.top,
                  paddingBottom: insets.bottom,
                },
                style,
                animatedSheetStyle,
              ]}>
              <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                  style={styles.flex1}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}>
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

RightSheet.displayName = 'RightSheet';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
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
    borderBottomLeftRadius: radius.xxl,
  },
  content: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
});
