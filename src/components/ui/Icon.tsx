import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

// MAGMA Custom Icon System
// Style: Phantom wallet aesthetic -- 2px stroke, rounded caps/joins, minimal fill
// Orange #FF6B35 on active, muted on inactive
// All icons are 24x24 viewBox, stroke-based, no fill

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const STROKE_DEFAULTS = {
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
};

// ── Tab Bar Icons ─────────────────────────────────────────────────────────────

export const Home = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M9 21V12h6v9" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Rocket = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const LineChart = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 3v18h18" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M18 9l-5 5-4-4-3 3" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Wallet = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M16 12a1 1 0 100 2 1 1 0 000-2z" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M2 10h20" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const User = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Circle cx="12" cy="7" r="4" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

// ── Action Icons ──────────────────────────────────────────────────────────────

export const ArrowLeft = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 12H5M12 5l-7 7 7 7" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const ChevronRight = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const ChevronDown = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 9l6 6 6-6" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const ChevronUp = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M18 15l-6-6-6 6" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Copy = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="9" y="9" width="13" height="13" rx="2" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const ExternalLink = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M15 3h6v6M10 14L21 3" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Mic = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="9" y="2" width="6" height="11" rx="3" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M19 10a7 7 0 01-14 0M12 19v3M8 22h8" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Globe = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

// ── Status / Indicator Icons ──────────────────────────────────────────────────

export const TrendingUp = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Polyline points="17 6 23 6 23 12" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const TrendingDown = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Polyline points="17 18 23 18 23 12" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Sparkles = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const AlertTriangle = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Minus = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1="5" y1="12" x2="19" y2="12" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const CheckCircle = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M22 4L12 14.01l-3-3" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const XCircle = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Flame = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7 7 7 0 01-7-7c0-1.5.5-3 1.5-4" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Zap = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

export const Unlock = ({ size = 24, color, strokeWidth = 2 }: IconProps) => {
  const { theme } = useTheme();
  const c = color ?? theme.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
      <Path d="M7 11V7a5 5 0 019.9-1" stroke={c} strokeWidth={strokeWidth} {...STROKE_DEFAULTS} />
    </Svg>
  );
};

// ── Generic Icon component (for backward compat with ui/Icon usage) ────────────
export type IconName =
  | 'Home' | 'Rocket' | 'LineChart' | 'Wallet' | 'User'
  | 'ArrowLeft' | 'ChevronRight' | 'ChevronDown' | 'ChevronUp'
  | 'Copy' | 'ExternalLink' | 'Mic' | 'Globe'
  | 'TrendingUp' | 'TrendingDown' | 'Sparkles' | 'AlertTriangle' | 'Minus'
  | 'CheckCircle' | 'XCircle' | 'Flame' | 'Zap' | 'Unlock';

const ICON_MAP: Record<IconName, React.ComponentType<IconProps>> = {
  Home, Rocket, LineChart, Wallet, User,
  ArrowLeft, ChevronRight, ChevronDown, ChevronUp,
  Copy, ExternalLink, Mic, Globe,
  TrendingUp, TrendingDown, Sparkles, AlertTriangle, Minus,
  CheckCircle, XCircle, Flame, Zap, Unlock,
};

interface GenericIconProps extends IconProps {
  name: IconName;
}

export function Icon({ name, size = 24, color, strokeWidth = 2 }: GenericIconProps) {
  const Component = ICON_MAP[name];
  if (!Component) return null;
  return <Component size={size} color={color} strokeWidth={strokeWidth} />;
}
