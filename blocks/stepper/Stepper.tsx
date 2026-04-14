import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Text, borders, iconSizes, layout, radius, spacing, useTheme, CheckIcon } from '../../../masicn';

export interface Step {
  /** Step label */
  label: string;
  /** Step description */
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

/**
 * Stepper — a horizontal or vertical step progress indicator for multi-step flows.
 *
 * Renders numbered circles connected by a line. Completed steps show a check mark;
 * the active step is highlighted in primary colour; future steps are dimmed.
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

  return (
    <View
      style={[
        styles.container,
        orientation === 'vertical' && styles.containerVertical,
        containerStyle,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: steps.length - 1, now: currentStep }}
      testID={testID}
    >
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <React.Fragment key={index}>
            <View
              style={[
                styles.step,
                orientation === 'vertical' && styles.stepVertical,
              ]}>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: isCompleted || isActive
                      ? theme.colors.primary
                      : theme.colors.disabled,
                    borderColor: isActive
                      ? theme.colors.primary
                      : theme.colors.borderSecondary,
                  },
                  isActive && styles.circleActive,
                ]}>
                {isCompleted ? (
                  <CheckIcon size={iconSizes.decorative} color={theme.colors.onPrimary} />
                ) : (
                  <Text
                    variant="label"
                    style={{
                      color: isActive
                        ? theme.colors.onPrimary
                        : theme.colors.textDisabled,
                    }}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <View style={styles.labelContainer}>
                <Text
                  variant="bodySmall"
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
                    color="textSecondary"
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
                    backgroundColor: index < currentStep
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.full,
    borderWidth: borders.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    borderWidth: borders.thick,
  },
  labelContainer: {
    gap: spacing.xxs,
  },
  description: {
    marginTop: spacing.xxs,
  },
  connector: {
    flex: 1,
    height: borders.medium,
    minWidth: spacing.md,
  },
  connectorVertical: {
    width: borders.medium,
    height: spacing.xl,
    marginLeft: spacing.lg,
    flex: 0,
  },
});
