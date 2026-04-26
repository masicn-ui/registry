import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type TextLayoutEvent,
} from 'react-native';

import { Text, spacing, type Theme, type Typography } from '../../../masicn';

type TextVariant = keyof Typography;
type TextColor = keyof Theme['colors'];

interface ExpandableProps {
  /** The string content to display. */
  children: string;
  /** Number of lines before truncating. Defaults to 3. */
  numberOfLines?: number;
  /** Text variant applied to both the main text and the toggle button. Defaults to `'body'`. */
  variant?: TextVariant;
  /** Text color token for the main body text. Defaults to `'textPrimary'`. */
  color?: TextColor;
  /** Label for the expand toggle. Defaults to `'Read more'`. */
  expandLabel?: string;
  /** Label for the collapse toggle. Defaults to `'Show less'`. */
  collapseLabel?: string;
}

/**
 * Expandable — a text block that truncates long content and provides an inline
 * expand/collapse toggle.
 *
 * On first render a hidden, unclamped copy of the text is measured to determine
 * whether truncation is necessary. If the full text exceeds `numberOfLines`, the
 * visible copy is clamped and a toggle button is shown. Tapping the toggle
 * expands the text to its full length; tapping again collapses it. If the text
 * fits within `numberOfLines` no toggle is rendered and the measurement layer is
 * removed after the first measurement.
 *
 * @example
 * <Expandable numberOfLines={4}>
 *   {longBiographyText}
 * </Expandable>
 *
 * // Custom labels
 * <Expandable expandLabel="See more" collapseLabel="See less" numberOfLines={2}>
 *   {description}
 * </Expandable>
 *
 * @example
 * // Small caption text — product disclaimer
 * <Expandable variant="caption" color="textTertiary" numberOfLines={2}>
 *   {legalDisclaimer}
 * </Expandable>
 *
 * @example
 * // Review text on a product page
 * <Expandable expandLabel="Read full review" collapseLabel="Collapse" numberOfLines={5}>
 *   {review.body}
 * </Expandable>
 *
 * @example
 * // News article summary in a feed card
 * <Expandable numberOfLines={3} variant="bodySmall">
 *   {article.summary}
 * </Expandable>
 */
export function Expandable({
  children,
  numberOfLines = 3,
  variant = 'body',
  color = 'textPrimary',
  expandLabel = 'Read more',
  collapseLabel = 'Show less',
}: ExpandableProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [isTruncated, setIsTruncated] = React.useState(false);
  const [measured, setMeasured] = React.useState(false);

  const handleMeasure = React.useCallback(
    (e: TextLayoutEvent) => {
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
