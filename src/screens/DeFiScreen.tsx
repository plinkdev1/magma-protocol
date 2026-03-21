import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { usePythPriceFeed } from '../hooks/usePythPriceFeed';
import { useJupiterSwap } from '../hooks/useMagmaTransactions';
import { API_URL } from '../config';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, fontSize } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PROTOCOL_LOGOS: Record<string, any> = {
  meteora:      require('../../assets/logos/protocols/meteora.jpg'),
  kamino:       require('../../assets/logos/protocols/kamino.jpg'),
  save:         require('../../assets/logos/protocols/save.jpg'),
  jupiter_lend: require('../../assets/logos/protocols/jupiter.jpg'),
  skr_guardian: require('../../assets/logos/wallets/seeker.jpg'),
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Protocol {
  id:          string;
  name:        string;
  subtitle:    string;
  apy:         number;
  tvl:         number;
  logoKey?:    string;      // key into PROTOCOL_LOGOS
  logoEmoji?:  string;      // fallback emoji for protocols without image
  stakedLabel?: string;     // for SKR Guardian — shows "Your staked"
  stakedValue?: string;
  buttonLabel: string;
}

// ─── Static protocol data (APYs will come from Redis in Phase G+) ─────────────

const PROTOCOLS: Protocol[] = [
  {
    id:          'meteora',
    name:        'Meteora DLMM',
    subtitle:    'Dynamic Liquidity Market Maker',
    apy:         18.4,
    tvl:         45_000_000,
    logoKey:     'meteora',
    buttonLabel: 'Deposit',
  },
  {
    id:          'kamino',
    name:        'Kamino',
    subtitle:    'Automated liquidity vaults',
    apy:         9.2,
    tvl:         120_000_000,
    logoKey:     'kamino',
    buttonLabel: 'Deposit',
  },
  {
    id:          'save',
    name:        'Save.Finance',
    subtitle:    'Lending protocol',
    apy:         7.1,
    tvl:         85_000_000,
    logoKey:     'save',
    buttonLabel: 'Deposit',
  },
  {
    id:          'jupiter_lend',
    name:        'Jupiter Lend',
    subtitle:    'Money market protocol',
    apy:         4.8,
    tvl:         1_650_000_000,
    logoKey:     'jupiter_lend',
    buttonLabel: 'Deposit',
  },
  {
    id:          'skr_guardian',
    name:        'SKR Guardian',
    subtitle:    'SKR native staking',
    apy:         10.0,
    tvl:         0,
    logoKey:     'skr_guardian',
    stakedLabel: 'Your staked',
    stakedValue: '0 SKR',
    buttonLabel: 'Stake SKR',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTVL = (tvl: number) => {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
  if (tvl >= 1_000_000)     return `$${(tvl / 1_000_000).toFixed(1)}M`;
  if (tvl >= 1_000)         return `$${(tvl / 1_000).toFixed(1)}K`;
  return tvl > 0 ? `$${tvl}` : '—';
};

const formatNumber = (num: number) =>
  num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── APY Card ─────────────────────────────────────────────────────────────────

const APYCard: React.FC<{ protocol: Protocol; index: number }> = ({ protocol, index }) => {
  const { theme } = useTheme();
  const cardProgress = useSharedValue(0);

  useEffect(() => {
    cardProgress.value = withTiming(1, { duration: 400 + index * 100 });
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity:   cardProgress.value,
    transform: [{ translateY: (1 - cardProgress.value) * 20 }],
  }));

  return (
    <Animated.View style={[
      styles.apyCard,
      { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
      cardStyle,
    ]}>
      {/* Header */}
      <View style={styles.apyCardHeader}>
        <View style={[styles.apyCardIconWrap, { backgroundColor: theme.bgElevated }]}>
          {protocol.logoKey ? (
            <Image
              source={PROTOCOL_LOGOS[protocol.logoKey]}
              style={{ width: 32, height: 32, borderRadius: 8 }}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.apyCardEmoji}>{protocol.logoEmoji}</Text>
          )}
        </View>
        <View style={styles.apyCardInfo}>
          <Text style={[styles.apyCardName, { color: theme.textPrimary }]}>{protocol.name}</Text>
          <Text style={[styles.apyCardSub,  { color: theme.textSecondary }]}>{protocol.subtitle}</Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={[styles.apyCardMetrics, { borderColor: theme.borderSubtle }]}>
        <View style={styles.apyMetric}>
          <Text style={[styles.apyMetricValue, { color: theme.orange }]}>
            {protocol.apy.toFixed(1)}%
          </Text>
          <Text style={[styles.apyMetricLabel, { color: theme.textTertiary }]}>APY</Text>
        </View>
        <View style={[styles.apyMetricDivider, { backgroundColor: theme.borderSubtle }]} />
        {protocol.stakedLabel ? (
          <View style={styles.apyMetric}>
            <Text style={[styles.apyMetricValue, { color: theme.textPrimary }]}>
              {protocol.stakedValue}
            </Text>
            <Text style={[styles.apyMetricLabel, { color: theme.textTertiary }]}>
              {protocol.stakedLabel}
            </Text>
          </View>
        ) : (
          <View style={styles.apyMetric}>
            <Text style={[styles.apyMetricValue, { color: theme.textPrimary }]}>
              {formatTVL(protocol.tvl)}
            </Text>
            <Text style={[styles.apyMetricLabel, { color: theme.textTertiary }]}>TVL</Text>
          </View>
        )}
      </View>

      {/* Deposit / Stake button — orange pill */}
      <TouchableOpacity
        style={[styles.depositButton, { backgroundColor: theme.orange }]}
        activeOpacity={0.7}
      >
        <Text style={styles.depositButtonText}>{protocol.buttonLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const DeFiScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [refreshing, setRefreshing]   = useState(false);
  const [liveApys, setLiveApys]         = useState<Record<string,number>>({});
  const [protocols, setProtocols]     = useState<Protocol[]>(PROTOCOLS);

  // Update protocol APYs when live data arrives
  useEffect(() => {
    if (Object.keys(liveApys).length === 0) return;
    setProtocols(PROTOCOLS.map(p => {
      const apyKey: Record<string,string> = {
        meteora:      'meteora',
        kamino:       'kamino',
        save:         'save',
        jupiter_lend: 'jupiter_lend',
        skr_guardian: 'skr_guardian',
      };
      const key = apyKey[p.id];
      const live = key ? liveApys[key] : null;
      return live ? { ...p, apy: live } : p;
    }));
  }, [liveApys]);
  const [solAmount, setSolAmount]     = useState('');
  const [magmaAmount, setMagmaAmount] = useState('');
  const [isSwapping, setIsSwapping]   = useState(false);
  const [yieldEarned, setYieldEarned] = useState(0.0234);
  const [vaultAllocation]             = useState({ meteora: 35, kamino: 25, save: 20, jupiter_lend: 12, skr_guardian: 8 });

  const { price, lastUpdated, isStale } = usePythPriceFeed();
  const { swap } = useJupiterSwap();

  const yieldValue  = useSharedValue(0);
  const pulseValue  = useSharedValue(0);

  // Fetch live APYs from backend
  useEffect(() => {
    const fetchApys = async () => {
      try {
        const res = await fetch(`${API_URL}/v1/defi/apys`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.apys) setLiveApys(data.apys);
      } catch { /* keep defaults */ }
    };
    fetchApys();
    const id = setInterval(fetchApys, 60_000); // refresh every 60s
    return () => clearInterval(id);
  }, []);

  // Yield counter tick
  useEffect(() => {
    const id = setInterval(() => {
      setYieldEarned(prev => prev + 0.0001 + Math.random() * 0.0002);
      yieldValue.value = withTiming(1, { duration: 300 }, () => {
        yieldValue.value = withTiming(0, { duration: 300 });
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Pulse for price card
  useEffect(() => {
    pulseValue.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setProtocols(prev => prev.map(p => ({ ...p, apy: p.apy + (Math.random() - 0.5) * 0.5 })));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(false);
  }, []);

  const calculateSwap = useCallback((input: string) => {
    const sol = parseFloat(input) || 0;
    setMagmaAmount(sol > 0 ? (sol * 100).toFixed(2) : '');
  }, []);

  const handleSwap = useCallback(async () => {
    const amount = parseFloat(solAmount);
    if (!amount || amount <= 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsSwapping(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await swap(amount, 50);
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSolAmount('');
        setMagmaAmount('');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSwapping(false);
    }
  }, [solAmount, swap]);

  const priceStyle = useAnimatedStyle(() => ({ opacity: 0.7 + pulseValue.value * 0.3 }));
  const yieldStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + yieldValue.value * 0.05 }] }));

  // ── Sub-components ────────────────────────────────────────────────────────

  const PriceCard = () => (
    <Animated.View style={[styles.priceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }, priceStyle]}>
      <View style={styles.priceCardHeader}>
        <Text style={[styles.priceCardLabel, { color: theme.textSecondary }]}>SOL/USD</Text>
        {isStale && (
          <View style={[styles.staleBadge, { backgroundColor: theme.textTertiary }]}>
            <Text style={[styles.staleText, { color: theme.bgBase }]}>STALE</Text>
          </View>
        )}
      </View>
      <Text style={[styles.priceCardValue, { color: theme.orange }]}>${formatNumber(price)}</Text>
      <Text style={[styles.priceCardMeta, { color: theme.textSecondary }]}>
        Pyth • {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}
      </Text>
    </Animated.View>
  );

  const YieldCounter = () => (
    <Animated.View style={[styles.yieldCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }, yieldStyle]}>
      <View style={styles.yieldHeader}>
        <Text style={[styles.yieldLabel, { color: theme.textSecondary }]}>Yield Earned Today</Text>
        <Text style={styles.yieldIcon}>📈</Text>
      </View>
      <Text style={[styles.yieldValue, { color: theme.green }]}>${formatNumber(yieldEarned)}</Text>
      <View style={[styles.yieldBreakdown, { borderTopColor: theme.borderSubtle }]}>
        {PROTOCOLS.slice(0, 3).map(protocol => (
          <View key={protocol.id} style={styles.yieldBreakdownItem}>
            <Text style={[styles.yieldBreakdownName, { color: theme.textTertiary }]}>{protocol.name}</Text>
            <Text style={[styles.yieldBreakdownValue, { color: theme.green }]}>
              +${(yieldEarned * (protocol.apy / 34.7)).toFixed(4)}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const SwapWidget = () => (
    <View style={[styles.swapWidget, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[styles.swapWidgetTitle, { color: theme.textPrimary }]}>Quick Swap SOL → $MAGMA</Text>
      <View style={styles.swapInputContainer}>
        <Text style={[styles.swapInputLabel, { color: theme.textSecondary }]}>You Pay</Text>
        <View style={[styles.swapInput, { backgroundColor: theme.bgBase, borderColor: theme.cardBorder }]}>
          <TextInput
            style={[styles.swapTextInput, { color: theme.textPrimary }]}
            placeholder="0.00"
            placeholderTextColor={theme.textTertiary}
            value={solAmount}
            onChangeText={text => { setSolAmount(text); calculateSwap(text); }}
            keyboardType="decimal-pad"
          />
          <View style={[styles.swapTokenBadge, { backgroundColor: theme.orange }]}>
            <Text style={styles.swapTokenBadgeText}>SOL</Text>
          </View>
        </View>
      </View>
      <View style={styles.swapArrow}>
        <Text style={[styles.swapArrowText, { color: theme.textTertiary }]}>↓</Text>
      </View>
      <View style={styles.swapInputContainer}>
        <Text style={[styles.swapInputLabel, { color: theme.textSecondary }]}>You Receive</Text>
        <View style={[styles.swapInput, { backgroundColor: theme.bgElevated, borderColor: theme.cardBorder }]}>
          <TextInput
            style={[styles.swapTextInput, { color: theme.textSecondary }]}
            placeholder="0.00"
            placeholderTextColor={theme.textTertiary}
            value={magmaAmount}
            editable={false}
          />
          <View style={[styles.swapTokenBadge, { backgroundColor: theme.amber }]}>
            <Text style={styles.swapTokenBadgeText}>$MAGMA</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.swapButton, { backgroundColor: theme.orange }, (!solAmount || isSwapping) && styles.swapButtonDisabled]}
        onPress={handleSwap}
        disabled={!solAmount || isSwapping}
        activeOpacity={0.7}
      >
        <Text style={styles.swapButtonText}>{isSwapping ? 'Swapping...' : 'Swap'}</Text>
      </TouchableOpacity>
    </View>
  );

  const VAULT_SEGMENTS = [
    { label: 'Meteora DLMM',  pct: vaultAllocation.meteora,      color: '#00ff88' },
    { label: 'Kamino',        pct: vaultAllocation.kamino,       color: theme.amber },
    { label: 'Save.Finance',  pct: vaultAllocation.save,         color: theme.orange },
    { label: 'Jupiter Lend',  pct: vaultAllocation.jupiter_lend, color: '#9B8FFF' },
    { label: 'SKR Guardian',  pct: vaultAllocation.skr_guardian, color: '#FF6B9D' },
  ];

  const VaultAllocation = () => (
    <View style={[styles.vaultCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[styles.vaultCardTitle, { color: theme.textPrimary }]}>Vault Allocation</Text>
      {/* Segmented bar */}
      <View style={styles.vaultBar}>
        {VAULT_SEGMENTS.map((seg, i) => (
          <View key={i} style={[styles.vaultBarSegment, {
            backgroundColor: seg.color,
            flex: seg.pct,
            borderRadius: i === 0 ? 6 : i === VAULT_SEGMENTS.length - 1 ? 6 : 0,
            borderTopLeftRadius: i === 0 ? 6 : 0,
            borderBottomLeftRadius: i === 0 ? 6 : 0,
            borderTopRightRadius: i === VAULT_SEGMENTS.length - 1 ? 6 : 0,
            borderBottomRightRadius: i === VAULT_SEGMENTS.length - 1 ? 6 : 0,
          }]} />
        ))}
      </View>
      {/* Legend */}
      <View style={styles.allocationList}>
        {VAULT_SEGMENTS.map((seg, i) => (
          <View key={i} style={styles.allocationItem}>
            <View style={[styles.allocationDot, { backgroundColor: seg.color }]} />
            <Text style={[styles.allocationName, { color: theme.textPrimary }]}>{seg.label}</Text>
            <Text style={[styles.allocationPct, { color: theme.textSecondary }]}>{seg.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bgBase }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      bounces={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.orange}
          colors={[theme.orange]}
        />
      }
    >
      <PriceCard />
      <YieldCounter />

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Live APYs</Text>
      <View style={styles.apyCardsContainer}>
        {protocols.map((protocol, index) => (
          <APYCard key={protocol.id} protocol={protocol} index={index} />
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quick Swap</Text>
      <SwapWidget />

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your Vaults</Text>
      <VaultAllocation />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding:       spacing.lg,
    paddingBottom: 32,
  },
  // Price card
  priceCard: {
    borderRadius:  radius.lg,
    padding:       spacing.xl,
    borderWidth:   1,
    marginBottom:  spacing.md,
  },
  priceCardHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing.sm,
  },
  priceCardLabel: {
    fontSize: fontSize.sm,
  },
  staleBadge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      radius.sm,
  },
  staleText: {
    fontSize:   10,
    fontWeight: '700',
  },
  priceCardValue: {
    fontSize:   32,
    fontWeight: '700',
  },
  priceCardMeta: {
    fontSize:  12,
    marginTop: 4,
  },
  // Yield card
  yieldCard: {
    borderRadius: radius.lg,
    padding:      spacing.xl,
    borderWidth:  1,
    marginBottom: spacing.md,
  },
  yieldHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing.sm,
  },
  yieldLabel: {
    fontSize: fontSize.sm,
  },
  yieldIcon: {
    fontSize: 20,
  },
  yieldValue: {
    fontSize:   28,
    fontWeight: '700',
  },
  yieldBreakdown: {
    marginTop:    spacing.md,
    paddingTop:   spacing.md,
    borderTopWidth: 1,
  },
  yieldBreakdownItem: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      6,
  },
  yieldBreakdownName: {
    fontSize: 12,
  },
  yieldBreakdownValue: {
    fontSize:   12,
    fontWeight: '600',
  },
  // Section title
  sectionTitle: {
    fontSize:   18,
    fontWeight: '700',
    marginTop:  spacing.sm,
    marginBottom: spacing.md,
  },
  // APY cards
  apyCardsContainer: {
    gap:          spacing.md,
    marginBottom: spacing.md,
  },
  apyCard: {
    borderRadius: radius.lg,
    padding:      spacing.lg,
    borderWidth:  1,
  },
  apyCardHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  spacing.md,
  },
  apyCardIconWrap: {
    width:         44,
    height:        44,
    borderRadius:  22,
    alignItems:    'center',
    justifyContent:'center',
    marginRight:   spacing.md,
  },
  apyCardEmoji: {
    fontSize: 22,
  },
  apyCardInfo: {
    flex: 1,
  },
  apyCardName: {
    fontSize:   16,
    fontWeight: '700',
  },
  apyCardSub: {
    fontSize:  12,
    marginTop: 2,
  },
  apyCardMetrics: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  apyMetric: {
    flex:       1,
    alignItems: 'center',
  },
  apyMetricValue: {
    fontSize:   20,
    fontWeight: '700',
  },
  apyMetricLabel: {
    fontSize:  11,
    marginTop: 2,
  },
  apyMetricDivider: {
    width:            1,
    height:           36,
    marginHorizontal: spacing.md,
  },
  // Deposit button — orange pill
  depositButton: {
    borderRadius:  radius.full,
    paddingVertical: 12,
    alignItems:    'center',
  },
  depositButtonText: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
  // Swap widget
  swapWidget: {
    borderRadius: radius.lg,
    padding:      spacing.xl,
    borderWidth:  1,
    marginBottom: spacing.md,
  },
  swapWidgetTitle: {
    fontSize:     16,
    fontWeight:   '700',
    marginBottom: spacing.lg,
  },
  swapInputContainer: {
    marginBottom: spacing.md,
  },
  swapInputLabel: {
    fontSize:     12,
    marginBottom: 6,
  },
  swapInput: {
    flexDirection:   'row',
    alignItems:      'center',
    borderRadius:    radius.md,
    borderWidth:     1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  swapTextInput: {
    flex:     1,
    fontSize: 18,
  },
  swapTokenBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical:   6,
    borderRadius:      radius.full,
  },
  swapTokenBadgeText: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
  swapArrow: {
    alignItems:    'center',
    marginVertical: -6,
  },
  swapArrowText: {
    fontSize: 20,
  },
  swapButton: {
    borderRadius:    radius.full,
    paddingVertical: 16,
    alignItems:      'center',
    marginTop:       spacing.sm,
  },
  swapButtonDisabled: {
    opacity: 0.5,
  },
  swapButtonText: {
    fontSize:   16,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
  // Vault allocation
  vaultBar: {
    flexDirection: 'row',
    height:        12,
    borderRadius:  6,
    overflow:      'hidden',
    marginBottom:  spacing.lg,
  },
  vaultBarSegment: {
    height: 12,
  },
  vaultCard: {
    borderRadius: radius.lg,
    padding:      spacing.xl,
    borderWidth:  1,
  },
  vaultCardTitle: {
    fontSize:     16,
    fontWeight:   '700',
    marginBottom: spacing.lg,
  },
  vaultContent: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  donutContainer: {
    position:    'relative',
    marginRight: spacing.xl,
  },
  donut: {
    width:         120,
    height:        120,
    borderRadius:  60,
    flexDirection: 'row',
    overflow:      'hidden',
  },
  donutSegment: {
    height: 120,
  },
  donutHole: {
    position:       'absolute',
    top:            30,
    left:           30,
    width:          60,
    height:         60,
    borderRadius:   30,
    alignItems:     'center',
    justifyContent: 'center',
  },
  donutHoleText: {
    fontSize:   12,
    fontWeight: '700',
  },
  allocationList: {
    flex: 1,
  },
  allocationItem: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  spacing.sm,
  },
  allocationDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    marginRight:  spacing.sm,
  },
  allocationName: {
    flex:     1,
    fontSize: 13,
  },
  allocationPct: {
    fontSize:   13,
    fontWeight: '700',
  },
});

export default DeFiScreen;
