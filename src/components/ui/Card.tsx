import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
}

export function Card({ children, style, elevated = false, noPadding = false }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: elevated ? theme.bgElevated : theme.cardBg,
          borderColor:     elevated ? theme.borderMedium : theme.cardBorder,
        },
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth:  1,
  },
  padding: {
    padding: spacing.xl,
  },
});
