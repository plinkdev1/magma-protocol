import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

import { useAuthorization } from '../hooks/useAuthorization';

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

// Mock data interfaces
interface Narrative {
  id: string;
  title: string;
  score: number;
  scoreHistory: number[];
  solBacked: number;
  yieldEarned: number;
  status: 'active' | 'completed' | 'expired';
}

interface BackedNarrative {
  id: string;
  title: string;
  solAmount: number;
  backedAt: Date;
  currentScore: number;
}

interface Payout {
  id: string;
  narrativeId: string;
  narrativeTitle: string;
  amount: number;
  date: Date;
  type: 'yield' | 'exit' | 'bonus';
}

const API_BASE_URL = 'http://localhost:3000';

const PortfolioScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [backedNarratives, setBackedNarratives] = useState<BackedNarrative[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [magmaBalance, setMagmaBalance] = useState(0);
  const [totalYield, setTotalYield] = useState(0.1523);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { account, isConnected } = useAuthorization();
  const yieldValue = useSharedValue(0);
  const pulseValue = useSharedValue(0);

  // Animate yield counter
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalYield((prev) => {
        const increment = 0.00005 + Math.random() * 0.0001;
        return prev + increment;
      });
      yieldValue.value = withTiming(1, { duration: 300 }, () => {
        yieldValue.value = withTiming(0, { duration: 300 });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Pulse animation for balance
  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        setNotificationsEnabled(true);
        await Notifications.setBadgeCounterAsync(0);
      }
    } catch (error) {
      console.error('[PortfolioScreen] Notification permission failed:', error);
    }
  }, []);

  // Toggle notifications
  const toggleNotifications = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      await requestNotificationPermission();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }, [requestNotificationPermission]);

  // Fetch portfolio data
  const fetchPortfolioData = useCallback(async () => {
    if (!isConnected || !account) return;

    try {
      const [narrativesRes, backedRes, payoutsRes, balanceRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/v1/users/${account.toBase58()}/narratives`),
        axios.get(`${API_BASE_URL}/v1/users/${account.toBase58()}/backed`),
        axios.get(`${API_BASE_URL}/v1/users/${account.toBase58()}/payouts`),
        axios.get(`${API_BASE_URL}/v1/users/${account.toBase58()}/balance`),
      ]);

      setNarratives(narrativesRes.data);
      setBackedNarratives(backedRes.data);
      setPayouts(payoutsRes.data);
      setMagmaBalance(balanceRes.data.magma);
      setIsLoading(false);
    } catch (error) {
      console.error('[PortfolioScreen] Fetch failed:', error);
      setIsLoading(false);
    }
  }, [isConnected, account]);

  // Initial load
  useEffect(() => {
    if (isConnected && account) {
      fetchPortfolioData();
    }
  }, [isConnected, account, fetchPortfolioData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPortfolioData();
    setRefreshing(false);
  }, [fetchPortfolioData]);

  // Animated yield style
  const yieldStyle = useAnimatedStyle(() => {
    const scale = 1 + yieldValue.value * 0.03;
    return { transform: [{ scale }] };
  });

  // Animated balance style
  const balanceStyle = useAnimatedStyle(() => {
    const opacity = 0.8 + pulseValue.value * 0.2;
    return { opacity };
  });

  // Format number
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Sparkline component
  const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 30;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <View style={styles.sparklineContainer}>
        <svg height={height} width={width}>
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
        </svg>
      </View>
    );
  };

  // Narrative Card component
  const NarrativeCard = ({ narrative, index }: { narrative: Narrative; index: number }) => {
    const cardProgress = useSharedValue(0);

    useEffect(() => {
      cardProgress.value = withTiming(1, { duration: 400, delay: index * 100 });
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: cardProgress.value,
      transform: [{ translateX: (1 - cardProgress.value) * -20 }],
    }));

    const scoreColor = narrative.score >= 75 ? COLORS.success : narrative.score >= 50 ? COLORS.accent : COLORS.muted;

    return (
      <Animated.View style={[styles.narrativeCard, cardStyle]}>
        <View style={styles.narrativeCardHeader}>
          <View style={styles.narrativeCardInfo}>
            <Text style={styles.narrativeCardTitle} numberOfLines={2}>
              {narrative.title}
            </Text>
            <View style={styles.narrativeCardMeta}>
              <Text style={[styles.narrativeCardStatus, { color: scoreColor }]}>
                Score: {narrative.score}
              </Text>
              <Text style={styles.narrativeCardStatus}>•</Text>
              <Text style={styles.narrativeCardStatus}>{narrative.status}</Text>
            </View>
          </View>
          {narrative.scoreHistory.length > 0 && (
            <Sparkline data={narrative.scoreHistory} color={scoreColor} />
          )}
        </View>

        <View style={styles.narrativeCardMetrics}>
          <View style={styles.narrativeMetric}>
            <Text style={styles.narrativeMetricValue}>{narrative.solBacked.toFixed(2)}</Text>
            <Text style={styles.narrativeMetricLabel}>SOL Backed</Text>
          </View>
          <View style={styles.narrativeMetricDivider} />
          <View style={styles.narrativeMetric}>
            <Text style={[styles.narrativeMetricValue, { color: COLORS.success }]}>
              {narrative.yieldEarned.toFixed(4)}
            </Text>
            <Text style={styles.narrativeMetricLabel}>Yield Earned</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Backed Narrative Card component
  const BackedNarrativeCard = ({ item, index }: { item: BackedNarrative; index: number }) => {
    const cardProgress = useSharedValue(0);

    useEffect(() => {
      cardProgress.value = withTiming(1, { duration: 400, delay: index * 100 });
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: cardProgress.value,
      transform: [{ translateX: (1 - cardProgress.value) * -20 }],
    }));

    return (
      <Animated.View style={[styles.backedCard, cardStyle]}>
        <View style={styles.backedCardHeader}>
          <View style={styles.backedCardIcon}>
            <Text style={styles.backedCardIconText}>🔥</Text>
          </View>
          <View style={styles.backedCardInfo}>
            <Text style={styles.backedCardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.backedCardDate}>
              Backed {formatDate(item.backedAt)}
            </Text>
          </View>
          <View style={styles.backedCardAmount}>
            <Text style={styles.backedCardValue}>{item.solAmount.toFixed(2)}</Text>
            <Text style={styles.backedCardLabel}>SOL</Text>
          </View>
        </View>
        <View style={styles.backedCardScore}>
          <Text style={styles.backedCardScoreLabel}>Current Score:</Text>
          <Text style={styles.backedCardScoreValue}>{item.currentScore}</Text>
        </View>
      </Animated.View>
    );
  };

  // Payout Card component
  const PayoutCard = ({ payout, index }: { payout: Payout; index: number }) => {
    const cardProgress = useSharedValue(0);

    useEffect(() => {
      cardProgress.value = withTiming(1, { duration: 400, delay: index * 100 });
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: cardProgress.value,
      transform: [{ translateX: (1 - cardProgress.value) * -20 }],
    }));

    const typeColors = {
      yield: COLORS.success,
      exit: COLORS.primary,
      bonus: COLORS.accent,
    };

    return (
      <Animated.View style={[styles.payoutCard, cardStyle]}>
        <View style={styles.payoutCardHeader}>
          <View style={styles.payoutCardIcon}>
            <Text style={styles.payoutCardIconText}>💰</Text>
          </View>
          <View style={styles.payoutCardInfo}>
            <Text style={styles.payoutCardTitle} numberOfLines={1}>
              {payout.narrativeTitle}
            </Text>
            <Text style={styles.payoutCardDate}>{formatDate(payout.date)}</Text>
          </View>
          <View style={[styles.payoutCardAmount, { borderColor: typeColors[payout.type] }]}>
            <Text style={[styles.payoutCardValue, { color: typeColors[payout.type] }]}>
              +{formatNumber(payout.amount)}
            </Text>
            <Text style={styles.payoutCardLabel}>{payout.type.toUpperCase()}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Balance Card component
  const BalanceCard = () => (
    <Animated.View style={[styles.balanceCard, balanceStyle]}>
      <View style={styles.balanceCardHeader}>
        <Text style={styles.balanceCardLabel}>$MAGMA Balance</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>⟳</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.balanceCardValue}>{formatNumber(magmaBalance)}</Text>
      <Text style={styles.balanceCardAddress}>
        {account ? `${account.toBase58().slice(0, 4)}...${account.toBase58().slice(-4)}` : 'Not connected'}
      </Text>
    </Animated.View>
  );

  // Yield Card component
  const YieldCard = () => (
    <Animated.View style={[styles.yieldCard, yieldStyle]}>
      <View style={styles.yieldCardHeader}>
        <Text style={styles.yieldCardLabel}>Total Yield Earned</Text>
        <Text style={styles.yieldCardIcon}>📈</Text>
      </View>
      <Text style={styles.yieldCardValue}>{formatNumber(totalYield)} SOL</Text>
      <View style={styles.yieldCardSubtext}>
        <Text style={styles.yieldCardSubtextValue}>+{(totalYield * 0.05).toFixed(4)} today</Text>
      </View>
    </Animated.View>
  );

  // Empty State component
  const EmptyState = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
    <Animated.View style={styles.emptyState} entering={FadeIn} exiting={FadeOut}>
      <Text style={styles.emptyStateIcon}>{icon}</Text>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
    </Animated.View>
  );

  // Section Header component
  const SectionHeader = ({ title, count }: { title: string; count?: number }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      {count !== undefined && (
        <View style={styles.sectionHeaderBadge}>
          <Text style={styles.sectionHeaderBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
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
      {/* Balance Card */}
      <BalanceCard />

      {/* Yield Card */}
      <YieldCard />

      {/* Notifications Toggle */}
      <View style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsLabel}>Score Updates</Text>
            <Text style={styles.settingsDescription}>
              Get notified when your narrative scores change
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.primary }}
            thumbColor={COLORS.background}
          />
        </View>
      </View>

      {/* My Narratives */}
      <SectionHeader title="My Narratives" count={narratives.length} />
      {narratives.length > 0 ? (
        <View style={styles.narrativesContainer}>
          {narratives.map((narrative, index) => (
            <NarrativeCard key={narrative.id} narrative={narrative} index={index} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="📝"
          title="No narratives yet"
          subtitle="Create your first narrative from the Launch tab"
        />
      )}

      {/* Backed Narratives */}
      <SectionHeader title="Backed Narratives" count={backedNarratives.length} />
      {backedNarratives.length > 0 ? (
        <View style={styles.backedContainer}>
          {backedNarratives.map((item, index) => (
            <BackedNarrativeCard key={item.id} item={item} index={index} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="👛"
          title="No backed narratives"
          subtitle="Back narratives from the Feed to earn yield"
        />
      )}

      {/* Payout History */}
      <SectionHeader title="Payout History" count={payouts.length} />
      {payouts.length > 0 ? (
        <View style={styles.payoutsContainer}>
          {payouts.map((payout, index) => (
            <PayoutCard key={payout.id} payout={payout} index={index} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="💰"
          title="No payouts yet"
          subtitle="Payouts will appear here when you earn yield"
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceCardLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
    color: COLORS.text,
  },
  balanceCardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Syne-Bold',
  },
  balanceCardAddress: {
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
  yieldCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  yieldCardLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  yieldCardIcon: {
    fontSize: 20,
  },
  yieldCardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.success,
    fontFamily: 'Syne-Bold',
  },
  yieldCardSubtext: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  yieldCardSubtextValue: {
    fontSize: 12,
    color: COLORS.success,
    fontFamily: 'Syne-Regular',
  },
  settingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
  settingsDescription: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    fontFamily: 'Syne-Regular',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Syne-Bold',
  },
  sectionHeaderBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  narrativesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  narrativeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  narrativeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  narrativeCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  narrativeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    fontFamily: 'Syne-Bold',
  },
  narrativeCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  narrativeCardStatus: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  sparklineContainer: {
    width: 80,
    height: 30,
    alignItems: 'flex-end',
  },
  narrativeCardMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  narrativeMetric: {
    flex: 1,
    alignItems: 'center',
  },
  narrativeMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Syne-Bold',
  },
  narrativeMetricLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    fontFamily: 'Syne-Regular',
  },
  narrativeMetricDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 12,
  },
  backedContainer: {
    gap: 12,
    marginBottom: 16,
  },
  backedCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  backedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backedCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backedCardIconText: {
    fontSize: 22,
  },
  backedCardInfo: {
    flex: 1,
  },
  backedCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: 'Syne-Bold',
  },
  backedCardDate: {
    fontSize: 11,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  backedCardAmount: {
    alignItems: 'flex-end',
  },
  backedCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Syne-Bold',
  },
  backedCardLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  backedCardScore: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  backedCardScoreLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginRight: 8,
    fontFamily: 'Syne-Regular',
  },
  backedCardScoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
    fontFamily: 'Syne-Bold',
  },
  payoutsContainer: {
    gap: 12,
  },
  payoutCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  payoutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  payoutCardIconText: {
    fontSize: 22,
  },
  payoutCardInfo: {
    flex: 1,
  },
  payoutCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: 'Syne-Bold',
  },
  payoutCardDate: {
    fontSize: 11,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  payoutCardAmount: {
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  payoutCardValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Syne-Bold',
  },
  payoutCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.muted,
    marginTop: 2,
    fontFamily: 'Syne-Bold',
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: 'Syne-Bold',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    fontFamily: 'Syne-Regular',
  },
});

export default PortfolioScreen;
