// src/components/FilterPill.tsx
// Replaces emoji-labelled filter pills in FeedScreen.
// Usage: <FilterPill label="HOT" icon={<Flame size={10} color={active ? '#ff6b35' : '#7a4a30'} strokeWidth={2} />} active onPress={...} />

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface FilterPillProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const FilterPill: React.FC<FilterPillProps> = ({
  label,
  icon,
  active = false,
  onPress,
  style,
}) => (
  <TouchableOpacity
    style={[styles.pill, active ? styles.active : styles.inactive, style]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon}
    <Text style={[styles.label, { color: active ? '#ff6b35' : '#7a4a30' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  active: {
    borderColor: 'rgba(255,107,53,0.5)',
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  inactive: {
    borderColor: 'rgba(122,74,48,0.25)',
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});
