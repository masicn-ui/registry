// File: src/shared/blocks/json-tree/JsonTree.tsx
import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text, Box, Pressable, borders, radius, spacing, useTheme } from '../../../masicn';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JsonTreeProps {
  /** The data to render. Accepts any JavaScript value — object, array, or primitive. */
  data: unknown;
  /**
   * Number of depth levels expanded on first render.
   * Nodes deeper than this start collapsed. Defaults to 2.
   */
  defaultDepth?: number;
  /** Optional title shown in the header bar. */
  title?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INDENT_SIZE = spacing.lg;
const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrimitive(v: unknown): string {
  if (typeof v === 'string') { return `"${v}"`; }
  if (v === null) { return 'null'; }
  if (v === undefined) { return 'undefined'; }
  if (typeof v === 'function') { return '[Function]'; }
  if (typeof v === 'symbol') { return v.toString(); }
  return String(v);
}

function isCollapsible(v: unknown): v is object {
  return v !== null && typeof v === 'object';
}

// ── JsonNode (internal recursive component) ───────────────────────────────────

interface NodeProps {
  name?: string | number;
  value: unknown;
  depth: number;
  defaultDepth: number;
  isLast: boolean;
  seen: ReadonlySet<object>;
}

function JsonNode({ name, value, depth, defaultDepth, isLast, seen }: NodeProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(() => depth < defaultDepth);

  const isArr = Array.isArray(value);
  const isComplex = isCollapsible(value);
  const indent = depth * INDENT_SIZE;

  const comma = !isLast ? (
    <Text variant="bodySmall" style={[styles.mono, { color: theme.colors.textTertiary }]}>,</Text>
  ) : null;

  // Key prefix rendered for all named nodes
  const keyText = name !== undefined ? (
    <>
      <Text variant="bodySmall" style={[styles.mono, { color: theme.colors.textSecondary }]}>
        {typeof name === 'string' ? `"${name}"` : name}
      </Text>
      <Text variant="bodySmall" style={[styles.mono, { color: theme.colors.textTertiary }]}>
        {': '}
      </Text>
    </>
  ) : null;

  const rowProps = {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    style: { paddingLeft: indent, paddingVertical: spacing.xxs },
  };

  // ── Circular reference ────────────────────────────────────────────────────
  if (isComplex && seen.has(value)) {
    return (
      <Box {...rowProps}>
        {keyText}
        <Text variant="bodySmall" style={[styles.mono, styles.italic, { color: theme.colors.textTertiary }]}>
          [Circular]
        </Text>
        {comma}
      </Box>
    );
  }

  // ── Primitive ─────────────────────────────────────────────────────────────
  if (!isComplex) {
    let valueColor = theme.colors.textTertiary;
    if (typeof value === 'string') { valueColor = theme.colors.success; }
    else if (typeof value === 'number') { valueColor = theme.colors.info; }
    else if (typeof value === 'boolean') { valueColor = theme.colors.warning; }

    return (
      <Box {...rowProps}>
        {keyText}
        <Text
          variant="bodySmall"
          style={[
            styles.mono,
            { color: valueColor },
            (value === null || value === undefined) && styles.italic,
          ]}>
          {formatPrimitive(value)}
        </Text>
        {comma}
      </Box>
    );
  }

  // ── Object / Array ────────────────────────────────────────────────────────
  const entries: Array<[string | number, unknown]> = isArr
    ? (value as unknown[]).map((v, i) => [i, v])
    : Object.entries(value as Record<string, unknown>);

  const count = entries.length;
  const openBracket = isArr ? '[' : '{';
  const closeBracket = isArr ? ']' : '}';

  // Empty object or array — render inline, no expand toggle
  if (count === 0) {
    return (
      <Box {...rowProps}>
        {keyText}
        <Text variant="bodySmall" style={[styles.mono, { color: theme.colors.textPrimary }]}>
          {isArr ? '[ ]' : '{ }'}
        </Text>
        {comma}
      </Box>
    );
  }

  const nextSeen = new Set(seen);
  nextSeen.add(value);

  const countLabel = isArr
    ? `${count} ${count === 1 ? 'item' : 'items'}`
    : `${count} ${count === 1 ? 'key' : 'keys'}`;

  return (
    <Box>
      {/* Opening bracket row — tap to expand / collapse */}
      <Pressable
        onPress={() => setIsOpen(prev => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${name ?? (isArr ? 'array' : 'object')}, ${isOpen ? 'collapse' : 'expand'}`}>
        <Box {...rowProps}>
          {keyText}
          <Text variant="bodySmall" style={[styles.mono, { color: theme.colors.textPrimary }]}>{openBracket}</Text>
          {!isOpen && (
            <Text variant="bodySmall" style={[styles.mono, { color: theme.colors.textTertiary }]}>
              {` ${countLabel} `}
            </Text>
          )}
          {!isOpen && <Text variant="bodySmall" style={[styles.mono, { color: theme.colors.textPrimary }]}>{closeBracket}</Text>}
          {!isOpen && comma}
          <View style={[styles.chevronWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
            <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
              {isOpen ? '▾' : '▸'}
            </Text>
          </View>
        </Box>
      </Pressable>

      {/* Children */}
      {isOpen && entries.map(([k, v], i) => (
        <JsonNode
          key={String(k)}
          name={k}
          value={v}
          depth={depth + 1}
          defaultDepth={defaultDepth}
          isLast={i === count - 1}
          seen={nextSeen}
        />
      ))}

      {/* Closing bracket row */}
      {isOpen && (
        <Box {...rowProps}>
          <Text variant="bodySmall" style={[styles.mono, { color: theme.colors.textPrimary }]}>{closeBracket}</Text>
          {comma}
        </Box>
      )}
    </Box>
  );
}

// ── JsonTree ────────────────────────────────────────────────────────────────

/**
 * JsonTree — a recursively collapsible JSON tree viewer.
 *
 * Renders any JavaScript value as an interactive tree. Objects and arrays
 * can be expanded and collapsed on tap. Primitive value types are
 * colour-coded using semantic theme tokens:
 * - Strings → `success` (green)
 * - Numbers → `info` (blue)
 * - Booleans → `warning` (amber)
 * - null / undefined → `textTertiary`, italic
 *
 * Nodes deeper than `defaultDepth` start collapsed. Circular references
 * are detected and rendered as `[Circular]` to prevent infinite loops.
 *
 * An optional `title` prop adds a header bar above the tree.
 *
 * @example
 * <JsonTree data={{ user: { name: 'John', age: 30 }, tags: ['admin'] }} />
 *
 * @example
 * <JsonTree data={apiResponse} defaultDepth={0} title="API Response" />
 *
 * @example
 * // Fully collapsed — only root node expanded on tap
 * <JsonTree
 *   data={complexNested}
 *   defaultDepth={0}
 *   title="Raw Payload"
 * />
 *
 * @example
 * // Deep expansion for a flat config object
 * <JsonTree
 *   data={{ theme: 'dark', locale: 'en-AU', version: '2.1.0' }}
 *   defaultDepth={3}
 * />
 */
export function JsonTree({ data, defaultDepth = 2, title }: JsonTreeProps) {
  const { theme } = useTheme();

  return (
    <Box
      borderRadius="lg"
      borderWidth="thin"
      borderColor={theme.colors.borderSecondary}
      overflow="hidden">
      {title && (
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderBottomWidth: borders.thin,
              borderBottomColor: theme.colors.borderSecondary,
            },
          ]}>
          <Text variant="label" color="textSecondary">{title}</Text>
        </View>
      )}
      <Box
        padding="md"
        backgroundColor={theme.colors.surfaceTertiary}>
        <JsonNode
          value={data}
          depth={0}
          defaultDepth={defaultDepth}
          isLast
          seen={new Set()}
        />
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  mono: {
    fontFamily: MONO_FONT,
  },
  italic: {
    fontStyle: 'italic',
  },
  chevronWrap: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
