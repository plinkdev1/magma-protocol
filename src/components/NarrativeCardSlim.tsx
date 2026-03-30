import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  title:         string;
  status?:       string;
  solBacked?:    number;
  daysRemaining?: number;
  onPress:       () => void;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    '#22C55E',
  PENDING:   '#F59E0B',
  TRUE:      '#22C55E',
  FALSE:     '#EF4444',
  GRADUATED: '#3B82F6',
};

const NarrativeCardSlim: React.FC<Props> = ({
  title, status = 'ACTIVE', solBacked = 0, daysRemaining, onPress,
}) => {
  const { theme } = useTheme();
  const statusColor = STATUS_COLORS[status.toUpperCase()] ?? '#9B95A8';
  const statusLabel = status.toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.meta, { color: theme.textTertiary }]}>
          {solBacked.toFixed(2)} SOL backed
          {daysRemaining != null && daysRemaining > 0 ? `  ·  ${daysRemaining}d left` : ''}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
        <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical:   12,
    paddingHorizontal: 16,
    borderRadius:   12,
    borderWidth:    1,
    marginHorizontal: 16,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize:   14,
    fontWeight: '600',
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
  },
  badge: {
    borderRadius:      9999,
    borderWidth:       1,
    paddingVertical:   3,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize:   11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

export default NarrativeCardSlim;
