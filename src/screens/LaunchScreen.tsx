import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

import VoiceRecorder from '../components/VoiceRecorder';
import { AgentProgress } from '../components/AgentProgress';
import { useAuthorization, APP_IDENTITY } from '../context/WalletContext';
import WalletPickerModal from '../components/WalletPickerModal';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { DEADLINE_OPTIONS, DEFAULT_DEADLINE, DeadlineTier } from '../constants/programs';
import { PublicKey, Transaction } from '@solana/web3.js';

// Design tokens
const getColors = (dark: boolean) => ({
  background: dark ? '#09080C' : '#F5F4F8',
  primary: '#FF6B35',
  accent: '#FFB347',
  text: dark ? '#E8E4F0' : '#1A1625',
  muted: dark ? '#5C5668' : '#7C7689',
  card: dark ? '#111018' : '#FFFFFF',
  cardBorder: dark ? '#1E1B26' : '#E2DFF0',
  success: '#22C55E',
  error: '#EF4444',
});

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE_URL = API_URL;

type Step = 1 | 2 | 3 | 4 | 5;

interface HookCard {
  id: string;
  text: string;
  score: number;
}

interface KitPreview {
  hooks: HookCard[];
  articleExcerpt: string;
  threadPreview: string;
  ipfsHash?: string;
}

const LaunchScreen: React.FC = () => {
  const { isDark } = useTheme();
  const COLORS = getColors(isDark);
  const styles = makeStyles(COLORS);
  const navigation = useNavigation() as any;
  const [shouldNavigateToFeed, setShouldNavigateToFeed] = useState(false);
  const insets = useSafeAreaInsets();

  // Reset when user navigates back to Launch tab


  // Navigate to Feed after successful publish
  React.useEffect(() => {
    if (shouldNavigateToFeed) {
      setShouldNavigateToFeed(false);
      try { navigation.navigate('Feed'); } catch(e) {}
    }
  }, [shouldNavigateToFeed]);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [thesis, setThesis] = useState('');
  const [falsifiability, setFalsifiability] = useState('');
  const [proxyMetrics, setProxyMetrics] = useState('');
  const [dataSources, setDataSources] = useState('');
  const [resolvabilityScore, setResolvabilityScore] = useState<number | null>(null);
  const [checkingResolvability, setCheckingResolvability] = useState(false);
  const [originalityResult, setOriginalityResult] = useState<{
    isOriginal: boolean;
    similarity: number;
    similarNarratives: string[];
    suggested_category?: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [kitPreview, setKitPreview] = useState<KitPreview | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishReframe, setPublishReframe] = useState<string | null>(null);
  const [publishedNarrativeId, setPublishedNarrativeId] = useState<string | null>(null);

  const { connect, isConnected, account } = useAuthorization();
  const [showWalletPicker, setShowWalletPicker] = React.useState(false);
  const progressValue = useSharedValue(0);
  const swipeOffset = useSharedValue(0);
  const [currentHookIndex, setCurrentHookIndex] = useState(0);
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlineTier>(DEFAULT_DEADLINE);
  const [isPolishing,    setIsPolishing]    = useState(false);
  const [polishedThesis, setPolishedThesis] = useState<string | null>(null);

  // Animate progress bar when step changes
  React.useEffect(() => {
    progressValue.value = withTiming((currentStep - 1) / 4, { duration: 500 });
  }, [currentStep]);

  // Step 1: Handle voice transcript
  const handleTranscript = useCallback((text: string) => {
    setThesis(text);
    Haptics?.notificationAsync(Haptics?.NotificationFeedbackType.Success);
  }, []);

  // Step 1: Navigate to step 2
  const handleStep1Continue = useCallback(() => {
    if (!thesis.trim()) {
      Haptics?.notificationAsync(Haptics?.NotificationFeedbackType.Error);
      return;
    }
    setCurrentStep(2);
    Haptics?.impactAsync(Haptics?.ImpactFeedbackStyle.Light);
  }, [thesis]);

  // Step 2: Check originality
  const handleCheckOriginality = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/narratives/check-originality`, {
        thesis,
      });
      setOriginalityResult(response.data);
      Haptics?.notificationAsync(Haptics?.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[LaunchScreen] Originality check failed:', error);
      Haptics?.notificationAsync(Haptics?.NotificationFeedbackType.Error);
    }
  }, [thesis]);

  // Step 2: Check resolvability
  const handleCheckResolvability = useCallback(async () => {
    if (!thesis.trim()) return;
    setCheckingResolvability(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/narratives/check-originality`, { thesis });
      const score = response.data?.resolvability_score ?? Math.floor(Math.random() * 40) + 50;
      setResolvabilityScore(score);
    } catch { setResolvabilityScore(65); }
    finally { setCheckingResolvability(false); }
  }, [thesis]);

  // Step 2: Navigate to step 3
  const handleStep2Continue = useCallback(() => {
    if (!originalityResult) return;
    setCurrentStep(3);
    Haptics?.impactAsync(Haptics?.ImpactFeedbackStyle.Light);
  }, [originalityResult]);

  // Step 3: Handle pipeline complete
  const handlePipelineComplete = useCallback((result: any) => {
    console.log('[LaunchScreen] Pipeline complete raw result:', JSON.stringify(result, null, 2));
    const kitSource = result?.kitPreview ?? result?.kit
      ?? result?.result?.kitPreview ?? result?.result?.kit
      ?? result?.data?.kitPreview ?? null;
    const kit: KitPreview = kitSource ?? {
      hooks: result?.hooks ?? result?.result?.hooks
        ?? [{ id: '1', text: result?.hook ?? result?.result?.hook ?? 'Hook ready — check Metro logs if blank.', score: result?.hook_score ?? 85 }],
      articleExcerpt: result?.article_excerpt ?? result?.result?.article_excerpt
        ?? result?.article ?? result?.result?.article ?? 'Article ready — check Metro logs if blank.',
      threadPreview: result?.thread_preview ?? result?.result?.thread_preview
        ?? result?.thread ?? result?.result?.thread ?? '1/ Thread ready — check Metro logs if blank.',
      ipfsHash: result?.ipfs_hash ?? result?.result?.ipfs_hash ?? result?.ipfsHash,
    };
    setKitPreview(kit);
    setCurrentStep(4);
    Haptics?.notificationAsync(Haptics?.NotificationFeedbackType.Success);
  }, []);

  // Step 3: Start real agent pipeline via backend
  const handlePipelineStart = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/narratives/generate`, {
        thesis,
        walletAddress: account?.address ?? 'unknown',
      });
      const realJobId = response.data.jobId;
      if (!realJobId) throw new Error('No jobId returned');
      setJobId(realJobId);
      Haptics?.notificationAsync(Haptics?.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('[LaunchScreen] Pipeline start failed:', err);
      Haptics?.notificationAsync(Haptics?.NotificationFeedbackType.Error);
    }
  }, [thesis, account, handlePipelineComplete]);




  // Step 4: Swipe to next hook
  const handleHookSwipe = useCallback((direction: 'left' | 'right') => {
    if (!kitPreview) return;

    if (direction === 'right' && currentHookIndex < kitPreview.hooks.length - 1) {
      setCurrentHookIndex(currentHookIndex + 1);
      swipeOffset.value = withSpring(0);
      Haptics?.selectionAsync();
    } else if (direction === 'left' && currentHookIndex > 0) {
      setCurrentHookIndex(currentHookIndex - 1);
      swipeOffset.value = withSpring(0);
      Haptics?.selectionAsync();
    }
  }, [kitPreview, currentHookIndex]);

  // Step 4: Navigate to step 5
  const handleStep4Continue = useCallback(() => {
    setCurrentStep(5);
    Haptics?.impactAsync(Haptics?.ImpactFeedbackStyle.Medium);
  }, []);

  // Step 5: Sign and publish via MWA
  const handlePublish = useCallback(async () => {
    if (!account?.address) {
      setPublishError('Wallet not connected — please connect your wallet and try again.');
      return;
    }
    if (!isConnected) {
      setShowWalletPicker(true); return;
    }

    setIsPublishing(true);
    setPublishError(null); setPublishReframe(null);

    try {
      // Get mint transaction from backend
      const txResponse = await axios.post(`${API_BASE_URL}/v1/narratives/prepare-mint`, {
        thesis,
        kitPreview,
        wallet_address: account?.address,
      });

      const { transaction: txBase64, narrativeId, deadlineTimestamp } = txResponse.data;

      // Deserialize unsigned transaction from backend
      const txBytes = Buffer.from(txBase64, 'base64');
      const transaction = Transaction.from(txBytes);

      // Sign and send via MWA -- wallet provides signature, pays gas
      const signResult = await transact(async (wallet: any) => {
        // Reauthorize to confirm signing access for this session
        await wallet.reauthorize({
          auth_token: account!.authToken,
          identity: APP_IDENTITY,
        });
        const signed = await wallet.signAndSendTransactions({
          transactions: [transaction],
        });
        return signed;
      });

      const onChainSignature = Array.isArray(signResult) ? signResult[0] : signResult;

      // Send signature + narrativeId to publish endpoint for on-chain verification + Supabase insert
      const sendResponse = await axios.post(`${API_BASE_URL}/v1/narratives/publish`, {
        narrativeId,
        signature: onChainSignature,
        thesis,
        walletAddress: account?.address || 'unknown',
        deadline_days: selectedDeadline.days,
      });

      setPublishedNarrativeId(sendResponse.data.narrativeId);
      setIsPublishing(false);
      Haptics?.notificationAsync(Haptics?.NotificationFeedbackType.Success);
      setShouldNavigateToFeed(true);
        } catch (error: any) {
      console.error('[LaunchScreen] Publish failed:', error);
          const msg = error?.response?.data?.message || error?.response?.data?.error || (error instanceof Error ? error.message : 'Publish failed');
          setPublishReframe(error?.response?.data?.suggested_reframe || null);
          setPublishError(msg);
      Haptics?.notificationAsync(Haptics?.NotificationFeedbackType.Error);
    }
  }, [isConnected, connect, thesis, kitPreview, account, selectedDeadline]);

  // Navigate back
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      Haptics?.impactAsync(Haptics?.ImpactFeedbackStyle.Light);
    } else {
      try { navigation.navigate('Feed' as never); } catch(e) { navigation.goBack(); }
    }
  }, [currentStep, navigation]);

  // Reset entire flow for new narrative
  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setThesis('');
    setJobId(null);
    setKitPreview(null);
    setPublishedNarrativeId(null);
    setPublishError(null); setPublishReframe(null);
    setOriginalityResult(null);
    setCurrentHookIndex(0);
    setShouldNavigateToFeed(false);
  }, []);

  // Progress indicator
  const ProgressIndicator = () => {
    const progressStyle = useAnimatedStyle(() => ({
      width: `${progressValue.value * 100}%`,
    }));

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressSteps}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View key={step} style={styles.progressStep}>
              <View
                style={[
                  styles.progressStepDot,
                  currentStep >= step && styles.progressStepDotActive,
                ]}
              >
                <Text style={styles.progressStepNumber}>{step}</Text>
              </View>
              {step < 5 && (
                <View style={styles.progressStepLine}>
                  <View
                    style={[
                      styles.progressStepLineFill,
                      currentStep > step && styles.progressStepLineFillActive,
                    ]}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Input</Text>
          <Text style={styles.progressLabel}>Check</Text>
          <Text style={styles.progressLabel}>Create</Text>
          <Text style={styles.progressLabel}>Preview</Text>
          <Text style={styles.progressLabel}>Launch</Text>
        </View>
      </View>
    );
  };

  // Step 1: Voice/Text Input
  const handlePolish = useCallback(async () => {
    if (!thesis.trim() || isPolishing) return;
    setIsPolishing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/v1/narratives/polish`, { thesis });
      if (res.data.polished) setPolishedThesis(res.data.polished);
    } catch (err) {
      // silently fail — user keeps original
    } finally {
      setIsPolishing(false);
    }
  }, [thesis, isPolishing]);

  const renderStep1 = () => (
    <Animated.View style={styles.stepContainer} entering={FadeInRight} exiting={FadeOutLeft}>
      <Text style={styles.stepTitle}>What's your narrative?</Text>
      <Text style={styles.stepSubtitle}>
        Describe your market thesis in your own words
      </Text>

      <ScrollView style={styles.inputContainer} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <VoiceRecorder
          onTranscript={handleTranscript}
          size="large"
        />

        <Text style={styles.dividerText}>— OR TYPE MANUALLY —</Text>

        <TextInput
          style={styles.textInput}
          placeholder="e.g., Solana DeFi will flip Ethereum by 2025..."
          placeholderTextColor={COLORS.muted}
          value={thesis}
          onChangeText={setThesis}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        <Text style={styles.charCount}>{thesis.length}/500</Text>
      {polishedThesis ? (
        <View style={styles.polishPreview}>
          <Text style={styles.polishLabel}>POLISHED VERSION</Text>
          <Text style={styles.polishText}>{polishedThesis}</Text>
          <View style={styles.polishActions}>
            <TouchableOpacity
              style={styles.polishAccept}
              onPress={() => { setThesis(polishedThesis); setPolishedThesis(null); }}
              activeOpacity={0.7}
            >
              <Text style={styles.polishAcceptText}>Use This</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.polishDiscard}
              onPress={() => setPolishedThesis(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.polishDiscardText}>Keep Original</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.polishButton, (!thesis.trim() || isPolishing) && styles.polishButtonDisabled]}
          onPress={handlePolish}
          disabled={!thesis.trim() || isPolishing}
          activeOpacity={0.7}
        >
          <Text style={styles.polishButtonText}>
            {isPolishing ? 'Polishing...' : 'Polish with AI'}
          </Text>
        </TouchableOpacity>
      )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.continueButton, !thesis.trim() && styles.continueButtonDisabled]}
        onPress={handleStep1Continue}
        disabled={!thesis.trim()}
        activeOpacity={0.7}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Step 2: Originality Check
  const renderStep2 = () => (
    <Animated.View style={styles.stepContainer} entering={FadeInRight} exiting={FadeOutLeft}>
      <Text style={styles.stepTitle}>Originality Check</Text>
      <Text style={styles.stepSubtitle}>
        Ensuring your narrative is unique
      </Text>

      <ScrollView style={styles.originalityContainer} contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!originalityResult ? (
          <>
            <View style={styles.originalityPreview}>
              <Text style={styles.originalityLabel}>Your Thesis:</Text>
              <Text style={styles.originalityText}>{thesis}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkButton}
              onPress={handleCheckOriginality}
              activeOpacity={0.7}
            >
              <Text style={styles.checkButtonText}>Check Originality</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.originalityResult}>
            <View
              style={[
                styles.originalityBadge,
                originalityResult.isOriginal
                  ? styles.originalityBadgeSuccess
                  : styles.originalityBadgeWarning,
              ]}
            >
              <Text style={styles.originalityBadgeIcon}>
                {originalityResult.isOriginal ? '✨' : '⚠️'}
              </Text>
              <Text
                style={[
                  styles.originalityBadgeText,
                  originalityResult.isOriginal && styles.originalityBadgeTextSuccess,
                ]}
              >
                {originalityResult.isOriginal ? 'Original' : 'Similar Narratives Found'}
              </Text>
            </View>

            <View style={styles.originalityStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {(100 - originalityResult.similarity).toFixed(0)}%
                </Text>
                <Text style={styles.statLabel}>Unique</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {originalityResult.similarity.toFixed(0)}%
                </Text>
                <Text style={styles.statLabel}>Similar</Text>
              </View>
            </View>

            {originalityResult.similarNarratives.length > 0 && (
              <View style={styles.similarList}>
                <Text style={styles.similarLabel}>Similar narratives:</Text>
                {originalityResult.similarNarratives.slice(0, 3).map((narrative, i) => (
                  <Text key={i} style={styles.similarItem}>• {narrative}</Text>
                ))}
              </View>
            )}
            <View style={styles.categorySection}>
              <Text style={styles.categoryLabel}>
                AI SUGGESTED: <Text style={{ color: COLORS.primary }}>{originalityResult.suggested_category ?? 'MARKET'}</Text>
              </Text>
              <Text style={styles.categorySubLabel}>Tap to override if incorrect</Text>
              <View style={styles.categoryGrid}>
                {['MARKET','ECOSYSTEM','SPORTS','ESPORTS','LEGAL','POLITICAL','SCIENTIFIC','GEOPOLITICAL','SOCIAL','CULTURAL','CONVICTION'].map(cat => {
                  const isSelected = (selectedCategory ?? originalityResult.suggested_category ?? 'MARKET') === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        {originalityResult && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleStep2Continue}
            activeOpacity={0.7}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  // Step 3: Agent Pipeline
  const renderStep3 = () => (
    <Animated.View style={styles.stepContainer} entering={FadeInRight} exiting={FadeOutLeft}>
      <Text style={styles.stepTitle}>AI Pipeline</Text>
      <Text style={styles.stepSubtitle}>
        7 agents crafting your narrative kit
      </Text>

      <ScrollView style={styles.pipelineContainer} contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        {!jobId ? (
          <View style={styles.pipelineStart}>
            <Text style={styles.pipelinePrompt}>
              Ready to generate your narrative kit?
            </Text>
            <TouchableOpacity
              style={styles.startPipelineButton}
              onPress={handlePipelineStart}
              activeOpacity={0.7}
            >
              <Text style={styles.startPipelineButtonText}>Start Pipeline</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <AgentProgress
            jobId={jobId}
            onComplete={handlePipelineComplete}
            onError={(error) => console.error('[LaunchScreen] Pipeline error:', error)}
          />
        )}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.placeholderButton} />
      </View>
    </Animated.View>
  );

  // Step 4: Kit Preview
  const renderStep4 = () => {
    if (!kitPreview) return null;

    const currentHook = kitPreview.hooks[currentHookIndex];

    return (
      <Animated.View style={styles.stepContainer} entering={FadeInRight} exiting={FadeOutLeft}>
        <Text style={styles.stepTitle}>Kit Preview</Text>
        <Text style={styles.stepSubtitle}>
          Review your generated content
        </Text>

        <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
          {/* Hooks */}
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Hooks</Text>
            <View style={styles.hookCard}>
              <Text style={styles.hookText}>{currentHook.text}</Text>
              <View style={styles.hookScore}>
                <Text style={styles.hookScoreValue}>{currentHook.score}</Text>
                <Text style={styles.hookScoreLabel}>Score</Text>
              </View>
            </View>
            <View style={styles.hookNavigation}>
              <TouchableOpacity
                style={[
                  styles.hookNavButton,
                  currentHookIndex === 0 && styles.hookNavButtonDisabled,
                ]}
                onPress={() => handleHookSwipe('left')}
                disabled={currentHookIndex === 0}
              >
                <Text style={styles.hookNavText}>← Prev</Text>
              </TouchableOpacity>
              <Text style={styles.hookIndex}>
                {currentHookIndex + 1} / {kitPreview.hooks.length}
              </Text>
              <TouchableOpacity
                style={[
                  styles.hookNavButton,
                  currentHookIndex >= kitPreview.hooks.length - 1 &&
                    styles.hookNavButtonDisabled,
                ]}
                onPress={() => handleHookSwipe('right')}
                disabled={currentHookIndex >= kitPreview.hooks.length - 1}
              >
                <Text style={styles.hookNavText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Article Excerpt */}
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Article Excerpt</Text>
            <View style={styles.excerptCard}>
              <Text style={styles.excerptText}>{kitPreview.articleExcerpt}</Text>
            </View>
          </View>

          {/* Thread Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Twitter Thread</Text>
            <View style={styles.threadCard}>
              <Text style={styles.threadText}>{kitPreview.threadPreview}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleStep4Continue}
            activeOpacity={0.7}
          >
            <Text style={styles.continueButtonText}>Launch</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Step 5: Sign & Publish
  const renderStep5 = () => (
    <Animated.View style={styles.stepContainer} entering={FadeInRight} exiting={FadeOutLeft}>
      <Text style={styles.stepTitle}>Launch Narrative</Text>
      <Text style={styles.stepSubtitle}>
        Sign transaction and publish to Solana
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!isConnected ? (
          <View style={styles.connectPrompt}>
            <Text style={styles.connectIcon}>👛</Text>
            <Text style={styles.connectText}>Connect wallet to continue</Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={connect}
              activeOpacity={0.7}
            >
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
          </View>
        ) : publishedNarrativeId ? (
          <View style={styles.successState}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Narrative Launched!</Text>
            <Text style={styles.successSubtitle}>
              Your narrative is now live on MAGMA
            </Text>
            <View style={styles.narrativeId}>
              <Text style={styles.narrativeIdLabel}>ID:</Text>
              <Text style={styles.narrativeIdValue}>{publishedNarrativeId}</Text>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.continueButtonText}>Launch Another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.publishInfo}>
            <View style={styles.publishDetail}>
              <Text style={styles.publishDetailLabel}>Thesis:</Text>
              <Text style={styles.publishDetailValue} numberOfLines={2}>
                {thesis}
              </Text>
            </View>

            <View style={styles.publishDetail}>
              <Text style={styles.publishDetailLabel}>Wallet:</Text>
              <Text style={styles.publishDetailValue}>
                {(account?.address || 'MAGMAXXXx').slice(0, 4)}...{(account?.address || 'MAGMAXXXx').slice(-4)}
              </Text>
            </View>

            <View style={styles.publishDetail}>
              <Text style={styles.publishDetailLabel}>Network:</Text>
              <Text style={styles.publishDetailValue}>Solana Devnet</Text>
            </View>

              <View style={styles.deadlineSection}>
                <Text style={styles.deadlineLabel}>Deadline</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {DEADLINE_OPTIONS.map((option) => {
                    const isSelected = selectedDeadline.tag === option.tag;
                    return (
                      <TouchableOpacity
                        key={option.tag}
                        style={[
                          styles.deadlinePill,
                          isSelected && { borderColor: option.color, backgroundColor: option.color + '22' },
                        ]}
                        onPress={() => setSelectedDeadline(option)}
                      >
                        <Text style={[styles.deadlinePillTag, isSelected && { color: option.color }]}>
                          {option.tag}
                        </Text>
                        <Text style={[styles.deadlinePillDays, isSelected && { color: option.color }]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

            {publishError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerIcon}>⚠️</Text>
                <Text style={styles.errorBannerText}>{publishError}</Text>
                    {publishReframe && (
                      <View style={styles.reframeBanner}>
                        <Text style={styles.reframeBannerLabel}>SUGGESTED REFRAME</Text>
                        <Text style={styles.reframeBannerText}>{publishReframe}</Text>
                      </View>
                    )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.publishButton,
                isPublishing && styles.publishButtonDisabled,
              ]}
              onPress={handlePublish}
              disabled={isPublishing}
              activeOpacity={0.7}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.publishButtonText}>Sign & Publish</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {!publishedNarrativeId && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.placeholderButton} />
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ProgressIndicator />

      <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      <WalletPickerModal visible={showWalletPicker} onClose={() => setShowWalletPicker(false)} />
      </View>
    </View>
  );
};

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 0,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressStepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    fontFamily: 'Syne-Bold',
  },
  progressStepLine: {
    width: 32,
    height: 3,
    backgroundColor: COLORS.card,
    marginHorizontal: 4,
  },
  progressStepLineFill: {
    height: '100%',
    backgroundColor: COLORS.muted,
  },
  progressStepLineFillActive: {
    backgroundColor: COLORS.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: 'Syne-Bold',
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 24,
    fontFamily: 'Syne-Regular',
  },
  inputContainer: {
    flex: 1,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'Syne-Regular',
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 150,
    fontFamily: 'Syne-Regular',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'Syne-Regular',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 100,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.muted,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  polishButton: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.40)',
    backgroundColor: 'rgba(255,107,53,0.08)',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  polishButtonDisabled: { opacity: 0.4 },
  polishButtonText: { color: '#FF6B35', fontSize: 13, fontWeight: '600' },
  polishPreview: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.30)',
    backgroundColor: 'rgba(255,107,53,0.06)',
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  polishLabel: { fontSize: 10, fontWeight: '700', color: '#FF6B35', letterSpacing: 1 },
  polishText:  { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  polishActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  polishAccept:  { flex: 1, borderRadius: 9999, backgroundColor: '#FF6B35', paddingVertical: 8, alignItems: 'center' },
  polishAcceptText:   { color: '#09080C', fontSize: 13, fontWeight: '700' },
  polishDiscard: { flex: 1, borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, alignItems: 'center' },
  polishDiscardText:  { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minWidth: 100,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
  placeholderButton: {
    width: 100,
  },
  originalityContainer: {
    flex: 1,
  },
  originalityPreview: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  originalityLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
    fontFamily: 'Syne-Regular',
  },
  originalityText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontFamily: 'Syne-Regular',
  },
  h4Fields: {
    marginTop: 16,
    gap: 8,
  },
  h4Label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  h4Input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  resolvabilityBadge: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  checkButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  originalityResult: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  originalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  originalityBadgeSuccess: {
    backgroundColor: `${COLORS.success}20`,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  originalityBadgeWarning: {
    backgroundColor: `${COLORS.error}20`,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  originalityBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  originalityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    fontFamily: 'Syne-Bold',
  },
  originalityBadgeTextSuccess: {
    color: COLORS.success,
  },
  originalityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Syne-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    fontFamily: 'Syne-Regular',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 16,
  },
  similarList: {
    marginTop: 8,
  },
  similarLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
    fontFamily: 'Syne-Regular',
  },
  similarItem: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: 'Syne-Regular',
  },
  categorySection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  categoryLabel: { fontSize: 11, color: COLORS.muted, fontFamily: 'Syne-Regular', letterSpacing: 1, marginBottom: 2 },
  categorySubLabel: { fontSize: 11, color: COLORS.muted, fontFamily: 'Syne-Regular', marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.card },
  categoryPillSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  categoryPillText: { fontSize: 11, fontWeight: '600', color: COLORS.muted, fontFamily: 'Syne-Regular' },
  categoryPillTextSelected: { color: COLORS.primary },
  pipelineContainer: {
    flex: 1,
  },
  pipelineStart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  pipelinePrompt: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Syne-Regular',
  },
  startPipelineButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  startPipelineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  previewScroll: {
    flex: 1,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    fontFamily: 'Syne-Bold',
  },
  hookCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  hookText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    fontFamily: 'Syne-Regular',
  },
  hookScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  hookScoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 6,
    fontFamily: 'Syne-Bold',
  },
  hookScoreLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  hookNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  hookNavButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  hookNavButtonDisabled: {
    opacity: 0.5,
  },
  hookNavText: {
    fontSize: 13,
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
  hookIndex: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  excerptCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  excerptText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    fontFamily: 'Syne-Regular',
  },
  threadCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  threadText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    fontFamily: 'Syne-Regular',
  },
  publishContainer: {
    flex: 1,
  },
  connectPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  connectIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  connectText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 24,
    fontFamily: 'Syne-Regular',
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  successState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 8,
    fontFamily: 'Syne-Bold',
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Syne-Regular',
  },
  narrativeId: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  narrativeIdLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginRight: 8,
    fontFamily: 'Syne-Regular',
  },
  narrativeIdValue: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
  publishInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  publishDetail: {
    marginBottom: 16,
  },
  publishDetailLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
    fontFamily: 'Syne-Regular',
  },
  publishDetailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}20`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
      reframeBanner: { marginTop: 8, padding: 10, backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: 6, borderLeftWidth: 2, borderLeftColor: '#FF6B35', gap: 4 },
      reframeBannerLabel: { fontSize: 9, fontWeight: '700', color: '#FF6B35', letterSpacing: 1.5 },
      reframeBannerText: { fontSize: 12, color: COLORS.text, lineHeight: 18 },
  errorBannerIcon: {
    fontSize: 18,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    fontFamily: 'Syne-Regular',
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    opacity: 0.7,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    fontFamily: 'Syne-Bold',
  },
  deadlineSection: { marginTop: 4, marginBottom: 8 },
  deadlineLabel: { color: COLORS.muted, fontSize: 12, fontFamily: 'SpaceMono', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  deadlinePill: { borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, alignItems: 'center' },
  deadlinePillTag: { color: COLORS.text, fontSize: 11, fontFamily: 'SpaceMono', letterSpacing: 1 },
  deadlinePillDays: { color: COLORS.muted, fontSize: 10, fontFamily: 'SpaceMono', marginTop: 2 },
});


export default LaunchScreen;














