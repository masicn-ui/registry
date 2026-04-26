import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
} from 'react-native';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, interpolateColor } from 'react-native-reanimated';
import { Text, elevation, motion, motionEasing, opacity as opacityTokens, sizes, spacing, useReducedMotion, useTheme } from '../../../masicn';

interface SwitchProps {
  /** Current on/off state of the switch. */
  value: boolean;
  /** Callback fired when the user toggles the switch. Receives the new value. */
  onValueChange: (value: boolean) => void;
  /** Primary label text displayed next to the track. */
  label?: string;
  /** Secondary helper text displayed below the label. */
  description?: string;
  /** Side the label is placed relative to the track. Defaults to `'right'`. */
  labelPosition?: 'left' | 'right';
  /** When true, the switch is non-interactive and visually dimmed. */
  disabled?: boolean;
  /** Overrides the accessibility label (defaults to the `label` prop value). */
  accessibilityLabel?: string;
  /** Accessibility hint describing the result of toggling. */
  accessibilityHint?: string;
  /** Test identifier for automated testing. */
  testID?: string;
}

const THUMB_OFFSET = spacing.xxs;
const ANIMATION_DURATION = motion.duration.normal;

/**
 * A fully custom animated toggle switch with an optional label and description.
 * The thumb slides smoothly between on/off positions and scales slightly on
 * press. Respects the system reduced-motion preference.
 *
 * @example
 * const [enabled, setEnabled] = useState(false);
 * <Switch
 *   value={enabled}
 *   onValueChange={setEnabled}
 *   label="Push notifications"
 *   description="Receive alerts when you're mentioned"
 * />
 *
 * @example
 * // Label on the left side for a settings row where the control sits on the right
 * <Switch
 *   value={darkMode}
 *   onValueChange={setDarkMode}
 *   label="Dark mode"
 *   labelPosition="left"
 * />
 *
 * @example
 * // Disabled switch for a locked setting
 * <Switch
 *   value={true}
 *   onValueChange={() => {}}
 *   label="Two-factor authentication"
 *   description="Managed by your organisation"
 *   disabled
 * />
 *
 * @example
 * // Standalone switch without label, with explicit accessibility props
 * <Switch
 *   value={isMuted}
 *   onValueChange={setIsMuted}
 *   accessibilityLabel="Mute microphone"
 *   accessibilityHint="Toggles your microphone on or off during the call"
 *   testID="mute-toggle"
 * />
 */
const Switch = React.forwardRef<View, SwitchProps>(function Switch(
  {
    value,
    onValueChange,
    label,
    description,
    labelPosition = 'right',
    disabled = false,
    accessibilityLabel,
    accessibilityHint,
    testID,
  },
  ref,
) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  const progress = useSharedValue(value ? 1 : 0);
  const thumbScale = useSharedValue(1);

  React.useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: reducedMotion ? motion.duration.instant : ANIMATION_DURATION,
      easing: motionEasing.standard,
    });
  }, [value, reducedMotion, progress]);

  const handlePress = () => {
    if (!disabled) { onValueChange(!value); }
  };

  const THUMB_MAX = sizes.switchTrackWidth - sizes.switchThumb - THUMB_OFFSET;

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.colors.borderPrimary, theme.colors.primary]),
  }));

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [THUMB_OFFSET, THUMB_MAX]) },
      { scale: thumbScale.value },
    ],
  }));

  const thumbColor = theme.colors.surfacePrimary;

  const switchElement = (
    <Pressable
      testID={testID}
      onPress={handlePress}
      onPressIn={() => {
        if (!disabled) { thumbScale.value = withTiming(1.08, { duration: motion.duration.fast }); }
      }}
      onPressOut={() => {
        thumbScale.value = withTiming(1, { duration: motion.duration.fast });
      }}
      disabled={disabled}
      style={[styles.switchContainer, disabled && styles.switchDisabled]}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked: value, disabled }}>
      <Reanimated.View style={[styles.track, animatedTrackStyle]}>
        <Reanimated.View
          style={[
            styles.thumb,
            { backgroundColor: thumbColor },
            !disabled && { ...elevation.sm, shadowColor: theme.colors.shadow },
            animatedThumbStyle,
          ]}
        />
      </Reanimated.View>
    </Pressable>
  );

  if (!label && !description) { return switchElement; }

  return (
    <View ref={ref} style={[styles.container, labelPosition === 'left' && styles.containerReverse]}>
      <View style={styles.labelContainer}>
        {label && (
          <Text variant="body" color={disabled ? 'textDisabled' : 'textPrimary'}>{label}</Text>
        )}
        {description && (
          <Text variant="caption" color={disabled ? 'textDisabled' : 'textSecondary'} style={styles.description}>
            {description}
          </Text>
        )}
      </View>
      {switchElement}
    </View>
  );
});

Switch.displayName = 'Switch';

export { Switch };
export type { SwitchProps };

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  containerReverse: { flexDirection: 'row-reverse' },
  labelContainer: { flex: 1 },
  description: { marginTop: spacing.xxs },
  switchContainer: { padding: spacing.xxs },
  switchDisabled: { opacity: opacityTokens.disabled },
  track: { width: sizes.switchTrackWidth, height: sizes.switchTrackHeight, borderRadius: sizes.switchTrackHeight / 2, justifyContent: 'center' },
  thumb: { width: sizes.switchThumb, height: sizes.switchThumb, borderRadius: sizes.switchThumb / 2 },
});
