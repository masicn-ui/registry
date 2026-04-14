import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, borders, radius, sizes, spacing, useTheme } from '../../../masicn';

export interface PaginationProps {
  /** Current page (1-based) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when a page is selected */
  onPageChange: (page: number) => void;
  /** Max page buttons visible before collapsing to ellipsis (default 5) */
  maxVisible?: number;
  /** Test identifier — forwarded as `${testID}-page-${p}` to each page button. */
  testID?: string;
}

/**
 * Pagination — numbered page buttons with prev/next arrow controls.
 *
 * Renders a horizontal row containing a `‹` prev arrow, numbered page
 * buttons, and a `›` next arrow. When `totalPages` exceeds `maxVisible`,
 * the control collapses the middle pages into an ellipsis (`…`) while
 * always keeping the first and last page visible. The window of visible
 * page numbers stays centred around `page`.
 *
 * The `‹` and `›` buttons are automatically disabled (rendered without
 * an `onPress`) when the user is on the first or last page respectively.
 *
 * @example
 * <Pagination
 *   page={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={setCurrentPage}
 * />
 *
 * @example
 * // Show up to 7 page buttons before collapsing
 * <Pagination
 *   page={currentPage}
 *   totalPages={50}
 *   onPageChange={setCurrentPage}
 *   maxVisible={7}
 * />
 */
export const Pagination = React.memo(function Pagination({
  page,
  totalPages,
  onPageChange,
  maxVisible = 5,
  testID,
}: PaginationProps) {
  const { theme } = useTheme();

  const pages = useMemo((): Array<number | '…'> => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(2, page - half);
    let end = Math.min(totalPages - 1, page + half);

    if (page - half < 2) { end = Math.min(totalPages - 1, maxVisible - 1); }
    if (page + half > totalPages - 1) { start = Math.max(2, totalPages - maxVisible + 2); }

    const result: Array<number | '…'> = [1];
    if (start > 2) { result.push('…'); }
    for (let i = start; i <= end; i++) { result.push(i); }
    if (end < totalPages - 1) { result.push('…'); }
    result.push(totalPages);
    return result;
  }, [page, totalPages, maxVisible]);

  const renderButton = (label: string | number, target: number | null, active = false, buttonTestID?: string) => {
    const disabled = target === null;
    const bg = active ? theme.colors.primary : theme.colors.surfaceSecondary;
    const textColor = active ? theme.colors.onPrimary : disabled ? theme.colors.textDisabled : theme.colors.textPrimary;

    return (
      <Pressable
        key={String(label)}
        onPress={target !== null ? () => onPageChange(target) : undefined}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={typeof label === 'number' ? `Page ${label}` : String(label)}
        accessibilityState={{ selected: active, disabled }}
        testID={buttonTestID}
        hitSlop={spacing.sm}
        style={[styles.button, { backgroundColor: bg, borderColor: theme.colors.borderSecondary }]}>
        <Text variant="caption" style={{ color: textColor }}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel="Pagination" testID={testID}>
      {renderButton('‹', page > 1 ? page - 1 : null)}
      {pages.map((p, i) =>
        p === '…'
          ? <Text key={`ellipsis-${i}`} variant="caption" color="textSecondary" style={styles.ellipsis}>…</Text>
          : renderButton(p, p, p === page, testID ? `${testID}-page-${p}` : undefined),
      )}
      {renderButton('›', page < totalPages ? page + 1 : null)}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  button: {
    width: sizes.paginationButton,
    height: sizes.paginationButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: borders.thin,
  },
  ellipsis: {
    paddingHorizontal: spacing.xs,
  },
});
