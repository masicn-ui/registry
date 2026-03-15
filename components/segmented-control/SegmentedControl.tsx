// File: components/segmented-control/SegmentedControl.tsx

import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Text, elevation, motion, motionEasing, opacity as opacityTokens, radius, spacing, useReducedMotion, useTheme } from '@masicn/ui';

export interface SegmentedControlOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = React.useState(0);

  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value));
  const segmentWidth =
    containerWidth > 0 ? (containerWidth - spacing.xs * 2) / options.length : 0;

  const translateX = useSharedValue(0);

  React.useEffect(() => {
    const targetX = selectedIndex * segmentWidth;
    if (reducedMotion || segmentWidth === 0) {
      translateX.value = targetX;
    } else {
      translateX.value = withTiming(targetX, { duration: motion.duration.normal, easing: motionEasing.standard });
    }
  }, [selectedIndex, segmentWidth, reducedMotion, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth,
  }));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceSecondary },
        disabled && styles.disabled,
      ]}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            {
              backgroundColor: theme.colors.surfacePrimary,
              shadowColor: theme.colors.shadow,
            },
          ]}
        />
      )}
      {options.map(opt => {
        const isSelected = opt.value === value;
        const isDisabled = disabled || !!opt.disabled;
        return (
          <Pressable
            key={opt.value}
            style={styles.option}
            onPress={() => !isDisabled && onChange(opt.value)}
            disabled={isDisabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected, disabled: isDisabled }}
            accessibilityLabel={opt.label}
          >
            <Text
              variant="buttonSmall"
              color={isSelected ? 'textPrimary' : 'textSecondary'}
              align="center"
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.lg,
    position: 'relative',
  },
  disabled: {
    opacity: opacityTokens.disabled,
  },
  indicator: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radius.md,
    ...elevation.sm,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
