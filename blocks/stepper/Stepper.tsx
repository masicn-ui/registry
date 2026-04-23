import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Text,
  borders,
  iconSizes,
  motion,
  radius,
  spacing,
  useReducedMotion,
  useTheme,
  CheckIcon,
} from '../../../masicn';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Step {
  /** Stable key for list reconciliation. Falls back to index when omitted. */
  id?: string;
  /** Step label */
  label: string;
  /** Step description (only rendered in vertical orientation). @default undefined */
  description?: string;
}

export interface StepperProps {
  /** Array of steps */
  steps: Step[];
  /** Current active step (0-indexed) */
  currentStep: number;
  /** Additional container style */
  containerStyle?: ViewStyle;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Test identifier forwarded to the container View. */
  testID?: string;
}

// ─── Circle size — smaller than minTouchTarget, sized for visual indicator ─

const CIRCLE_SIZE = spacing.xxl; // 32px

// ─── AnimatedStepCircle ────────────────────────────────────────────────────

interface StepCircleProps {
  isActive: boolean;
  isCompleted: boolean;
  index: number;
}

const AnimatedStepCircle = React.memo(function AnimatedStepCircle({
  isActive,
  isCompleted,
  index,
}: StepCircleProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  const scale = useSharedValue(isActive ? 1 : 0.9);

  useEffect(() => {
    scale.value = reducedMotion
      ? (isActive ? 1 : 0.9)
      : withSpring(isActive ? 1 : 0.9, motion.spring.snappy);
  // scale is a stable ref — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDone = isCompleted;
  const isUpcoming = !isActive && !isCompleted;

  const circleColorStyle = useMemo(() => ({
    backgroundColor: isDone || isActive ? theme.colors.primary : 'transparent',
    borderColor: isActive || isCompleted ? theme.colors.primary : theme.colors.borderSecondary,
    borderWidth: isUpcoming ? borders.medium : 0,
  }), [isDone, isActive, isCompleted, isUpcoming, theme]);

  const numberColorStyle = useMemo(() => ({
    color: isActive ? theme.colors.onPrimary : theme.colors.textDisabled,
  }), [isActive, theme]);

  return (
    <Animated.View style={[styles.circle, animStyle, circleColorStyle]}>
      {isDone ? (
        <CheckIcon size={iconSizes.decorative} color={theme.colors.onPrimary} />
      ) : (
        <Text variant="captionSmall" bold={isActive} style={numberColorStyle}>
          {index + 1}
        </Text>
      )}
    </Animated.View>
  );
});

// ─── Stepper ───────────────────────────────────────────────────────────────

/**
 * Stepper — a horizontal or vertical step progress indicator for multi-step flows.
 *
 * Renders numbered circles connected by a line. Completed steps show a check mark;
 * the active step animates to full scale and is highlighted in the primary colour;
 * future steps are dimmed and outlined. Uses Reanimated spring for the active-step
 * scale transition.
 *
 * @example
 * // Horizontal (default)
 * <Stepper
 *   steps={[{ label: 'Account' }, { label: 'Profile' }, { label: 'Review' }]}
 *   currentStep={1}
 * />
 *
 * @example
 * // Vertical with descriptions
 * <Stepper
 *   orientation="vertical"
 *   steps={[
 *     { label: 'Account', description: 'Create your account' },
 *     { label: 'Profile', description: 'Fill in your details' },
 *   ]}
 *   currentStep={0}
 * />
 */
export const Stepper = React.memo(function Stepper({
  steps,
  currentStep,
  containerStyle,
  orientation = 'horizontal',
  testID,
}: StepperProps) {
  const { theme } = useTheme();

  useEffect(() => {
    if (__DEV__ && orientation !== 'vertical') {
      const hasDescriptions = steps.some(s => s.description);
      if (hasDescriptions) {
        console.warn(
          '[masicn] Stepper: step.description is only rendered in vertical orientation. Pass orientation="vertical" to display descriptions.',
        );
      }
    }
  }, [steps, orientation]);

  return (
    <View
      style={[
        styles.container,
        orientation === 'vertical' && styles.containerVertical,
        containerStyle,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: steps.length - 1, now: currentStep }}
      testID={testID}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <React.Fragment key={step.id ?? String(index)}>
            <View
              style={[
                styles.step,
                orientation === 'vertical' && styles.stepVertical,
              ]}>
              <AnimatedStepCircle
                isActive={isActive}
                isCompleted={isCompleted}
                index={index}
              />

              <View style={styles.labelContainer}>
                <Text
                  variant="captionSmall"
                  bold={isActive}
                  color={
                    isActive
                      ? 'textPrimary'
                      : isCompleted
                        ? 'textSecondary'
                        : 'textDisabled'
                  }>
                  {step.label}
                </Text>
                {step.description && orientation === 'vertical' && (
                  <Text
                    variant="caption"
                    color={isCompleted ? 'textTertiary' : 'textSecondary'}
                    style={styles.description}>
                    {step.description}
                  </Text>
                )}
              </View>
            </View>

            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  orientation === 'vertical' && styles.connectorVertical,
                  {
                    backgroundColor:
                      index < currentStep
                        ? theme.colors.primary
                        : theme.colors.borderSecondary,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
});

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  containerVertical: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  step: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepVertical: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  description: {
    marginTop: spacing.xxs,
  },
  /** Horizontal connector — 2px thick, grows to fill space between steps. Offset down to thread through circle center. */
  connector: {
    flex: 1,
    height: borders.medium,
    minWidth: spacing.sm,
    marginTop: CIRCLE_SIZE / 2 - borders.medium / 2,
  },
  /** Vertical connector — fixed height, aligned with circle center column. */
  connectorVertical: {
    width: borders.medium,
    height: spacing.xl,
    marginLeft: CIRCLE_SIZE / 2 - borders.medium / 2,
    flex: 0,
  },
});
