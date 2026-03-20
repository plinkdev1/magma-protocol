import React from 'react';
import * as LucideIcons from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export type IconName = keyof typeof LucideIcons;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color, strokeWidth = 2 }: IconProps) {
  const { theme } = useTheme();
  const LucideIcon = LucideIcons[name] as React.ComponentType<any>;
  if (!LucideIcon) return null;
  return (
    <LucideIcon
      size={size}
      color={color ?? theme.textPrimary}
      strokeWidth={strokeWidth}
    />
  );
}
