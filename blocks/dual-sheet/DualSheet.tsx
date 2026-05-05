import React, { useImperativeHandle } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
  Platform,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import {
  useTheme,
  spacing,
  radius,
  elevation,
  motion,
  motionEasing,
  useReducedMotion,
  useFocusTrap,
  Masicn,
} from '../../../masicn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Imperative handle exposed via `ref` for programmatic open/close control. */
export interface DualSheetRef {
  /** Opens both panels. */
  open: () => void;
  /** Dismisses both panels and fires `onClose`. */
  close: () => void;
}

interface DualSheetProps {
  /** Whether the split sheet layout is visible. Omit to drive via the imperative `ref` API. */
  visible?: boolean;
  /** Called when either panel is dismissed via backdrop tap or Android back. */
  onClose: () => void;
  /** Called when the left panel is swipe-dismissed. Falls back to `onClose` if omitted. */
  onCloseLeft?: () => void;
  /** Called when the right panel is swipe-dismissed. Falls back to `onClose` if omitted. */
  onCloseRight?: () => void;
  /** Content for the left (1/3) panel. */
  leftContent: React.ReactNode;
  /** Content for the right (2/3) panel. */
  rightContent: React.ReactNode;
  /** Extra style for the left panel. */
  leftStyle?: ViewStyle;
  /** Extra style for the right panel. */
  rightStyle?: ViewStyle;
  /** Accessibility label for the left panel. Defaults to 'Left sheet'. */
  accessibilityLabel?: string;
}

const DISMISS_THRESHOLD = 0.3;

/**
 * DualSheet — two animated panels (left 1/3, right 2/3) that slide in simultaneously
 * from opposite edges of the screen.
 *
 * Each panel can be swiped to dismiss independently via `onCloseLeft` / `onCloseRight`.
 * Backdrop tap and Android back button fire `onClose` for both panels together.
 *
 * Supports both controlled (`visible` prop) and imperative (`ref`) APIs.
 *
 * @example
 * const [open, setOpen] = React.useState(false);
 * <DualSheet visible={open} onClose={() => setOpen(false)}
 *   leftContent={<NavMenu />} rightContent={<Detail />} />
 *
 * @example
 * // Imperative usage
 * const sheetRef = useRef<DualSheetRef>(null);
 * <DualSheet ref={sheetRef} onClose={() => {}}
 *   leftContent={<NavMenu />} rightContent={<Detail />} />
 *
 * @example
 * // With independent dismiss callbacks for each panel
 * <DualSheet
 *   visible={open}
 *   onClose={() => setOpen(false)}
 *   onCloseLeft={handleCloseNav}
 *   onCloseRight={handleCloseDetail}
 *   leftContent={<FilterSidebar />}
 *   rightContent={<ArticleBody />}
 * />
 *
 * @example
 * // Custom panel widths via leftStyle / rightStyle
 * <DualSheet
 *   visible={open}
 *   onClose={() => setOpen(false)}
 *   leftContent={<QuickActions />}
 *   rightContent={<MainContent />}
 *   leftStyle={{ backgroundColor: theme.colors.surfaceSecondary }}
 *   rightStyle={{ padding: spacing.lg }}
 * />
 */
export const DualSheet = React.forwardRef<DualSheetRef, DualSheetProps>(
  function DualSheet(
    {
      visible: controlledVisible,
      onClose,
      onCloseLeft,
      onCloseRight,
      leftContent,
      rightContent,
      leftStyle,
      rightStyle,
      accessibilityLabel,
    }: DualSheetProps,
    ref,
  ) {
    const { theme } = useTheme();
    const reducedMotion = useReducedMotion();
    // Snapshot into a ref so the async resolution never re-triggers the animation effect mid-spring.
    const reducedMotionRef = React.useRef(reducedMotion);
    React.useEffect(() => {
      reducedMotionRef.current = reducedMotion;
    }, [reducedMotion]);

    const insets = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const leftWidth = Math.floor((SCREEN_WIDTH - spacing.md) / 3);
    const rightWidth = SCREEN_WIDTH - spacing.md - leftWidth;

    const leftTranslateX = useSharedValue(-leftWidth);
    const rightTranslateX = useSharedValue(rightWidth);
    const backdropOpacity = useSharedValue(0);
    const [internalVisible, setInternalVisible] = React.useState(false);
    const isVisible = controlledVisible ?? internalVisible;
    const [shouldRender, setShouldRender] = React.useState(isVisible);

    const { containerRef: leftContainerRef } = useFocusTrap({
      active: isVisible,
    });
    const { containerRef: rightContainerRef } = useFocusTrap({
      active: isVisible,
    });

    const handleDismiss = React.useCallback(() => {
      Keyboard.dismiss();
      setInternalVisible(false);
      onClose();
    }, [onClose]);

    const handleDismissLeft = React.useCallback(() => {
      (onCloseLeft ?? onClose)();
    }, [onCloseLeft, onClose]);

    const handleDismissRight = React.useCallback(() => {
      (onCloseRight ?? onClose)();
    }, [onCloseRight, onClose]);

    useImperativeHandle(
      ref,
      () => ({
        open: () => setInternalVisible(true),
        close: handleDismiss,
      }),
      [handleDismiss],
    );

    React.useEffect(() => {
      if (!isVisible || Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleDismiss();
        return true;
      });
      return () => sub.remove();
    }, [isVisible, handleDismiss]);

    // reducedMotion intentionally omitted from deps — read via ref to prevent
    // the async AccessibilityInfo resolution from killing an in-progress spring.
    React.useEffect(() => {
      const rm = reducedMotionRef.current;
      if (isVisible) {
        setShouldRender(true);
        backdropOpacity.value = withTiming(1, {
          duration: rm ? motion.duration.instant : motion.duration.slow,
        });
        leftTranslateX.value = rm
          ? withTiming(0, { duration: motion.duration.instant })
          : withSpring(0, motion.spring.sheet);
        rightTranslateX.value = rm
          ? withTiming(0, { duration: motion.duration.instant })
          : withSpring(0, motion.spring.sheet);
      } else {
        const exitDuration = rm
          ? motion.duration.instant
          : motion.duration.normal;
        leftTranslateX.value = withTiming(-leftWidth, {
          duration: exitDuration,
          easing: motionEasing.accelerate,
        });
        rightTranslateX.value = withTiming(rightWidth, {
          duration: exitDuration,
          easing: motionEasing.accelerate,
        });
        backdropOpacity.value = withTiming(
          0,
          { duration: exitDuration, easing: motionEasing.accelerate },
          finished => {
            if (finished) scheduleOnRN(setShouldRender, false);
          },
        );
      }
    }, [
      isVisible,
      backdropOpacity,
      leftTranslateX,
      rightTranslateX,
      leftWidth,
      rightWidth,
    ]);

    const leftPan = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .onUpdate(e => {
        if (e.translationX < 0) {
          leftTranslateX.value = e.translationX;
        }
      })
      .onEnd(e => {
        if (
          e.translationX < -(leftWidth * DISMISS_THRESHOLD) ||
          e.velocityX < -500
        ) {
          scheduleOnRN(handleDismissLeft);
        } else {
          leftTranslateX.value = withSpring(0, motion.spring.sheet);
        }
      });

    const rightPan = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .onUpdate(e => {
        if (e.translationX > 0) {
          rightTranslateX.value = e.translationX;
        }
      })
      .onEnd(e => {
        if (
          e.translationX > rightWidth * DISMISS_THRESHOLD ||
          e.velocityX > 500
        ) {
          scheduleOnRN(handleDismissRight);
        } else {
          rightTranslateX.value = withSpring(0, motion.spring.sheet);
        }
      });

    const backdropAnimStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));
    const leftAnimStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: leftTranslateX.value }],
    }));
    const rightAnimStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: rightTranslateX.value }],
    }));

    if (!shouldRender) {
      return null;
    }

    const panelInsets = {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    };

    return (
      <Masicn>
        <View style={styles.overlay}>
          <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
            <Pressable
              style={[
                styles.backdrop,
                { backgroundColor: theme.colors.overlay },
              ]}
              onPress={handleDismiss}
            />
          </Animated.View>
          <GestureDetector gesture={leftPan}>
            <Animated.View
              ref={leftContainerRef}
              accessibilityRole="menu"
              accessibilityViewIsModal
              accessibilityLabel={accessibilityLabel ?? 'Left sheet'}
              style={[
                styles.leftPanel,
                elevation.xl,
                {
                  ...panelInsets,
                  width: leftWidth,
                  backgroundColor: theme.colors.surfacePrimary,
                  shadowColor: theme.colors.shadow,
                },
                leftStyle,
                leftAnimStyle,
              ]}
            >
              <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <ScrollView
                  style={styles.flex1}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  {leftContent}
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
          </GestureDetector>
          <GestureDetector gesture={rightPan}>
            <Animated.View
              ref={rightContainerRef}
              accessibilityRole="menu"
              accessibilityViewIsModal
              accessibilityLabel="Right sheet"
              style={[
                styles.rightPanel,
                elevation.xl,
                {
                  ...panelInsets,
                  width: rightWidth,
                  backgroundColor: theme.colors.surfacePrimary,
                  shadowColor: theme.colors.shadow,
                },
                rightStyle,
                rightAnimStyle,
              ]}
            >
              <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <ScrollView
                  style={styles.flex1}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  {rightContent}
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
          </GestureDetector>
        </View>
      </Masicn>
    );
  },
);

DualSheet.displayName = 'DualSheet';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  leftPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderTopRightRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  rightPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    borderTopLeftRadius: radius.xxl,
    borderBottomLeftRadius: radius.xxl,
  },
  flex1: { flex: 1 },
  scrollContent: { padding: spacing.lg },
});
