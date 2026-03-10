// src/components/GlowEmptyState.tsx
// Animated empty-state illustration with glowing volcano — replaces 🔥 emoji
// in FeedScreen and PortfolioScreen empty states.
// Requires: react-native-svg, react-native Animated API (no extra deps).

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, {
  Polygon,
  Ellipse,
  Circle,
  Path,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';

interface GlowEmptyStateProps {
  title?: string;
  subtitle?: string;
  size?: number;
}

/** Large glowing volcano illustration for empty states */
export const GlowEmptyState: React.FC<GlowEmptyStateProps> = ({
  title = 'No narratives yet',
  subtitle = 'New signals will surface here as the market evolves.',
  size = 96,
}) => {
  const pulse = useRef(new Animated.Value(0.6)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 2200, useNativeDriver: true }),
      ])
    ).start();

    // Subtle vertical float
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: -4, duration: 2800, useNativeDriver: true }),
        Animated.timing(drift, { toValue:  0, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const s  = size * 0.36;
  const sw = size * 0.048;
  const craterRx = s * 0.28;
  const craterRy = s * 0.13;

  return (
    <View style={styles.container}>
      {/* Outer ambient glow ring (animated opacity) */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 0.8,
            opacity: pulse,
            transform: [{ translateY: drift }],
          },
        ]}
      />

      {/* Volcano SVG */}
      <Animated.View style={{ transform: [{ translateY: drift }] }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="innerGlow" cx="50%" cy="60%" r="45%">
              <Stop offset="0%"   stopColor="#ff6b35" stopOpacity={0.3} />
              <Stop offset="100%" stopColor="#ff6b35" stopOpacity={0}   />
            </RadialGradient>
            <RadialGradient id="craterGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#ffb347" stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#ff6b35" stopOpacity={0.6} />
            </RadialGradient>
            <LinearGradient id="lavaLine" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%"   stopColor="#ffb347" stopOpacity={0.6} />
              <Stop offset="100%" stopColor="#ff6b35" stopOpacity={0}   />
            </LinearGradient>
          </Defs>

          {/* Inner ambient fill */}
          <Circle cx={cx} cy={cy} r={size * 0.42} fill="url(#innerGlow)" />

          {/* Volcano body */}
          <Polygon
            points={`${cx},${cy - s} ${cx - s * 0.82},${cy + s * 0.64} ${cx + s * 0.82},${cy + s * 0.64}`}
            fill="none"
            stroke="#ff6b35"
            strokeWidth={sw}
            strokeLinejoin="round"
          />

          {/* Side lava streams (faint) */}
          <Path
            d={`M ${cx - s * 0.38} ${cy - s * 0.05} Q ${cx - s * 0.5} ${cy + s * 0.3} ${cx - s * 0.62} ${cy + s * 0.64}`}
            fill="none"
            stroke="url(#lavaLine)"
            strokeWidth={sw * 0.55}
            strokeLinecap="round"
            opacity={0.45}
          />
          <Path
            d={`M ${cx + s * 0.38} ${cy - s * 0.05} Q ${cx + s * 0.5} ${cy + s * 0.3} ${cx + s * 0.62} ${cy + s * 0.64}`}
            fill="none"
            stroke="url(#lavaLine)"
            strokeWidth={sw * 0.55}
            strokeLinecap="round"
            opacity={0.45}
          />

          {/* Base lava pool */}
          <Ellipse
            cx={cx}
            cy={cy + s * 0.64}
            rx={s * 0.55}
            ry={s * 0.1}
            fill="#ff6b35"
            opacity={0.18}
          />

          {/* Crater */}
          <Ellipse
            cx={cx} cy={cy - s}
            rx={craterRx} ry={craterRy}
            fill="url(#craterGlow)"
          />
          <Ellipse
            cx={cx} cy={cy - s}
            rx={craterRx * 0.48} ry={craterRy * 0.48}
            fill="none"
            stroke="#fff5ee"
            strokeWidth={sw * 0.3}
            opacity={0.35}
          />

          {/* Central lava drip */}
          <Path
            d={`M ${cx} ${cy - s + craterRy * 0.5} Q ${cx + s * 0.05} ${cy - s + size * 0.13} ${cx} ${cy - s + size * 0.22}`}
            fill="none"
            stroke="#ffb347"
            strokeWidth={sw * 0.8}
            strokeLinecap="round"
          />
          <Circle cx={cx} cy={cy - s + size * 0.235} r={size * 0.038} fill="#ffb347" />

          {/* Tiny ember particles */}
          <Circle cx={cx - s * 0.14} cy={cy - s - size * 0.08} r={size * 0.018} fill="#ffb347" opacity={0.7} />
          <Circle cx={cx + s * 0.2}  cy={cy - s - size * 0.12} r={size * 0.012} fill="#ff6b35" opacity={0.55} />
          <Circle cx={cx + s * 0.08} cy={cy - s - size * 0.18} r={size * 0.009} fill="#ffb347" opacity={0.4} />
        </Svg>
      </Animated.View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 20,
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.12)',
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 0,
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: 'Syne_700Bold',
    fontSize: 16,
    color: '#f0d8c0',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'IBMPlexMono',
    fontSize: 11,
    color: '#7a4a30',
    lineHeight: 17,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
