// src/components/TierBadge.tsx
// Score-driven tier badge — replaces all mock tier emoji/text in ProfileScreen.
// Usage: <TierBadge score={userScore} size="large" />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MagmaLogo } from './MagmaLogo';

const TIERS = {
  OBSERVER:  { color: '#7a4a30', label: 'OBSERVER',  minScore: 0  },
  SIGNAL:    { color: '#ffb347', label: 'SIGNAL',    minScore: 25 },
  ARCHITECT: { color: '#ff6b35', label: 'ARCHITECT', minScore: 50 },
  ORACLE:    { color: '#00c4ff', label: 'ORACLE',    minScore: 75 },
  LEGEND:    { color: '#00ff88', label: 'LEGEND',    minScore: 90 },
} as const;

type TierKey = keyof typeof TIERS;

export const getTierFromScore = (score: number): TierKey => {
  if (score >= 90) return 'LEGEND';
  if (score >= 75) return 'ORACLE';
  if (score >= 50) return 'ARCHITECT';
  if (score >= 25) return 'SIGNAL';
  return 'OBSERVER';
};

const SIZE_MAP = {
  small:  { paddingH: 6,  paddingV: 3, fontSize: 7,  logoSize: 10, gap: 3, radius: 3 },
  medium: { paddingH: 10, paddingV: 5, fontSize: 9,  logoSize: 14, gap: 4, radius: 4 },
  large:  { paddingH: 14, paddingV: 8, fontSize: 11, logoSize: 18, gap: 6, radius: 5 },
};

interface TierBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showScore?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  score,
  size = 'medium',
  showScore = false,
}) => {
  const tierKey = getTierFromScore(score);
  const tier    = TIERS[tierKey];
  const s       = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor:     tier.color + '40',
          backgroundColor: tier.color + '0c',
          paddingHorizontal: s.paddingH,
          paddingVertical:   s.paddingV,
          borderRadius:      s.radius,
          gap:               s.gap,
        },
      ]}
    >
      <MagmaLogo size={s.logoSize} color={tier.color} accentColor={tier.color + 'cc'} />
      <Text style={[styles.label, { color: tier.color, fontSize: s.fontSize }]}>
        {tier.label}
      </Text>
      {showScore && (
        <Text style={[styles.score, { color: tier.color + '88', fontSize: s.fontSize - 1 }]}>
          {score}
        </Text>
      )}
    </View>
  );
};

// Compact progress bar showing score within current tier band
export const TierProgressBar: React.FC<{ score: number }> = ({ score }) => {
  const tierKey = getTierFromScore(score);
  const tier    = TIERS[tierKey];
  const keys    = Object.keys(TIERS) as TierKey[];
  const idx     = keys.indexOf(tierKey);
  const nextTier = idx < keys.length - 1 ? TIERS[keys[idx + 1]] : null;
  const bandMin  = tier.minScore;
  const bandMax  = nextTier ? nextTier.minScore : 100;
  const pct      = Math.min(((score - bandMin) / (bandMax - bandMin)) * 100, 100);

  return (
    <View style={pb.container}>
      <View style={pb.labels}>
        <Text style={[pb.tierLabel, { color: tier.color }]}>{tier.label}</Text>
        {nextTier && (
          <Text style={[pb.nextLabel, { color: nextTier.color }]}>{nextTier.label}</Text>
        )}
      </View>
      <View style={pb.track}>
        <View
          style={[
            pb.fill,
            { width: `${pct}%` as any, backgroundColor: tier.color },
          ]}
        />
      </View>
      <Text style={pb.scoreText}>{score} / {bandMax}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'SpaceMono',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  score: {
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
  },
});

const pb = StyleSheet.create({
  container: { gap: 5 },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  nextLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.2,
    opacity: 0.6,
  },
  track: {
    height: 2,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: 2,
    borderRadius: 1,
  },
  scoreText: {
    fontFamily: 'IBMPlexMono',
    fontSize: 9,
    color: '#7a4a30',
    textAlign: 'right',
  },
});
