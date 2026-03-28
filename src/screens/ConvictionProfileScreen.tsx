import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../theme/ThemeContext';
import { API_URL } from '../config';

// --- Types ---
interface ConvictionData {
  conviction_score:           number;
  conviction_tier:            string;
  correct_backings:           number;
  incorrect_backings:         number;
  accuracy_rate:              number;
  current_streak:             number;
  longest_streak:             number;
  conviction_multiplier:      number;
  streak_multiplier:          number;
  combined_multiplier:        number;
  fee_pct:                    number;
  nft_tier:                   string | null;
  creator_score?:             number;
  creator_tier?:              string;
  total_creator_earnings_sol?: number;
}

interface EchoPreview {
  epoch_number:        number;
  days_remaining:      number;
  echo_pool_sol:       number;
  estimated_share_sol: number;
  last_epoch_amount:   number;
}

interface CreatorData {
  creator_score:              number;
  creator_tier:               string;
  creator_share_pct:          number;
  narratives_submitted:       number;
  total_creator_earnings_sol: number;
}

// --- Constants ---
const TIER_COLORS: Record<string, string> = {
  ember:    '#CC7722',
  flare:    '#FF6B35',
  magma:    '#FF4500',
  core:     '#CC0000',
  volcanic: '#FF0000',
};

const TIER_LABELS: Record<string, string> = {
  ember:    'EMBER',
  flare:    'FLARE',
  magma:    'MAGMA',
  core:     'CORE',
  volcanic: 'VOLCANIC',
};

const TIER_EMOJIS: Record<string, string> = {
  ember:    'fire',
  flare:    'zap',
  magma:    'volcano',
  core:     'gem',
  volcanic: 'flame',
};

const TIER_NEXT_THRESHOLD: Record<string, number> = {
  ember:    100,
  flare:    300,
  magma:    600,
  core:     900,
  volcanic: 1000,
};

function getNextTierPts(tier: string, score: number): string {
  if (tier === 'volcanic') return 'MAX TIER';
  const next = TIER_NEXT_THRESHOLD[tier] ?? 100;
  return `${next - score} pts to next tier`;
}

// --- Screen ---
export default function ConvictionProfileScreen() {
  const navigation  = useNavigation<any>();
  const insets      = useSafeAreaInsets();
  const { theme }   = useTheme();
  const { account, nftState } = useWallet();

  const wallet = account?.publicKey?.toString() ?? '';

  const [conviction,   setConviction]   = useState<ConvictionData | null>(null);
  const [echoPreview,  setEchoPreview]  = useState<EchoPreview | null>(null);
  const [creatorData,  setCreatorData]  = useState<CreatorData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(false);

  const fetchAll = useCallback(async () => {
    if (!wallet) { setLoading(false); return; }
    setError(false);
    try {
      const [convRes, echoRes, creatorRes] = await Promise.all([
        fetch(`${API_URL}/v1/conviction/${wallet}`),
        fetch(`${API_URL}/v1/conviction/echo-pool/preview/${wallet}`),
        fetch(`${API_URL}/v1/conviction/creator/${wallet}`),
      ]);
      if (convRes.ok)    setConviction(await convRes.json());
      if (echoRes.ok)    setEchoPreview(await echoRes.json());
      if (creatorRes.ok) setCreatorData(await creatorRes.json());
    } catch (e) {
      console.error('[ConvictionProfileScreen] fetch error:', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [wallet]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
  }, [fetchAll]);

  const s = makeStyles(theme, insets);

  // --- Not connected ---
  if (!wallet) {
    return (
      <View style={[s.container, s.centered]}>
        <Text style={[s.emptyIcon]}>🔥</Text>
        <Text style={[s.emptyTitle, { color: theme.textPrimary }]}>Wallet not connected</Text>
        <Text style={[s.emptySubtitle, { color: theme.textSecondary }]}>
          Connect your wallet to view your Conviction Score
        </Text>
      </View>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator color={theme.orange} size="large" />
        <Text style={[s.loadingText, { color: theme.textSecondary }]}>
          Loading conviction data...
        </Text>
      </View>
    );
  }

  // --- Error ---
  if (error || !conviction) {
    return (
      <View style={[s.container, s.centered]}>
        <Text style={[s.emptyIcon]}>⚠️</Text>
        <Text style={[s.emptyTitle, { color: theme.textPrimary }]}>Failed to load</Text>
        <TouchableOpacity style={[s.retryBtn, { borderColor: theme.orange }]} onPress={fetchAll}>
          <Text style={[s.retryText, { color: theme.orange }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tierColor   = TIER_COLORS[conviction.conviction_tier] ?? theme.orange;
  const tierLabel   = TIER_LABELS[conviction.conviction_tier] ?? conviction.conviction_tier.toUpperCase();
  const totalBacks  = conviction.correct_backings + conviction.incorrect_backings;
  const progressPct = Math.min(100, (conviction.conviction_score / 1000) * 100);

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.bgBase }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.orange}
          colors={[theme.orange]}
        />
      }
    >

      {/* ── TIER BADGE ── */}
      <View style={[s.tierCard, { backgroundColor: theme.bgSurface, borderColor: tierColor }]}>
        <Text style={[s.tierLabel, { color: tierColor }]}>
          🌋 {tierLabel}
        </Text>
        <Text style={[s.scoreDisplay, { color: theme.textPrimary }]}>
          {conviction.conviction_score}
          <Text style={[s.scoreMax, { color: theme.textSecondary }]}> / 1000</Text>
        </Text>
        <View style={[s.progressTrack, { backgroundColor: theme.cardBorder }]}>
          <View style={[s.progressFill, { width: `${progressPct}%` as any, backgroundColor: tierColor }]} />
        </View>
        <Text style={[s.nextTierHint, { color: theme.textSecondary }]}>
          {getNextTierPts(conviction.conviction_tier, conviction.conviction_score)}
        </Text>
      </View>

      {/* ── STATS GRID ── */}
      <View style={[s.statsGrid, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}>
        {[
          { label: 'Correct',     value: String(conviction.correct_backings) },
          { label: 'Incorrect',   value: String(conviction.incorrect_backings) },
          {
            label: 'Accuracy',
            value: `${conviction.accuracy_rate ?? 0}%`,
            color: (conviction.accuracy_rate ?? 0) >= 60 ? '#22C55E'
                 : (conviction.accuracy_rate ?? 0) >= 40 ? '#F59E0B'
                 : '#EF4444',
          },
          {
            label: 'Streak',
            value: `${conviction.current_streak}${conviction.current_streak >= 3 ? ' 🔥' : ''}`,
          },
          { label: 'Best',  value: String(conviction.longest_streak) },
          { label: 'Total', value: String(totalBacks) },
        ].map((stat, i) => (
          <View key={i} style={[s.statCell, { borderColor: theme.cardBorder }]}>
            <Text style={[s.statValue, { color: stat.color ?? theme.textPrimary }]}>
              {stat.value}
            </Text>
            <Text style={[s.statLabel, { color: theme.textTertiary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── MULTIPLIERS ── */}
      <View style={[s.section, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}>
        <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>YOUR MULTIPLIERS</Text>
        {[
          { label: 'Yield Multiplier',  value: `${conviction.conviction_multiplier}×` },
          { label: 'Streak Bonus',      value: `${conviction.streak_multiplier}×` },
          { label: 'Combined Yield',    value: `\×`, accent: true },
          { label: 'Protocol Fee',      value: conviction.fee_pct === 0 ? 'WAIVED 🎉' : `${conviction.fee_pct}%` },
          {
            label: 'NFT Boost',
            value: nftState.mlava_tier ? (nftState.mlava_tier.toUpperCase() + ' NFT Active') : 'No NFT',
          },
        ].map((row, i) => (
          <View key={i} style={[s.multRow, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[s.multLabel, { color: theme.textSecondary }]}>{row.label}</Text>
            <Text style={[s.multValue, { color: row.accent ? theme.orange : theme.textPrimary }]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {/* ── NFT SECTION ── */}
      <View style={[s.section, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}>
        <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>LAVA TIER NFT</Text>
        <View style={s.multRow}>
          <Text style={[s.multLabel, { color: theme.textSecondary }]}>Status</Text>
          <Text style={[s.multValue, { color: theme.textPrimary }]}>
            {nftState.mlava_tier ? (nftState.mlava_tier.toUpperCase() + ' · Active') : nftState.genesis_holder ? 'Genesis Origin Card · Echo Pool +1.1x' : 'No NFT · Mint opens post-TGE'}
          </Text>
        </View>
        <Text style={[s.nftNote, { color: theme.textTertiary }]}>
          NFT tier grants yield multiplier floor — system uses MAX of earned tier vs NFT tier
        </Text>
      </View>

      {/* ── ECHO POOL PREVIEW ── */}
      {echoPreview && (
        <TouchableOpacity
          style={[s.section, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}
          onPress={() => navigation.navigate('EchoPool')}
          activeOpacity={0.85}
        >
          <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>ECHO POOL</Text>
          {[
            { label: 'Last distribution',   value: `${(echoPreview.last_epoch_amount ?? 0).toFixed(3)} SOL` },
            { label: 'Next distribution',   value: `${echoPreview.days_remaining ?? 0} days` },
            {
              label: 'Estimated this epoch',
              value: `~${(echoPreview.estimated_share_sol ?? 0).toFixed(3)} SOL`,
              accent: true,
            },
            { label: 'Pool size',           value: `${(echoPreview.echo_pool_sol ?? 0).toFixed(2)} SOL` },
          ].map((row, i) => (
            <View key={i} style={[s.multRow, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[s.multLabel, { color: theme.textSecondary }]}>{row.label}</Text>
              <Text style={[s.multValue, { color: row.accent ? '#22C55E' : theme.textPrimary }]}>
                {row.value}
              </Text>
            </View>
          ))}
          <Text style={[s.cta, { color: theme.orange }]}>View Echo Pool →</Text>
        </TouchableOpacity>
      )}

      {/* ── CREATOR SCORE ── */}
      {creatorData && (creatorData.narratives_submitted ?? 0) > 0 && (
        <TouchableOpacity
          style={[s.section, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}
          onPress={() => navigation.navigate('CreatorStudio')}
          activeOpacity={0.85}
        >
          <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>CREATOR SCORE</Text>
          {[
            { label: 'Tier',          value: creatorData.creator_tier },
            { label: 'Score',         value: `${creatorData.creator_score} / 1000` },
            { label: 'Creator share', value: `${creatorData.creator_share_pct}% of pool` },
            {
              label: 'Total earned',
              value: `${(creatorData.total_creator_earnings_sol ?? 0).toFixed(4)} SOL`,
              accent: true,
            },
          ].map((row, i) => (
            <View key={i} style={[s.multRow, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[s.multLabel, { color: theme.textSecondary }]}>{row.label}</Text>
              <Text style={[s.multValue, { color: row.accent ? '#22C55E' : theme.textPrimary }]}>
                {row.value}
              </Text>
            </View>
          ))}
          <Text style={[s.cta, { color: theme.orange }]}>View Creator Studio →</Text>
        </TouchableOpacity>
      )}

      {/* ── WALLET ── */}
      <View style={[s.section, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}>
        <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>WALLET</Text>
        <View style={s.multRow}>
          <Text style={[s.multLabel, { color: theme.textSecondary }]}>Address</Text>
          <Text style={[s.multValue, { color: theme.textPrimary }]}>
            {wallet.slice(0, 4)}...{wallet.slice(-4)}
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

const makeStyles = (theme: any, insets: any) => StyleSheet.create({
  container:    { flex: 1 },
  centered:     { justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  content:      { padding: 16, gap: 12, paddingBottom: insets.bottom + 32 },
  loadingText:  { marginTop: 12, fontSize: 14 },
  emptyIcon:    { fontSize: 32 },
  emptyTitle:   { fontSize: 18, fontWeight: '700' },
  emptySubtitle:{ fontSize: 14, textAlign: 'center' },
  retryBtn:     { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
                  borderRadius: 9999, borderWidth: 1 },
  retryText:    { fontSize: 14, fontWeight: '600' },
  // Tier card
  tierCard:     { borderRadius: 20, borderWidth: 1.5, padding: 24, alignItems: 'center', gap: 8 },
  tierLabel:    { fontSize: 13, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase' },
  scoreDisplay: { fontSize: 56, fontWeight: '900', lineHeight: 64 },
  scoreMax:     { fontSize: 20, fontWeight: '400' },
  progressTrack:{ width: '100%', height: 6, borderRadius: 3, marginTop: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  nextTierHint: { fontSize: 12, marginTop: 4 },
  // Stats grid
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 16,
                  borderWidth: 1, overflow: 'hidden' },
  statCell:     { width: '33.33%', padding: 16, alignItems: 'center',
                  borderRightWidth: 1, borderBottomWidth: 1 },
  statValue:    { fontSize: 20, fontWeight: '700' },
  statLabel:    { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  // Section
  section:      { borderRadius: 16, borderWidth: 1, padding: 20, gap: 0 },
  sectionTitle: { fontSize: 10, letterSpacing: 2, fontWeight: '600',
                  textTransform: 'uppercase', marginBottom: 12 },
  multRow:      { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', paddingVertical: 10,
                  borderBottomWidth: StyleSheet.hairlineWidth },
  multLabel:    { fontSize: 13 },
  multValue:    { fontSize: 13, fontWeight: '600' },
  nftNote:      { fontSize: 11, marginTop: 8, lineHeight: 16 },
  cta:          { fontSize: 13, fontWeight: '600', marginTop: 12, textAlign: 'right' },
});
