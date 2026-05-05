// File: src/shared/components/drawer/Drawer.tsx

import React, { useImperativeHandle } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type ViewStyle,
  useWindowDimensions,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
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
import {
  useTheme,
  spacing,
  radius,
  borders,
  elevation,
  motion,
  motionEasing,
  layout,
  useReducedMotion,
  useFocusTrap,
  Masicn,
} from '../../../masicn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawerSide = 'left' | 'right';
export type DrawerVariant = 'temporary' | 'permanent';

/** Imperative handle exposed via `ref` for programmatic open/close control. */
export interface DrawerRef {
  /** Slides the drawer into view. Only has effect in `temporary` variant. */
  open: () => void;
  /** Dismisses the drawer and fires `onClose`. Only has effect in `temporary` variant. */
  close: () => void;
}

export interface DrawerProps {
  /** Whether the drawer is open. Omit to drive via the imperative `ref` API (temporary only). */
  visible?: boolean;
  /** Called when the user dismisses the drawer. Only fires in `temporary` variant. */
  onClose: () => void;
  /** Navigation content rendered inside the drawer. */
  children: React.ReactNode;
  /**
   * `temporary` — slides in as an overlay with a dismissible backdrop (default, phone).
   * `permanent` — always visible inline; no backdrop, no animation, cannot be dismissed.
   */
  variant?: DrawerVariant;
  /** Which edge the drawer slides from. Defaults to `'left'`. */
  side?: DrawerSide;
  /** Drawer width as a fraction of screen width (temporary) or fixed px (permanent).
   *  Defaults to 0.75 for temporary, 280 for permanent. */
  width?: number;
  /** Hide the semi-transparent backdrop in temporary mode. Defaults to `false`. */
  hideBackdrop?: boolean;
  /** Additional style applied to the drawer surface. */
  style?: ViewStyle;
  /** Accessibility label announced by screen readers when the drawer gains focus. Defaults to 'Drawer'. */
  accessibilityLabel?: string;
  /** Test identifier for automated testing. */
  testID?: string;
}

const DISMISS_THRESHOLD = 0.3;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Drawer — a side navigation panel with two behavioural modes.
 *
 * **Temporary** (default): slides in from the left or right as a dismissible
 * overlay. Users can swipe to dismiss or tap the backdrop. Intended for phones
 * and narrow viewports.
 *
 * **Permanent**: always rendered inline, never dismissed. Intended for tablets
 * and wide layouts where the nav should always be visible.
 *
 * Supports both controlled (`visible` prop) and imperative (`ref`) APIs in
 * `temporary` mode. On Android the hardware back button dismisses the drawer.
 *
 * Use `useResponsive()` to switch between variants based on screen width:
 * ```tsx
 * const { breakpoint } = useResponsive();
 * const variant = breakpoint === 'tablet' || breakpoint === 'largeTablet' ? 'permanent' : 'temporary';
 * ```
 *
 * @example
 * // Temporary drawer on mobile
 * const [open, setOpen] = React.useState(false);
 * <Drawer visible={open} onClose={() => setOpen(false)}>
 *   <NavMenu />
 * </Drawer>
 *
 * @example
 * // Permanent drawer on tablet
 * <Drawer variant="permanent" visible onClose={() => {}}>
 *   <NavMenu />
 * </Drawer>
 *
 * @example
 * // Imperative usage
 * const drawerRef = useRef<DrawerRef>(null);
 * <Drawer ref={drawerRef} onClose={() => {}}>
 *   <NavMenu />
 * </Drawer>
 *
 * @example
 * // Right-side drawer without backdrop
 * const [open, setOpen] = React.useState(false);
 * <Drawer visible={open} onClose={() => setOpen(false)} side="right" hideBackdrop>
 *   <FilterPanel />
 * </Drawer>
 */
export const Drawer = React.forwardRef<DrawerRef, DrawerProps>(function Drawer(
  {
    visible,
    onClose,
    children,
    variant = 'temporary',
    side = 'left',
    width,
    hideBackdrop = false,
    style,
    accessibilityLabel,
    testID,
  }: DrawerProps,
  ref,
) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const isLeft = side === 'left';
  const resolvedWidth =
    width ??
    (variant === 'permanent' ? layout.sideSheetMaxWidth : SCREEN_WIDTH * 0.75);

  // ── Permanent variant — always rendered, no animation ──────────────────────
  if (variant === 'permanent') {
    // Permanent drawer has no open/close behaviour — ref is a no-op
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useImperativeHandle(ref, () => ({ open: () => {}, close: () => {} }), []);

    return (
      <View
        testID={testID}
        accessibilityRole="menu"
        style={[
          styles.permanentSheet,
          isLeft ? styles.permanentLeft : styles.permanentRight,
          {
            width: resolvedWidth,
            backgroundColor: theme.colors.surfacePrimary,
            borderColor: theme.colors.borderPrimary,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
          style,
        ]}
      >
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  // ── Temporary variant — animated overlay ──────────────────────────────────
  return (
    <TemporaryDrawer
      ref={ref}
      visible={visible}
      onClose={onClose}
      side={side}
      isLeft={isLeft}
      resolvedWidth={resolvedWidth}
      hideBackdrop={hideBackdrop}
      reducedMotion={reducedMotion}
      insets={insets}
      theme={theme}
      style={style}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </TemporaryDrawer>
  );
});

Drawer.displayName = 'Drawer';

// ─── TemporaryDrawer (internal) ───────────────────────────────────────────────

interface TemporaryDrawerProps {
  visible?: boolean;
  onClose: () => void;
  side: DrawerSide;
  isLeft: boolean;
  resolvedWidth: number;
  hideBackdrop: boolean;
  reducedMotion: boolean;
  insets: { top: number; bottom: number; left: number; right: number };
  theme: ReturnType<typeof useTheme>['theme'];
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
  children: React.ReactNode;
}

const TemporaryDrawer = React.forwardRef<DrawerRef, TemporaryDrawerProps>(
  function TemporaryDrawer(
    {
      visible: controlledVisible,
      onClose,
      isLeft,
      resolvedWidth,
      hideBackdrop,
      reducedMotion,
      insets,
      theme,
      style,
      accessibilityLabel,
      testID,
      children,
    }: TemporaryDrawerProps,
    ref,
  ) {
    // Snapshot into a ref so the async resolution never re-triggers the animation effect mid-spring.
    const reducedMotionRef = React.useRef(reducedMotion);
    React.useEffect(() => {
      reducedMotionRef.current = reducedMotion;
    }, [reducedMotion]);

    const translateX = useSharedValue(isLeft ? -resolvedWidth : resolvedWidth);
    const backdropOpacity = useSharedValue(0);
    const [internalVisible, setInternalVisible] = React.useState(false);
    const isVisible = controlledVisible ?? internalVisible;
    const [shouldRender, setShouldRender] = React.useState(isVisible);

    const { containerRef } = useFocusTrap({ active: shouldRender });

    const handleDismiss = React.useCallback(() => {
      Keyboard.dismiss();
      setInternalVisible(false);
      onClose();
    }, [onClose]);

    useImperativeHandle(
      ref,
      () => ({
        open: () => setInternalVisible(true),
        close: handleDismiss,
      }),
      [handleDismiss],
    );

    // reducedMotion intentionally omitted from deps — read via ref to prevent
    // the async AccessibilityInfo resolution from killing an in-progress spring.
    React.useEffect(() => {
      const rm = reducedMotionRef.current;
      if (isVisible) {
        setShouldRender(true);
        translateX.value = rm
          ? withTiming(0, { duration: motion.duration.instant })
          : withSpring(0, motion.spring.sheet);
        backdropOpacity.value = withTiming(1, {
          duration: rm ? motion.duration.instant : motion.duration.slow,
        });
      } else {
        const exitDuration = rm
          ? motion.duration.instant
          : motion.duration.normal;
        const target = isLeft ? -resolvedWidth : resolvedWidth;
        translateX.value = withTiming(target, {
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
    }, [isVisible, translateX, backdropOpacity, resolvedWidth, isLeft]);

    React.useEffect(() => {
      if (!isVisible || Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleDismiss();
        return true;
      });
      return () => sub.remove();
    }, [isVisible, handleDismiss]);

    const pan = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .onUpdate(e => {
        if (isLeft && e.translationX < 0) {
          translateX.value = e.translationX;
        } else if (!isLeft && e.translationX > 0) {
          translateX.value = e.translationX;
        }
      })
      .onEnd(e => {
        const over = isLeft
          ? e.translationX < -(resolvedWidth * DISMISS_THRESHOLD) ||
            e.velocityX < -500
          : e.translationX > resolvedWidth * DISMISS_THRESHOLD ||
            e.velocityX > 500;
        if (over) {
          scheduleOnRN(handleDismiss);
        } else {
          translateX.value = withSpring(0, motion.spring.sheet);
        }
      });

    const animatedSheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    if (!shouldRender) {
      return null;
    }

    return (
      <Masicn>
        <View
          style={[
            styles.overlay,
            isLeft ? styles.overlayLeft : styles.overlayRight,
          ]}
          pointerEvents={hideBackdrop ? 'box-none' : undefined}
        >
          {!hideBackdrop && (
            <Animated.View
              style={[StyleSheet.absoluteFill, animatedBackdropStyle]}
            >
              <Pressable
                style={[
                  styles.backdrop,
                  { backgroundColor: theme.colors.overlay },
                ]}
                onPress={handleDismiss}
                accessibilityLabel="Close drawer"
              />
            </Animated.View>
          )}
          <GestureDetector gesture={pan}>
            <Animated.View
              ref={containerRef}
              testID={testID}
              accessibilityRole="menu"
              accessibilityViewIsModal
              accessibilityLabel={accessibilityLabel ?? 'Drawer'}
              style={[
                styles.sheet,
                isLeft ? styles.sheetLeft : styles.sheetRight,
                elevation.xl,
                {
                  width: resolvedWidth,
                  backgroundColor: theme.colors.surfacePrimary,
                  shadowColor: theme.colors.shadow,
                  paddingTop: insets.top,
                  paddingBottom: insets.bottom,
                },
                style,
                animatedSheetStyle,
              ]}
            >
              <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <ScrollView
                  style={styles.flex1}
                  contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: spacing.lg },
                  ]}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                >
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Temporary overlay wrapper
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  overlayLeft: { justifyContent: 'flex-start' },
  overlayRight: { justifyContent: 'flex-end' },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Animated drawer panel
  sheet: {},
  sheetLeft: {
    borderTopRightRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  sheetRight: {
    borderTopLeftRadius: radius.xxl,
    borderBottomLeftRadius: radius.xxl,
  },

  flex1: { flex: 1 },
  scrollContent: { padding: spacing.lg },

  // Permanent drawer panel
  permanentSheet: {
    borderRightWidth: borders.thin,
  },
  permanentLeft: {
    borderRightWidth: borders.thin,
    borderLeftWidth: 0,
  },
  permanentRight: {
    borderRightWidth: 0,
    borderLeftWidth: 1,
  },
});
