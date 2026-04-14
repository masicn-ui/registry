import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Text, elevation, motion, motionEasing, opacity as opacityTokens, radius, spacing, useReducedMotion, useTheme } from '../../../masicn';

/** A single option entry for Segment. */
export interface SegmentOption {
  /** Display text for the segment. */
  label: string;
  /** Unique value identifier for the segment. */
  value: string;
  /** Whether this individual segment is disabled. */
  disabled?: boolean;
}

interface SegmentProps {
  /** Array of selectable options rendered as segments. */
  options: SegmentOption[];
  /** The currently selected option value. */
  value: string;
  /** Callback fired when the user selects a different segment. */
  onChange: (value: string) => void;
  /** When true, all segments are non-interactive. */
  disabled?: boolean;
}

/**
 * A horizontal tab-like control that allows the user to pick one option from
 * a small set of mutually-exclusive choices. An animated indicator slides
 * beneath the active segment. Respects the system reduced-motion preference.
 *
 * @example
 * const [view, setView] = useState('list');
 * <Segment
 *   options={[
 *     { label: 'List', value: 'list' },
 *     { label: 'Grid', value: 'grid' },
 *   ]}
 *   value={view}
 *   onChange={setView}
 * />
 */
export function Segment({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentProps) {
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
            elevation.sm,
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
