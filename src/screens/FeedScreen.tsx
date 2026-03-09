import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import NarrativeCard, { NarrativeCardProps } from '../components/NarrativeCard';
import { usePythPriceFeed } from '../hooks/usePythPriceFeed';

// Design tokens
const COLORS = {
  background: '#080400',
  primary: '#ff6b35',
  accent: '#ffb347',
  text: '#f0d8c0',
  muted: '#7a4a30',
  card: '#1a0f0a',
  cardBorder: '#3d2a1f',
};

const API_BASE_URL = 'http://YOUR_PC_IP:3000';

type FilterType = 'All' | 'Trending' | 'New' | 'Backed';

interface Narrative {
  id: string;
  title: string;
  thesis: string;
  score: number;
  solBacked: number;
  backers: number;
  daysRemaining: number;
}

const FILTERS: FilterType[] = ['All', 'Trending', 'New', 'Backed'];

const FeedScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { price, confidence, lastUpdated, isStale, error: priceError } = usePythPriceFeed();

  const fetchNarratives = useCallback(async (): Promise<Narrative[]> => {
    const response = await axios.get(`${API_BASE_URL}/v1/narratives`, {
      params: { filter: activeFilter.toLowerCase() },
      timeout: 10000,
    });
    return response.data;
  }, [activeFilter]);

  const {
    data: narratives,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Narrative[]>({
    queryKey: ['narratives', activeFilter],
    queryFn: fetchNarratives,
    staleTime: 30000,
    retry: 2,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['narratives'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleBack = useCallback((narrativeId: string) => {
    console.log('[FeedScreen] Backing narrative:', narrativeId);
    // TODO: Navigate to LaunchScreen or open backing modal
  }, []);

  const handleDismiss = useCallback((narrativeId: string) => {
    console.log('[FeedScreen] Dismissing narrative:', narrativeId);
    // TODO: Mark as dismissed in user preferences
  }, []);

  const renderPriceTicker = () => (
    <View style={styles.priceTicker}>
      <View style={styles.priceContent}>
        <Text style={styles.priceLabel}>SOL/USD</Text>
        {priceError ? (
          <Text style={styles.priceError}>${price.toFixed(2)}</Text>
        ) : (
          <Text style={styles.priceValue}>${price.toFixed(2)}</Text>
        )}
        {isStale && (
          <View style={styles.staleBadge}>
            <Text style={styles.staleText}>STALE</Text>
          </View>
        )}
      </View>
      <Text style={styles.priceMeta}>
        Pyth • {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}
      </Text>
    </View>
  );

  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      {FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            activeFilter === filter && styles.filterButtonActive,
          ]}
          onPress={() => setActiveFilter(filter)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === filter && styles.filterTextActive,
            ]}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonScore} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonThesis} />
          <View style={styles.skeletonMetrics} />
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <Animated.View style={styles.emptyState} entering={FadeIn} exiting={FadeOut}>
      <Text style={styles.emptyIcon}>🔥</Text>
      <Text style={styles.emptyTitle}>No narratives yet</Text>
      <Text style={styles.emptySubtitle}>
        Check back soon for new opportunities
      </Text>
    </Animated.View>
  );

  const renderItem = ({ item }: { item: Narrative }) => (
    <NarrativeCard
      title={item.title}
      thesis={item.thesis}
      score={item.score}
      solBacked={item.solBacked}
      backers={item.backers}
      daysRemaining={item.daysRemaining}
      onBack={() => handleBack(item.id)}
      onDismiss={() => handleDismiss(item.id)}
    />
  );

  const keyExtractor = useCallback((item: Narrative) => item.id, []);

  return (
    <View style={styles.container}>
      {renderPriceTicker()}
      {renderFilterBar()}

      {isLoading ? (
        renderSkeleton()
      ) : isError ? (
        <View style={styles.errorState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to load narratives</Text>
          <Text style={styles.errorSubtitle}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : narratives && narratives.length > 0 ? (
        <FlatList
          data={narratives}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  priceTicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  priceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginRight: 8,
    fontFamily: 'Syne-Regular',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Syne-Bold',
  },
  priceError: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.muted,
    fontFamily: 'Syne-Bold',
  },
  staleBadge: {
    backgroundColor: COLORS.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  staleText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  priceMeta: {
    fontSize: 11,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  filterTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  skeletonContainer: {
    padding: 16,
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  skeletonScore: {
    height: 6,
    backgroundColor: COLORS.muted,
    borderRadius: 3,
    width: '80%',
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: COLORS.muted,
    borderRadius: 4,
    width: '70%',
    marginBottom: 8,
  },
  skeletonThesis: {
    height: 14,
    backgroundColor: COLORS.muted,
    borderRadius: 3,
    width: '100%',
    marginBottom: 4,
  },
  skeletonMetrics: {
    height: 40,
    backgroundColor: COLORS.muted,
    borderRadius: 4,
    width: '100%',
    marginTop: 12,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: 'Syne-Bold',
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Syne-Regular',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: 'Syne-Bold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    fontFamily: 'Syne-Regular',
  },
});

export default FeedScreen;
