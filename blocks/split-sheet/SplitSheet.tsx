// File: blocks/split-sheet/SplitSheet.tsx


import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, spacing, motion, motionEasing } from '@masicn/ui';
import { LeftSheet } from '@/components/ui/LeftSheet';
import { RightSheet } from '@/components/ui/RightSheet';

interface SplitSheetProps {
  /** Whether the split sheet layout is visible */
  visible: boolean;
  /** Called when either panel is dismissed */
  onClose: () => void;
  /** Content for the left (1/3) panel */
  leftContent: React.ReactNode;
  /** Content for the right (2/3) panel */
  rightContent: React.ReactNode;
  /** Show drag handles on both panels */
  showHandle?: boolean;
  /** Extra style for the left panel */
  leftStyle?: ViewStyle;
  /** Extra style for the right panel */
  rightStyle?: ViewStyle;
}

const GAP = spacing.md;

export function SplitSheet({
  visible,
  onClose,
  leftContent,
  rightContent,
  showHandle = false,
  leftStyle,
  rightStyle,
}: SplitSheetProps) {
  const { theme } = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const opacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = React.useState(visible);

  // Left panel gets 1/3 and right gets 2/3 of the space minus the gap between them.
  // The gap shows the shared backdrop through it.
  const leftRatio = (SCREEN_WIDTH - GAP) / 3 / SCREEN_WIDTH;
  const rightRatio = ((SCREEN_WIDTH - GAP) * 2) / 3 / SCREEN_WIDTH;

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      opacity.value = withTiming(1, { duration: motion.duration.slow });
    } else {
      opacity.value = withTiming(0, { duration: motion.duration.normal, easing: motionEasing.accelerate });
      setTimeout(() => {
        setShouldRender(false);
      }, motion.duration.normal);
    }
  }, [visible, opacity]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          backdropStyle,
          { backgroundColor: theme.colors.backdrop },
        ]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <LeftSheet
        visible={visible}
        onClose={onClose}
        width={leftRatio}
        showHandle={showHandle}
        hideBackdrop
        style={leftStyle}>
        {leftContent}
      </LeftSheet>
      <RightSheet
        visible={visible}
        onClose={onClose}
        width={rightRatio}
        showHandle={showHandle}
        hideBackdrop
        style={rightStyle}>
        {rightContent}
      </RightSheet>
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
  },
});
