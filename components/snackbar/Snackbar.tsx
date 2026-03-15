// File: components/snackbar/Snackbar.tsx


import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Masicn, Text, elevation, motion, radius, spacing, useTheme } from '@masicn/ui';

type SnackbarType = 'success' | 'error' | 'warning' | 'info' | 'default';
type SnackbarPosition = 'top' | 'bottom';

interface SnackbarAction {
  label: string;
  onPress: () => void;
}

interface SnackbarMessage {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number;
  action?: SnackbarAction;
  position?: SnackbarPosition;
}

interface SnackbarContextValue {
  show: (message: string, type?: SnackbarType, duration?: number, action?: SnackbarAction, position?: SnackbarPosition) => void;
  success: (message: string, duration?: number, action?: SnackbarAction, position?: SnackbarPosition) => void;
  error: (message: string, duration?: number, action?: SnackbarAction, position?: SnackbarPosition) => void;
  warning: (message: string, duration?: number, action?: SnackbarAction, position?: SnackbarPosition) => void;
  info: (message: string, duration?: number, action?: SnackbarAction, position?: SnackbarPosition) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}

interface SnackbarProviderProps {
  children: React.ReactNode;
  defaultPosition?: SnackbarPosition;
}

export function SnackbarProvider({ children, defaultPosition = 'bottom' }: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

  const show = useCallback(
    (message: string, type: SnackbarType = 'default', duration = 4000, action?: SnackbarAction, position?: SnackbarPosition) => {
      const id = Date.now().toString();
      const finalPosition = position ?? defaultPosition;
      setSnackbars(prev => [...prev, { id, message, type, duration, action, position: finalPosition }]);

      setTimeout(() => {
        setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
      }, duration);
    },
    [defaultPosition],
  );

  const success = useCallback(
    (message: string, duration?: number, action?: SnackbarAction, position?: SnackbarPosition) =>
      show(message, 'success', duration, action, position),
    [show],
  );

  const error = useCallback(
    (message: string, duration?: number, action?: SnackbarAction, position?: SnackbarPosition) =>
      show(message, 'error', duration, action, position),
    [show],
  );

  const warning = useCallback(
    (message: string, duration?: number, action?: SnackbarAction, position?: SnackbarPosition) =>
      show(message, 'warning', duration, action, position),
    [show],
  );

  const info = useCallback(
    (message: string, duration?: number, action?: SnackbarAction, position?: SnackbarPosition) =>
      show(message, 'info', duration, action, position),
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
          pointerEvents="box-none">
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
          pointerEvents="box-none">
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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const initialSlideValue = snackbar.position === 'top' ? -spacing.xxxl : spacing.xxxl;
  const slideAnim = React.useRef(new Animated.Value(initialSlideValue)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: motion.duration.slow,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: motion.duration.normal,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: snackbar.position === 'top' ? -spacing.xxxl : spacing.xxxl,
          duration: motion.duration.normal,
          useNativeDriver: true,
        }),
      ]).start();
    }, (snackbar.duration || 4000) - motion.duration.normal);

    return () => clearTimeout(timeout);
  }, [fadeAnim, slideAnim, snackbar.duration, snackbar.position]);

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
    return snackbar.type === 'default' ? theme.colors.textPrimary : theme.colors.onSuccess;
  };

  const handleActionPress = () => {
    snackbar.action?.onPress();
    onDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.snackbar,
        {
          backgroundColor: getBackgroundColor(),
          ...elevation.lg,
          shadowColor: theme.colors.shadow,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <Text
        variant="body"
        style={[styles.message, { color: getTextColor() }]}
        numberOfLines={2}>
        {snackbar.message}
      </Text>
      {snackbar.action && (
        <Pressable
          onPress={handleActionPress}
          style={styles.actionButton}>
          <Text
            variant="button"
            style={{ color: snackbar.type === 'default' ? theme.colors.primary : theme.colors.onSuccess }}
            bold>
            {snackbar.action.label}
          </Text>
        </Pressable>
      )}
      <Pressable
        onPress={onDismiss}
        style={styles.closeButton}
        hitSlop={spacing.sm}>
        <Text
          variant="body"
          style={{ color: getTextColor() }}>
          ✕
        </Text>
      </Pressable>
    </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingRight: spacing.lg,
    borderRadius: radius.lg,
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
