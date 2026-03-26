import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { radius, spacing, fontSize } from '../theme/tokens';
import { API_URL } from '../config';

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType = 'backing' | 'payout' | 'echo_pool' | 'creator' | 'challenge';

interface Transaction {
  id:           string;
  type:         TxType;
  amount_sol:   number;
  token_type?:  string;
  narrative_id?: string;
  narrative_title?: string;
  tx_signature?: string;
  created_at:   string;
  status?:      string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TX_LABELS: Record<TxType, string> = {
  backing:    '↑ Backing',
  payout:     '↓ Payout',
  echo_pool:  '🌊 Echo Pool',
  creator:    '✍️ Creator Earn',
  challenge:  '⚖️ Challenge Fee',
};

const TX_COLORS: Record<TxType, string> = {
  backing:    '#FF6B35',
  payout:     '#22C55E',
  echo_pool:  '#3B82F6',
  creator:    '#FFB347',
  challenge:  '#F59E0B',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncateSig(sig?: string): string {
  if (!sig) return '—';
  return sig.slice(0, 6) + '...' + sig.slice(-6);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TransactionHistoryScreen: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { account } = useWallet();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<TxType | 'all'>('all');

  const fetchHistory = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    setLoading(true);
    try {
      const walletAddr = account.publicKey?.toString() ?? '';

      // Fetch backed + payouts in parallel
      const [backedRes, payoutsRes] = await Promise.all([
        fetch(`${API_URL}/v1/users/${walletAddr}/backed`),
        fetch(`${API_URL}/v1/users/${walletAddr}/payouts`),
      ]);

      const backedData   = await backedRes.json();
      const payoutsData  = await payoutsRes.json();

      const txs: Transaction[] = [];

      // Map backings
      for (const b of backedData.backed ?? []) {
        txs.push({
          id:              b.backing_id,
          type:            'backing',
          amount_sol:      b.amount_sol,
          token_type:      b.token_type,
          narrative_id:    b.narrative?.id,
          narrative_title: b.narrative?.title,
          created_at:      b.backed_at,
        });
      }

      // Map payouts
      for (const p of payoutsData.payouts ?? []) {
        txs.push({
          id:           p.backing_id,
          type:         'payout',
          amount_sol:   p.payout_amount,
          narrative_id: p.narrative_id,
          tx_signature: p.payout_tx,
          created_at:   p.paid_at,
        });
      }

      // Sort by date descending
      txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(txs);
    } catch (err) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const FILTERS: Array<TxType | 'all'> = ['all', 'backing', 'payout', 'echo_pool', 'creator'];

  return (
    <View style={[styles.container, { backgroundColor: theme.bgBase, paddingTop: insets.top }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Transaction History</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterPill,
              { borderColor: theme.cardBorder, backgroundColor: theme.cardBg },
              filter === f && { backgroundColor: theme.orange, borderColor: theme.orange },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterPillText,
              { color: theme.textSecondary },
              filter === f && { color: '#FFF' },
            ]}>
              {f === 'all' ? 'All' : TX_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.orange} />
        </View>
      ) : !account ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Connect wallet to view history</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions yet</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
          contentContainerStyle={styles.listContent}
        >
          {filtered.map(tx => (
            <View
              key={tx.id}
              style={[styles.txRow, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            >
              {/* Left — type indicator */}
              <View style={[styles.txDot, { backgroundColor: TX_COLORS[tx.type] + '20', borderColor: TX_COLORS[tx.type] + '40' }]}>
                <Text style={styles.txDotText}>{TX_LABELS[tx.type].split(' ')[0]}</Text>
              </View>

              {/* Middle — details */}
              <View style={styles.txInfo}>
                <Text style={[styles.txType, { color: TX_COLORS[tx.type] }]}>
                  {TX_LABELS[tx.type]}
                </Text>
                {tx.narrative_title && (
                  <Text style={[styles.txNarrative, { color: theme.textSecondary }]} numberOfLines={1}>
                    {tx.narrative_title}
                  </Text>
                )}
                <Text style={[styles.txDate, { color: theme.textTertiary }]}>{formatDate(tx.created_at)}</Text>
              </View>

              {/* Right — amount + solscan */}
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, {
                  color: tx.type === 'backing' || tx.type === 'challenge' ? theme.orange : theme.green,
                }]}>
                  {tx.type === 'backing' || tx.type === 'challenge' ? '-' : '+'}{tx.amount_sol?.toFixed(3)} {tx.token_type || 'SOL'}
                </Text>
                {tx.tx_signature && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://solscan.io/tx/${tx.tx_signature}?cluster=devnet`)}
                  >
                    <Text style={[styles.txSig, { color: theme.textTertiary }]}>{truncateSig(tx.tx_signature)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn:    { padding: 4 },
  closeBtnText:{ fontSize: 18 },
  filterScroll:{ flexGrow: 0 },
  filterContent:{
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    gap:               spacing.sm,
    flexDirection:     'row',
  },
  filterPill: {
    borderRadius:      radius.full,
    borderWidth:       1,
    paddingVertical:   6,
    paddingHorizontal: spacing.md,
  },
  filterPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.md,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15 },
  listContent:{ padding: spacing.lg, gap: spacing.md },
  txRow: {
    flexDirection: 'row',
    alignItems:    'center',
    borderRadius:  radius.lg,
    borderWidth:   1,
    padding:       spacing.lg,
    gap:           spacing.md,
  },
  txDot: {
    width:          40,
    height:         40,
    borderRadius:   20,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  txDotText:  { fontSize: 18 },
  txInfo:     { flex: 1 },
  txType:     { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  txNarrative:{ fontSize: 12, marginBottom: 2 },
  txDate:     { fontSize: 11 },
  txRight:    { alignItems: 'flex-end', gap: 4 },
  txAmount:   { fontSize: 14, fontWeight: '700' },
  txSig:      { fontSize: 10 },
});

export default TransactionHistoryScreen;
