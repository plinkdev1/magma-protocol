import React, { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import NarrativeCard from '../components/NarrativeCard';
import { getDaysRemaining } from '../utils/narrative';
import { usePythPriceFeed } from '../hooks/usePythPriceFeed';
import { useTheme } from '../theme/ThemeContext';

const API_BASE_URL = API_URL;

type FilterType = 'All' | 'Trending' | 'New' | 'Backed';

interface Narrative {
  id: string;
  title: string;
  thesis: string;
  score: number;
  solBacked: number;
  backers: number;
  daysRemaining: number;
  deadline_at?: string;
}

const FILTERS: FilterType[] = ['All', 'Trending', 'New', 'Backed'];

const FeedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { price, lastUpdated, isStale, error: priceError } = usePythPriceFeed();

  const fetchNarratives = useCallback(async (): Promise<Narrative[]> => {
    const response = await axios.get(`${API_BASE_URL}/v1/narratives`, {
      params: { filter: activeFilter.toLowerCase() },
      timeout: 10000,
    });
    const raw = response.data.narratives || [];
    return raw.map((n: any) => ({
      ...n,
      solBacked: n.sol_backed ?? 0,
      stage: (n.status || 'active').toUpperCase(),
      daysRemaining: getDaysRemaining(n.deadline_at),
      score: n.score ?? 0,
      backers: n.backers ?? 0,
    }));
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
    navigation.navigate('NarrativeDetail', { narrativeId });
  }, [navigation]);

  const handleDismiss = useCallback((narrativeId: string) => {
    setDismissedIds(prev => new Set([...prev, narrativeId]));
  }, []);

  const styles = makeStyles(theme);

  const renderPriceTicker = () => (
    <View style={styles.priceTicker}>
      <View style={styles.priceContent}>
        <Text style={styles.priceLabel}>SOL/USD</Text>
        <Text style={priceError ? styles.priceError : styles.priceValue}>
          ${price.toFixed(2)}
        </Text>
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
      onPress={() => handleBack(item.id)}
      onDismiss={() => handleDismiss(item.id)}
    />
  );

  const renderSeparator = () => <View style={styles.separator} />;

  const keyExtractor = useCallback((item: Narrative) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          data={narratives.filter(n => !dismissedIds.has(n.id))}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={renderSeparator}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.orange}
              colors={[theme.orange]}
            />
          }
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

const makeStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bgBase,
    },
    // --- Price ticker ---
    priceTicker: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    priceContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    priceLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginRight: 8,
    },
    priceValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.orange,
    },
    priceError: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    staleBadge: {
      backgroundColor: theme.textTertiary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    staleText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.bgBase,
    },
    priceMeta: {
      fontSize: 11,
      color: theme.textTertiary,
    },
    // --- Filter bar ---
    filterBar: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBg,
    },
    filterButtonActive: {
      backgroundColor: theme.orange,
      borderColor: theme.orange,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    filterTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    // --- List ---
    list: {
      flex: 1,
    },
    listContent: {
      paddingTop: 16,
      paddingBottom: 32,
      paddingHorizontal: 0,
    },
    separator: {
      height: 16,
    },
    // --- Skeleton ---
    skeletonContainer: {
      padding: 16,
      gap: 16,
    },
    skeletonCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    skeletonScore: {
      height: 6,
      backgroundColor: theme.textTertiary,
      borderRadius: 3,
      width: '80%',
      marginBottom: 12,
    },
    skeletonTitle: {
      height: 20,
      backgroundColor: theme.textTertiary,
      borderRadius: 4,
      width: '70%',
      marginBottom: 8,
    },
    skeletonThesis: {
      height: 14,
      backgroundColor: theme.textTertiary,
      borderRadius: 3,
      width: '100%',
      marginBottom: 4,
    },
    skeletonMetrics: {
      height: 40,
      backgroundColor: theme.textTertiary,
      borderRadius: 4,
      width: '100%',
      marginTop: 12,
    },
    // --- Error state ---
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
      color: theme.textPrimary,
      marginBottom: 8,
    },
    errorSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: theme.orange,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 9999,
    },
    retryText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // --- Empty state ---
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
      color: theme.textPrimary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });

export default FeedScreen;
