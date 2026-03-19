import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, borders, opacity as opacityTokens, spacing, useTheme } from '../../../masicn';

interface KeyValueRowProps {
  /** The descriptor label shown on the left side of the row. */
  label: string;
  /** The data value shown on the right side of the row. */
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

/**
 * KeyValueRow — a horizontal row that displays a label–value pair, with optional
 * press-to-copy behaviour and inline feedback.
 *
 * When `onPress` is provided the row becomes a `Pressable`. After the press
 * handler fires, the value text is temporarily replaced by `feedbackLabel`
 * (default "Copied!") rendered in the success color, then reverts after 1.5 s.
 * Without `onPress` the row renders as a plain `View`.
 *
 * @example
 * // Static display
 * <KeyValueRow label="Email" value="user@example.com" separator />
 *
 * // Tap-to-copy with custom feedback
 * <KeyValueRow
 *   label="API Key"
 *   value={apiKey}
 *   onPress={() => Clipboard.setString(apiKey)}
 *   feedbackLabel="Copied!"
 *   valueAlign="right"
 * />
 */
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
