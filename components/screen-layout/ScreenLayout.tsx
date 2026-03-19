import React, { type ReactNode } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Row, Text, layout, radius, spacing, useResponsive, useTheme } from '../../../masicn'
import { Button } from '../button/Button';

export interface RightAction {
  label: string;
  onPress: () => void;
}

interface ScreenLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  /** Called when the back button is pressed. If omitted, back button is hidden even when showBackButton=true. */
  onBack?: () => void;
  showThemeToggle?: boolean;
  /** Up to 2 extra action buttons rendered on the right side of the header. */
  rightActions?: RightAction[];
  paddingHorizontal?: keyof typeof spacing;
  paddingTop?: keyof typeof spacing;
  paddingBottom?: keyof typeof spacing;
  /** When true (default), header stays fixed above the scroll area. When false, header scrolls with content. */
  stickyHeader?: boolean;
}

/**
 * Reusable screen layout component with consistent header and back button.
 * Decoupled from React Navigation — pass `onBack` instead of relying on useNavigation().
 *
 * Right-side header supports up to 2 buttons total (rightActions + optional theme toggle).
 * Layouts:
 *   - No back button:  [Title ─────────────── RightBtn1? RightBtn2?]
 *   - With back button: [Back] [─── Title ───] [RightBtn1? RightBtn2?]
 */
export function ScreenLayout({
  children,
  title,
  subtitle,
  showBackButton = true,
  onBack,
  showThemeToggle = true,
  rightActions = [],
  paddingHorizontal = 'md',
  paddingTop,
  paddingBottom,
  stickyHeader = true,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme } = useTheme();
  const { select } = useResponsive();

  const contentPaddingHorizontal = select({
    phone: paddingHorizontal ? spacing[paddingHorizontal] : 0,
    tablet: spacing.xl,
    largeTablet: spacing.xxl,
  });
  const contentPaddingTop = paddingTop ? spacing[paddingTop] : spacing.lg;
  const contentPaddingBottom = paddingBottom ? spacing[paddingBottom] : spacing.xl;
  const scrollPaddingTop = stickyHeader ? contentPaddingTop : 0;

  const canGoBack = showBackButton && onBack !== undefined;

  // Build the right-side button list: custom actions first, then theme toggle
  const allRightActions: RightAction[] = [
    ...rightActions,
    ...(showThemeToggle
      ? [{ label: theme.dark ? 'Light' : 'Dark', onPress: toggleTheme }]
      : []),
  ];

  // Sticky header sits outside the ScrollView and needs its own horizontal padding.
  // Scrolling header lives inside the ScrollView whose contentContainerStyle already
  // applies horizontal padding, so the header only needs vertical padding there.
  const headerPaddingStyle = stickyHeader
    ? {
      paddingTop: insets.top - spacing.sm,
      paddingBottom: spacing.md,
      paddingLeft: insets.left + contentPaddingHorizontal,
      paddingRight: insets.right + contentPaddingHorizontal,
      backgroundColor: theme.colors.background,
    }
    : {
      paddingTop: insets.top - spacing.sm,
      paddingBottom: spacing.md,
      backgroundColor: theme.colors.background,
    };

  const headerRow = (
    <Row justify="space-between" align="center">
      {/* Left: Back Button or Title */}
      {canGoBack ? (
        <Button
          variant="ghost"
          size="sm"
          onPress={onBack}
          containerStyle={{
            backgroundColor: theme.colors.surfaceSecondary,
            borderRadius: radius.lg,
          }}
        >
          Back
        </Button>
      ) : (
        <Box style={styles.flex1}>
          <Text variant="h1">{title}</Text>
        </Box>
      )}

      {/* Center: Title (only when back button is shown) */}
      {canGoBack && (
        <Box style={styles.centerTitle} pointerEvents="none">
          <Text variant="h1" style={styles.centerTitleText}>
            {title}
          </Text>
        </Box>
      )}

      {/* Right: Action Buttons (max 2) */}
      {allRightActions.length > 0 && (
        <Row gap="xs" align="center">
          {allRightActions.slice(0, 2).map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              onPress={action.onPress}
              containerStyle={{
                backgroundColor: theme.colors.surfacePrimary,
                borderRadius: radius.lg,
              }}
            >
              {action.label}
            </Button>
          ))}
        </Row>
      )}
    </Row>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex1, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Fixed header — only rendered outside ScrollView when stickyHeader=true */}
      {stickyHeader && (
        <View style={headerPaddingStyle}>
          {headerRow}
        </View>
      )}

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={{
          paddingTop: scrollPaddingTop,
          paddingBottom: insets.bottom + contentPaddingBottom,
          paddingLeft: insets.left + contentPaddingHorizontal,
          paddingRight: insets.right + contentPaddingHorizontal,
        }}
        bounces={true}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled">

        {/* Scrolling header — only inside ScrollView when stickyHeader=false */}
        {!stickyHeader && (
          <View style={headerPaddingStyle}>
            {headerRow}
          </View>
        )}

        {/* Content top spacing when header is not sticky */}
        {!stickyHeader && <View style={{ height: contentPaddingTop }} />}

        {/* Subtitle/Description */}
        {subtitle && (
          <Box marginBottom="xl">
            <Text variant="bodySmall" color="textSecondary">
              {subtitle}
            </Text>
          </Box>
        )}

        {/* Content */}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  centerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: layout.zIndex.base,
  },
  centerTitleText: {
    textAlign: 'center',
  },
});
