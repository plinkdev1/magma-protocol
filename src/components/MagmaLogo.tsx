// src/components/MagmaLogo.tsx
// Reusable volcano / MAGMA brand icon — replaces ALL 🌋 emoji instances.
// Requires: react-native-svg (bundled with Expo SDK 55).

import React from 'react';
import Svg, {
  Polygon,
  Ellipse,
  Circle,
  Path,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface MagmaLogoProps {
  size?: number;
  color?: string;
  accentColor?: string;
  /** Adds a soft radial glow — use on dark backgrounds only */
  glow?: boolean;
}

export const MagmaLogo: React.FC<MagmaLogoProps> = ({
  size = 24,
  color = '#ff6b35',
  accentColor = '#ffb347',
  glow = false,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.38;
  const sw = size * 0.055;

  const craterRx = s * 0.28;
  const craterRy = s * 0.13;

  const dripPath = [
    `M ${cx} ${cy - s + craterRy * 0.5}`,
    `Q ${cx + s * 0.06} ${cy - s + size * 0.14} ${cx} ${cy - s + size * 0.2}`,
  ].join(' ');

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {glow && (
          <RadialGradient id={`glow_${size}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={color} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={color} stopOpacity={0}   />
          </RadialGradient>
        )}
      </Defs>

      {glow && (
        <Circle cx={cx} cy={cy} r={size * 0.48} fill={`url(#glow_${size})`} />
      )}

      {/* Volcano body */}
      <Polygon
        points={`${cx},${cy - s} ${cx - s * 0.8},${cy + s * 0.62} ${cx + s * 0.8},${cy + s * 0.62}`}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />

      {/* Faint inner lava glow */}
      <Path
        d={`M ${cx - s * 0.25} ${cy + s * 0.08} L ${cx + s * 0.25} ${cy + s * 0.08}`}
        stroke={accentColor}
        strokeWidth={sw * 0.6}
        strokeLinecap="round"
        opacity={0.22}
      />

      {/* Crater rim */}
      <Ellipse
        cx={cx} cy={cy - s}
        rx={craterRx} ry={craterRy}
        fill={accentColor}
        opacity={0.88}
      />

      {/* Crater inner highlight */}
      <Ellipse
        cx={cx} cy={cy - s}
        rx={craterRx * 0.5} ry={craterRy * 0.5}
        fill="none"
        stroke="#fff5ee"
        strokeWidth={sw * 0.35}
        opacity={0.28}
      />

      {/* Lava drip */}
      <Path
        d={dripPath}
        fill="none"
        stroke={accentColor}
        strokeWidth={sw * 0.85}
        strokeLinecap="round"
      />

      {/* Lava drop */}
      <Circle
        cx={cx}
        cy={cy - s + size * 0.215}
        r={size * 0.042}
        fill={accentColor}
      />
    </Svg>
  );
};
