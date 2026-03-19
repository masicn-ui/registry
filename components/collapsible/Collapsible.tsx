import React, { useState } from 'react';
import { Pressable, View, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text, borders, iconSizes, spacing, useReducedMotion, useTheme } from '../../../masicn';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleProps {
  /** Header text */
  title: string;
  /** Collapsible body content */
  children: React.ReactNode;
  /** Start expanded */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Called when the header is pressed */
  onToggle?: (open: boolean) => void;
  /** Custom chevron/icon to replace the default ▾ glyph */
  icon?: React.ReactNode;
}

/**
 * Collapsible — a lightweight expandable section with an animated chevron.
 *
 * Renders a pressable header row with a title and a chevron that rotates
 * 180° when expanded. The body content is shown/hidden using
 * `LayoutAnimation` (with reduced-motion fallback). Supports both controlled
 * (`open` + `onToggle`) and uncontrolled (`defaultOpen`) modes. The default
 * chevron can be replaced with any node via the `icon` prop.
 *
 * @example
 * // Uncontrolled, starts expanded
 * <Collapsible title="Advanced Settings" defaultOpen>
 *   <Toggle label="Enable debug mode" />
 * </Collapsible>
 *
 * @example
 * // Controlled
 * <Collapsible
 *   title="Filters"
 *   open={filtersOpen}
 *   onToggle={setFiltersOpen}
 * >
 *   <FilterPanel />
 * </Collapsible>
 */
export function Collapsible({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  icon,
}: CollapsibleProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isOpen = controlledOpen ?? internalOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (!reducedMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setInternalOpen(next);
    onToggle?.(next);
  };

  return (
    <View
      style={[
        styles.container,
        { borderColor: theme.colors.borderSecondary },
      ]}>
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.header,
          { backgroundColor: pressed ? theme.colors.highlight : theme.colors.surfacePrimary },
        ]}>
        <Text variant="label" color="textPrimary" style={styles.headerTitle}>
          {title}
        </Text>
        {icon ?? (
          <Text
            variant="body"
            style={[
              styles.chevron,
              { color: theme.colors.textSecondary, transform: [{ rotate: isOpen ? '180deg' : '0deg' }] },
            ]}>
            ▾
          </Text>
        )}
      </Pressable>

      {isOpen && (
        <View
          style={[
            styles.body,
            { borderTopColor: theme.colors.borderSecondary },
          ]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: borders.thin,
    borderRadius: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  chevron: {
    fontSize: iconSizes.decorative,
  },
  body: {
    padding: spacing.md,
    borderTopWidth: borders.thin,
  },
});
