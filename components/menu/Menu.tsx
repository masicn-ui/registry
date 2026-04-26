import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { Divider, Text, elevation, radius, sizes, spacing, useTheme } from '../../../masicn';

export interface MenuItem {
  /** Menu item label */
  label: string;
  /** Menu item value/id */
  value: string;
  /** Optional icon (emoji or text) */
  icon?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Optional description */
  description?: string;
  /** Destructive action (red text) */
  destructive?: boolean;
}

interface MenuProps {
  /** Menu items to display */
  items: MenuItem[];
  /** Callback when item is selected */
  onSelect: (value: string) => void;
  /** Trigger element that opens the menu when pressed. */
  children: React.ReactElement<any>;
  /** Optional heading rendered above the item list. */
  title?: string;
  /** Additional style applied to the outermost wrapper `View`. */
  style?: ViewStyle;
  /** Test identifier forwarded to the outermost wrapper `View`. */
  testID?: string;
}

/**
 * Menu — a modal context-menu that presents a list of actions when the trigger
 * element is pressed.
 *
 * The menu opens a centered `Modal` with a fade animation and a tappable
 * backdrop to dismiss. Items can carry an optional icon, description, and
 * `destructive` flag (which renders the label in the error/red color). Disabled
 * items are visually dimmed and cannot be pressed. Selecting a non-disabled item
 * calls `onSelect` with the item's `value` and closes the menu automatically.
 *
 * @example
 * <Menu
 *   title="Actions"
 *   items={[
 *     { label: 'Edit', value: 'edit', icon: '✏️' },
 *     { label: 'Share', value: 'share', icon: '↗️' },
 *     { label: 'Delete', value: 'delete', icon: '🗑', destructive: true },
 *   ]}
 *   onSelect={(value) => handleAction(value)}
 * >
 *   <IconButton icon="more-horizontal" />
 * </Menu>
 *
 * @example
 * // No title, minimal options
 * <Menu
 *   items={[
 *     { label: 'Copy link', value: 'copy' },
 *     { label: 'Report', value: 'report', destructive: true },
 *   ]}
 *   onSelect={handlePostAction}
 * >
 *   <Pressable><DotsIcon /></Pressable>
 * </Menu>
 *
 * @example
 * // With item descriptions
 * <Menu
 *   title="Export as"
 *   items={[
 *     { label: 'PDF', value: 'pdf', icon: '📄', description: 'Best for printing' },
 *     { label: 'CSV', value: 'csv', icon: '📊', description: 'Open in spreadsheet' },
 *     { label: 'JSON', value: 'json', icon: '{}', description: 'Raw data format' },
 *   ]}
 *   onSelect={handleExport}
 * >
 *   <Button variant="outline">Export</Button>
 * </Menu>
 *
 * @example
 * // With a disabled item (premium feature locked)
 * <Menu
 *   items={[
 *     { label: 'Duplicate', value: 'dup' },
 *     { label: 'Archive', value: 'archive', disabled: !canArchive },
 *     { label: 'Delete', value: 'delete', destructive: true },
 *   ]}
 *   onSelect={handleRowAction}
 * >
 *   <Pressable><MoreIcon /></Pressable>
 * </Menu>
 */
export function Menu({
  items,
  onSelect,
  children,
  title,
  style,
  testID,
}: MenuProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  const handleSelect = (value: string) => {
    onSelect(value);
    setVisible(false);
  };

  // Inject onPress directly onto the child to avoid a nested Pressable that
  // would intercept the touch before the child's own responder runs.
  const clonedChild = React.cloneElement(children, {
    onPress: (e: GestureResponderEvent) => {
      children.props.onPress?.(e);
      setVisible(true);
    },
  });

  return (
    <View style={style} testID={testID}>
      {clonedChild}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        // statusBarTranslucent makes the Modal extend behind the Android status
        // bar so the backdrop covers the full screen including the notch area.
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}>

        {/* Full-screen root — flex:1 fills the entire Modal surface */}
        <View style={styles.modalRoot}>
          {/* Backdrop: absoluteFill covers the whole modalRoot including status bar */}
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
            onPress={() => setVisible(false)}
          />

          {/* Menu card — stacks on top of backdrop via JSX render order */}
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: theme.colors.surfaceOverlay,
                ...elevation.lg,
                shadowColor: theme.colors.shadow,
              },
            ]}
            pointerEvents="auto">
            {title && (
              <>
                <View style={styles.header}>
                  <Text variant="label" color="textSecondary">
                    {title}
                  </Text>
                </View>
                <Divider />
              </>
            )}
            {items.map((item, index) => (
              <Pressable
                key={item.value}
                onPress={() => !item.disabled && handleSelect(item.value)}
                disabled={item.disabled}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && !item.disabled && {
                    backgroundColor: theme.colors.highlight,
                  },
                  index === items.length - 1 && styles.lastItem,
                ]}>
                {item.icon && (
                  <Text
                    variant="body"
                    style={[
                      styles.menuIcon,
                      {
                        color: item.disabled
                          ? theme.colors.textDisabled
                          : item.destructive
                            ? theme.colors.error
                            : theme.colors.textPrimary,
                      },
                    ]}>
                    {item.icon}
                  </Text>
                )}
                <View style={styles.menuContent}>
                  <Text
                    variant="body"
                    color={
                      item.disabled
                        ? 'textDisabled'
                        : item.destructive
                          ? 'error'
                          : 'textPrimary'
                    }>
                    {item.label}
                  </Text>
                  {item.description && (
                    <Text
                      variant="caption"
                      color={item.disabled ? 'textDisabled' : 'textSecondary'}
                      style={styles.menuDescription}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menuContainer: {
    borderRadius: radius.xl,
    minWidth: sizes.menuMinWidth,
    maxWidth: sizes.menuMaxWidth,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  lastItem: {},
  menuIcon: {
    width: spacing.xl,
    textAlign: 'center',
  },
  menuContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  menuDescription: {
    marginTop: spacing.xxs,
  },
});
