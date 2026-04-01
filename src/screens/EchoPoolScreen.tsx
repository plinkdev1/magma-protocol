import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config';

export default function EchoPoolScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { account } = useWallet();
  const wallet = account?.address ?? '';

  const [preview, setPreview]   = useState<any>(null);
  const [history, setHistory]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!wallet) { setLoading(false); return; }
    async function fetchData() {
      try {
        const [previewRes, historyRes] = await Promise.all([
          fetch(`${API_URL}/v1/conviction/echo-pool/preview/${wallet}`),
          fetch(`${API_URL}/v1/conviction/echo-pool/history/${wallet}`),
        ]);
        setPreview(await previewRes.json());
        const hData = await historyRes.json();
        setHistory(hData.distributions ?? []);
      } catch (e) {
        console.error('[EchoPool] fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [wallet]);

  if (loading) return (
    <View style={[styles.center, { backgroundColor: theme.bgBase }]}>
      <ActivityIndicator size="large" color={theme.orange} />
    </View>
  );

  if (!wallet) return (
    <View style={[styles.center, { backgroundColor: theme.bgBase }]}>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Connect wallet to view Echo Pool</Text>
    </View>
  );

  const epochProgress = preview
    ? Math.round(((30 - (preview.days_remaining ?? 30)) / 30) * 100)
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bgBase }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
    >
      {/* Hero */}
      <View style={[styles.heroCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.heroLabel, { color: theme.textTertiary }]}>
          EPOCH {preview?.epoch_number} · {preview?.days_remaining ?? '—'} DAYS REMAINING
        </Text>
        <Text style={[styles.heroValue, { color: theme.textPrimary }]}>
          {(preview?.echo_pool_sol ?? 0).toFixed(3)}
        </Text>
        <Text style={[styles.heroUnit, { color: theme.textSecondary }]}>SOL accumulated this epoch</Text>
        <View style={[styles.progressBar, { backgroundColor: theme.cardBorder }]}>
          <View style={[styles.progressFill, { width: `${Math.min(epochProgress, 100)}%`, backgroundColor: theme.orange }]} />
        </View>
        <Text style={[styles.progressLabel, { color: theme.textTertiary }]}>{epochProgress}% of epoch elapsed</Text>
      </View>

      {/* Your Share */}
      <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>YOUR SHARE</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Estimated this epoch</Text>
          <Text style={[styles.rowValue, { color: theme.green }]}>
            ~{(preview?.estimated_share_sol ?? 0).toFixed(3)} SOL
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Last epoch received</Text>
          <Text style={[styles.rowValue, { color: theme.textPrimary }]}>
            {(preview?.last_epoch_amount ?? 0).toFixed(3)} SOL
          </Text>
        </View>
        <View style={[styles.explainer, { backgroundColor: theme.bgBase }]}>
          <Text style={[styles.explainerText, { color: theme.textSecondary }]}>
            Your share = your Conviction Multiplier × correct backing volume this epoch.
            Back more accurately to increase your weight.
          </Text>
        </View>
      </View>

      {/* How it works */}
      <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>HOW ECHO POOL WORKS</Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          Every narrative that resolves FALSE sends 35% of its backing capital to the Echo Pool.
          At the end of each 30-day epoch, the pool distributes to all correct backers — weighted
          by their Conviction Score and backing volume.
        </Text>
        {['FALSE resolution → capital captured', '35% → Echo Pool', 'Distributed to correct backers monthly'].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: theme.orange }]}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.textPrimary }]}>{step}</Text>
          </View>
        ))}
      </View>

      {/* History */}
      <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>PAST DISTRIBUTIONS</Text>
        {history.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Your first Echo Pool distribution will appear here after Epoch 1 completes.
          </Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              {['Epoch', 'Amount', 'Share %', 'Date'].map(h => (
                <Text key={h} style={[styles.tableHeaderText, { color: theme.textTertiary }]}>{h}</Text>
              ))}
            </View>
            {history.map((dist, i) => (
              <View key={i} style={[styles.tableRow, { borderBottomColor: theme.cardBorder }]}>
                <Text style={[styles.tableCell, { color: theme.textPrimary }]}>#{dist.epoch_number}</Text>
                <Text style={[styles.tableCell, { color: theme.green }]}>{(dist.echo_amount_sol ?? 0).toFixed(3)}</Text>
                <Text style={[styles.tableCell, { color: theme.textPrimary }]}>{(dist.echo_share_pct ?? 0).toFixed(1)}%</Text>
                <Text style={[styles.tableCell, { color: theme.textSecondary }]}>
                  {dist.distributed_at ? new Date(dist.distributed_at).toLocaleDateString() : '—'}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>

      <Text style={[styles.footerNote, { color: theme.textTertiary }]}>
        Echo Pool distributions happen on the 1st of each month. No action required.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  content:         { padding: 20, gap: 16 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard:        { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center' },
  heroLabel:       { fontSize: 10, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  heroValue:       { fontSize: 52, fontWeight: '900', lineHeight: 60 },
  heroUnit:        { fontSize: 13, marginBottom: 16 },
  progressBar:     { width: '100%', height: 4, borderRadius: 2 },
  progressFill:    { height: 4, borderRadius: 2 },
  progressLabel:   { fontSize: 10, marginTop: 6, letterSpacing: 1 },
  section:         { borderRadius: 16, borderWidth: 1, padding: 20 },
  sectionTitle:    { fontSize: 10, letterSpacing: 2, marginBottom: 14, textTransform: 'uppercase' },
  row:             { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowLabel:        { fontSize: 13 },
  rowValue:        { fontSize: 13, fontWeight: '600' },
  explainer:       { borderRadius: 8, padding: 12, marginTop: 12 },
  explainerText:   { fontSize: 12, lineHeight: 18 },
  bodyText:        { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  stepRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  stepNum:         { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumText:     { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepText:        { fontSize: 13 },
  tableHeader:     { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tableHeaderText: { flex: 1, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  tableRow:        { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1 },
  tableCell:       { flex: 1, fontSize: 12 },
  emptyText:       { fontSize: 13, lineHeight: 20 },
  footerNote:      { fontSize: 11, textAlign: 'center', marginTop: 8 },
});
