import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, fontSize, gradients } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { theme, isDark } = useTheme();

  const sizeStyles = {
    sm: { paddingVertical: spacing.sm,  paddingHorizontal: spacing.lg,  fontSize: fontSize.sm },
    md: { paddingVertical: spacing.md,  paddingHorizontal: spacing.xl,  fontSize: fontSize.md },
    lg: { paddingVertical: spacing.lg,  paddingHorizontal: spacing.xxl, fontSize: fontSize.lg },
  }[size];

  const gradientColors = isDark ? gradients.primaryDark : gradients.primaryLight;

  const opacity = disabled || loading ? 0.5 : 1;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal, opacity },
          ]}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={[styles.textPrimary, { fontSize: sizeStyles.fontSize }, textStyle]}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle = {
    secondary: {
      bg:     'rgba(255, 107, 53, 0.08)',
      border: theme.borderMedium,
      text:   theme.orange,
    },
    destructive: {
      bg:     'rgba(239, 68, 68, 0.10)',
      border: 'rgba(239, 68, 68, 0.30)',
      text:   theme.red,
    },
    ghost: {
      bg:     'transparent',
      border: 'transparent',
      text:   theme.textSecondary,
    },
  }[variant as 'secondary' | 'destructive' | 'ghost'];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: variantStyle.bg,
          borderColor:     variantStyle.border,
          borderWidth:     1,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={variantStyle.text} />
        : <Text style={[styles.textBase, { fontSize: sizeStyles.fontSize, color: variantStyle.text }, textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  textPrimary: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textBase: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
