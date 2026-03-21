import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, fontSize } from '../theme/tokens';
import { API_URL } from '../config';

// ─── Supported coins ──────────────────────────────────────────────────────────

const COINS = ['SOL', 'SKR', 'USDC', 'USDT', 'ETH', 'BTC', 'BNB', 'MATIC'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Quote {
  id:            string;
  depositCoin:   string;
  settleCoin:    string;
  depositAmount: string;
  settleAmount:  string;
  rate:          string;
  expiresAt:     string;
}

interface Shift {
  id:             string;
  depositAddress: string;
  depositCoin:    string;
  settleAddress:  string;
  settleCoin:     string;
  depositAmount:  string;
  settleAmount:   string;
  status:         string;
}

type Stage = 'form' | 'quoting' | 'confirm' | 'creating' | 'waiting' | 'done' | 'error';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SideShiftWidgetProps {
  defaultFrom?:    string;
  defaultTo?:      string;
  settleAddress:   string;   // user's wallet address
  refundAddress?:  string;   // fallback = same as settle
}

// ─── Component ────────────────────────────────────────────────────────────────

const SideShiftWidget: React.FC<SideShiftWidgetProps> = ({
  defaultFrom   = 'USDC',
  defaultTo     = 'SOL',
  settleAddress,
  refundAddress,
}) => {
  const { theme } = useTheme();

  const [fromCoin, setFromCoin]   = useState(defaultFrom);
  const [toCoin, setToCoin]       = useState(defaultTo);
  const [amount, setAmount]       = useState('');
  const [stage, setStage]         = useState<Stage>('form');
  const [quote, setQuote]         = useState<Quote | null>(null);
  const [shift, setShift]         = useState<Shift | null>(null);
  const [errorMsg, setErrorMsg]   = useState('');
  const [shiftStatus, setShiftStatus] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker]     = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Get quote ──────────────────────────────────────────────────────────────

  const handleGetQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (fromCoin === toCoin) {
      setErrorMsg('FROM and TO coins must be different');
      setStage('error');
      return;
    }

    setStage('quoting');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/v1/sideshift/quote`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fromCoin, toCoin, fromAmount: amount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quote failed');

      setQuote(data);
      setStage('confirm');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Quote failed');
      setStage('error');
    }
  }, [amount, fromCoin, toCoin]);

  // ── Create shift ───────────────────────────────────────────────────────────

  const handleCreateShift = useCallback(async () => {
    if (!quote) return;
    setStage('creating');

    try {
      const res = await fetch(`${API_URL}/v1/sideshift/shift`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          quoteId:            quote.id,
          destinationAddress: settleAddress,
          refundAddress:      refundAddress || settleAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Shift creation failed');

      setShift(data);
      setShiftStatus('pending');
      setStage('waiting');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/v1/sideshift/shift/${data.id}`);
          const statusData = await statusRes.json();
          setShiftStatus(statusData.status);
          if (statusData.status === 'settled') {
            if (pollRef.current) clearInterval(pollRef.current);
            setStage('done');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (statusData.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setErrorMsg('Shift failed — contact SideShift support');
            setStage('error');
          }
        } catch { /* ignore poll errors */ }
      }, 10_000);

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Shift creation failed');
      setStage('error');
    }
  }, [quote, settleAddress, refundAddress]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStage('form');
    setQuote(null);
    setShift(null);
    setAmount('');
    setErrorMsg('');
    setShiftStatus('');
  }, []);

  const styles = makeStyles(theme);

  // ── Coin picker modal ──────────────────────────────────────────────────────

  const CoinPicker = ({
    visible,
    current,
    onSelect,
    onClose,
  }: {
    visible:  boolean;
    current:  string;
    onSelect: (coin: string) => void;
    onClose:  () => void;
  }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={[styles.modalSheet, { backgroundColor: theme.bgElevated, borderColor: theme.cardBorder }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Token</Text>
          <ScrollView>
            {COINS.map(coin => (
              <TouchableOpacity
                key={coin}
                style={[
                  styles.coinRow,
                  { borderBottomColor: theme.borderSubtle },
                  coin === current && { backgroundColor: 'rgba(255,107,53,0.08)' },
                ]}
                onPress={() => { onSelect(coin); onClose(); }}
              >
                <Text style={[styles.coinLabel, { color: coin === current ? theme.orange : theme.textPrimary }]}>
                  {coin}
                </Text>
                {coin === current && (
                  <Text style={{ color: theme.orange, fontSize: 16 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ── Render stages ──────────────────────────────────────────────────────────

  if (stage === 'form' || stage === 'quoting') {
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>⚡ Swap Tokens</Text>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
          200+ assets · Non-custodial · No KYC
        </Text>

        {/* FROM */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>You Send</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.amountInput, { backgroundColor: theme.bgBase, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            placeholder="0.00"
            placeholderTextColor={theme.textTertiary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity
            style={[styles.coinButton, { backgroundColor: theme.bgElevated, borderColor: theme.borderMedium }]}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={[styles.coinButtonText, { color: theme.orange }]}>{fromCoin} ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Arrow */}
        <Text style={[styles.swapArrow, { color: theme.textTertiary }]}>↓</Text>

        {/* TO */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>You Receive</Text>
        <TouchableOpacity
          style={[styles.toRow, { backgroundColor: theme.bgBase, borderColor: theme.cardBorder }]}
          onPress={() => setShowToPicker(true)}
        >
          <Text style={[styles.coinButtonText, { color: theme.orange }]}>{toCoin} ▾</Text>
        </TouchableOpacity>

        {/* Get Quote button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.orange }, (!amount || stage === 'quoting') && styles.disabled]}
          onPress={handleGetQuote}
          disabled={!amount || stage === 'quoting'}
          activeOpacity={0.7}
        >
          {stage === 'quoting' ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Get Quote</Text>
          )}
        </TouchableOpacity>

        <CoinPicker visible={showFromPicker} current={fromCoin} onSelect={setFromCoin} onClose={() => setShowFromPicker(false)} />
        <CoinPicker visible={showToPicker}   current={toCoin}   onSelect={setToCoin}   onClose={() => setShowToPicker(false)} />
      </View>
    );
  }

  if (stage === 'confirm' && quote) {
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Confirm Swap</Text>

        <View style={[styles.quoteRow, { borderColor: theme.borderSubtle }]}>
          <Text style={[styles.quoteLabel, { color: theme.textSecondary }]}>You Send</Text>
          <Text style={[styles.quoteValue, { color: theme.textPrimary }]}>{quote.depositAmount} {quote.depositCoin}</Text>
        </View>
        <View style={[styles.quoteRow, { borderColor: theme.borderSubtle }]}>
          <Text style={[styles.quoteLabel, { color: theme.textSecondary }]}>You Receive</Text>
          <Text style={[styles.quoteValue, { color: theme.green }]}>{quote.settleAmount} {quote.settleCoin}</Text>
        </View>
        <View style={[styles.quoteRow, { borderColor: theme.borderSubtle }]}>
          <Text style={[styles.quoteLabel, { color: theme.textSecondary }]}>Rate</Text>
          <Text style={[styles.quoteValue, { color: theme.textPrimary }]}>1 {quote.depositCoin} = {parseFloat(quote.rate).toFixed(4)} {quote.settleCoin}</Text>
        </View>
        <View style={[styles.quoteRow, { borderColor: theme.borderSubtle }]}>
          <Text style={[styles.quoteLabel, { color: theme.textSecondary }]}>To Address</Text>
          <Text style={[styles.quoteValueSmall, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="middle">
            {settleAddress}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.orange, marginTop: spacing.lg }]}
          onPress={handleCreateShift}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>Confirm & Create Shift</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
          <Text style={[styles.ghostButtonText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === 'creating') {
    return (
      <View style={[styles.card, styles.centered, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <ActivityIndicator size="large" color={theme.orange} />
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>Creating shift...</Text>
      </View>
    );
  }

  if (stage === 'waiting' && shift) {
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Send Your {shift.depositCoin}</Text>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
          Send exactly {shift.depositAmount} {shift.depositCoin} to:
        </Text>

        <View style={[styles.addressBox, { backgroundColor: theme.bgElevated, borderColor: theme.borderMedium }]}>
          <Text style={[styles.addressText, { color: theme.orange }]} selectable>
            {shift.depositAddress}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,179,71,0.10)', borderColor: 'rgba(255,179,71,0.30)' }]}>
          <Text style={[styles.statusBadgeText, { color: theme.amber }]}>
            Status: {shiftStatus.toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.hintText, { color: theme.textTertiary }]}>
          Polling every 10s · {shift.settleAmount} {shift.settleCoin} will arrive in your wallet
        </Text>

        <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
          <Text style={[styles.ghostButtonText, { color: theme.textTertiary }]}>Start New Swap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === 'done') {
    return (
      <View style={[styles.card, styles.centered, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={styles.doneIcon}>✅</Text>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Swap Complete</Text>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
          {shift?.settleAmount} {shift?.settleCoin} has arrived in your wallet.
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.orange, marginTop: spacing.lg }]}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>New Swap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === 'error') {
    return (
      <View style={[styles.card, styles.centered, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={styles.doneIcon}>⚠️</Text>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Something went wrong</Text>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{errorMsg}</Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.orange, marginTop: spacing.lg }]}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      borderWidth:  1,
      padding:      spacing.xl,
    },
    centered: {
      alignItems: 'center',
      gap:        spacing.md,
    },
    cardTitle: {
      fontSize:     17,
      fontWeight:   '700',
      marginBottom: spacing.sm,
    },
    cardSub: {
      fontSize:     13,
      marginBottom: spacing.lg,
      lineHeight:   20,
    },
    fieldLabel: {
      fontSize:     12,
      fontWeight:   '600',
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: 'row',
      gap:           spacing.sm,
      marginBottom:  spacing.sm,
    },
    amountInput: {
      flex:              1,
      borderRadius:      radius.md,
      borderWidth:       1,
      paddingHorizontal: spacing.lg,
      paddingVertical:   14,
      fontSize:          18,
    },
    coinButton: {
      borderRadius:      radius.md,
      borderWidth:       1,
      paddingHorizontal: spacing.lg,
      paddingVertical:   14,
      justifyContent:    'center',
    },
    coinButtonText: {
      fontSize:   15,
      fontWeight: '700',
    },
    toRow: {
      borderRadius:      radius.md,
      borderWidth:       1,
      paddingHorizontal: spacing.lg,
      paddingVertical:   14,
      marginBottom:      spacing.md,
    },
    swapArrow: {
      textAlign:     'center',
      fontSize:      20,
      marginVertical: spacing.sm,
    },
    primaryButton: {
      borderRadius:    radius.full,
      paddingVertical: 14,
      alignItems:      'center',
    },
    primaryButtonText: {
      fontSize:   15,
      fontWeight: '700',
      color:      '#FFFFFF',
    },
    disabled: {
      opacity: 0.5,
    },
    ghostButton: {
      paddingVertical: 12,
      alignItems:      'center',
      marginTop:       spacing.sm,
    },
    ghostButtonText: {
      fontSize:   14,
      fontWeight: '600',
    },
    quoteRow: {
      flexDirection:   'row',
      justifyContent:  'space-between',
      alignItems:      'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    quoteLabel: {
      fontSize: 13,
    },
    quoteValue: {
      fontSize:   14,
      fontWeight: '700',
    },
    quoteValueSmall: {
      fontSize: 12,
      maxWidth: 160,
    },
    addressBox: {
      borderRadius:  radius.md,
      borderWidth:   1,
      padding:       spacing.lg,
      marginVertical: spacing.lg,
    },
    addressText: {
      fontSize:   13,
      fontWeight: '600',
      lineHeight: 20,
    },
    statusBadge: {
      borderRadius:      radius.full,
      borderWidth:       1,
      paddingVertical:   6,
      paddingHorizontal: spacing.lg,
      alignSelf:         'center',
      marginBottom:      spacing.md,
    },
    statusBadgeText: {
      fontSize:   12,
      fontWeight: '700',
    },
    hintText: {
      fontSize:  11,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    statusText: {
      fontSize:  14,
      marginTop: spacing.md,
    },
    doneIcon: {
      fontSize: 48,
    },
    // Coin picker modal
    modalOverlay: {
      flex:            1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent:  'flex-end',
    },
    modalSheet: {
      borderTopLeftRadius:  radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth:          1,
      maxHeight:            '60%',
      padding:              spacing.xl,
    },
    modalTitle: {
      fontSize:     17,
      fontWeight:   '700',
      marginBottom: spacing.lg,
      textAlign:    'center',
    },
    coinRow: {
      flexDirection:   'row',
      justifyContent:  'space-between',
      alignItems:      'center',
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
    },
    coinLabel: {
      fontSize:   16,
      fontWeight: '600',
    },
  });

export default SideShiftWidget;
