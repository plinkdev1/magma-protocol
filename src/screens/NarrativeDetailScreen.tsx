import React, { useState, useCallback, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useNarrative } from '../hooks/useNarrative';
import { useWallet } from '../context/WalletContext';
import { useBackNarrative } from '../hooks/useBackNarrative';
import TokenSelectorModal, { BackingToken } from '../components/TokenSelectorModal';
import SideShiftWidget from '../components/SideShiftWidget';
import { API_URL } from '../config';
import { RootStackParamList } from '../../App';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NarrativeDetail'>;
  route: RouteProp<RootStackParamList, 'NarrativeDetail'>;
};

type KitTab = 'Hooks' | 'Article' | 'Thread';
type Token = BackingToken;

// â”€â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const C = {
  bg: '#09080C',
  primary: '#FF6B35',
  accent: '#ffb347',
  text: '#f0d8c0',
  muted: '#9B95A8',
  card: '#111018',
  border: '#3d2a1f',
  success: '#22C55E',
  info: '#00c4ff',
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const truncateWallet = (addr: string) =>
  addr?.length > 12 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr ?? 'â€“';

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return 'â€“';
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

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Main screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const NarrativeDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { narrativeId } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  // Override C with theme values for light/dark support
  const C = {
    bg: theme.bgBase, card: theme.cardBg, cardBorder: theme.cardBorder,
    text: theme.textPrimary, muted: theme.textSecondary, accent: theme.amber,
    primary: theme.orange, success: theme.green, red: '#EF4444',
    // Keep static values for compatibility
    accentAlt: '#FFB347',
  };
  const { account, nftState } = useWallet();
  const { narrative, backers, loading, error, refetch } = useNarrative(narrativeId);

  const [activeKitTab, setActiveKitTab] = useState<KitTab>('Hooks');
  const [selectedToken, setSelectedToken] = useState<Token>('SOL');
  const [tokenSelectorVisible, setTokenSelectorVisible] = useState(false);
  const [showSideShift, setShowSideShift] = useState(false);
  const [sideShiftTo, setSideShiftTo] = useState<string>('SOL');
  const [backAmount, setBackAmount] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const { backNarrative, backing, txSignature, error: backError } = useBackNarrative();
  // -- Task 12: challenge state --
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [challengeEvidence, setChallengeEvidence] = useState('');
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);
  const [challengeError, setChallengeError] = useState('');
  const [challengeFee, setChallengeFee] = useState(0.05);
  const [countdown, setCountdown] = useState('');
  const [earlyResolutionRequested, setEarlyResolutionRequested] = useState(false);

  // countdown timer for challenge window
  useEffect(() => {
    if (!narrative?.challenge_window_closes_at) return;
    const update = () => {
      const diff = new Date(narrative.challenge_window_closes_at!).getTime() - Date.now();
      if (diff <= 0) { setCountdown('Closed'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(h + 'h ' + m + 'm remaining');
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [narrative?.challenge_window_closes_at]);

  // compute challenge fee from backing amount
  useEffect(() => {
    if (!narrative || !account) return;
    const fetchFee = async () => {
      try {
        const res = await fetch(API_URL + '/v1/narratives/' + narrativeId + '/challenges');
        // fee is computed server-side on submit; show estimate here
        setChallengeFee(0.05);
      } catch {}
    };
    fetchFee();
  }, [narrativeId, account]);

  const handleSubmitChallenge = useCallback(async () => {
    if (!account || !challengeEvidence.trim()) return;
    setChallengeSubmitting(true);
    setChallengeError('');
    try {
      const res = await fetch(API_URL + '/v1/narratives/' + narrativeId + '/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenger_wallet: account.publicKey.toString(),
          evidence_text: challengeEvidence.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChallengeError(data.message || data.error || 'Failed to submit challenge');
        return;
      }
      setChallengeSubmitted(true);
      setChallengeModalVisible(false);
      refetch();
    } catch (e: any) {
      setChallengeError('Network error. Please try again.');
    } finally {
      setChallengeSubmitting(false);
    }
  }, [account, challengeEvidence, narrativeId, refetch]);

  const handleRequestEarlyResolution = useCallback(async () => {
    if (!account) return;
    try {
      await fetch(API_URL + '/v1/narratives/' + narrativeId + '/request-early-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_wallet: account.publicKey.toString() }),
      });
      setEarlyResolutionRequested(true);
    } catch {}
  }, [account, narrativeId]);

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

  // â”€â”€ Loading / Error states â”€â”€
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

  // â”€â”€ Kit content â”€â”€
  const hooks: string[] = narrative.kit_hooks ?? [];
  const article: string = narrative.kit_article ?? '';
  const thread: string = narrative.kit_thread ?? '';
  const hasKit = hooks.length > 0 || article || thread;

  // â”€â”€ Oracle badge â”€â”€
  const oracleStatus = narrative.oracle_status ?? 'pending';
  const isResolved = ['resolved_true','resolved_false','under_review'].includes(oracleStatus);
  const isTrue = oracleStatus === 'resolved_true';
  const isFalse = oracleStatus === 'resolved_false';
  const isUnderReview = oracleStatus === 'under_review';
  const isFinal = narrative.is_final ?? false;
  const windowOpen = !isFinal &&
    narrative.challenge_window_closes_at &&
    new Date() < new Date(narrative.challenge_window_closes_at);
  const walletKey = account?.publicKey?.toString();
  const isCreator = walletKey && narrative.wallet_address === walletKey;
  const oracleBadgeColor =
    isTrue ? C.success :
    isFalse ? '#ff4444' :
    isUnderReview ? C.accent :
    oracleStatus === 'running' ? C.accent :
    C.muted;
  const oracleLabel =
    isTrue ? (isFinal ? 'RESOLVED â€” TRUE  [FINAL]' : 'RESOLVED â€” TRUE') :
    isFalse ? (isFinal ? 'RESOLVED â€” FALSE  [FINAL]' : 'RESOLVED â€” FALSE') :
    isUnderReview ? 'UNDER REVIEW' :
    oracleStatus === 'running' ? 'SCORING...' :
    'PENDING';

  // â”€â”€ Estimated yield (stub for Phase D) â”€â”€
  const estimatedYield = backAmount
    ? (parseFloat(backAmount || '0') * 0.072).toFixed(4)
    : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* â”€â”€ Header â”€â”€ */}
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

        {/* â”€â”€ Section 1: Narrative â”€â”€ */}
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

        {/* â”€â”€ Section 2: Narrative Kit â”€â”€ */}
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

        {/* â”€â”€ Section 3: Backing â”€â”€ */}
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

        {/* Token selector */}
        <TouchableOpacity
          style={[styles.tokenSelectorBtn, { borderColor: C.primary }]}
          onPress={() => setTokenSelectorVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tokenSelectorText, { color: C.primary }]}>
            {selectedToken} â–¾
          </Text>
        </TouchableOpacity>
        <TokenSelectorModal
          visible={tokenSelectorVisible}
          selected={selectedToken}
          onSelect={(t) => setSelectedToken(t)}
          onClose={() => setTokenSelectorVisible(false)}
        />

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

        {/* SideShift shortcut â€” shown when amount entered */}
        {backAmount && parseFloat(backAmount) > 0 && !txSignature && (
          <View style={styles.convertRow}>
            <Text style={[styles.convertLabel, { color: C.muted }]}>Need {selectedToken}?</Text>
            <TouchableOpacity
              style={[styles.convertBtn, { borderColor: C.primary }]}
              onPress={() => { setSideShiftTo(selectedToken); setShowSideShift(true); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.convertBtnText, { color: C.primary }]}>
                Get {selectedToken} via Swap
              </Text>
            </TouchableOpacity>
          </View>
        )}
            {/* Multiplier preview — shown when amount entered */}
            {backAmount && parseFloat(backAmount) > 0 && !txSignature && (
              <View style={styles.multiplierPreview}>
                <Text style={styles.multiplierPreviewTitle}>YOUR MULTIPLIERS</Text>
                <View style={styles.multiplierRow}>
                  <Text style={styles.multiplierLabel}>Discovery</Text>
                  <Text style={styles.multiplierValue}>check timing</Text>
                </View>
                <View style={styles.multiplierRow}>
                  <Text style={styles.multiplierLabel}>NFT + Conviction</Text>
                  <Text style={[styles.multiplierValue, { color: '#FF6B35' }]}>
                    {nftState.total_yield_multiplier + 'x'}
                  </Text>
                </View>
                <View style={[styles.multiplierRow, styles.multiplierRowLast]}>
                  <Text style={styles.multiplierLabel}>Est. yield on {backAmount} {selectedToken}</Text>
                  <Text style={[styles.multiplierValue, { color: '#22C55E' }]}>
                    {(parseFloat(backAmount || '0') * 0.072 * nftState.total_yield_multiplier).toFixed(4)} {selectedToken}
                  </Text>
                </View>
              </View>
            )}
        {/* SideShift modal */}
        {showSideShift && (
          <View style={styles.sideShiftModal}>
            <TouchableOpacity
              style={styles.sideShiftClose}
              onPress={() => setShowSideShift(false)}
            >
              <Text style={{ color: C.muted, fontSize: 14 }}>âœ• Close</Text>
            </TouchableOpacity>
            <SideShiftWidget
              settleAddress={account?.publicKey?.toString() ?? ''}
              defaultFrom="USDC"
              defaultTo={sideShiftTo}
            />
          </View>
        )}
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

        {/* â”€â”€ Section 4: Oracle Status â”€â”€ */}
        <SectionHeader title="ORACLE STATUS" />

        <View style={styles.oracleCard}>
          <View style={styles.oracleStatusRow}>
            <View style={[styles.oracleDot, { backgroundColor: oracleBadgeColor }]} />
            <Text style={[styles.oracleStatusText, { color: oracleBadgeColor }]}>{oracleLabel}</Text>
          </View>

          {oracleStatus === 'pending' && (
            <Text style={styles.oraclePendingText}>
              Oracle resolution will begin after the narrative deadline passes.
            </Text>
          )}
          {oracleStatus === 'running' && (
            <View style={styles.oracleRunning}>
              <ActivityIndicator size="small" color={C.accent} />
              <Text style={styles.oracleRunningText}>AI agents are scoring this narrative...</Text>
            </View>
          )}
          {(isTrue || isFalse) && (
            <View style={styles.oracleSourcesBlock}>
              {narrative.confidence != null && (
                <Text style={styles.oracleConfidence}>Confidence: {narrative.confidence}%</Text>
              )}
              {narrative.sources_used && Array.isArray(narrative.sources_used) && (
                <Text style={styles.oracleSources}>Sources: {narrative.sources_used.join(' - ')}</Text>
              )}
              {narrative.resolved_at && (
                <Text style={styles.oracleResolvedAt}>Resolved: {formatDate(narrative.resolved_at)}</Text>
              )}
            </View>
          )}
          {isUnderReview && (
            <Text style={styles.oraclePendingText}>
              {challengeSubmitted
                ? 'You submitted a challenge. Pending admin review (24-48 hours).'
                : 'This resolution is under admin review.'}
            </Text>
          )}
          {(isTrue || isFalse) && windowOpen && !isFinal && (
            <Text style={styles.challengeCountdown}>Challenge window: {countdown}</Text>
          )}
          {(isTrue || isFalse) && windowOpen && !isFinal && walletKey && !challengeSubmitted && (
            <TouchableOpacity
              style={styles.challengeBtn}
              activeOpacity={0.8}
              onPress={() => setChallengeModalVisible(true)}
            >
              <Text style={styles.challengeBtnText}>CHALLENGE THIS RESOLUTION</Text>
            </TouchableOpacity>
          )}
          {isFinal && (
            <Text style={styles.finalLabel}>Resolution is permanent.</Text>
          )}
        </View>

        {oracleStatus === 'pending' && isCreator && !earlyResolutionRequested && (
          <TouchableOpacity
            style={styles.earlyResolutionBtn}
            activeOpacity={0.8}
            onPress={handleRequestEarlyResolution}
          >
            <Text style={styles.earlyResolutionBtnText}>Request Early Resolution</Text>
          </TouchableOpacity>
        )}
        {earlyResolutionRequested && (
          <Text style={styles.earlyResolutionSent}>Early resolution requested.</Text>
        )}

        {(isTrue || isFalse) && (
          <>
            <SectionHeader title="PAYOUT" />
            <View style={styles.payoutCard}>
              <Text style={styles.payoutText}>
                Payout available after oracle resolution. Claim coming in Phase D.
              </Text>
              <TouchableOpacity style={[styles.claimBtn, styles.claimBtnDisabled]} disabled>
                <Text style={styles.claimBtnText}>CLAIM PAYOUT - COMING SOON</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Modal
          visible={challengeModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setChallengeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Challenge Resolution</Text>
              <Text style={styles.modalBody}>Resolution: {isTrue ? 'TRUE' : 'FALSE'}</Text>
              <Text style={styles.modalBody}>
                Challenge fee: {challengeFee} SOL{'\n'}(Refunded + 0.025 SOL bonus if upheld)
              </Text>
              <TextInput
                style={styles.modalInput}
                multiline
                numberOfLines={4}
                placeholder="Paste links, explain why resolution is wrong..."
                placeholderTextColor={C.muted}
                value={challengeEvidence}
                onChangeText={setChallengeEvidence}
              />
              {challengeError ? <Text style={styles.modalError}>{challengeError}</Text> : null}
              <TouchableOpacity
                style={[styles.modalSubmitBtn, (!challengeEvidence.trim() || challengeSubmitting) && styles.backNarrativeBtnDisabled]}
                activeOpacity={0.8}
                disabled={challengeSubmitting || !challengeEvidence.trim()}
                onPress={handleSubmitChallenge}
              >
                {challengeSubmitting
                  ? <ActivityIndicator color="#fff5ee" size="small" />
                  : <Text style={styles.modalSubmitBtnText}>SUBMIT CHALLENGE</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setChallengeModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* â”€â”€ Section 6: Backing History â”€â”€ */}
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

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  convertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  convertLabel: {
    fontSize: 13,
  },
  convertBtn: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  convertBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sideShiftModal: {
    marginBottom: 16,
  },
  sideShiftClose: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  tokenSelectorBtn: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tokenSelectorText: {
    fontSize: 15,
    fontWeight: '700',
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

  // -- Task 12: oracle + challenge styles --
  oracleSourcesBlock: {
    marginTop: 8,
    gap: 4,
  },
  oracleConfidence: {
    color: '#fff5ee',
    fontSize: 13,
    fontFamily: 'SpaceMono',
  },
  oracleSources: {
    color: '#7a4a30',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    marginTop: 2,
  },
  oracleResolvedAt: {
    color: '#7a4a30',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    marginTop: 2,
  },
  oracleUnderReview: {
    marginTop: 8,
  },
  challengeCountdown: {
    color: '#ffb347',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    marginTop: 10,
  },
  challengeBtn: {
    marginTop: 12,
    backgroundColor: '#3d2a1f',
    borderWidth: 1,
    borderColor: '#ff6b35',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  challengeBtnText: {
    color: '#ff6b35',
    fontSize: 13,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
  },
  finalBadge: {
    borderRadius: 9999, borderWidth: 1,
    paddingVertical: 2, paddingHorizontal: 8, marginLeft: 8,
  },
  finalBadgeText: { fontSize: 10, fontWeight: '700' },
  oracleResultBanner: {
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12,
  },
  oracleResultText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  oracleSourceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  oracleSourceLabel: { fontSize: 12, color: '#9B95A8' },
  oracleSourceValue: { fontSize: 12, fontWeight: '700' },
  finalLabel: {
    color: '#7a4a30',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    marginTop: 8,
  },
  earlyResolutionBtn: {
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d2a1f',
    borderRadius: 8,
  },
  earlyResolutionBtnText: {
    color: '#7a4a30',
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
  earlyResolutionSent: {
    color: '#7a4a30',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1a0f0a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderColor: '#3d2a1f',
  },
  modalTitle: {
    color: '#fff5ee',
    fontSize: 16,
    fontFamily: 'Syne-Bold',
    marginBottom: 4,
  },
  modalBody: {
    color: '#7a4a30',
    fontSize: 13,
    fontFamily: 'SpaceMono',
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#080400',
    borderWidth: 1,
    borderColor: '#3d2a1f',
    borderRadius: 8,
    padding: 12,
    color: '#fff5ee',
    fontSize: 13,
    fontFamily: 'SpaceMono',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalError: {
    color: '#ff4444',
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
  modalSubmitBtn: {
    backgroundColor: '#ff6b35',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#fff5ee',
    fontSize: 13,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    color: '#7a4a30',
    fontSize: 13,
    fontFamily: 'SpaceMono',
  },
  multiplierPreview: {
    backgroundColor: '#120D0A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2A1F15',
    gap: 0,
  },
  multiplierPreviewTitle: {
    fontSize: 10,
    color: '#7A6B5A',
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A1F15',
  },
  multiplierRowLast: {
    borderBottomWidth: 0,
  },
  multiplierLabel: {
    fontSize: 12,
    color: '#7A6B5A',
  },
  multiplierValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8E4F0',
  },
});

export default NarrativeDetailScreen;
