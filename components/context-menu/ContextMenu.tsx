import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  type LayoutChangeEvent,
  type ViewStyle,
  type LayoutRectangle,
} from 'react-native';
import {
  Text,
  borders,
  elevation,
  opacity as opacityTokens,
  radius,
  sizes,
  spacing,
  useTheme,
} from '../../../masicn';

export interface ContextMenuItem {
  /** Menu item label */
  label: string;
  /** Menu item value/id */
  value: string;
  /** Optional icon (emoji or text) */
  icon?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Destructive action (red text) */
  destructive?: boolean;
}

interface ContextMenuProps {
  /** Menu items to display */
  items: ContextMenuItem[];
  /** Callback when item is selected */
  onSelect: (value: string) => void;
  /** Trigger element */
  children: React.ReactElement<any>;
  /** Additional menu style */
  menuStyle?: ViewStyle;
  /** Accessibility label for the trigger — required for screen reader users to know what the long-press activates. */
  accessibilityLabel: string;
}

/**
 * ContextMenu — contextual action menu triggered by a long press on any element.
 *
 * Positions the menu automatically to stay within screen bounds. Supports
 * icons, destructive items, and disabled items.
 *
 * @example
 * // Basic usage with action items
 * <ContextMenu
 *   accessibilityLabel="Message options"
 *   items={[
 *     { label: 'Copy', value: 'copy', icon: '📋' },
 *     { label: 'Reply', value: 'reply', icon: '↩️' },
 *     { label: 'Delete', value: 'delete', icon: '🗑', destructive: true },
 *   ]}
 *   onSelect={(value) => handleAction(value)}>
 *   <Text>Long press me</Text>
 * </ContextMenu>
 *
 * @example
 * // With a disabled item
 * <ContextMenu
 *   accessibilityLabel="File options"
 *   items={[
 *     { label: 'Edit', value: 'edit' },
 *     { label: 'Share', value: 'share', disabled: true },
 *   ]}
 *   onSelect={setAction}>
 *   <Image source={thumbnail} />
 * </ContextMenu>
 *
 * @example
 * // Long-press on a list item row
 * <ContextMenu
 *   accessibilityLabel="Contact options"
 *   items={[
 *     { label: 'Call', value: 'call', icon: '📞' },
 *     { label: 'Message', value: 'message', icon: '💬' },
 *     { label: 'Block', value: 'block', destructive: true },
 *   ]}
 *   onSelect={handleContactAction}>
 *   <ContactRow contact={contact} />
 * </ContextMenu>
 *
 * @example
 * // Context menu on an image with custom menu style
 * <ContextMenu
 *   accessibilityLabel="Photo options"
 *   items={[
 *     { label: 'Save to photos', value: 'save' },
 *     { label: 'Copy', value: 'copy' },
 *   ]}
 *   onSelect={handlePhotoAction}
 *   menuStyle={{ minWidth: 200 }}>
 *   <Photo uri={item.uri} />
 * </ContextMenu>
 */
export function ContextMenu({
  items,
  onSelect,
  children,
  menuStyle,
  accessibilityLabel,
}: ContextMenuProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(
    null,
  );
  const [menuLayout, setMenuLayout] = useState<LayoutRectangle | null>(null);
  const triggerRef = useRef<View>(null);

  const handleLongPress = useCallback(() => {
    // Open immediately (at opacity 0 via getMenuPosition) so tests can query
    // menu items without waiting for measureInWindow to call back.
    setVisible(true);
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
    });
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
      setVisible(false);
    },
    [onSelect],
  );

  const handleClose = () => {
    setVisible(false);
  };

  const handleMenuLayout = useCallback((event: LayoutChangeEvent) => {
    setMenuLayout(event.nativeEvent.layout);
  }, []);

  const getMenuPosition = (): ViewStyle => {
    if (!triggerLayout) {
      return { opacity: 0 };
    }

    const OFFSET = spacing.xs;
    const SCREEN_PADDING = spacing.md;
    const { width: screenWidth, height: screenHeight } =
      Dimensions.get('window');

    let top = triggerLayout.y + triggerLayout.height + OFFSET;
    let left = triggerLayout.x;

    if (menuLayout) {
      if (top + menuLayout.height > screenHeight - SCREEN_PADDING) {
        top = triggerLayout.y - menuLayout.height - OFFSET;
      }

      if (top < SCREEN_PADDING) {
        top = SCREEN_PADDING;
      }

      if (left + menuLayout.width > screenWidth - SCREEN_PADDING) {
        left = screenWidth - SCREEN_PADDING - menuLayout.width;
      }
      if (left < SCREEN_PADDING) {
        left = SCREEN_PADDING;
      }
    }

    return {
      position: 'absolute',
      top,
      left,
      minWidth: Math.max(triggerLayout.width, sizes.menuMinWidth),
    };
  };

  return (
    <Pressable
      ref={triggerRef}
      onLongPress={handleLongPress}
      delayLongPress={500}
      android_ripple={null}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Long press to open context menu"
    >
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable
            onLayout={handleMenuLayout}
            style={[
              styles.menu,
              getMenuPosition(),
              {
                backgroundColor: theme.colors.surfaceOverlay,
                borderColor: theme.colors.borderPrimary,
                ...elevation.lg,
                shadowColor: theme.colors.shadow,
              },
              menuStyle,
            ]}
            onPress={e => e.stopPropagation()}
          >
            {items.map((item, index) => (
              <React.Fragment key={item.value}>
                <Pressable
                  disabled={item.disabled}
                  onPress={() => handleSelect(item.value)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    index === 0 && styles.menuItemFirst,
                    index === items.length - 1 && styles.menuItemLast,
                    pressed &&
                      !item.disabled && {
                        backgroundColor: theme.colors.ripple,
                      },
                    item.disabled && { opacity: opacityTokens.disabled },
                  ]}
                >
                  <View style={styles.menuItemContent}>
                    {item.icon && (
                      <Text variant="body" style={styles.menuIcon}>
                        {item.icon}
                      </Text>
                    )}
                    <Text
                      variant="body"
                      color={
                        item.destructive
                          ? 'error'
                          : item.disabled
                          ? 'textDisabled'
                          : 'textPrimary'
                      }
                      style={styles.menuLabel}
                    >
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
                {index < items.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.borderSecondary },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    borderRadius: radius.md,
    borderWidth: borders.thin,
    paddingVertical: spacing.xs,
    minWidth: sizes.menuMinWidth,
    maxWidth: sizes.menuMaxWidth,
  },
  menuItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  menuItemFirst: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  menuItemLast: {
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: spacing.sm,
    width: spacing.lg,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
  },
  divider: {
    height: borders.thin,
    marginTop: spacing.xs,
  },
});
