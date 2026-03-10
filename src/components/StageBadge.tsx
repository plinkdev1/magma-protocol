// src/components/StageBadge.tsx
// Narrative stage pill badges — replaces all emoji stage indicators in NarrativeCard.
// Usage: <StageBadge stage="SEEDING" />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  CheckCircle,
  Unlock,
  Flame,
  Zap,
  XCircle,
} from 'lucide-react-native';

export type StageKey =
  | 'GRADUATED'
  | 'BACKING_OPEN'
  | 'SEEDING'
  | 'ACTIVE'
  | 'SLASHED';

type StageConfig = {
  bg: string;
  border: string;
  text: string;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
};

const STAGE_CONFIG: Record<StageKey, StageConfig> = {
  GRADUATED: {
    bg:     'rgba(0,255,136,0.07)',
    border: 'rgba(0,255,136,0.28)',
    text:   '#00ff88',
    label:  'GRADUATED',
    Icon:   CheckCircle,
  },
  BACKING_OPEN: {
    bg:     'rgba(255,179,71,0.07)',
    border: 'rgba(255,179,71,0.28)',
    text:   '#ffb347',
    label:  'BACKING OPEN',
    Icon:   Unlock,
  },
  SEEDING: {
    bg:     'rgba(255,107,53,0.07)',
    border: 'rgba(255,107,53,0.28)',
    text:   '#ff6b35',
    label:  'SEEDING',
    Icon:   Flame,
  },
  ACTIVE: {
    bg:     'rgba(0,196,255,0.07)',
    border: 'rgba(0,196,255,0.28)',
    text:   '#00c4ff',
    label:  'ACTIVE',
    Icon:   Zap,
  },
  SLASHED: {
    bg:     'rgba(255,50,50,0.07)',
    border: 'rgba(255,50,50,0.28)',
    text:   '#ff3232',
    label:  'SLASHED',
    Icon:   XCircle,
  },
};

interface StageBadgeProps {
  stage: StageKey;
  size?: 'small' | 'medium';
}

export const StageBadge: React.FC<StageBadgeProps> = ({
  stage,
  size = 'small',
}) => {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG['ACTIVE'];
  const { Icon } = config;
  const iconSize = size === 'small' ? 9  : 11;
  const fontSize = size === 'small' ? 8  : 10;
  const paddingH = size === 'small' ? 6  : 8;
  const paddingV = size === 'small' ? 3  : 4;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor:  config.bg,
          borderColor:      config.border,
          paddingHorizontal: paddingH,
          paddingVertical:   paddingV,
        },
      ]}
    >
      <Icon size={iconSize} color={config.text} strokeWidth={2.5} />
      <Text style={[styles.label, { color: config.text, fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
    fontWeight: '700',
  },
});
