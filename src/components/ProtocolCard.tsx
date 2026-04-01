// src/components/ProtocolCard.tsx
// Protocol cards for DeFiScreen — logo via logo.dev CDN (no file downloads).
// Usage: <ProtocolCard protocol="kamino" name="Kamino Finance" apy="14.2%" tvl="$840M" />

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, TrendingDown, ChevronRight, Globe } from './ui/Icon';

// ─── Logo registry ────────────────────────────────────────────────────────────

const TOKEN = 'pk_XbfwnIzARnaj2H8Lvi-QpQ';

export const PROTOCOL_LOGOS = {
  meteora: `https://img.logo.dev/meteora.ag?token=${TOKEN}`,
  kamino:  `https://img.logo.dev/kamino.finance?token=${TOKEN}`,
  save:    `https://img.logo.dev/save.finance?token=${TOKEN}`,
  jupiter: `https://img.logo.dev/jup.ag?token=${TOKEN}`,
  pyth:    `https://img.logo.dev/pyth.network?token=${TOKEN}`,
} as const;

export type ProtocolKey = keyof typeof PROTOCOL_LOGOS;

// ─── ProtocolLogo ─────────────────────────────────────────────────────────────

interface ProtocolLogoProps {
  protocol: ProtocolKey;
  size?: number;
}

export const ProtocolLogo: React.FC<ProtocolLogoProps> = ({
  protocol,
  size = 24,
}) => {
  const [errored, setErrored] = useState(false);
  const radius = size * 0.17;

  if (errored) {
    return (
      <View style={[logo.fallback, { width: size, height: size, borderRadius: radius }]}>
        <Globe size={size * 0.55} color="#7a4a30" strokeWidth={1.5} />
      </View>
    );
  }

  return (
    <View style={[logo.wrap, { width: size, height: size, borderRadius: radius }]}>
      <Image
        source={{ uri: PROTOCOL_LOGOS[protocol] }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="contain"
        onError={() => setErrored(true)}
      />
    </View>
  );
};

const logo = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,53,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.15)',
  },
});

// ─── ProtocolCard ─────────────────────────────────────────────────────────────

interface ProtocolCardProps {
  protocol: ProtocolKey;
  name: string;
  apy: string;
  apyDelta?: number;   // positive = up, negative = down
  tvl?: string;
  strategy?: string;
  onPress?: () => void;
}

export const ProtocolCard: React.FC<ProtocolCardProps> = ({
  protocol,
  name,
  apy,
  apyDelta,
  tvl,
  strategy,
  onPress,
}) => {
  const isUp = apyDelta !== undefined && apyDelta >= 0;

  return (
    <TouchableOpacity
      style={card.container}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {/* Header */}
      <View style={card.header}>
        <View style={card.logoRow}>
          <ProtocolLogo protocol={protocol} size={24} />
          <Text style={card.name}>{name}</Text>
        </View>
        <ChevronRight size={13} color="#7a4a30" strokeWidth={2} />
      </View>

      {/* Stats */}
      <View style={card.stats}>
        <View>
          <View style={card.apyRow}>
            {apyDelta !== undefined && (
              isUp
                ? <TrendingUp   size={11} color="#00ff88" strokeWidth={2.5} />
                : <TrendingDown size={11} color="#ff3232" strokeWidth={2.5} />
            )}
            <Text style={card.apyValue}>{apy}</Text>
          </View>
          <Text style={card.statLabel}>APY</Text>
        </View>

        {tvl && (
          <View style={card.tvlBlock}>
            <Text style={card.tvlValue}>{tvl}</Text>
            <Text style={card.statLabel}>TVL</Text>
          </View>
        )}
      </View>

      {/* Strategy tag */}
      {strategy && (
        <View style={card.strategyTag}>
          <Text style={card.strategyText}>{strategy.toUpperCase()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const card = StyleSheet.create({
  container: {
    backgroundColor: '#130b02',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.12)',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: 'IBMPlexMono',
    fontSize: 11,
    color: '#f0d8c0',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
  },
  apyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  apyValue: {
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
    color: '#00ff88',
    lineHeight: 20,
  },
  tvlBlock: {
    alignItems: 'flex-end',
    marginLeft: 'auto',
  },
  tvlValue: {
    fontFamily: 'IBMPlexMono',
    fontSize: 13,
    color: '#f0d8c0',
    opacity: 0.75,
  },
  statLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 7,
    color: '#7a4a30',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  strategyTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,107,53,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.18)',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  strategyText: {
    fontFamily: 'SpaceMono',
    fontSize: 7,
    color: '#ff6b35',
    letterSpacing: 1.2,
  },
});
