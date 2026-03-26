import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { radius, spacing } from '../theme/tokens';
import { API_URL } from '../config';

const TERMS_CONTENT = `MAGMA PROTOCOL — TERMS AND CONDITIONS
Version 1.0 | March 2026

PLEASE READ THESE TERMS CAREFULLY BEFORE USING MAGMA PROTOCOL.

1. ACCEPTANCE OF TERMS
By connecting your wallet and using MAGMA Protocol, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the protocol.

2. ELIGIBILITY
You must be 18 years or older to participate. By using MAGMA, you confirm you meet this requirement and that participation is legal in your jurisdiction.

3. CAPITAL AT RISK
All SOL or tokens you back a narrative with are at risk. Incorrect backings result in loss of your backing amount. MAGMA Protocol is not responsible for any financial losses.

4. NOT A SECURITIES PLATFORM
MAGMA Protocol is not a securities exchange, investment platform, or financial advisor. Narratives are prediction markets, not investments. Nothing on this platform constitutes financial advice.

5. ANTI-SYBIL REQUIREMENT
One-time human verification (Civic or Gitcoin Passport) is required to participate. Attempting to circumvent this verification will result in permanent wallet ban.

6. ORACLE DECISIONS
Oracle resolutions are final unless successfully challenged within the 48-hour challenge window. Admin decisions on challenges are final.

7. PROTOCOL FEES
MAGMA charges a protocol fee on correct resolutions based on your Conviction Tier. Fees range from 0% (Volcanic) to 2% (Ember). Fee schedules may change with 30 days notice.

8. ECHO POOL
The Echo Pool distributes 35% of incorrect backers capital to correct backers monthly. Distribution amounts are not guaranteed and depend on protocol activity.

9. PROHIBITED ACTIVITIES
You may not: use bots or automated systems to back narratives, attempt to manipulate oracle outcomes, submit fraudulent challenges, or engage in wash trading.

10. LIMITATION OF LIABILITY
MAGMA Protocol and ExiDante Corp are not liable for any direct, indirect, or consequential damages arising from your use of the protocol, including smart contract bugs, oracle errors, or market conditions.

11. GOVERNING LAW
These terms are governed by the laws of the applicable jurisdiction. Disputes shall be resolved through binding arbitration.

12. MODIFICATIONS
We reserve the right to modify these terms at any time. Continued use after modifications constitutes acceptance of the new terms.

By tapping "I Agree" below, you confirm you have read, understood, and agree to these Terms and Conditions.

MAGMA Protocol · ExiDante Corp · 2026`;

const TermsScreen: React.FC<{ onAccept?: () => void; onClose?: () => void }> = ({ onAccept, onClose }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { account } = useWallet();
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isBottom) setScrolledToBottom(true);
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await AsyncStorage.setItem('terms_accepted', 'true');
      await AsyncStorage.setItem('terms_version', '1.0');
      if (account?.address) {
        await fetch(`${API_URL}/v1/users/accept-terms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: account.address, version: '1.0' }),
        });
      }
      setAccepted(true);
      onAccept?.();
    } catch (err) {
      Alert.alert('Error', 'Failed to record acceptance. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bgBase, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Terms & Conditions</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeBtn, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {!scrolledToBottom && (
        <View style={[styles.scrollHint, { backgroundColor: 'rgba(255,107,53,0.08)', borderColor: theme.borderMedium }]}>
          <Text style={[styles.scrollHintText, { color: theme.orange }]}>↓ Scroll to read all terms before accepting</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        <Text style={[styles.termsText, { color: theme.textSecondary }]}>{TERMS_CONTENT}</Text>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bgBase, borderTopColor: theme.cardBorder, paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.acceptBtn,
            { backgroundColor: scrolledToBottom ? theme.orange : theme.cardBg,
              borderColor: scrolledToBottom ? theme.orange : theme.cardBorder },
          ]}
          onPress={handleAccept}
          disabled={!scrolledToBottom || accepting || accepted}
          activeOpacity={0.7}
        >
          <Text style={[styles.acceptBtnText, { color: scrolledToBottom ? '#FFF' : theme.textTertiary }]}>
            {accepted ? '✓ Accepted' : accepting ? 'Recording...' : scrolledToBottom ? 'I Agree to Terms & Conditions' : 'Scroll to bottom to accept'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle:    { fontSize: 18, fontWeight: '700' },
  closeBtn:       { fontSize: 18, padding: 4 },
  scrollHint:     { margin: 16, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  scrollHintText: { fontSize: 13, fontWeight: '600' },
  scroll:         { flex: 1 },
  scrollContent:  { padding: 20 },
  termsText:      { fontSize: 13, lineHeight: 22 },
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  acceptBtn:      { borderRadius: 9999, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  acceptBtnText:  { fontSize: 15, fontWeight: '700' },
});

export default TermsScreen;
