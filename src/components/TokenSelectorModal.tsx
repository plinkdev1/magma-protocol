import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, fontSize } from '../theme/tokens';

// ─── Yield route data (mirrors MAGMA_YIELD_ROUTER_SPEC.md) ───────────────────

export type BackingToken =
  | 'SOL' | 'USDC' | 'SKR' | 'BONK' | 'RAY' | 'JUP'
  | 'WIF' | 'JTO' | 'PYTH' | 'KMNO' | 'MET' | 'DRIFT'
  | 'VIRTUAL' | 'PENGU' | 'PUMP' | 'CAKE';

interface TokenInfo {
  symbol:   BackingToken;
  apy:      number | null;   // null = no yield
  protocol: string;
  risk:     'LOW' | 'MED' | 'HIGH';
  isLP:     boolean;
  tier:     1 | 2 | 3 | 4;
}

const TOKENS: TokenInfo[] = [
  // Tier 1 — Lending
  { symbol: 'SOL',     apy: 7.2,  protocol: 'Kamino Lend',   risk: 'LOW',  isLP: false, tier: 1 },
  { symbol: 'USDC',    apy: 5.8,  protocol: 'Kamino Lend',   risk: 'LOW',  isLP: false, tier: 1 },
  { symbol: 'BONK',    apy: 3.2,  protocol: 'Kamino Lend',   risk: 'LOW',  isLP: false, tier: 1 },
  { symbol: 'RAY',     apy: 5.1,  protocol: 'Kamino Lend',   risk: 'LOW',  isLP: false, tier: 1 },
  { symbol: 'JUP',     apy: 4.8,  protocol: 'Jupiter Lend',  risk: 'LOW',  isLP: false, tier: 1 },
  { symbol: 'WIF',     apy: 8.4,  protocol: 'Kamino Lend',   risk: 'MED',  isLP: false, tier: 1 },
  { symbol: 'JTO',     apy: 6.2,  protocol: 'Kamino Lend',   risk: 'LOW',  isLP: false, tier: 1 },
  { symbol: 'PYTH',    apy: 4.1,  protocol: 'Jupiter Lend',  risk: 'MED',  isLP: false, tier: 1 },
  { symbol: 'DRIFT',   apy: 7.8,  protocol: 'Save Finance',  risk: 'MED',  isLP: false, tier: 1 },
  // Tier 2 — LP
  { symbol: 'KMNO',    apy: 15.0, protocol: 'Meteora DLMM',  risk: 'MED',  isLP: true,  tier: 2 },
  { symbol: 'MET',     apy: 18.0, protocol: 'Meteora DLMM',  risk: 'MED',  isLP: true,  tier: 2 },
  { symbol: 'VIRTUAL', apy: 22.0, protocol: 'Raydium CLMM',  risk: 'HIGH', isLP: true,  tier: 2 },
  { symbol: 'PENGU',   apy: 19.0, protocol: 'Raydium CLMM',  risk: 'HIGH', isLP: true,  tier: 2 },
  // Tier 3 — Staking
  { symbol: 'SKR',     apy: 10.0, protocol: 'SKR Guardian',  risk: 'LOW',  isLP: false, tier: 3 },
  // Tier 4 — No yield
  { symbol: 'PUMP',    apy: null, protocol: 'No yield market', risk: 'HIGH', isLP: false, tier: 4 },
  { symbol: 'CAKE',    apy: null, protocol: 'No yield market', risk: 'HIGH', isLP: false, tier: 4 },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface TokenSelectorModalProps {
  visible:   boolean;
  selected:  BackingToken;
  onSelect:  (token: BackingToken) => void;
  onClose:   () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TokenSelectorModal: React.FC<TokenSelectorModalProps> = ({
  visible,
  selected,
  onSelect,
  onClose,
}) => {
  const { theme } = useTheme();

  const getRiskColor = (risk: 'LOW' | 'MED' | 'HIGH') => {
    if (risk === 'LOW')  return theme.green;
    if (risk === 'MED')  return theme.amber;
    return theme.red;
  };

  const getRiskBg = (risk: 'LOW' | 'MED' | 'HIGH') => {
    if (risk === 'LOW')  return 'rgba(34,197,94,0.10)';
    if (risk === 'MED')  return 'rgba(245,158,11,0.10)';
    return 'rgba(239,68,68,0.10)';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        onPress={onClose}
        activeOpacity={1}
      >
        <View style={[styles.sheet, { backgroundColor: theme.bgElevated, borderColor: theme.cardBorder }]}>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Select Backing Token</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeBtn, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* LP warning */}
          <View style={[styles.lpWarning, { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.20)' }]}>
            <Text style={[styles.lpWarningText, { color: theme.amber }]}>
              ⚠ LP tokens carry impermanent loss risk
            </Text>
          </View>

          {/* Token list */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {TOKENS.map(token => {
              const isSelected = token.symbol === selected;
              const isNoYield  = token.tier === 4;

              return (
                <TouchableOpacity
                  key={token.symbol}
                  style={[
                    styles.tokenRow,
                    { borderBottomColor: theme.borderSubtle },
                    isSelected && { backgroundColor: 'rgba(255,107,53,0.06)' },
                  ]}
                  onPress={() => { onSelect(token.symbol); onClose(); }}
                  activeOpacity={0.7}
                >
                  {/* Left — symbol + protocol */}
                  <View style={styles.tokenLeft}>
                    <View style={styles.tokenSymbolRow}>
                      <Text style={[styles.tokenSymbol, { color: isSelected ? theme.orange : theme.textPrimary }]}>
                        {token.symbol}
                      </Text>
                      {token.isLP && (
                        <Text style={[styles.lpTag, { color: theme.amber }]}>LP</Text>
                      )}
                      {isSelected && (
                        <Text style={[styles.selectedCheck, { color: theme.orange }]}>✓</Text>
                      )}
                    </View>
                    <Text style={[styles.tokenProtocol, { color: theme.textTertiary }]}>
                      {token.protocol}
                    </Text>
                  </View>

                  {/* Right — APY + risk */}
                  <View style={styles.tokenRight}>
                    <Text style={[
                      styles.tokenApy,
                      { color: isNoYield ? theme.textTertiary : theme.green },
                    ]}>
                      {token.apy !== null ? `~${token.apy}% APY` : '0% APY'}
                    </Text>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskBg(token.risk), borderColor: getRiskColor(token.risk) + '40' }]}>
                      <Text style={[styles.riskText, { color: getRiskColor(token.risk) }]}>
                        {token.risk}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent:  'flex-end',
  },
  sheet: {
    borderTopLeftRadius:  radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth:          1,
    maxHeight:            '75%',
    paddingTop:           spacing.xl,
  },
  sheetHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: spacing.xl,
    marginBottom:      spacing.md,
  },
  sheetTitle: {
    fontSize:   17,
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: 18,
    padding:  4,
  },
  lpWarning: {
    marginHorizontal: spacing.xl,
    marginBottom:     spacing.md,
    borderRadius:     radius.md,
    borderWidth:      1,
    paddingVertical:  8,
    paddingHorizontal: spacing.md,
  },
  lpWarningText: {
    fontSize:  12,
    fontWeight: '600',
  },
  tokenRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingVertical:   spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
  },
  tokenLeft: {
    flex: 1,
  },
  tokenSymbolRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
    marginBottom:  3,
  },
  tokenSymbol: {
    fontSize:   16,
    fontWeight: '700',
  },
  lpTag: {
    fontSize:          10,
    fontWeight:        '700',
    borderWidth:       1,
    borderColor:       'rgba(245,158,11,0.40)',
    borderRadius:      3,
    paddingHorizontal: 4,
    paddingVertical:   1,
  },
  selectedCheck: {
    fontSize:   14,
    fontWeight: '700',
  },
  tokenProtocol: {
    fontSize: 12,
  },
  tokenRight: {
    alignItems: 'flex-end',
    gap:        spacing.sm,
  },
  tokenApy: {
    fontSize:   13,
    fontWeight: '600',
  },
  riskBadge: {
    borderRadius:      radius.full,
    borderWidth:       1,
    paddingVertical:   2,
    paddingHorizontal: 8,
  },
  riskText: {
    fontSize:   10,
    fontWeight: '700',
  },
});

export default TokenSelectorModal;
