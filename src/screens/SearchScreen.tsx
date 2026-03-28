import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = ['All', 'CONVICTION', 'CULTURAL', 'SOCIAL', 'STANDARD'];
const STATUSES   = ['All', 'pending', 'resolved', 'challenged'];
const RECENT_KEY = 'magma:recent_searches';
const TRENDING   = ['AI dominance', 'Solana ETF', 'Bitcoin halving', 'DeFi summer'];

interface Narrative {
  id: string;
  title: string;
  thesis?: string;
  status?: string;
  oracle_mode?: string;
  total_backed_sol?: number;
  backer_count?: number;
  created_at?: string;
  deadline_at?: string;
}

export default function SearchScreen() {
  const { theme } = useTheme();
  const navigation  = useNavigation<Nav>();
  const insets      = useSafeAreaInsets();
  const inputRef    = useRef<TextInput>(null);

  const [query,         setQuery]         = useState('');
  const [category,      setCategory]      = useState('All');
  const [status,        setStatus]        = useState('All');
  const [allNarratives, setAllNarratives] = useState<Narrative[]>([]);
  const [results,       setResults]       = useState<Narrative[]>([]);
  const [recentSearches,setRecentSearches]= useState<string[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [fetched,       setFetched]       = useState(false);

  const s = makeStyles(theme, insets);

  // Load recent searches from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(raw => {
      if (raw) setRecentSearches(JSON.parse(raw));
    });
    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Fetch all narratives once
  const fetchAll = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/v1/narratives`);
      setAllNarratives(res.data.narratives ?? []);
      setFetched(true);
    } catch (e) {
      console.error('[SearchScreen] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  // Filter client-side whenever query/category/status changes
  useEffect(() => {
    if (!fetched) return;
    const q = query.trim().toLowerCase();
    const filtered = allNarratives.filter(n => {
      const matchQ = !q
        || (n.title?.toLowerCase().includes(q))
        || (n.thesis?.toLowerCase().includes(q));
      const matchCat = category === 'All'
        || n.oracle_mode?.toUpperCase() === category;
      const matchStatus = status === 'All'
        || n.status === status;
      return matchQ && matchCat && matchStatus;
    });
    setResults(filtered);
  }, [query, category, status, allNarratives, fetched]);

  // Save recent search
  const saveRecent = useCallback(async (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(r => r !== term)].slice(0, 8);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  }, [recentSearches]);

  const handleSubmit = useCallback(() => {
    if (!query.trim()) return;
    saveRecent(query.trim());
    fetchAll();
    Keyboard.dismiss();
  }, [query, saveRecent, fetchAll]);

  const handleRecentTap = useCallback((term: string) => {
    setQuery(term);
    fetchAll();
    saveRecent(term);
  }, [fetchAll, saveRecent]);

  const clearRecent = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  }, []);

  const handleCardPress = useCallback((id: string) => {
    navigation.navigate('NarrativeDetail', { narrativeId: id });
  }, [navigation]);

  const showHome = !fetched && query === '';

  const renderResult = ({ item }: { item: Narrative }) => (
    <TouchableOpacity
      style={[s.card, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}
      onPress={() => handleCardPress(item.id)}
      activeOpacity={0.85}
    >
      <View style={s.cardTop}>
        {item.oracle_mode && item.oracle_mode !== 'standard' && (
          <View style={[s.catBadge, { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: theme.borderMedium }]}>
            <Text style={[s.catBadgeText, { color: theme.orange }]}>
              {item.oracle_mode.toUpperCase()}
            </Text>
          </View>
        )}
        {item.status && (
          <View style={[s.statusBadge, {
            backgroundColor: item.status === 'pending'
              ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.06)',
            borderColor: item.status === 'pending'
              ? 'rgba(34,197,94,0.30)' : theme.cardBorder,
          }]}>
            <Text style={[s.statusText, {
              color: item.status === 'pending' ? '#22C55E' : theme.textSecondary,
            }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={[s.cardTitle, { color: theme.textPrimary }]} numberOfLines={2}>
        {item.title}
      </Text>
      {item.thesis ? (
        <Text style={[s.cardThesis, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.thesis}
        </Text>
      ) : null}
      <View style={s.cardMeta}>
        <Text style={[s.metaText, { color: theme.textTertiary }]}>
          {(item.total_backed_sol ?? 0).toFixed(2)} SOL
        </Text>
        <Text style={[s.metaText, { color: theme.textTertiary }]}>·</Text>
        <Text style={[s.metaText, { color: theme.textTertiary }]}>
          {item.backer_count ?? 0} backers
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { backgroundColor: theme.bgBase }]}>

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={[s.backText, { color: theme.orange }]}>← Back</Text>
        </TouchableOpacity>
        <View style={[s.inputWrap, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}>
          <Text style={[s.inputIcon, { color: theme.textTertiary }]}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={[s.input, { color: theme.textPrimary }]}
            placeholder="Search narratives..."
            placeholderTextColor={theme.textTertiary}
            value={query}
            onChangeText={text => { setQuery(text); if (!fetched && text.length > 1) fetchAll(); }}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={[s.clearBtn, { color: theme.textTertiary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      <View style={s.filterRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.filterPill,
              { borderColor: category === cat ? theme.orange : theme.cardBorder },
              category === cat && { backgroundColor: 'rgba(255,107,53,0.12)' }
            ]}
            onPress={() => { setCategory(cat); fetchAll(); }}
          >
            <Text style={[s.filterText, { color: category === cat ? theme.orange : theme.textSecondary }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status filter */}
      <View style={[s.filterRow, { marginTop: 0 }]}>
        {STATUSES.map(st => (
          <TouchableOpacity
            key={st}
            style={[s.filterPill,
              { borderColor: status === st ? theme.orange : theme.cardBorder },
              status === st && { backgroundColor: 'rgba(255,107,53,0.12)' }
            ]}
            onPress={() => { setStatus(st); fetchAll(); }}
          >
            <Text style={[s.filterText, { color: status === st ? theme.orange : theme.textSecondary }]}>
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading */}
      {loading && (
        <ActivityIndicator color={theme.orange} style={{ marginTop: 32 }} />
      )}

      {/* Home state — recent + trending */}
      {!loading && showHome && (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={() => (
            <View style={s.homeContent}>
              {recentSearches.length > 0 && (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>RECENT</Text>
                    <TouchableOpacity onPress={clearRecent}>
                      <Text style={[s.clearAll, { color: theme.textTertiary }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  {recentSearches.map((r, i) => (
                    <TouchableOpacity key={i} style={s.recentRow} onPress={() => handleRecentTap(r)}>
                      <Text style={[s.recentIcon, { color: theme.textTertiary }]}>🕐</Text>
                      <Text style={[s.recentText, { color: theme.textPrimary }]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={s.section}>
                <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>TRENDING</Text>
                {TRENDING.map((t, i) => (
                  <TouchableOpacity key={i} style={s.recentRow} onPress={() => handleRecentTap(t)}>
                    <Text style={[s.recentIcon, { color: theme.orange }]}>🔥</Text>
                    <Text style={[s.recentText, { color: theme.textPrimary }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Results */}
      {!loading && fetched && (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={item => item.id}
          contentContainerStyle={s.resultsList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={() => (
            <View style={s.emptyState}>
              <Text style={[s.emptyIcon]}>🔍</Text>
              <Text style={[s.emptyTitle, { color: theme.textPrimary }]}>No results</Text>
              <Text style={[s.emptySubtitle, { color: theme.textSecondary }]}>
                Try a different keyword or filter
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (theme: any, insets: any) => StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                  paddingBottom: 12, borderBottomWidth: 1, gap: 8 },
  backBtn:      { paddingHorizontal: 4, paddingVertical: 8 },
  backText:     { fontSize: 15, fontWeight: '600' },
  inputWrap:    { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12,
                  borderWidth: 1, paddingHorizontal: 12, height: 44, gap: 8 },
  inputIcon:    { fontSize: 14 },
  input:        { flex: 1, fontSize: 15, paddingVertical: 0 },
  clearBtn:     { fontSize: 14, paddingHorizontal: 4 },
  filterRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8,
                  paddingHorizontal: 12, paddingVertical: 10 },
  filterPill:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999,
                  borderWidth: 1 },
  filterText:   { fontSize: 12, fontWeight: '500' },
  homeContent:  { padding: 16, gap: 24 },
  section:      { gap: 4 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  clearAll:     { fontSize: 12 },
  recentRow:    { flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  recentIcon:   { fontSize: 14 },
  recentText:   { fontSize: 14, fontWeight: '400' },
  resultsList:  { padding: 12, gap: 10, paddingBottom: insets.bottom + 20 },
  card:         { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardTop:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, borderWidth: 1 },
  catBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, borderWidth: 1 },
  statusText:   { fontSize: 10, fontWeight: '600' },
  cardTitle:    { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  cardThesis:   { fontSize: 13, lineHeight: 19 },
  cardMeta:     { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaText:     { fontSize: 12 },
  emptyState:   { alignItems: 'center', paddingTop: 64, gap: 8 },
  emptyIcon:    { fontSize: 32 },
  emptyTitle:   { fontSize: 18, fontWeight: '700' },
  emptySubtitle:{ fontSize: 14 },
});