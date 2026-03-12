// File: components/key-value-row/KeyValueRow.tsx

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme, spacing, borders, opacity as opacityTokens } from '@masicn/ui';
import { Text } from '@/components/ui/Text';

interface KeyValueRowProps {
  label: string;
  value: string;
  /** Called when the row is pressed (e.g. copy to clipboard). */
  onPress?: () => void;
  /** Brief feedback label shown after press. Defaults to "Copied!". */
  feedbackLabel?: string;
  /** Alignment of the value text. Defaults to 'right'. */
  valueAlign?: 'left' | 'right';
  /** Render a hairline separator below the row. */
  separator?: boolean;
}

export function KeyValueRow({
  label,
  value,
  onPress,
  feedbackLabel = 'Copied!',
  valueAlign = 'right',
  separator = false,
}: KeyValueRowProps) {
  const { theme } = useTheme();
  const [feedback, setFeedback] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handlePress = () => {
    if (!onPress) return;
    onPress();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setFeedback(true);
    timeoutRef.current = setTimeout(() => setFeedback(false), 1500);
  };

  const row = (
    <View
      style={[
        styles.row,
        separator && styles.rowSeparator,
        separator && { borderBottomColor: theme.colors.borderPrimary },
      ]}
    >
      <Text variant="caption" color="textSecondary" style={styles.label}>
        {label}
      </Text>
      <Text
        variant="body"
        color={feedback ? 'success' : 'textPrimary'}
        align={valueAlign}
        style={styles.value}
      >
        {feedback ? feedbackLabel : value}
      </Text>
    </View>
  );

  if (!onPress) return row;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => pressed && styles.pressed}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Double-tap to copy.`}
    >
      {row}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  label: {
    flex: 1,
  },
  value: {
    flex: 2,
  },
  rowSeparator: {
    borderBottomWidth: borders.hairline,
  },
  pressed: {
    opacity: opacityTokens.pressed,
  },
});
