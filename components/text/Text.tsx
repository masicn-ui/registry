// File: components/text/Text.tsx

import React from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';
import { useTheme, typography, fontFamilies, type Typography, type Theme } from '@masicn/ui';

type TextColor = keyof Theme['colors'];

interface TextProps extends RNTextProps {
  variant?: keyof Typography;
  color?: TextColor;
  align?: 'left' | 'center' | 'right' | 'justify';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/**
 * Lookup table: any weight variant of a family → that family's bold font string.
 * Built once at module level from the canonical fontFamilies registry, so adding
 * or renaming a font family in typography.ts automatically updates this map.
 */
const boldFontMap = new Map<string, string>(
  Object.values(fontFamilies).flatMap(({ regular, medium, bold }) => [
    [regular, bold],
    [medium, bold],
  ]),
);

function getBoldFont(fontFamily?: string): string | undefined {
  if (!fontFamily) { return fontFamily; }
  return boldFontMap.get(fontFamily) ?? fontFamily;
}

export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  bold,
  italic,
  underline,
  style,
  children,
  ...rest
}: TextProps) {
  const { theme } = useTheme();

  const baseStyle = typography[variant];

  const resolvedFontFamily = bold
    ? getBoldFont(baseStyle.fontFamily)
    : baseStyle.fontFamily;

  return (
    <RNText
      style={[
        baseStyle,
        { fontFamily: resolvedFontFamily },
        { color: theme.colors[color] },
        align && styles[align],
        italic && styles.italic,
        underline && styles.underline,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  justify: { textAlign: 'justify' },

  italic: {
    fontStyle: 'italic',
  },

  underline: {
    textDecorationLine: 'underline',
  },
});
