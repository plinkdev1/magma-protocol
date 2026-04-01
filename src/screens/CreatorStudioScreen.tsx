import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config';

const CREATOR_TIERS = [
  { tier: 'Unranked', min: 0,   max: 99,  share: '0%'   },
  { tier: 'Rising',   min: 100, max: 299, share: '0.5%' },
  { tier: 'Proven',   min: 300, max: 599, share: '1.0%' },
  { tier: 'Expert',   min: 600, max: 799, share: '1.5%' },
  { tier: 'Legend',   min: 800, max: 1000,share: '2.0%' },
];

export default function CreatorStudioScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { account } = useWallet();
  const wallet = account?.address ?? '';

  const [creator, setCreator]           = useState<any>(null);
  const [narratives, setNarratives]     = useState<any[]>([]);
  const [filter, setFilter]             = useState<'all' | 'true' | 'false' | 'pending'>('all');
  const [loading, setLoading]           = useState(true);
  const [showTierTable, setShowTierTable] = useState(false);

  useEffect(() => {
    if (!wallet) { setLoading(false); return; }
    async function fetchData() {
      setLoading(true);
      try {
        const [creatorRes, narrativesRes] = await Promise.all([
          fetch(`${API_URL}/v1/conviction/creator/${wallet}`),
          fetch(`${API_URL}/v1/conviction/creator/${wallet}/narratives?status=${filter}`),
        ]);
        setCreator(await creatorRes.json());
        const nd = await narrativesRes.json();
        setNarratives(nd.narratives ?? []);
      } catch (e) {
        console.error('[CreatorStudio] fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [wallet, filter]);

  if (loading) return (
    <View style={[styles.center, { backgroundColor: theme.bgBase }]}>
      <ActivityIndicator size="large" color={theme.orange} />
    </View>
  );

  if (!wallet) return (
    <View style={[styles.center, { backgroundColor: theme.bgBase }]}>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Connect wallet to view Creator Studio</Text>
    </View>
  );

  const accuracy = creator && creator.narratives_submitted > 0
    ? Math.round((creator.narratives_resolved_true / creator.narratives_submitted) * 1000) / 10
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bgBase }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      {/* Hero */}
      <View style={[styles.heroCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.heroLabel, { color: theme.textTertiary }]}>✏️  CREATOR STUDIO</Text>
        <Text style={[styles.tierDisplay, { color: theme.orange }]}>
          {creator?.creator_tier?.toUpperCase() ?? 'UNRANKED'}
        </Text>
        <Text style={[styles.scoreDisplay, { color: theme.textPrimary }]}>
          {creator?.creator_score ?? 0}{' '}
          <Text style={[styles.scoreMax, { color: theme.textSecondary }]}>/ 1000</Text>
        </Text>
        <Text style={[styles.shareDisplay, { color: theme.textSecondary }]}>
          {creator?.creator_share_pct ?? 0}% creator share on each TRUE narrative
        </Text>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: theme.cardBorder }]}>
        {[
          { label: 'Total Earned',    value: `${(creator?.total_creator_earnings_sol ?? 0).toFixed(3)} SOL`, accent: true },
          { label: 'TRUE Narratives', value: `${creator?.narratives_resolved_true ?? 0} of ${creator?.narratives_submitted ?? 0}` },
          { label: 'Pending',         value: String(creator?.narratives_pending ?? 0) },
        ].map((stat, i) => (
          <View key={i} style={[styles.statCell, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.statValue, { color: stat.accent ? theme.green : theme.textPrimary }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.accuracyText, { color: theme.textSecondary }]}>Accuracy: {accuracy}%</Text>

      {/* Tier table */}
      <TouchableOpacity
        style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
        onPress={() => setShowTierTable(!showTierTable)}
      >
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          TIER BENEFITS {showTierTable ? '▲' : '▼'}
        </Text>
        {showTierTable && (
          <>
            <View style={styles.tableHeader}>
              {['Tier', 'Score', 'Share'].map(h => (
                <Text key={h} style={[styles.tableHeaderText, { color: theme.textTertiary }]}>{h}</Text>
              ))}
            </View>
            {CREATOR_TIERS.map((row, i) => (
              <View key={i} style={[
                styles.tableRow,
                { borderBottomColor: theme.cardBorder },
                creator?.creator_tier === row.tier ? { backgroundColor: 'rgba(255,107,53,0.08)' } : {},
              ]}>
                <Text style={[styles.tableCell, {
                  color: creator?.creator_tier === row.tier ? theme.orange : theme.textPrimary
                }]}>{row.tier}</Text>
                <Text style={[styles.tableCell, { color: theme.textPrimary }]}>{row.min}–{row.max}</Text>
                <Text style={[styles.tableCell, { color: theme.textPrimary }]}>{row.share}</Text>
              </View>
            ))}
          </>
        )}
      </TouchableOpacity>

      {/* Narratives */}
      <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>YOUR NARRATIVES</Text>
        <View style={styles.filterRow}>
          {(['all', 'pending', 'true', 'false'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, { borderColor: theme.cardBorder },
                filter === f ? { backgroundColor: theme.orange, borderColor: theme.orange } : {}
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? '#fff' : theme.textSecondary }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {narratives.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {filter === 'all'
              ? 'Submit your first narrative to start building your Creator Score.'
              : `No ${filter} narratives.`}
          </Text>
        ) : (
          narratives.map((n, i) => (
            <View key={i} style={[styles.narrativeRow, { borderBottomColor: theme.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.narrativeTitle, { color: theme.textPrimary }]} numberOfLines={1}>{n.title}</Text>
                {n.resolution === 'true' && n.creator_share_sol ? (
                  <Text style={[styles.earnedText, { color: theme.green }]}>
                    Earned: {Number(n.creator_share_sol).toFixed(4)} SOL
                  </Text>
                ) : (
                  <Text style={[styles.poolText, { color: theme.textTertiary }]}>
                    Pool: {Number(n.sol_backed ?? 0).toFixed(2)} SOL
                  </Text>
                )}
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: n.status === 'graduated' ? 'rgba(34,197,94,0.10)' :
                                  n.status === 'failed' ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
              }]}>
                <Text style={[styles.statusText, {
                  color: n.status === 'graduated' ? theme.green :
                         n.status === 'failed'    ? '#EF4444' : theme.amber,
                }]}>
                  {n.status === 'graduated' ? '✓ TRUE' :
                   n.status === 'failed'    ? '✗ FALSE' : 'PENDING'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: theme.orange }]}
        onPress={() => (navigation as any).navigate('Main', { screen: 'Launch' })}
        activeOpacity={0.8}
      >
        <Text style={styles.submitBtnText}>✏️  Submit New Narrative</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  content:        { padding: 20, gap: 16, paddingBottom: 40 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard:       { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center' },
  heroLabel:      { fontSize: 10, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  tierDisplay:    { fontSize: 22, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  scoreDisplay:   { fontSize: 40, fontWeight: '900' },
  scoreMax:       { fontSize: 16 },
  shareDisplay:   { fontSize: 12, marginTop: 8, textAlign: 'center' },
  statsRow:       { flexDirection: 'row', gap: 1 },
  statCell:       { flex: 1, padding: 16, alignItems: 'center' },
  statValue:      { fontSize: 16, fontWeight: '700' },
  statLabel:      { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  accuracyText:   { fontSize: 12, textAlign: 'center' },
  section:        { borderRadius: 16, borderWidth: 1, padding: 20 },
  sectionTitle:   { fontSize: 10, letterSpacing: 2, marginBottom: 14, textTransform: 'uppercase' },
  tableHeader:    { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tableHeaderText:{ flex: 1, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  tableRow:       { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1 },
  tableCell:      { flex: 1, fontSize: 12 },
  filterRow:      { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterPill:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, flexShrink: 1, minWidth: 64 },
  filterText:     { fontSize: 12, flexShrink: 1 },
  narrativeRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  narrativeTitle: { fontSize: 13, fontWeight: '500', marginBottom: 3 },
  earnedText:     { fontSize: 11 },
  poolText:       { fontSize: 11 },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText:     { fontSize: 11, fontWeight: '700' },
  emptyText:      { fontSize: 13, lineHeight: 20 },
  submitBtn:      { borderRadius: 12, padding: 18, alignItems: 'center' },
  submitBtnText:  { color: '#000', fontSize: 16, fontWeight: '800' },
});
