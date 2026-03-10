// src/components/OriginalityBadge.tsx
// Replaces the ✨ emoji in the Originality Check screen with Sparkles icon.
// Usage: <OriginalityBadge result="original" />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, AlertTriangle, Minus } from 'lucide-react-native';

export type OriginalityResult = 'original' | 'derivative' | 'inconclusive';

const CONFIG = {
  original: {
    bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.30)',
    text: '#00ff88', label: 'ORIGINAL', Icon: Sparkles,
  },
  derivative: {
    bg: 'rgba(255,50,50,0.08)', border: 'rgba(255,50,50,0.30)',
    text: '#ff3232', label: 'DERIVATIVE', Icon: AlertTriangle,
  },
  inconclusive: {
    bg: 'rgba(255,179,71,0.08)', border: 'rgba(255,179,71,0.30)',
    text: '#ffb347', label: 'INCONCLUSIVE', Icon: Minus,
  },
} as const;

const DIMS = {
  small:  { iconSize: 9,  fontSize: 7,  paddingH: 6,  paddingV: 3, gap: 4 },
  medium: { iconSize: 11, fontSize: 9,  paddingH: 9,  paddingV: 5, gap: 5 },
  large:  { iconSize: 13, fontSize: 10, paddingH: 12, paddingV: 6, gap: 6 },
} as const;

interface OriginalityBadgeProps {
  result?: OriginalityResult;
  label?: string;
  size?: keyof typeof DIMS;
}

export const OriginalityBadge: React.FC<OriginalityBadgeProps> = ({
  result = 'original',
  label,
  size = 'medium',
}) => {
  const cfg  = CONFIG[result];
  const d    = DIMS[size];
  const Icon = cfg.Icon as React.ComponentType<{ size: number; color: string; strokeWidth: number }>;

  return (
    <View style={[styles.badge, {
      backgroundColor: cfg.bg,
      borderColor: cfg.border,
      paddingHorizontal: d.paddingH,
      paddingVertical: d.paddingV,
      gap: d.gap,
    }]}>
      <Icon size={d.iconSize} color={cfg.text} strokeWidth={2} />
      <Text style={[styles.label, { color: cfg.text, fontSize: d.fontSize }]}>
        {label ?? cfg.label}
      </Text>
    </View>
  );
};

// Full card for the OriginalityCheck screen
interface OriginalityCheckCardProps {
  score: number;
  result: OriginalityResult;
  similarNarratives?: number;
  checkDate?: string;
}

export const OriginalityCheckCard: React.FC<OriginalityCheckCardProps> = ({
  score,
  result,
  similarNarratives = 0,
  checkDate,
}) => {
  const cfg = CONFIG[result];

  return (
    <View style={card.container}>
      <View style={card.header}>
        <Text style={card.title}>ORIGINALITY CHECK</Text>
        <OriginalityBadge result={result} size="small" />
      </View>

      <View style={card.scoreRow}>
        <Text style={[card.scoreNum, { color: cfg.text }]}>{score}</Text>
        <Text style={card.scoreDenom}>/ 100</Text>
      </View>

      <View style={card.barTrack}>
        <View style={[card.barFill, { width: `${score}%` as any, backgroundColor: cfg.text }]} />
      </View>

      <View style={card.meta}>
        {similarNarratives > 0 && (
          <View style={card.metaRow}>
            <AlertTriangle size={9} color="#ffb347" strokeWidth={2} />
            <Text style={card.metaText}>{similarNarratives} similar narratives found</Text>
          </View>
        )}
        {checkDate && <Text style={card.dateText}>Checked {checkDate}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'SpaceMono',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: '#1a0f0a',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.12)',
    borderRadius: 8,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#7a4a30',
    letterSpacing: 1.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreNum: {
    fontFamily: 'Syne_700Bold',
    fontSize: 36,
    lineHeight: 38,
  },
  scoreDenom: {
    fontFamily: 'IBMPlexMono',
    fontSize: 13,
    color: '#7a4a30',
  },
  barTrack: {
    height: 2,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  barFill: {
    height: 2,
    borderRadius: 1,
  },
  meta: { gap: 6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: 'IBMPlexMono',
    fontSize: 9,
    color: '#ffb347',
    letterSpacing: 0.3,
  },
  dateText: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: '#7a4a30',
    letterSpacing: 0.5,
  },
});
