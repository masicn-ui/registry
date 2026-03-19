import React from 'react';
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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme, spacing, radius, elevation, sizes, motion, motionEasing } from '@masicn/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RightSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  showHandle?: boolean;
  style?: ViewStyle;
  hideBackdrop?: boolean;
}

const DISMISS_THRESHOLD = 0.3;

export function RightSheet({
  visible,
  onClose,
  children,
  width = 0.75,
  showHandle = false,
  style,
  hideBackdrop = false,
}: RightSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const sheetWidth = SCREEN_WIDTH * width;
  const translateX = useSharedValue(sheetWidth);
  const opacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = React.useState(visible);

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateX.value = withSpring(0, {
        damping: 25,
        stiffness: 300,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: motion.duration.slow });
    } else {
      translateX.value = withTiming(sheetWidth, { duration: motion.duration.normal, easing: motionEasing.accelerate });
      opacity.value = withTiming(0, { duration: motion.duration.normal, easing: motionEasing.accelerate });
      setTimeout(() => {
        setShouldRender(false);
      }, motion.duration.normal);
    }
  }, [visible, translateX, opacity, sheetWidth]);

  const sheetWidthSV = useSharedValue(sheetWidth);
  React.useEffect(() => { sheetWidthSV.value = sheetWidth; }, [sheetWidth, sheetWidthSV]);

  const handleDismiss = React.useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (e.translationX > sheetWidthSV.value * DISMISS_THRESHOLD || e.velocityX > 500) {
        handleDismiss();
      } else {
        translateX.value = withSpring(0, { damping: 25, stiffness: 300, mass: 0.8 });
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
    <View style={styles.overlay} pointerEvents={hideBackdrop ? 'box-none' : undefined}>
      {!hideBackdrop && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle]}>
          <Pressable
            style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}
            onPress={() => { Keyboard.dismiss(); onClose(); }}
          />
        </Animated.View>
      )}
      <GestureDetector gesture={pan}>
        <Animated.View
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
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              style={styles.flex1}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: spacing.lg },
              ]}
              keyboardShouldPersistTaps="handled"
              bounces={false}>
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

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
  handleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  handle: {
    width: sizes.bottomSheetHandle,
    height: sizes.bottomSheetHandleWidth,
    borderRadius: radius.full,
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
