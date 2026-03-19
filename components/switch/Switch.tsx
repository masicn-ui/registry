import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Text, elevation, motion, opacity as opacityTokens, sizes, spacing, useReducedMotion, useTheme } from '../../../masicn';

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
  },
  ref,
) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  const progress = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  const [pressing, setPressing] = React.useState(false);

  React.useEffect(() => {
    if (reducedMotion) {
      progress.setValue(value ? 1 : 0);
      return;
    }
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, reducedMotion, progress]);

  const handlePress = () => {
    if (!disabled) { onValueChange(!value); }
  };

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.borderPrimary, theme.colors.primary],
  });

  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_OFFSET, sizes.switchTrackWidth - sizes.switchThumb - THUMB_OFFSET],
  });

  const thumbScale = pressing && !disabled ? 1.08 : 1;
  const thumbColor = theme.colors.surfacePrimary;

  const switchElement = (
    <Pressable
      onPress={handlePress}
      onPressIn={() => !disabled && setPressing(true)}
      onPressOut={() => !disabled && setPressing(false)}
      disabled={disabled}
      style={[styles.switchContainer, disabled && styles.switchDisabled]}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked: value, disabled }}>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColor,
              transform: [{ translateX: thumbTranslateX }, { scale: thumbScale }],
            },
            !disabled && [styles.thumbShadow, { shadowColor: theme.colors.shadow }],
          ]}
        />
      </Animated.View>
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
  thumbShadow: { ...elevation.sm },
});
