import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  interpolateColor,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { usePythPriceFeed } from '../hooks/usePythPriceFeed';
import { EcosystemGrid } from '../components/EcosystemGrid';
import { useJupiterSwap } from '../hooks/useMagmaTransactions';

// Design tokens
const COLORS = {
  background: '#080400',
  primary: '#ff6b35',
  accent: '#ffb347',
  text: '#f0d8c0',
  muted: '#7a4a30',
  card: '#1a0f0a',
  cardBorder: '#3d2a1f',
  success: '#00ff88',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PROTOCOL_LOGOS: Record<string, any> = {
  meteora: require('../../assets/logos/protocols/meteora.jpg'),
  kamino:  require('../../assets/logos/protocols/kamino.jpg'),
  save:    require('../../assets/logos/protocols/save.jpg'),
};


// Protocol data
interface Protocol {
  id: string;
  name: string;
  apy: number;
  tvl: number;
  description: string;
  color: string;
}

const PROTOCOLS: Protocol[] = [
  { id: 'meteora', name: 'Meteora DLMM', apy: 18.4, tvl: 45000000, description: 'Dynamic Liquidity Market Maker', color: '#00ff88' },
  { id: 'kamino', name: 'Kamino', apy: 9.2, tvl: 120000000, description: 'Automated liquidity vaults', color: '#ffb347' },
  { id: 'save', name: 'Save.Finance', apy: 7.1, tvl: 85000000, description: 'Lending protocol', color: '#ff6b35' },
];

// Format large numbers
const formatTVL = (tvl: number) => {
  if (tvl >= 1000000000) return `$${(tvl / 1000000000).toFixed(1)}B`;
  if (tvl >= 1000000) return `$${(tvl / 1000000).toFixed(1)}M`;
  if (tvl >= 1000) return `$${(tvl / 1000).toFixed(1)}K`;
  return `$${tvl}`;
};

const formatNumber = (num: number) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const DeFiScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [protocols, setProtocols] = useState<Protocol[]>(PROTOCOLS);
  const [solAmount, setSolAmount] = useState('');
  const [magmaAmount, setMagmaAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [yieldEarned, setYieldEarned] = useState(0.0234);
  const [vaultAllocation, setVaultAllocation] = useState({
    meteora: 45,
    kamino: 35,
    save: 20,
  });

  const { price, confidence, lastUpdated, isStale } = usePythPriceFeed();
  const { swap } = useJupiterSwap();
  const yieldValue = useSharedValue(0);
  const pulseValue = useSharedValue(0);

  // Animate yield counter every second
  useEffect(() => {
    const interval = setInterval(() => {
      setYieldEarned((prev) => {
        const increment = 0.0001 + Math.random() * 0.0002;
        return prev + increment;
      });
      yieldValue.value = withTiming(1, { duration: 300 }, () => {
        yieldValue.value = withTiming(0, { duration: 300 });
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Pulse animation for price
  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate APY update
    setProtocols((prev) =>
      prev.map((p) => ({
        ...p,
        apy: p.apy + (Math.random() - 0.5) * 0.5,
      }))
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(false);
  }, []);

  // Calculate swap output
  const calculateSwap = useCallback((input: string) => {
    const sol = parseFloat(input) || 0;
    // Mock rate: 1 SOL = 100 MAGMA (replace with actual Jupiter quote)
    const magma = sol * 100;
    setMagmaAmount(magma > 0 ? magma.toFixed(2) : '');
  }, []);

  // Handle swap
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
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSwapping(false);
    }
  }, [solAmount, swap]);

  // Animated price style
  const priceStyle = useAnimatedStyle(() => {
    const opacity = 0.7 + pulseValue.value * 0.3;
    return { opacity };
  });

  // Animated yield style
  const yieldStyle = useAnimatedStyle(() => {
    const scale = 1 + yieldValue.value * 0.05;
    return { transform: [{ scale }] };
  });

  // Donut chart segments
  const renderDonutSegment = (percentage: number, color: string, startAngle: number) => {
    const size = 120;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = (percentage / 100) * circumference;

    return {
      percentage,
      color,
      strokeDasharray,
      circumference,
    };
  };

  // APY Card component
  const APYCard = ({ protocol, index }: { protocol: Protocol; index: number }) => {
    const cardProgress = useSharedValue(0);

    useEffect(() => {
      cardProgress.value = withTiming(1, { duration: 400, delay: index * 100 });
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: cardProgress.value,
      transform: [{ translateY: (1 - cardProgress.value) * 20 }],
    }));

    return (
      <Animated.View style={[styles.apyCard, cardStyle]}>
        <View style={styles.apyCardHeader}>
          <View style={styles.apyCardIcon}>
            <Image source={PROTOCOL_LOGOS[protocol.id]} style={{ width: 32, height: 32, borderRadius: 8 }} resizeMode="contain" />
          </View>
          <View style={styles.apyCardInfo}>
            <Text style={styles.apyCardName}>{protocol.name}</Text>
            <Text style={styles.apyCardDescription}>{protocol.description}</Text>
          </View>
        </View>

        <View style={styles.apyCardMetrics}>
          <View style={styles.apyMetric}>
            <Text style={styles.apyMetricValue}>
              {protocol.apy.toFixed(1)}%
            </Text>
            <Text style={styles.apyMetricLabel}>APY</Text>
          </View>
          <View style={styles.apyMetricDivider} />
          <View style={styles.apyMetric}>
            <Text style={styles.apyMetricValue}>{formatTVL(protocol.tvl)}</Text>
            <Text style={styles.apyMetricLabel}>TVL</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.depositButton, { borderColor: protocol.color }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.depositButtonText, { color: protocol.color }]}>
            Deposit
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Price Card component
  const PriceCard = () => (
    <Animated.View style={[styles.priceCard, priceStyle]}>
      <View style={styles.priceCardHeader}>
        <Text style={styles.priceCardLabel}>SOL/USD</Text>
        {isStale && (
          <View style={styles.staleBadge}>
            <Text style={styles.staleText}>STALE</Text>
          </View>
        )}
      </View>
      <Text style={styles.priceCardValue}>${formatNumber(price)}</Text>
      <Text style={styles.priceCardMeta}>
        Pyth • {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}
      </Text>
    </Animated.View>
  );

  // Swap Widget component
  const SwapWidget = () => (
    <View style={styles.swapWidget}>
      <Text style={styles.swapWidgetTitle}>Swap SOL → $MAGMA</Text>

      <View style={styles.swapInputContainer}>
        <Text style={styles.swapInputLabel}>You Pay</Text>
        <View style={styles.swapInput}>
          <TextInput
            style={styles.swapTextInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.muted}
            value={solAmount}
            onChangeText={(text) => {
              setSolAmount(text);
              calculateSwap(text);
            }}
            keyboardType="decimal-pad"
          />
          <View style={styles.swapTokenBadge}>
            <Text style={styles.swapTokenBadgeText}>SOL</Text>
          </View>
        </View>
      </View>

      <View style={styles.swapArrow}>
        <Text style={styles.swapArrowText}>↓</Text>
      </View>

      <View style={styles.swapInputContainer}>
        <Text style={styles.swapInputLabel}>You Receive</Text>
        <View style={[styles.swapInput, styles.swapOutput]}>
          <TextInput
            style={[styles.swapTextInput, styles.swapOutputText]}
            placeholder="0.00"
            placeholderTextColor={COLORS.muted}
            value={magmaAmount}
            editable={false}
          />
          <View style={[styles.swapTokenBadge, styles.swapTokenBadgeMagma]}>
            <Text style={styles.swapTokenBadgeText}>$MAGMA</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.swapButton,
          (!solAmount || isSwapping) && styles.swapButtonDisabled,
        ]}
        onPress={handleSwap}
        disabled={!solAmount || isSwapping}
        activeOpacity={0.7}
      >
        {isSwapping ? (
          <Text style={styles.swapButtonText}>Swapping...</Text>
        ) : (
          <Text style={styles.swapButtonText}>Swap</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Vault Allocation component
  const VaultAllocation = () => {
    const segments = [
      renderDonutSegment(vaultAllocation.meteora, PROTOCOLS[0].color, 0),
      renderDonutSegment(vaultAllocation.kamino, PROTOCOLS[1].color, vaultAllocation.meteora),
      renderDonutSegment(vaultAllocation.save, PROTOCOLS[2].color, vaultAllocation.meteora + vaultAllocation.kamino),
    ];

    return (
      <View style={styles.vaultCard}>
        <Text style={styles.vaultCardTitle}>Vault Allocation</Text>
        <View style={styles.vaultContent}>
          <View style={styles.donutContainer}>
            <View style={styles.donut}>
              {segments.map((segment, index) => (
                <View
                  key={index}
                  style={[
                    styles.donutSegment,
                    {
                      backgroundColor: segment.color,
                      width: `${segment.percentage}%`,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.donutHole}>
              <Text style={styles.donutHoleText}>100%</Text>
            </View>
          </View>

          <View style={styles.allocationList}>
            {PROTOCOLS.map((protocol) => (
              <View key={protocol.id} style={styles.allocationItem}>
                <View style={styles.allocationIndicator}>
                  <View
                    style={[
                      styles.allocationDot,
                      { backgroundColor: protocol.color },
                    ]}
                  />
                </View>
                <Text style={styles.allocationName}>{protocol.name}</Text>
                <Text style={styles.allocationPercentage}>
                  {vaultAllocation[protocol.id as keyof typeof vaultAllocation]}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Yield Counter component
  const YieldCounter = () => (
    <Animated.View style={[styles.yieldCard, yieldStyle]}>
      <View style={styles.yieldHeader}>
        <Text style={styles.yieldLabel}>Yield Earned Today</Text>
        <Text style={styles.yieldIcon}>📈</Text>
      </View>
      <Text style={styles.yieldValue}>${formatNumber(yieldEarned)}</Text>
      <View style={styles.yieldBreakdown}>
        {PROTOCOLS.map((protocol) => (
          <View key={protocol.id} style={styles.yieldBreakdownItem}>
            <Text style={styles.yieldBreakdownName}>{protocol.name}</Text>
            <Text style={[styles.yieldBreakdownValue, { color: protocol.color }]}>
              +${(yieldEarned * (protocol.apy / 34.7)).toFixed(4)}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Price Card */}
      <PriceCard />

      {/* Yield Counter */}
      <YieldCounter />

      {/* APY Cards */}
      <Text style={styles.sectionTitle}>Live APYs</Text>
      <View style={styles.apyCardsContainer}>
        {protocols.map((protocol, index) => (
          <APYCard key={protocol.id} protocol={protocol} index={index} />
        ))}
      </View>

      {/* Swap Widget */}
      <Text style={styles.sectionTitle}>Quick Swap</Text>
      <SwapWidget />

      {/* Vault Allocation */}
      <Text style={styles.sectionTitle}>Your Vaults</Text>
      <VaultAllocation />
      <EcosystemGrid />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 0,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  priceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  priceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceCardLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  staleBadge: {
    backgroundColor: COLORS.muted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  staleText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  priceCardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Syne-Bold',
  },
  priceCardMeta: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    fontFamily: 'Syne-Regular',
  },
  yieldCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  yieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  yieldLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  yieldIcon: {
    fontSize: 20,
  },
  yieldValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.success,
    fontFamily: 'Syne-Bold',
  },
  yieldBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  yieldBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  yieldBreakdownName: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  yieldBreakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Syne-Bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 12,
    fontFamily: 'Syne-Bold',
  },
  apyCardsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  apyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  apyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  apyCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  apyCardIconText: {
    fontSize: 22,
  },
  apyCardInfo: {
    flex: 1,
  },
  apyCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Syne-Bold',
  },
  apyCardDescription: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    fontFamily: 'Syne-Regular',
  },
  apyCardMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  apyMetric: {
    flex: 1,
    alignItems: 'center',
  },
  apyMetricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Syne-Bold',
  },
  apyMetricLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    fontFamily: 'Syne-Regular',
  },
  apyMetricDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 12,
  },
  depositButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  depositButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Syne-Bold',
  },
  swapWidget: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  swapWidgetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: 'Syne-Bold',
  },
  swapInputContainer: {
    marginBottom: 12,
  },
  swapInputLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 6,
    fontFamily: 'Syne-Regular',
  },
  swapInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  swapOutput: {
    backgroundColor: COLORS.cardBorder,
  },
  swapTextInput: {
    flex: 1,
    fontSize: 18,
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
  swapOutputText: {
    color: COLORS.muted,
  },
  swapTokenBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  swapTokenBadgeMagma: {
    backgroundColor: COLORS.accent,
  },
  swapTokenBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  swapArrow: {
    alignItems: 'center',
    marginVertical: -6,
  },
  swapArrowText: {
    fontSize: 20,
    color: COLORS.muted,
  },
  swapButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  swapButtonDisabled: {
    opacity: 0.5,
  },
  swapButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  vaultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  vaultCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: 'Syne-Bold',
  },
  vaultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donutContainer: {
    position: 'relative',
    marginRight: 20,
  },
  donut: {
    width: 120,
    height: 120,
    borderRadius: 60,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  donutSegment: {
    height: 120,
  },
  donutHole: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutHoleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Syne-Bold',
  },
  allocationList: {
    flex: 1,
  },
  allocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  allocationIndicator: {
    width: 12,
    marginRight: 8,
  },
  allocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allocationName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
  allocationPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    fontFamily: 'Syne-Bold',
  },
});

export default DeFiScreen;
