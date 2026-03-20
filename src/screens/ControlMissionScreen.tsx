import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, fontSize } from '../theme/tokens';
import { EcosystemGrid } from '../components/EcosystemGrid';

// ─── Quick Action Button ───────────────────────────────────────────────────────

interface QuickActionProps {
  label: string;
  subtitle: string;
  onPress: () => void;
}

const QuickActionButton: React.FC<QuickActionProps> = ({ label, subtitle, onPress }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.quickActionLabel, { color: theme.orange }]}>{label}</Text>
      <Text style={[styles.quickActionSub, { color: theme.textSecondary }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

// ─── SideShift Placeholder ────────────────────────────────────────────────────

const SideShiftPlaceholder: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.placeholderCard, { backgroundColor: theme.cardBg, borderColor: theme.borderMedium }]}>
      <Text style={[styles.placeholderTitle, { color: theme.textPrimary }]}>⚡ Swap Any Token</Text>
      <Text style={[styles.placeholderSub, { color: theme.textSecondary }]}>
        200+ assets · Non-custodial · No KYC
      </Text>
      <View style={[styles.placeholderBadge, { backgroundColor: 'rgba(255,107,53,0.10)', borderColor: theme.borderMedium }]}>
        <Text style={[styles.placeholderBadgeText, { color: theme.orange }]}>SideShift widget — Phase H6</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ControlMissionScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleGetSOL = () => {
    // Phase H6 — open SideShift pre-filled TO=SOL
    console.log('[ControlMission] Get SOL tapped');
  };

  const handleGetSKR = () => {
    // Phase H6 — open SideShift pre-filled TO=SKR
    console.log('[ControlMission] Get SKR tapped');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bgBase }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      bounces={false}
    >

      {/* ── Section: Quick Actions ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>QUICK ACTIONS</Text>
        <View style={styles.quickActionsRow}>
          <QuickActionButton
            label="Get SOL"
            subtitle="Swap any token → SOL"
            onPress={handleGetSOL}
          />
          <QuickActionButton
            label="Get SKR"
            subtitle="Swap any token → SKR"
            onPress={handleGetSKR}
          />
        </View>
      </View>

      {/* ── Section: Swap ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SWAP</Text>
        <SideShiftPlaceholder />
      </View>

      {/* ── Section: Solana Ecosystem ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SOLANA ECOSYSTEM</Text>
        <EcosystemGrid />
      </View>

    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize:      fontSize.xs,
    fontWeight:    '700',
    letterSpacing: 1.2,
    marginBottom:  spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap:           spacing.md,
  },
  quickAction: {
    flex:          1,
    borderRadius:  radius.lg,
    borderWidth:   1,
    padding:       spacing.lg,
    alignItems:    'center',
  },
  quickActionLabel: {
    fontSize:     16,
    fontWeight:   '700',
    marginBottom: 4,
  },
  quickActionSub: {
    fontSize:  11,
    textAlign: 'center',
  },
  placeholderCard: {
    borderRadius: radius.lg,
    borderWidth:  1,
    padding:      spacing.xl,
    alignItems:   'center',
    gap:          spacing.md,
  },
  placeholderTitle: {
    fontSize:   17,
    fontWeight: '700',
  },
  placeholderSub: {
    fontSize:  13,
    textAlign: 'center',
  },
  placeholderBadge: {
    borderRadius:      radius.full,
    borderWidth:       1,
    paddingVertical:   6,
    paddingHorizontal: spacing.lg,
    marginTop:         spacing.sm,
  },
  placeholderBadgeText: {
    fontSize:   11,
    fontWeight: '600',
  },
});

export default ControlMissionScreen;
