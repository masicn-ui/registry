import React, { type ReactNode } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Row, Text, layout, radius, spacing, useResponsive, useTheme } from '../../../masicn'
import { Button } from '../button/Button';

export interface RightAction {
  /** Button label displayed in the header action button. */
  label: string;
  /** Called when the action button is pressed. */
  onPress: () => void;
}

interface ScreenLayoutProps {
  /** Screen body content rendered inside the scroll view. */
  children: ReactNode;
  /** Screen title displayed in the header. */
  title: string;
  /** Optional descriptive text rendered below the title in the scroll area. */
  subtitle?: string;
  /** Whether to show the back button in the header. Defaults to true. */
  showBackButton?: boolean;
  /** Called when the back button is pressed. If omitted, back button is hidden even when showBackButton=true. */
  onBack?: () => void;
  /** Whether to show the light/dark theme toggle button in the header. Defaults to true. */
  showThemeToggle?: boolean;
  /** Up to 2 extra action buttons rendered on the right side of the header. */
  rightActions?: RightAction[];
  /** Horizontal content padding key from the spacing scale. Defaults to `'md'`. */
  paddingHorizontal?: keyof typeof spacing;
  /** Top content padding key from the spacing scale. Defaults to `spacing.lg`. */
  paddingTop?: keyof typeof spacing;
  /** Bottom content padding key from the spacing scale. Defaults to `spacing.xl`. */
  paddingBottom?: keyof typeof spacing;
  /** When true (default), header stays fixed above the scroll area. When false, header scrolls with content. */
  stickyHeader?: boolean;
}

/**
 * ScreenLayout — a full-screen scaffold with a responsive header, back navigation,
 * and scrollable content area.
 *
 * Decoupled from React Navigation — pass `onBack` instead of relying on `useNavigation()`.
 * The header adapts its layout based on whether a back button is present:
 *
 *   - No back button:   [Title ──────────────── RightBtn1? RightBtn2?]
 *   - With back button: [Back] [─── Title ───] [RightBtn1? RightBtn2?]
 *
 * On tablets and large tablets, the horizontal content padding is automatically
 * increased via `useResponsive`. A `KeyboardAvoidingView` wraps the entire layout
 * so inputs near the bottom are not obscured by the software keyboard.
 *
 * The optional `subtitle` is rendered below the header inside the scroll area.
 * Right-side header accepts a maximum of 2 buttons (custom actions + optional
 * theme toggle). Surplus actions are silently truncated.
 *
 * @example
 * <ScreenLayout
 *   title="Settings"
 *   showBackButton
 *   onBack={() => navigation.goBack()}
 *   rightActions={[{ label: 'Save', onPress: handleSave }]}
 * >
 *   <SettingsForm />
 * </ScreenLayout>
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
