import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  type ViewStyle,
} from 'react-native';
import { Divider, Text, elevation, radius, sizes, spacing, useTheme } from '@masicn/ui';

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
  /** Trigger element */
  children: React.ReactElement;
  /** Menu title */
  title?: string;
  /** Additional container style */
  containerStyle?: ViewStyle;
}

export function Menu({
  items,
  onSelect,
  children,
  title,
  containerStyle,
}: MenuProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  const handleSelect = (value: string) => {
    onSelect(value);
    setVisible(false);
  };

  return (
    <View style={containerStyle}>
      <Pressable onPress={() => setVisible(true)}>
        {children}
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay} pointerEvents="box-none">
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.backdrop }]}
            onPress={() => setVisible(false)}
          />
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: theme.colors.surfacePrimary,
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
  overlay: {
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
