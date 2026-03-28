import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { API_URL } from '../config';
import { useWallet } from '../context/WalletContext';

interface LeaderboardEntry {
  wallet_address: string;
  conviction_score?: number;
  conviction_tier?: string;
  correct_backings?: number;
  current_streak?: number;
  nft_tier?: string | null;
  creator_score?: number;
  creator_tier?: string;
  total_creator_earnings_sol?: number;
}

const TIER_COLORS: Record<string, string> = {
  ember: '#CC7722', flare: '#FF6B35', magma: '#FF4500',
  core: '#CC0000', volcanic: '#FF0000',
};

function formatWallet(addr: string): string {
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

function rankEmoji(i: number): string {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return String(i + 1);
}

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { account } = useWallet();

  const [tab, setTab] = useState<'conviction' | 'creators'>('conviction');
  const [convictionData, setConvictionData] = useState<LeaderboardEntry[]>([]);
  const [creatorData, setCreatorData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    setError(false);
    try {
      const [convRes, creatRes] = await Promise.all([
        fetch(`${API_URL}/v1/conviction/leaderboard/conviction`),
        fetch(`${API_URL}/v1/conviction/leaderboard/creators`),
      ]);
      if (convRes.ok)  setConvictionData((await convRes.json()).leaderboard ?? []);
      if (creatRes.ok) setCreatorData((await creatRes.json()).leaderboard ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const s = makeStyles(theme, insets);
  const data = tab === 'conviction' ? convictionData : creatorData;
  const myWallet = account?.address ?? '';

  return (
    <View style={[s.container, { backgroundColor: theme.bgBase }]}>

      {/* Tab selector */}
      <View style={[s.tabRow, { borderBottomColor: theme.cardBorder }]}>
        {(['conviction', 'creators'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, { color: tab === t ? theme.orange : theme.textSecondary }]}>
              {t === 'conviction' ? '⚡ Conviction' : '✍️ Creators'}
            </Text>
            {tab === t && <View style={[s.tabUnderline, { backgroundColor: theme.orange }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator color={theme.orange} size="large" />
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Text style={[s.emptyText, { color: theme.textSecondary }]}>Failed to load</Text>
          <TouchableOpacity style={[s.retryBtn, { borderColor: theme.orange }]} onPress={fetchAll}>
            <Text style={[s.retryText, { color: theme.orange }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.orange} colors={[theme.orange]} />
          }
          contentContainerStyle={s.list}
        >
          {data.length === 0 ? (
            <View style={s.centered}>
              <Text style={[s.emptyText, { color: theme.textSecondary }]}>No data yet</Text>
            </View>
          ) : data.map((entry, i) => {
            const isMe = entry.wallet_address === myWallet;
            const tierColor = TIER_COLORS[entry.conviction_tier ?? entry.creator_tier ?? 'ember'] ?? theme.orange;
            return (
              <View key={entry.wallet_address} style={[
                s.row,
                { backgroundColor: isMe ? 'rgba(255,107,53,0.08)' : theme.bgSurface,
                  borderColor: isMe ? theme.orange : theme.cardBorder }
              ]}>
                {/* Rank */}
                <Text style={s.rank}>{rankEmoji(i)}</Text>

                {/* Info */}
                <View style={s.info}>
                  <View style={s.infoTop}>
                    <Text style={[s.wallet, { color: isMe ? theme.orange : theme.textPrimary }]}>
                      {isMe ? 'YOU' : formatWallet(entry.wallet_address)}
                    </Text>
                    {(entry.conviction_tier || entry.creator_tier) && (
                      <View style={[s.tierBadge, { borderColor: tierColor + '60', backgroundColor: tierColor + '18' }]}>
                        <Text style={[s.tierText, { color: tierColor }]}>
                          {(entry.conviction_tier ?? entry.creator_tier ?? '').toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {entry.nft_tier && (
                      <View style={[s.nftBadge, { borderColor: 'rgba(255,179,71,0.4)' }]}>
                        <Text style={[s.nftText, { color: '#FFB347' }]}>
                          {entry.nft_tier.toUpperCase()} NFT
                        </Text>
                      </View>
                    )}
                  </View>
                  {tab === 'conviction' ? (
                    <Text style={[s.sub, { color: theme.textTertiary }]}>
                      {entry.correct_backings ?? 0} correct · streak {entry.current_streak ?? 0}
                    </Text>
                  ) : (
                    <Text style={[s.sub, { color: theme.textTertiary }]}>
                      {(entry.total_creator_earnings_sol ?? 0).toFixed(3)} SOL earned
                    </Text>
                  )}
                </View>

                {/* Score */}
                <Text style={[s.score, { color: tierColor }]}>
                  {tab === 'conviction'
                    ? (entry.conviction_score ?? 0)
                    : (entry.creator_score ?? 0)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (theme: any, insets: any) => StyleSheet.create({
  container:    { flex: 1, paddingTop: insets.top },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  tabRow:       { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabActive:    {},
  tabText:      { fontSize: 14, fontWeight: '600' },
  tabUnderline: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, borderRadius: 1 },
  list:         { padding: 12, gap: 8, paddingBottom: insets.bottom + 20 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                  borderRadius: 14, borderWidth: 1 },
  rank:         { fontSize: 18, width: 36, textAlign: 'center' },
  info:         { flex: 1, gap: 4 },
  infoTop:      { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  wallet:       { fontSize: 13, fontWeight: '700' },
  tierBadge:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999, borderWidth: 1 },
  tierText:     { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  nftBadge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999, borderWidth: 1 },
  nftText:      { fontSize: 9, fontWeight: '600' },
  sub:          { fontSize: 11 },
  score:        { fontSize: 22, fontWeight: '900', minWidth: 50, textAlign: 'right' },
  emptyText:    { fontSize: 15 },
  retryBtn:     { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 9999, borderWidth: 1 },
  retryText:    { fontSize: 13, fontWeight: '600' },
});
