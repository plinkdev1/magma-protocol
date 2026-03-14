import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Clipboard,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useNarrative } from '../hooks/useNarrative';
import { useWallet } from '../context/WalletContext';
import { useBackNarrative } from '../hooks/useBackNarrative';
import { RootStackParamList } from '../../App';

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NarrativeDetail'>;
  route: RouteProp<RootStackParamList, 'NarrativeDetail'>;
};

type KitTab = 'Hooks' | 'Article' | 'Thread';
type Token = 'SOL' | 'SKR';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#080400',
  primary: '#ff6b35',
  accent: '#ffb347',
  text: '#f0d8c0',
  muted: '#7a4a30',
  card: '#1a0f0a',
  border: '#3d2a1f',
  success: '#00ff88',
  info: '#00c4ff',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const truncateWallet = (addr: string) =>
  addr?.length > 12 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr ?? '–';

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getTierColor = (score: number) => {
  if (score >= 90) return C.success;
  if (score >= 75) return C.info;
  if (score >= 50) return C.primary;
  if (score >= 25) return C.accent;
  return C.muted;
};

const getTierLabel = (score: number) => {
  if (score >= 90) return 'LEGEND';
  if (score >= 75) return 'ORACLE';
  if (score >= 50) return 'ARCHITECT';
  if (score >= 25) return 'SIGNAL';
  return 'OBSERVER';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const CopyButton = ({ text }: { text: string }) => (
  <TouchableOpacity
    style={styles.copyBtn}
    onPress={() => Clipboard.setString(text)}
    activeOpacity={0.7}
  >
    <Copy size={14} color={C.muted} />
  </TouchableOpacity>
);

// ─── Main screen ─────────────────────────────────────────────────────────────

const NarrativeDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { narrativeId } = route.params;
  const insets = useSafeAreaInsets();
  const { account } = useWallet();
  const { narrative, backers, loading, error, refetch } = useNarrative(narrativeId);

  const [activeKitTab, setActiveKitTab] = useState<KitTab>('Hooks');
  const [selectedToken, setSelectedToken] = useState<Token>('SOL');
  const [backAmount, setBackAmount] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const { backNarrative, backing, txSignature, error: backError } = useBackNarrative();
  const handleBackNarrative = useCallback(async () => {
    if (!narrativeId) return;
    const amount = parseFloat(backAmount);
    if (isNaN(amount) || amount <= 0) return;
    try { await backNarrative(narrativeId, amount, selectedToken); } catch (e) {}
  }, [narrativeId, backAmount, selectedToken, backNarrative]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleOpenSolscan = useCallback((sig: string) => {
    Linking.openURL(`https://solscan.io/tx/${sig}?cluster=devnet`);
  }, []);

  // ── Loading / Error states ──
  if (loading) {
    return (
      <View style={[styles.centerFill, { paddingTop: insets.top, backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading narrative...</Text>
      </View>
    );
  }

  if (error || !narrative) {
    return (
      <View style={[styles.centerFill, { paddingTop: insets.top, backgroundColor: C.bg }]}>
        <Text style={styles.errorText}>{error ?? 'Narrative not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scoreColor = getTierColor(narrative.score);
  const tierLabel = getTierLabel(narrative.score);
  const totalBacked = (narrative.total_backed_sol ?? narrative.sol_backed ?? 0);
  const backerCount = narrative.backer_count ?? narrative.backers ?? 0;

  // ── Kit content ──
  const hooks: string[] = narrative.kit_hooks ?? [];
  const article: string = narrative.kit_article ?? '';
  const thread: string = narrative.kit_thread ?? '';
  const hasKit = hooks.length > 0 || article || thread;

  // ── Oracle badge ──
  const oracleStatus = narrative.oracle_status ?? 'pending';
  const oracleBadgeColor =
    oracleStatus === 'resolved' ? C.success :
    oracleStatus === 'running' ? C.accent :
    C.muted;

  // ── Estimated yield (stub for Phase D) ──
  const estimatedYield = backAmount
    ? (parseFloat(backAmount || '0') * 0.072).toFixed(4)
    : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color={C.text} />
          <Text style={styles.backLabel}>Feed</Text>
        </TouchableOpacity>
        <View style={styles.scoreBadge}>
          <Text style={[styles.scoreBadgeNum, { color: scoreColor }]}>{narrative.score}</Text>
          <Text style={[styles.scoreBadgeTier, { color: scoreColor }]}>{tierLabel}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Section 1: Narrative ── */}
        <SectionHeader title="NARRATIVE" />

        <View style={styles.authorRow}>
          <View style={styles.authorPill}>
            <Text style={styles.authorText}>{truncateWallet(narrative.wallet_address)}</Text>
            <CopyButton text={narrative.wallet_address} />
          </View>
          <Text style={styles.dateText}>{formatDate(narrative.created_at)}</Text>
        </View>

        <Text style={styles.narrativeTitle}>{narrative.title}</Text>
        <Text style={styles.narrativeThesis}>{narrative.thesis}</Text>

        {narrative.deadline_at && (
          <View style={styles.deadlineRow}>
            <Text style={styles.deadlineLabel}>Deadline</Text>
            <Text style={styles.deadlineValue}>{formatDate(narrative.deadline_at)}</Text>
          </View>
        )}

        {/* ── Section 2: Narrative Kit ── */}
        <SectionHeader title="NARRATIVE KIT" />

        {hasKit ? (
          <>
            <View style={styles.kitTabs}>
              {(['Hooks', 'Article', 'Thread'] as KitTab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.kitTab, activeKitTab === tab && styles.kitTabActive]}
                  onPress={() => setActiveKitTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.kitTabText, activeKitTab === tab && styles.kitTabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeKitTab === 'Hooks' && (
              <View style={styles.kitContent}>
                {hooks.length > 0 ? hooks.map((hook, i) => (
                  <View key={i} style={styles.hookCard}>
                    <View style={styles.hookNumBadge}>
                      <Text style={styles.hookNum}>{i + 1}</Text>
                    </View>
                    <Text style={styles.hookText}>{hook}</Text>
                    <CopyButton text={hook} />
                  </View>
                )) : (
                  <Text style={styles.kitPlaceholder}>Hooks are being generated by the AI agents...</Text>
                )}
              </View>
            )}

            {activeKitTab === 'Article' && (
              <View style={styles.kitContent}>
                {article ? (
                  <Text style={styles.articleText}>{article}</Text>
                ) : (
                  <Text style={styles.kitPlaceholder}>Article excerpt is being generated by the AI agents...</Text>
                )}
              </View>
            )}

            {activeKitTab === 'Thread' && (
              <View style={styles.kitContent}>
                {thread ? (
                  <View style={styles.threadPreview}>
                    <View style={styles.threadHandle}>
                      <Text style={styles.threadHandleText}>@magmaprotocol</Text>
                    </View>
                    <Text style={styles.threadText}>{thread}</Text>
                  </View>
                ) : (
                  <Text style={styles.kitPlaceholder}>Thread preview is being generated by the AI agents...</Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.kitPending}>
            <ActivityIndicator size="small" color={C.accent} />
            <Text style={styles.kitPendingText}>
              Narrative kit is being generated by AI agents after publish...
            </Text>
          </View>
        )}

        {/* ── Section 3: Backing ── */}
        <SectionHeader title="BACKING" />

        <View style={styles.backingStats}>
          <View style={styles.backingStat}>
            <Text style={styles.backingStatValue}>{totalBacked.toFixed(2)}</Text>
            <Text style={styles.backingStatLabel}>SOL Backed</Text>
          </View>
          <View style={styles.backingStatDivider} />
          <View style={styles.backingStat}>
            <Text style={styles.backingStatValue}>{backerCount}</Text>
            <Text style={styles.backingStatLabel}>Backers</Text>
          </View>
          <View style={styles.backingStatDivider} />
          <View style={styles.backingStat}>
            <Text style={[styles.backingStatValue, { color: C.success }]}>~7.2%</Text>
            <Text style={styles.backingStatLabel}>Est. APY</Text>
          </View>
        </View>

        {/* Token toggle */}
        <View style={styles.tokenToggle}>
          {(['SOL', 'SKR'] as Token[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tokenBtn, selectedToken === t && styles.tokenBtnActive]}
              onPress={() => setSelectedToken(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tokenBtnText, selectedToken === t && styles.tokenBtnTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount input */}
        <View style={styles.amountRow}>
          <TextInput
            style={styles.amountInput}
            value={backAmount}
            onChangeText={setBackAmount}
            placeholder={`Amount in ${selectedToken}`}
            placeholderTextColor={C.muted}
            keyboardType="decimal-pad"
          />
          {estimatedYield && (
            <Text style={styles.yieldEstimate}>+{estimatedYield} {selectedToken} yield est.</Text>
          )}
        </View>

        {backError ? <Text style={styles.backErrorText}>{backError}</Text> : null}
        {txSignature ? (
          <TouchableOpacity onPress={() => Linking.openURL(`https://solscan.io/tx/${txSignature}?cluster=devnet`)}>
            <Text style={styles.backSuccessText}>Backed! View on Solscan</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.backNarrativeBtn, (!account || backing || !!txSignature) && styles.backNarrativeBtnDisabled]}
          activeOpacity={0.8}
          disabled={!account || backing || !!txSignature}
          onPress={handleBackNarrative}
        >
          {backing ? (
            <ActivityIndicator color="#fff5ee" size="small" />
          ) : (
            <Text style={styles.backNarrativeBtnText}>
              {txSignature ? `BACKED ${backAmount} ${selectedToken}` : account ? `BACK WITH ${selectedToken}` : 'CONNECT WALLET TO BACK'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.passBtn} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.passBtnText}>PASS</Text>
        </TouchableOpacity>

        {/* ── Section 4: Oracle Status ── */}
        <SectionHeader title="ORACLE STATUS" />

        <View style={styles.oracleCard}>
          <View style={styles.oracleStatusRow}>
            <View style={[styles.oracleDot, { backgroundColor: oracleBadgeColor }]} />
            <Text style={[styles.oracleStatusText, { color: oracleBadgeColor }]}>
              {oracleStatus.toUpperCase()}
            </Text>
          </View>

          {oracleStatus === 'resolved' && narrative.resolution && (
            <View style={styles.oracleResolution}>
              <Text style={styles.oracleResolutionLabel}>Resolution</Text>
              <Text style={[
                styles.oracleResolutionValue,
                { color: narrative.resolution === 'true' ? C.success : '#ff4444' }
              ]}>
                {narrative.resolution === 'true' ? 'TRUE ✓' : 'FALSE ✗'}
              </Text>
            </View>
          )}

          {oracleStatus === 'pending' && (
            <Text style={styles.oraclePendingText}>
              Oracle resolution will begin after the narrative deadline passes. Scoring uses Grok + Tavily.
            </Text>
          )}

          {oracleStatus === 'running' && (
            <View style={styles.oracleRunning}>
              <ActivityIndicator size="small" color={C.accent} />
              <Text style={styles.oracleRunningText}>AI agents are scoring this narrative...</Text>
            </View>
          )}
        </View>

        {/* ── Section 5: Payout (only when resolved) ── */}
        {oracleStatus === 'resolved' && (
          <>
            <SectionHeader title="PAYOUT" />
            <View style={styles.payoutCard}>
              <Text style={styles.payoutText}>
                Payout available after oracle resolution. Claim coming in Phase D.
              </Text>
              <TouchableOpacity style={[styles.claimBtn, styles.claimBtnDisabled]} disabled>
                <Text style={styles.claimBtnText}>CLAIM PAYOUT — COMING SOON</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Section 6: Backing History ── */}
        <SectionHeader title="BACKING HISTORY" />

        <TouchableOpacity
          style={styles.historyToggle}
          onPress={() => setHistoryExpanded(!historyExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.historyToggleText}>
            {backers.length} backing{backers.length !== 1 ? 's' : ''}
          </Text>
          {historyExpanded
            ? <ChevronUp size={16} color={C.muted} />
            : <ChevronDown size={16} color={C.muted} />}
        </TouchableOpacity>

        {historyExpanded && (
          <View style={styles.historyList}>
            {backers.length === 0 ? (
              <Text style={styles.historyEmpty}>No backings yet. Be the first.</Text>
            ) : (
              backers.slice(0, 20).map((b) => (
                <View key={b.id} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyWallet}>{truncateWallet(b.wallet_address)}</Text>
                    <Text style={styles.historyDate}>{formatDate(b.created_at)}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>
                      {b.amount_sol > 0 ? `${b.amount_sol} SOL` : `${b.amount_skr} SKR`}
                    </Text>
                    {b.tx_signature && (
                      <TouchableOpacity onPress={() => handleOpenSolscan(b.tx_signature!)}>
                        <ExternalLink size={12} color={C.muted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: C.muted,
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: {
    color: C.bg,
    fontWeight: '700',
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backLabel: {
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scoreBadgeNum: {
    fontSize: 20,
    fontWeight: '700',
  },
  scoreBadgeTier: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },

  // Narrative section
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  authorText: {
    color: C.muted,
    fontSize: 12,
    fontFamily: 'IBMPlexMono',
  },
  dateText: {
    color: C.muted,
    fontSize: 12,
  },
  narrativeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    lineHeight: 30,
    marginBottom: 12,
  },
  narrativeThesis: {
    fontSize: 15,
    color: C.text,
    lineHeight: 24,
    opacity: 0.85,
  },
  deadlineRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  deadlineLabel: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '600',
  },
  deadlineValue: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '600',
  },

  // Kit section
  kitTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kitTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  kitTabActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  kitTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.muted,
  },
  kitTabTextActive: {
    color: C.bg,
  },
  kitContent: {
    gap: 10,
  },
  hookCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  hookNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  hookNum: {
    fontSize: 11,
    fontWeight: '700',
    color: C.bg,
  },
  hookText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  articleText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 22,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
  },
  threadPreview: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
  },
  threadHandle: {
    marginBottom: 8,
  },
  threadHandleText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },
  threadText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 22,
  },
  kitPlaceholder: {
    fontSize: 13,
    color: C.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  kitPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  kitPendingText: {
    fontSize: 13,
    color: C.muted,
    flex: 1,
  },

  // Backing section
  backingStats: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  backingStat: {
    flex: 1,
    alignItems: 'center',
  },
  backingStatDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  backingStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: C.primary,
  },
  backingStatLabel: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  tokenToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tokenBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
  },
  tokenBtnActive: {
    borderColor: C.primary,
    backgroundColor: `${C.primary}22`,
  },
  tokenBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.muted,
  },
  tokenBtnTextActive: {
    color: C.primary,
  },
  amountRow: {
    marginBottom: 14,
    gap: 6,
  },
  amountInput: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: C.text,
    fontWeight: '600',
  },
  yieldEstimate: {
    fontSize: 12,
    color: C.success,
    marginLeft: 4,
  },
  backNarrativeBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  backNarrativeBtnDisabled: {
    backgroundColor: C.muted,
    opacity: 0.6,
  },
  backNarrativeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
    letterSpacing: 1,
  },
  backErrorText: {
    color: '#ff4444',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  backSuccessText: {
    color: '#00ff88',
    fontFamily: 'IBMPlexMono',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  passBtn: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 4,
  },
  passBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1,
  },

  // Oracle section
  oracleCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  oracleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oracleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  oracleStatusText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  oracleResolution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  oracleResolutionLabel: {
    fontSize: 13,
    color: C.muted,
  },
  oracleResolutionValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  oraclePendingText: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
  },
  oracleRunning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  oracleRunningText: {
    fontSize: 13,
    color: C.accent,
  },

  // Payout section
  payoutCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  payoutText: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
  },
  claimBtn: {
    backgroundColor: C.success,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  claimBtnDisabled: {
    backgroundColor: C.muted,
    opacity: 0.5,
  },
  claimBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.bg,
    letterSpacing: 1,
  },

  // History section
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyToggleText: {
    fontSize: 14,
    color: C.muted,
    fontWeight: '600',
  },
  historyList: {
    marginTop: 8,
    gap: 6,
  },
  historyEmpty: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  historyLeft: { gap: 2 },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyWallet: {
    fontSize: 13,
    color: C.text,
    fontFamily: 'IBMPlexMono',
  },
  historyDate: {
    fontSize: 11,
    color: C.muted,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
  },
  copyBtn: {
    padding: 2,
  },
});

export default NarrativeDetailScreen;
