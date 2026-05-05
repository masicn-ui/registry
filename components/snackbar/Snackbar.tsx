import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Masicn,
  Text,
  elevation,
  iconSizes,
  motion,
  motionEasing,
  radius,
  spacing,
  useReducedMotion,
  useTheme,
  XIcon,
} from '../../../masicn';

type SnackbarType = 'success' | 'error' | 'warning' | 'info' | 'default';
type SnackbarPosition = 'top' | 'bottom';

interface SnackbarAction {
  /** Button label text displayed inside the snackbar. */
  label: string;
  /** Callback fired when the action button is pressed. The snackbar is also dismissed. */
  onPress: () => void;
}

interface SnackbarMessage {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number;
  action?: SnackbarAction;
  position?: SnackbarPosition;
  /** Optional callback fired when the snackbar body is tapped. Use for navigation (e.g. navigate to detail screen). The snackbar is dismissed after the callback. */
  onPress?: () => void;
}

interface SnackbarContextValue {
  show: (
    message: string,
    type?: SnackbarType,
    duration?: number,
    action?: SnackbarAction,
    position?: SnackbarPosition,
    onPress?: () => void,
  ) => void;
  success: (
    message: string,
    duration?: number,
    action?: SnackbarAction,
    position?: SnackbarPosition,
    onPress?: () => void,
  ) => void;
  error: (
    message: string,
    duration?: number,
    action?: SnackbarAction,
    position?: SnackbarPosition,
    onPress?: () => void,
  ) => void;
  warning: (
    message: string,
    duration?: number,
    action?: SnackbarAction,
    position?: SnackbarPosition,
    onPress?: () => void,
  ) => void;
  info: (
    message: string,
    duration?: number,
    action?: SnackbarAction,
    position?: SnackbarPosition,
    onPress?: () => void,
  ) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined,
);

/**
 * Returns the snackbar imperative API from the nearest `SnackbarProvider`.
 * Throws if called outside a provider.
 *
 * @example
 * const snackbar = useSnackbar();
 * snackbar.success('Saved!');
 *
 * @example
 * // Error with retry action
 * const snackbar = useSnackbar();
 * snackbar.error('Upload failed', 5000, { label: 'Retry', onPress: retryUpload });
 *
 * @example
 * // Top-positioned info snackbar
 * const snackbar = useSnackbar();
 * snackbar.info('New messages available', 3000, undefined, 'top');
 */
export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}

interface SnackbarProviderProps {
  /** Application subtree that will have access to the snackbar context. */
  children: React.ReactNode;
  /** Default screen position for snackbars when none is specified per-call. Defaults to `'bottom'`. */
  defaultPosition?: SnackbarPosition;
}

/**
 * Provides the snackbar context to the component tree. Renders active
 * snackbars in a portal above the rest of the UI. Wrap your root layout or
 * screen with this provider and use `useSnackbar()` anywhere inside to trigger
 * notifications programmatically.
 *
 * Unlike `Toast`, snackbars support an optional action button and a close
 * button, making them better suited for undoable or interactive feedback.
 *
 * @example
 * // In your root layout:
 * <SnackbarProvider>
 *   <App />
 * </SnackbarProvider>
 *
 * // Inside any screen:
 * const snackbar = useSnackbar();
 * snackbar.error('Upload failed', 5000, { label: 'Retry', onPress: retry });
 *
 * @example
 * // Default position overridden to top globally
 * <SnackbarProvider defaultPosition="top">
 *   <App />
 * </SnackbarProvider>
 *
 * @example
 * // Tappable snackbar that navigates to a detail screen
 * const snackbar = useSnackbar();
 * snackbar.info(
 *   'New order received',
 *   4000,
 *   undefined,
 *   'bottom',
 *   () => navigation.navigate('OrderDetail', { id: orderId }),
 * );
 */
export function SnackbarProvider({
  children,
  defaultPosition = 'bottom',
}: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

  const show = useCallback(
    (
      message: string,
      type: SnackbarType = 'default',
      duration = 4000,
      action?: SnackbarAction,
      position?: SnackbarPosition,
      onPress?: () => void,
    ) => {
      const id = Date.now().toString();
      const finalPosition = position ?? defaultPosition;
      setSnackbars(prev => [
        ...prev,
        {
          id,
          message,
          type,
          duration,
          action,
          position: finalPosition,
          onPress,
        },
      ]);

      setTimeout(() => {
        setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
      }, duration + 100);
    },
    [defaultPosition],
  );

  const success = useCallback(
    (
      message: string,
      duration?: number,
      action?: SnackbarAction,
      position?: SnackbarPosition,
      onPress?: () => void,
    ) => show(message, 'success', duration, action, position, onPress),
    [show],
  );

  const error = useCallback(
    (
      message: string,
      duration?: number,
      action?: SnackbarAction,
      position?: SnackbarPosition,
      onPress?: () => void,
    ) => show(message, 'error', duration, action, position, onPress),
    [show],
  );

  const warning = useCallback(
    (
      message: string,
      duration?: number,
      action?: SnackbarAction,
      position?: SnackbarPosition,
      onPress?: () => void,
    ) => show(message, 'warning', duration, action, position, onPress),
    [show],
  );

  const info = useCallback(
    (
      message: string,
      duration?: number,
      action?: SnackbarAction,
      position?: SnackbarPosition,
      onPress?: () => void,
    ) => show(message, 'info', duration, action, position, onPress),
    [show],
  );

  const dismiss = useCallback((id: string) => {
    setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
  }, []);

  return (
    <SnackbarContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      <Masicn>
        <SnackbarContainer snackbars={snackbars} onDismiss={dismiss} />
      </Masicn>
    </SnackbarContext.Provider>
  );
}

interface SnackbarContainerProps {
  snackbars: SnackbarMessage[];
  onDismiss: (id: string) => void;
}

function SnackbarContainer({ snackbars, onDismiss }: SnackbarContainerProps) {
  const insets = useSafeAreaInsets();
  const topSnackbars = snackbars.filter(s => s.position === 'top');
  const bottomSnackbars = snackbars.filter(s => s.position === 'bottom');

  return (
    <>
      {topSnackbars.length > 0 && (
        <View
          style={[
            styles.container,
            styles.containerTop,
            { paddingTop: insets.top + spacing.sm },
          ]}
          pointerEvents="box-none"
        >
          {topSnackbars.map(snackbar => (
            <SnackbarItem
              key={snackbar.id}
              snackbar={snackbar}
              onDismiss={() => onDismiss(snackbar.id)}
            />
          ))}
        </View>
      )}
      {bottomSnackbars.length > 0 && (
        <View
          style={[
            styles.container,
            styles.containerBottom,
            { paddingBottom: insets.bottom + spacing.sm },
          ]}
          pointerEvents="box-none"
        >
          {bottomSnackbars.map(snackbar => (
            <SnackbarItem
              key={snackbar.id}
              snackbar={snackbar}
              onDismiss={() => onDismiss(snackbar.id)}
            />
          ))}
        </View>
      )}
    </>
  );
}

interface SnackbarItemProps {
  snackbar: SnackbarMessage;
  onDismiss: () => void;
}

function SnackbarItem({ snackbar, onDismiss }: SnackbarItemProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const initialSlideValue =
    snackbar.position === 'top' ? -spacing.xxxl : spacing.xxxl;
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(initialSlideValue);

  React.useEffect(() => {
    const dur = reducedMotion ? motion.duration.instant : motion.duration.slow;
    fadeAnim.value = withTiming(1, { duration: dur });
    slideAnim.value = reducedMotion
      ? withTiming(0, { duration: dur })
      : withSpring(0, motion.spring.gentle);

    const exitSlideValue =
      snackbar.position === 'top' ? -spacing.xxxl : spacing.xxxl;
    const timeout = setTimeout(() => {
      fadeAnim.value = withTiming(0, { duration: motion.duration.normal });
      slideAnim.value = withTiming(exitSlideValue, {
        duration: motion.duration.normal,
        easing: motionEasing.accelerate,
      });
    }, (snackbar.duration || 4000) - motion.duration.normal);

    return () => clearTimeout(timeout);
  }, [
    fadeAnim,
    slideAnim,
    snackbar.duration,
    snackbar.position,
    reducedMotion,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const getBackgroundColor = () => {
    switch (snackbar.type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      case 'default':
      default:
        return theme.colors.surfacePrimary;
    }
  };

  const getTextColor = () => {
    switch (snackbar.type) {
      case 'success':
        return theme.colors.onSuccess;
      case 'error':
        return theme.colors.onError;
      case 'warning':
        return theme.colors.textInverse;
      case 'info':
        return theme.colors.onTertiary;
      default:
        return theme.colors.textPrimary;
    }
  };

  const handleActionPress = () => {
    snackbar.action?.onPress();
    onDismiss();
  };

  const handleBodyPress = () => {
    snackbar.onPress?.();
    onDismiss();
  };

  const snackbarStyle = [
    styles.snackbar,
    {
      backgroundColor: getBackgroundColor(),
      ...elevation.lg,
      shadowColor: theme.colors.shadow,
    },
    animatedStyle,
  ];

  const content = (
    <>
      <Text
        variant="body"
        style={[styles.message, { color: getTextColor() }]}
        numberOfLines={2}
      >
        {snackbar.message}
      </Text>
      {snackbar.action && (
        <Pressable onPress={handleActionPress} style={styles.actionButton}>
          <Text
            variant="button"
            style={{
              color:
                snackbar.type === 'default'
                  ? theme.colors.primary
                  : getTextColor(),
            }}
            bold
          >
            {snackbar.action.label}
          </Text>
        </Pressable>
      )}
      <Pressable
        onPress={onDismiss}
        style={styles.closeButton}
        hitSlop={spacing.sm}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <XIcon size={iconSizes.action} color={getTextColor()} />
      </Pressable>
    </>
  );

  if (snackbar.onPress) {
    return (
      <Reanimated.View style={snackbarStyle}>
        <Pressable style={styles.snackbarRow} onPress={handleBodyPress}>
          {content}
        </Pressable>
      </Reanimated.View>
    );
  }

  return (
    <Reanimated.View style={snackbarStyle}>
      <View style={styles.snackbarRow}>{content}</View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  containerTop: {
    top: 0,
  },
  containerBottom: {
    bottom: 0,
  },
  snackbar: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  snackbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingRight: spacing.lg,
    gap: spacing.sm,
    minHeight: spacing.xxxl,
  },
  message: {
    flex: 1,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  closeButton: {
    paddingHorizontal: spacing.xs,
  },
});
