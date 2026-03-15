// File: components/context-menu/ContextMenu.tsx

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  type ViewStyle,
  type LayoutRectangle,
} from 'react-native';
import { Text, borders, elevation, opacity as opacityTokens, radius, sizes, spacing, useTheme } from '@masicn/ui';

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
  children: React.ReactElement;
  /** Additional menu style */
  menuStyle?: ViewStyle;
}

/**
 * ContextMenu component for touch-and-hold interactions
 * Shows a contextual menu when user long-presses the trigger
 */
export function ContextMenu({
  items,
  onSelect,
  children,
  menuStyle,
}: ContextMenuProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null);
  const [menuLayout, setMenuLayout] = useState<LayoutRectangle | null>(null);
  const triggerRef = useRef<View>(null);

  const handleLongPress = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setVisible(true);
    });
  }, []);

  const handleSelect = (value: string) => {
    onSelect(value);
    setVisible(false);
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleMenuLayout = useCallback((event: any) => {
    setMenuLayout(event.nativeEvent.layout);
  }, []);

  const getMenuPosition = (): ViewStyle => {
    if (!triggerLayout) {
      return { opacity: 0 };
    }

    const OFFSET = spacing.xs;
    const SCREEN_PADDING = spacing.md;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    <View>
      <Pressable ref={triggerRef} onLongPress={handleLongPress}>
        {children}
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}>
        <Pressable
          style={styles.overlay}
          onPress={handleClose}>
          <Pressable
            onLayout={handleMenuLayout}
            style={[
              styles.menu,
              getMenuPosition(),
              {
                backgroundColor: theme.colors.surfacePrimary,
                borderColor: theme.colors.borderPrimary,
                ...elevation.lg,
                shadowColor: theme.colors.shadow,
              },
              menuStyle,
            ]}
            onPress={(e) => e.stopPropagation()}>
            {items.map((item, index) => (
              <Pressable
                key={item.value}
                disabled={item.disabled}
                onPress={() => handleSelect(item.value)}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: theme.colors.ripple },
                  item.disabled && { opacity: opacityTokens.disabled },
                ]}>
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
                    style={styles.menuLabel}>
                    {item.label}
                  </Text>
                </View>
                {index < items.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.borderSecondary },
                    ]}
                  />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
