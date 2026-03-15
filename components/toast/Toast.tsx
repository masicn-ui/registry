// File: components/toast/Toast.tsx


import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Masicn, Text, elevation, motion, radius, sizes, spacing, useReducedMotion, useTheme } from '@masicn/ui';

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

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
}

export function ToastProvider({ children, defaultPosition = 'top' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback(
    (message: string, type: ToastType = 'info', duration = 3000, position?: ToastPosition) => {
      const id = Date.now().toString();
      const finalPosition = position ?? defaultPosition;
      setToasts(prev => [...prev, { id, message, type, duration, position: finalPosition }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
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

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const initialSlideValue = reducedMotion ? 0 : (toast.position === 'top' ? -spacing.xxxl : spacing.xxxl);
  const slideAnim = React.useRef(new Animated.Value(initialSlideValue)).current;

  React.useEffect(() => {
    if (reducedMotion) {
      // Instant appearance for reduced motion
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: motion.duration.normal,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }

    const exitDuration = (toast.duration || 3000) - motion.duration.normal;
    const timeout = setTimeout(() => {
      if (reducedMotion) {
        fadeAnim.setValue(0);
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: motion.duration.normal,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: toast.position === 'top' ? -spacing.xxxl : spacing.xxxl,
            duration: motion.duration.normal,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, exitDuration);

    return () => clearTimeout(timeout);
  }, [fadeAnim, slideAnim, toast.duration, toast.position, reducedMotion]);

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

  const iconMap: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const textColor = textColorMap[toast.type];

  return (
    <Animated.View
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
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <Text variant="bodySmall" style={[styles.icon, { color: textColor }]}>
        {iconMap[toast.type]}
      </Text>
      <Text variant="body" style={[styles.message, { color: textColor }]}>
        {toast.message}
      </Text>
    </Animated.View>
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
    minWidth: sizes.menuMaxWidth - sizes.touchTarget,
    maxWidth: '100%',
  },
  icon: {
    // fontSize inherited from variant
  },
  message: {
    flex: 1,
  },
});
