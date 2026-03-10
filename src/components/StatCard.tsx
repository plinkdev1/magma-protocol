// src/components/StatCard.tsx
// Icon-labelled stat tiles for PortfolioScreen and ProfileScreen.
// Replaces all emoji labels next to numbers/stats.
// Usage: <StatCard icon={<BarChart2 size={14} color="#ff6b35" strokeWidth={2} />} label="P&L" value="+$2,340" delta="+12.4%" positive />

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  delta,
  positive,
  size = 'md',
  style,
}) => {
  const isSmall = size === 'sm';

  return (
    <View style={[styles.card, isSmall && styles.cardSm, style]}>
      {/* Label row */}
      <View style={styles.labelRow}>
        {icon}
        <Text style={styles.label}>{label.toUpperCase()}</Text>
      </View>

      {/* Value */}
      <Text style={[styles.value, isSmall && styles.valueSm]}>{value}</Text>

      {/* Delta */}
      {delta !== undefined && (
        <View style={styles.deltaRow}>
          {positive !== undefined && (
            positive
              ? <TrendingUp   size={9} color="#00ff88" strokeWidth={2.5} />
              : <TrendingDown size={9} color="#ff3232" strokeWidth={2.5} />
          )}
          <Text style={[styles.delta, { color: positive ? '#00ff88' : '#ff3232' }]}>
            {delta}
          </Text>
        </View>
      )}
    </View>
  );
};

// Compact horizontal row version (for ProfileScreen stats bar)
interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export const StatRow: React.FC<StatRowProps> = ({ icon, label, value }) => (
  <View style={row.container}>
    <View style={row.left}>
      {icon}
      <Text style={row.label}>{label}</Text>
    </View>
    <Text style={row.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a0f0a',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.1)',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    flex: 1,
  },
  cardSm: {
    padding: 8,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 7,
    color: '#7a4a30',
    letterSpacing: 1.2,
  },
  value: {
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
    color: '#f0d8c0',
    lineHeight: 20,
  },
  valueSm: {
    fontSize: 14,
    lineHeight: 16,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  delta: {
    fontFamily: 'IBMPlexMono',
    fontSize: 9,
    letterSpacing: 0.3,
  },
});

const row = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122,74,48,0.1)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  label: {
    fontFamily: 'IBMPlexMono',
    fontSize: 11,
    color: '#7a4a30',
    letterSpacing: 0.3,
  },
  value: {
    fontFamily: 'IBMPlexMono',
    fontSize: 11,
    color: '#f0d8c0',
    letterSpacing: 0.3,
  },
});
