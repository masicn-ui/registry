// File: blocks/step-indicator/StepIndicator.tsx


import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme, spacing, radius, sizes, borders } from '@masicn/ui';
import { Text } from '@/components/ui/Text';

export interface Step {
  /** Step label */
  label: string;
  /** Step description */
  description?: string;
}

interface StepIndicatorProps {
  /** Array of steps */
  steps: Step[];
  /** Current active step (0-indexed) */
  currentStep: number;
  /** Additional container style */
  containerStyle?: ViewStyle;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
}

export function StepIndicator({
  steps,
  currentStep,
  containerStyle,
  orientation = 'horizontal',
}: StepIndicatorProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        orientation === 'vertical' && styles.containerVertical,
        containerStyle,
      ]}>
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
                <Text
                  variant="label"
                  style={{
                    color: isCompleted || isActive
                      ? theme.colors.onPrimary
                      : theme.colors.textDisabled,
                  }}>
                  {isCompleted ? '✓' : index + 1}
                </Text>
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
}

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
    width: sizes.touchTarget,
    height: sizes.touchTarget,
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
