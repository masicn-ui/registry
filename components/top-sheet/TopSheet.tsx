import React from 'react';
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

interface TopSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
  showHandle?: boolean;
  style?: ViewStyle;
}

const DISMISS_THRESHOLD = 0.3;

export function TopSheet({
  visible,
  onClose,
  children,
  maxHeight = 0.8,
  showHandle = true,
  style,
}: TopSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const maxSheetHeight = SCREEN_HEIGHT * maxHeight;
  const translateY = useSharedValue(-SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = React.useState(visible);
  const [contentHeight, setContentHeight] = React.useState(0);

  const sheetHeight = Math.min(
    contentHeight + (showHandle ? spacing.md * 2 + sizes.bottomSheetHandle : 0),
    maxSheetHeight,
  );

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 300,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: motion.duration.slow });
    } else {
      translateY.value = withTiming(-SCREEN_HEIGHT, { duration: motion.duration.normal, easing: motionEasing.accelerate });
      opacity.value = withTiming(0, { duration: motion.duration.normal, easing: motionEasing.accelerate });
      setTimeout(() => {
        setShouldRender(false);
      }, motion.duration.normal);
    }
  }, [visible, translateY, opacity, SCREEN_HEIGHT]);

  const handleDismiss = React.useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const dismissThresholdSV = useSharedValue(0);
  React.useEffect(() => {
    dismissThresholdSV.value = sheetHeight * DISMISS_THRESHOLD;
  }, [sheetHeight, dismissThresholdSV]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY([-5, 5])
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY < -dismissThresholdSV.value || e.velocityY < -500) {
        handleDismiss();
      } else {
        translateY.value = withSpring(0, { damping: 25, stiffness: 300, mass: 0.8 });
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
    <View style={styles.overlay}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle]}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}
          onPress={() => { Keyboard.dismiss(); onClose(); }}
        />
      </Animated.View>
      <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.sheet,
          elevation.xl,
          {
            maxHeight: maxSheetHeight,
            height: sheetHeight || undefined,
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
  );
}

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
