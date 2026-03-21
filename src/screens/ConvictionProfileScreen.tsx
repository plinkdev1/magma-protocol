import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { radius, spacing, fontSize } from '../theme/tokens';
import { API_URL } from '../config';

// ─── Tier config (mirrors backend conviction.ts) ──────────────────────────────

type ConvictionTier = 'ember' | 'flare' | 'magma' | 'core' | 'volcanic';

interface TierConfig {
  tier:             ConvictionTier;
  label:            string;
  emoji:            string;
  minScore:         number;
  maxScore:         number;
  yieldMultiplier:  number;
  feePct:           number;
  color:            string;
  glowColor:        string;
}

const TIERS: TierConfig[] = [
  { tier: 'ember',    label: 'Ember',         emoji: '⬡',  minScore: 0,    maxScore: 99,   yieldMultiplier: 1.0, feePct: 2.0, color: '#CC7722', glowColor: 'rgba(204,119,34,0.30)' },
  { tier: 'flare',    label: 'Flare',         emoji: '⚡', minScore: 100,  maxScore: 299,  yieldMultiplier: 1.3, feePct: 1.5, color: '#FF6B35', glowColor: 'rgba(255,107,53,0.30)' },
  { tier: 'magma',    label: 'Magma',         emoji: '🌋', minScore: 300,  maxScore: 599,  yieldMultiplier: 1.6, feePct: 1.5, color: '#FF3A1A', glowColor: 'rgba(255,58,26,0.30)'  },
  { tier: 'core',     label: 'Core',          emoji: '💎', minScore: 600,  maxScore: 899,  yieldMultiplier: 2.0, feePct: 1.0, color: '#FF1E0A', glowColor: 'rgba(255,30,10,0.30)'  },
  { tier: 'volcanic', label: 'Volcanic Core', emoji: '🔥', minScore: 900,  maxScore: 1000, yieldMultiplier: 2.5, feePct: 0.0, color: '#FF0000', glowColor: 'rgba(255,0,0,0.40)'    },
];

function getTierFromScore(score: number): TierConfig {
  if (score >= 900) return TIERS[4];
  if (score >= 600) return TIERS[3];
  if (score >= 300) return TIERS[2];
  if (score >= 100) return TIERS[1];
  return TIERS[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  conviction_score:   number;
  creator_score:      number;
  total_backings:     number;
  correct_backings:   number;
  total_backed_sol:   number;
  echo_pool_share:    number;
  echo_pool_amount:   number;
  current_streak:     number;
  best_streak:        number;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label:    string;
  value:    string;
  sub?:     string;
  accent?:  string;
}> = ({ label, value, sub, accent }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[styles.statValue, { color: accent || theme.orange }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      {sub && <Text style={[styles.statSub, { color: theme.textTertiary }]}>{sub}</Text>}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ConvictionProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { account } = useWallet();

  const [profile, setProfile]   = useState<ProfileData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const scoreProgress = useSharedValue(0);
  const cardScale     = useSharedValue(0.95);

  useEffect(() => {
    if (!account) { setLoading(false); return; }
    fetchProfile();
  }, [account]);

  const fetchProfile = async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const walletAddress = account.publicKey?.toString() ?? '';
      const res = await fetch(`${API_URL}/v1/narratives?wallet=${walletAddress}&stats=true`);
      const data = await res.json();

      // Build profile from available data
      // Full profile endpoint comes in Phase G+ — stub remaining fields
      const p: ProfileData = {
        conviction_score:  data.conviction_score  ?? 0,
        creator_score:     data.creator_score     ?? 0,
        total_backings:    data.total_backings     ?? 0,
        correct_backings:  data.correct_backings   ?? 0,
        total_backed_sol:  data.total_backed_sol   ?? 0,
        echo_pool_share:   data.echo_pool_share    ?? 0,
        echo_pool_amount:  data.echo_pool_amount   ?? 0,
        current_streak:    data.current_streak     ?? 0,
        best_streak:       data.best_streak        ?? 0,
      };

      setProfile(p);

      const tierConfig = getTierFromScore(p.conviction_score);
      const progressPct = (p.conviction_score - tierConfig.minScore) /
        (tierConfig.maxScore - tierConfig.minScore);

      scoreProgress.value = withTiming(Math.min(progressPct, 1), { duration: 1000 });
      cardScale.value     = withSpring(1, { damping: 12 });
    } catch (err) {
      setError('Could not load profile');
      // Show empty state with score 0
      setProfile({
        conviction_score: 0, creator_score: 0, total_backings: 0,
        correct_backings: 0, total_backed_sol: 0, echo_pool_share: 0,
        echo_pool_amount: 0, current_streak: 0, best_streak: 0,
      });
      scoreProgress.value = withTiming(0, { duration: 800 });
      cardScale.value     = withSpring(1);
    } finally {
      setLoading(false);
    }
  };

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${scoreProgress.value * 100}%`,
  }));

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bgBase, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.orange} />
      </View>
    );
  }

  if (!account) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bgBase, paddingTop: insets.top }]}>
        <Text style={styles.noWalletIcon}>🔥</Text>
        <Text style={[styles.noWalletTitle, { color: theme.textPrimary }]}>Connect Your Wallet</Text>
        <Text style={[styles.noWalletSub, { color: theme.textSecondary }]}>
          Connect to view your Conviction Profile
        </Text>
      </View>
    );
  }

  const p           = profile ?? { conviction_score: 0, creator_score: 0, total_backings: 0, correct_backings: 0, total_backed_sol: 0, echo_pool_share: 0, echo_pool_amount: 0, current_streak: 0, best_streak: 0 };
  const tierConfig  = getTierFromScore(p.conviction_score);
  const nextTier    = TIERS.find(t => t.minScore > p.conviction_score);
  const accuracy    = p.total_backings > 0
    ? Math.round((p.correct_backings / p.total_backings) * 100)
    : 0;
  const pointsToNext = nextTier ? nextTier.minScore - p.conviction_score : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bgBase }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      bounces={false}
    >

      {/* ── Tier Badge Card ── */}
      <Animated.View style={[
        styles.tierCard,
        { backgroundColor: theme.cardBg, borderColor: tierConfig.color + '40' },
        cardAnimStyle,
      ]}>
        {/* Glow */}
        <View style={[styles.tierGlow, { backgroundColor: tierConfig.glowColor }]} />

        <Text style={[styles.tierEmoji]}>{tierConfig.emoji}</Text>
        <Text style={[styles.tierLabel, { color: tierConfig.color }]}>{tierConfig.label} Tier</Text>
        <Text style={[styles.tierScore, { color: theme.textPrimary }]}>{p.conviction_score}</Text>
        <Text style={[styles.tierScoreLabel, { color: theme.textSecondary }]}>Conviction Score</Text>

        {/* Progress to next tier */}
        {nextTier && (
          <View style={styles.progressSection}>
            <View style={[styles.progressTrack, { backgroundColor: theme.bgElevated }]}>
              <Animated.View style={[
                styles.progressFill,
                { backgroundColor: tierConfig.color },
                progressStyle,
              ]} />
            </View>
            <Text style={[styles.progressLabel, { color: theme.textTertiary }]}>
              {pointsToNext} pts to {nextTier.label}
            </Text>
          </View>
        )}

        {tierConfig.tier === 'volcanic' && (
          <View style={[styles.maxBadge, { backgroundColor: 'rgba(255,0,0,0.15)', borderColor: 'rgba(255,0,0,0.40)' }]}>
            <Text style={[styles.maxBadgeText, { color: '#FF0000' }]}>MAX TIER · FEES WAIVED</Text>
          </View>
        )}
      </Animated.View>

      {/* ── Multipliers ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>YOUR ADVANTAGES</Text>
        <View style={styles.advantagesRow}>
          <View style={[styles.advantageCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.advantageValue, { color: theme.green }]}>{tierConfig.yieldMultiplier}×</Text>
            <Text style={[styles.advantageLabel, { color: theme.textSecondary }]}>Yield Multiplier</Text>
          </View>
          <View style={[styles.advantageCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.advantageValue, { color: tierConfig.feePct === 0 ? theme.green : theme.orange }]}>
              {tierConfig.feePct === 0 ? 'FREE' : `${tierConfig.feePct}%`}
            </Text>
            <Text style={[styles.advantageLabel, { color: theme.textSecondary }]}>Protocol Fee</Text>
          </View>
        </View>
      </View>

      {/* ── Stats grid ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>BACKING STATS</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Accuracy"
            value={`${accuracy}%`}
            sub={`${p.correct_backings}/${p.total_backings} correct`}
            accent={accuracy >= 60 ? theme.green : theme.amber}
          />
          <StatCard
            label="SOL Backed"
            value={`${p.total_backed_sol.toFixed(2)}`}
            sub="total deployed"
          />
          <StatCard
            label="Streak"
            value={`${p.current_streak}`}
            sub={`best: ${p.best_streak}`}
            accent={theme.amber}
          />
          <StatCard
            label="Creator Score"
            value={`${p.creator_score}`}
            sub="narrative submissions"
            accent={theme.textPrimary}
          />
        </View>
      </View>

      {/* ── Echo Pool ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ECHO POOL</Text>
        <View style={[styles.echoCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.echoRow}>
            <View style={styles.echoItem}>
              <Text style={[styles.echoValue, { color: theme.green }]}>
                {(p.echo_pool_share * 100).toFixed(2)}%
              </Text>
              <Text style={[styles.echoLabel, { color: theme.textSecondary }]}>Your Pool Share</Text>
            </View>
            <View style={[styles.echoDivider, { backgroundColor: theme.borderSubtle }]} />
            <View style={styles.echoItem}>
              <Text style={[styles.echoValue, { color: theme.green }]}>
                {p.echo_pool_amount.toFixed(3)} SOL
              </Text>
              <Text style={[styles.echoLabel, { color: theme.textSecondary }]}>Est. Next Payout</Text>
            </View>
          </View>
          <Text style={[styles.echoNote, { color: theme.textTertiary }]}>
            35% of all incorrect backers' capital redistributed monthly to correct backers
          </Text>
        </View>
      </View>

      {/* ── Tier progression ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TIER PROGRESSION</Text>
        {TIERS.map((t, i) => {
          const isActive  = t.tier === tierConfig.tier;
          const isUnlocked = p.conviction_score >= t.minScore;
          return (
            <View
              key={t.tier}
              style={[
                styles.tierRow,
                { borderColor: isActive ? t.color + '60' : theme.cardBorder },
                { backgroundColor: isActive ? t.color + '10' : theme.cardBg },
              ]}
            >
              <Text style={[styles.tierRowEmoji, { opacity: isUnlocked ? 1 : 0.3 }]}>{t.emoji}</Text>
              <View style={styles.tierRowInfo}>
                <Text style={[styles.tierRowName, { color: isActive ? t.color : isUnlocked ? theme.textPrimary : theme.textTertiary }]}>
                  {t.label} {isActive && '← YOU'}
                </Text>
                <Text style={[styles.tierRowRange, { color: theme.textTertiary }]}>
                  Score {t.minScore}–{t.maxScore === 1000 ? '1000' : t.maxScore}
                </Text>
              </View>
              <View style={styles.tierRowRight}>
                <Text style={[styles.tierRowMultiplier, { color: isUnlocked ? theme.green : theme.textTertiary }]}>
                  {t.yieldMultiplier}× yield
                </Text>
                <Text style={[styles.tierRowFee, { color: theme.textTertiary }]}>
                  {t.feePct === 0 ? 'No fee' : `${t.feePct}% fee`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.md,
  },
  noWalletIcon: {
    fontSize: 64,
  },
  noWalletTitle: {
    fontSize:   20,
    fontWeight: '700',
  },
  noWalletSub: {
    fontSize:  14,
    textAlign: 'center',
  },
  // Tier badge card
  tierCard: {
    borderRadius:   radius.xl,
    borderWidth:    1,
    padding:        spacing.xl,
    alignItems:     'center',
    marginBottom:   spacing.lg,
    overflow:       'hidden',
  },
  tierGlow: {
    position:     'absolute',
    top:          -40,
    width:        200,
    height:       200,
    borderRadius: 100,
    opacity:      0.15,
  },
  tierEmoji: {
    fontSize:     56,
    marginBottom: spacing.sm,
  },
  tierLabel: {
    fontSize:     14,
    fontWeight:   '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom:  spacing.sm,
  },
  tierScore: {
    fontSize:   48,
    fontWeight: '700',
    lineHeight: 56,
  },
  tierScoreLabel: {
    fontSize:     12,
    marginBottom: spacing.lg,
  },
  progressSection: {
    width:        '100%',
    alignItems:   'center',
    gap:          spacing.sm,
  },
  progressTrack: {
    width:        '100%',
    height:       6,
    borderRadius: 3,
    overflow:     'hidden',
  },
  progressFill: {
    height:       '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
  },
  maxBadge: {
    marginTop:         spacing.md,
    borderRadius:      radius.full,
    borderWidth:       1,
    paddingVertical:   6,
    paddingHorizontal: spacing.lg,
  },
  maxBadgeText: {
    fontSize:   11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize:      fontSize.xs,
    fontWeight:    '700',
    letterSpacing: 1.2,
    marginBottom:  spacing.md,
  },
  // Advantages
  advantagesRow: {
    flexDirection: 'row',
    gap:           spacing.md,
  },
  advantageCard: {
    flex:           1,
    borderRadius:   radius.lg,
    borderWidth:    1,
    padding:        spacing.lg,
    alignItems:     'center',
    gap:            spacing.sm,
  },
  advantageValue: {
    fontSize:   28,
    fontWeight: '700',
  },
  advantageLabel: {
    fontSize:  12,
    textAlign: 'center',
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.md,
  },
  statCard: {
    width:        '47%',
    borderRadius: radius.lg,
    borderWidth:  1,
    padding:      spacing.lg,
    gap:          3,
  },
  statValue: {
    fontSize:   22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  statSub: {
    fontSize: 11,
  },
  // Echo Pool
  echoCard: {
    borderRadius: radius.lg,
    borderWidth:  1,
    padding:      spacing.xl,
  },
  echoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   spacing.md,
  },
  echoItem: {
    flex:       1,
    alignItems: 'center',
  },
  echoDivider: {
    width:  1,
    height: 40,
  },
  echoValue: {
    fontSize:   22,
    fontWeight: '700',
  },
  echoLabel: {
    fontSize:  12,
    marginTop: 3,
  },
  echoNote: {
    fontSize:   11,
    textAlign:  'center',
    lineHeight: 16,
  },
  // Tier progression rows
  tierRow: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   radius.lg,
    borderWidth:    1,
    padding:        spacing.lg,
    marginBottom:   spacing.sm,
    gap:            spacing.md,
  },
  tierRowEmoji: {
    fontSize: 24,
    width:    32,
    textAlign: 'center',
  },
  tierRowInfo: {
    flex: 1,
  },
  tierRowName: {
    fontSize:   14,
    fontWeight: '700',
    marginBottom: 2,
  },
  tierRowRange: {
    fontSize: 11,
  },
  tierRowRight: {
    alignItems: 'flex-end',
    gap:        2,
  },
  tierRowMultiplier: {
    fontSize:   13,
    fontWeight: '700',
  },
  tierRowFee: {
    fontSize: 11,
  },
});

export default ConvictionProfileScreen;
