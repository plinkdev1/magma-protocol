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
import { useWallet } from '../context/WalletContext';
import { radius, spacing, fontSize } from '../theme/tokens';
import { EcosystemGrid } from '../components/EcosystemGrid';
import SideShiftWidget from '../components/SideShiftWidget';

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ControlMissionScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { account } = useWallet();
  const [swapTo, setSwapTo] = React.useState<string>('SOL');
  const walletAddress = account?.publicKey?.toString() ?? '';

  const handleGetSOL = () => { setSwapTo('SOL'); };

  const handleGetSKR = () => { setSwapTo('SKR'); };

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
        <SideShiftWidget
          settleAddress={walletAddress}
          defaultFrom="USDC"
          defaultTo={swapTo}
        />
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
