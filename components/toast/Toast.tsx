import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Masicn, Text, elevation, iconSizes, layout, motion, motionEasing, radius, sizes, spacing, useReducedMotion, useTheme, type IconComponent, CheckIcon, XIcon, WarningIcon, InfoIcon } from '../../../masicn';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top' | 'bottom';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  position?: ToastPosition;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number, position?: ToastPosition) => void;
  success: (message: string, duration?: number, position?: ToastPosition) => void;
  error: (message: string, duration?: number, position?: ToastPosition) => void;
  warning: (message: string, duration?: number, position?: ToastPosition) => void;
  info: (message: string, duration?: number, position?: ToastPosition) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Returns the toast imperative API from the nearest `ToastProvider`.
 * Throws if called outside a provider.
 *
 * @example
 * const toast = useToast();
 * toast.success('File saved!');
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  /** Application subtree that will have access to the toast context. */
  children: React.ReactNode;
  /** Default screen position for toasts when none is specified per-call. Defaults to `'top'`. */
  defaultPosition?: ToastPosition;
}

/**
 * Provides the toast context to the component tree. Renders active toasts in
 * a portal above all other UI. Wrap your root layout with this provider and
 * call `useToast()` anywhere inside to trigger brief status notifications.
 *
 * Toasts are non-interactive (no action button) and auto-dismiss after the
 * specified duration. For interactive notifications, use `SnackbarProvider`.
 *
 * @example
 * // In your root layout:
 * <ToastProvider defaultPosition="bottom">
 *   <App />
 * </ToastProvider>
 *
 * // Inside any screen:
 * const toast = useToast();
 * toast.error('Connection failed');
 */
export function ToastProvider({ children, defaultPosition = 'top' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback(
    (message: string, type: ToastType = 'info', duration = 3000, position?: ToastPosition) => {
      const id = Date.now().toString();
      const finalPosition = position ?? defaultPosition;
      setToasts(prev => [...prev, { id, message, type, duration, position: finalPosition }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration + 100);
    },
    [defaultPosition],
  );

  const success = useCallback(
    (message: string, duration?: number, position?: ToastPosition) => show(message, 'success', duration, position),
    [show],
  );

  const error = useCallback(
    (message: string, duration?: number, position?: ToastPosition) => show(message, 'error', duration, position),
    [show],
  );

  const warning = useCallback(
    (message: string, duration?: number, position?: ToastPosition) => show(message, 'warning', duration, position),
    [show],
  );

  const info = useCallback(
    (message: string, duration?: number, position?: ToastPosition) => show(message, 'info', duration, position),
    [show],
  );

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      <Masicn>
        <ToastContainer toasts={toasts} />
      </Masicn>
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
}

function ToastContainer({ toasts }: ToastContainerProps) {
  const insets = useSafeAreaInsets();
  const topToasts = toasts.filter(t => t.position === 'top');
  const bottomToasts = toasts.filter(t => t.position === 'bottom');

  return (
    <>
      {topToasts.length > 0 && (
        <View
          style={[
            styles.container,
            styles.containerTop,
            { paddingTop: insets.top + spacing.sm },
          ]}
          pointerEvents="box-none">
          {topToasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </View>
      )}
      {bottomToasts.length > 0 && (
        <View
          style={[
            styles.container,
            styles.containerBottom,
            { paddingBottom: insets.bottom + spacing.sm },
          ]}
          pointerEvents="box-none">
          {bottomToasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </View>
      )}
    </>
  );
}

interface ToastItemProps {
  toast: ToastMessage;
}

function ToastItem({ toast }: ToastItemProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  const initialSlideValue = toast.position === 'top' ? -spacing.xxxl : spacing.xxxl;
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(initialSlideValue);

  React.useEffect(() => {
    const dur = reducedMotion ? motion.duration.instant : motion.duration.normal;
    fadeAnim.value = withTiming(1, { duration: dur });
    slideAnim.value = reducedMotion
      ? withTiming(0, { duration: dur })
      : withSpring(0, motion.spring.gentle);

    const exitSlideValue = toast.position === 'top' ? -spacing.xxxl : spacing.xxxl;
    const exitDuration = (toast.duration || 3000) - motion.duration.normal;
    const timeout = setTimeout(() => {
      fadeAnim.value = withTiming(0, { duration: motion.duration.normal });
      slideAnim.value = withTiming(exitSlideValue, {
        duration: motion.duration.normal,
        easing: motionEasing.accelerate,
      });
    }, exitDuration);

    return () => clearTimeout(timeout);
  }, [fadeAnim, slideAnim, toast.duration, toast.position, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const bgColorMap = {
    success: theme.colors.success,
    error: theme.colors.error,
    warning: theme.colors.warning,
    info: theme.colors.info,
  } as const;

  const textColorMap = {
    success: theme.colors.onSuccess,
    error: theme.colors.onError,
    warning: theme.colors.textInverse,
    info: theme.colors.onTertiary,
  } as const;

  const iconMap: Record<ToastType, IconComponent> = {
    success: CheckIcon,
    error: XIcon,
    warning: WarningIcon,
    info: InfoIcon,
  };

  const textColor = textColorMap[toast.type];
  const ToastIcon = iconMap[toast.type];

  return (
    <Reanimated.View
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`${toast.type}: ${toast.message}`}
      style={[
        styles.toast,
        {
          backgroundColor: bgColorMap[toast.type],
          ...elevation.md,
          shadowColor: theme.colors.shadow,
        },
        animatedStyle,
      ]}>
      <ToastIcon size={iconSizes.action} color={textColor} />
      <Text variant="body" style={[styles.message, { color: textColor }]}>
        {toast.message}
      </Text>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  containerTop: {
    top: 0,
  },
  containerBottom: {
    bottom: 0,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    minWidth: sizes.menuMaxWidth - layout.minTouchTarget,
    maxWidth: '100%',
  },
  message: {
    flex: 1,
  },
});
