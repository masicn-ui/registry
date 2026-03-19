import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import { Text, spacing, type Theme, type Typography } from '@masicn/ui';

type TextVariant = keyof Typography;
type TextColor = keyof Theme['colors'];

interface ReadMoreProps {
  children: string;
  /** Number of lines before truncating. Defaults to 3. */
  numberOfLines?: number;
  variant?: TextVariant;
  color?: TextColor;
  expandLabel?: string;
  collapseLabel?: string;
}

export function ReadMore({
  children,
  numberOfLines = 3,
  variant = 'body',
  color = 'textPrimary',
  expandLabel = 'Read more',
  collapseLabel = 'Show less',
}: ReadMoreProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [isTruncated, setIsTruncated] = React.useState(false);
  const [measured, setMeasured] = React.useState(false);

  const handleMeasure = React.useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (!measured) {
        setIsTruncated(e.nativeEvent.lines.length > numberOfLines);
        setMeasured(true);
      }
    },
    [measured, numberOfLines],
  );

  return (
    <View>
      {/* Hidden full-text render — counts actual lines without clamping */}
      {!measured && (
        <View style={styles.measureLayer} pointerEvents="none">
          <Text variant={variant} color={color} onTextLayout={handleMeasure}>
            {children}
          </Text>
        </View>
      )}

      {/* Visible text */}
      <Text
        variant={variant}
        color={color}
        numberOfLines={!expanded && isTruncated ? numberOfLines : undefined}
      >
        {children}
      </Text>

      {isTruncated && (
        <Pressable
          onPress={() => setExpanded(v => !v)}
          style={styles.toggle}
          accessibilityRole="button"
          accessibilityLabel={expanded ? collapseLabel : expandLabel}
        >
          <Text variant="label" color="tertiary">
            {expanded ? collapseLabel : expandLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  measureLayer: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  toggle: {
    marginTop: spacing.md,
  },
});
