import React, { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../theme/ThemeContext';
import { API_URL } from '../config';
import { useNavigation } from '@react-navigation/native';

// Locked conviction score tiers -- matches MAGMA_NOVA_ECONOMICS_TECH_SPEC.md
const CONVICTION_TIERS = [
  { name: 'Ember',    min: 0,   max: 99,   color: '#FF6B35', emoji: '\uD83D\uDD25', description: 'Just getting started',    multiplier: '1.0x', fee: '2.0%' },
  { name: 'Flare',    min: 100, max: 299,  color: '#FFB347', emoji: '\u26A1',         description: 'Rising conviction',       multiplier: '1.3x', fee: '1.5%' },
  { name: 'Magma',    min: 300, max: 599,  color: '#FF3355', emoji: '\uD83C\uDF0B', description: 'Core community member',   multiplier: '1.6x', fee: '1.5%' },
  { name: 'Core',     min: 600, max: 899,  color: '#00FF88', emoji: '\uD83D\uDC8E', description: 'Elite backer',            multiplier: '2.0x', fee: '1.0%' },
  { name: 'Volcanic', min: 900, max: 1000, color: '#9B8FFF', emoji: '\uD83C\uDF0A', description: 'Maximum conviction',      multiplier: '2.5x', fee: '0.0%' },
];

const APP_VERSION = '1.0.0-alpha';

const ProfileScreen: React.FC = () => {
  const { account, isConnected, disconnect, connect, nftState } = useWallet();
  const { theme, colorScheme, setColorScheme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [convictionScore, setConvictionScore] = useState(0);
  const [convictionTier, setConvictionTier]   = useState(CONVICTION_TIERS[0]);
  const [accuracyRate, setAccuracyRate]        = useState(0);
  const [biometricEnabled, setBiometricEnabled]       = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasBiometric, setHasBiometric]               = useState(false);
  const [isDisconnecting, setIsDisconnecting]         = useState(false);

  const badgeScale = useSharedValue(1);

  // Fetch real conviction data
  useEffect(() => {
    if (!account?.address) return;
    fetch(API_URL + '/v1/conviction/' + account.address)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const score = d.conviction_score ?? 0;
        setConvictionScore(score);
        setAccuracyRate(d.accuracy_rate ?? 0);
        const tier = CONVICTION_TIERS.find(t => score >= t.min && score <= t.max) ?? CONVICTION_TIERS[0];
        setConvictionTier(tier);
        badgeScale.value = withSpring(1.08, { damping: 10 }, () => {
          badgeScale.value = withTiming(1, { duration: 300 });
        });
      })
      .catch(() => {});
  }, [account?.address]);

  // Check biometric
  useEffect(() => {
    LocalAuthentication.hasHardwareAsync()
      .then(h => h ? LocalAuthentication.isEnrolledAsync() : Promise.resolve(false))
      .then(e => setHasBiometric(e))
      .catch(() => setHasBiometric(false));
  }, []);

  // Check notifications
  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then(({ status }) => setNotificationsEnabled(status === 'granted'))
      .catch(() => {});
  }, []);

  const toggleBiometric = useCallback(async (value: boolean) => {
    if (!value) { setBiometricEnabled(false); return; }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Lock',
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) {
        setBiometricEnabled(true);
      } else {
        Alert.alert('Failed', 'Authentication failed');
      }
    } catch {
      Alert.alert('Error', 'Failed to enable biometric lock');
    }
  }, []);

  const toggleNotifications = useCallback(async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      setNotificationsEnabled(true);
    } else {
      Alert.alert('Permission Denied', 'Notification permission was not granted');
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    Alert.alert('Disconnect Wallet', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive',
        onPress: async () => {
          setIsDisconnecting(true);
          try { await disconnect(); } catch { Alert.alert('Error', 'Failed to disconnect'); }
          finally { setIsDisconnecting(false); }
        },
      },
    ]);
  }, [disconnect]);

  const formatAddress = (address: string) =>
    address ? address.slice(0, 4) + '...' + address.slice(-4) : 'Not connected';

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const nextTier = CONVICTION_TIERS[CONVICTION_TIERS.indexOf(convictionTier) + 1];
  const progress = nextTier
    ? Math.min(((convictionScore - convictionTier.min) / (nextTier.min - convictionTier.min)) * 100, 100)
    : 100;

  const s = makeStyles(theme, insets);

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.bgBase }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Tier Badge */}
      <Animated.View style={[s.tierCard, { borderColor: convictionTier.color + '40' }, badgeStyle]}>
        <Text style={s.tierEmoji}>{convictionTier.emoji}</Text>
        <Text style={[s.tierName, { color: convictionTier.color }]}>{convictionTier.name}</Text>
        <Text style={[s.tierDesc, { color: theme.textSecondary }]}>{convictionTier.description}</Text>
        <View style={s.tierStats}>
          <View style={s.tierStat}>
            <Text style={[s.tierStatValue, { color: theme.textPrimary }]}>{convictionScore}</Text>
            <Text style={[s.tierStatLabel, { color: theme.textTertiary }]}>Score</Text>
          </View>
          <View style={[s.tierStatDivider, { backgroundColor: theme.cardBorder }]} />
          <View style={s.tierStat}>
            <Text style={[s.tierStatValue, { color: theme.textPrimary }]}>{convictionTier.multiplier}</Text>
            <Text style={[s.tierStatLabel, { color: theme.textTertiary }]}>Yield Mult</Text>
          </View>
          <View style={[s.tierStatDivider, { backgroundColor: theme.cardBorder }]} />
          <View style={s.tierStat}>
            <Text style={[s.tierStatValue, { color: theme.textPrimary }]}>{accuracyRate.toFixed(1)}%</Text>
            <Text style={[s.tierStatLabel, { color: theme.textTertiary }]}>Accuracy</Text>
          </View>
        </View>
        {nextTier && (
          <View style={s.progressWrap}>
            <View style={[s.progressBar, { backgroundColor: theme.cardBorder }]}>
              <View style={[s.progressFill, { width: (progress + '%') as any, backgroundColor: convictionTier.color }]} />
            </View>
            <Text style={[s.progressLabel, { color: theme.textTertiary }]}>
              {nextTier.min - convictionScore} pts to {nextTier.name}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Conviction Score shortcut */}
      <TouchableOpacity
        style={[s.card, s.row, { borderColor: 'rgba(255,107,53,0.25)' }]}
        onPress={() => navigation.navigate('ConvictionProfile' as never)}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={[s.cardLabel, { color: theme.textTertiary }]}>MY CONVICTION SCORE</Text>
          <Text style={[s.cardValue, { color: theme.orange }]}>View Full Profile →</Text>
          {nftState?.mlava_tier && (
            <Text style={[s.cardSub, { color: theme.amber }]}>{nftState.mlava_tier.toUpperCase()} NFT Active</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Wallet */}
      <View style={s.card}>
        <View style={s.row}>
          <Text style={[s.cardLabel, { color: theme.textTertiary }]}>CONNECTED WALLET</Text>
          <View style={[s.badge, { backgroundColor: isConnected ? 'rgba(34,197,94,0.12)' : 'rgba(92,86,104,0.12)' }]}>
            <View style={[s.dot, { backgroundColor: isConnected ? '#22C55E' : theme.textTertiary }]} />
            <Text style={[s.badgeText, { color: isConnected ? '#22C55E' : theme.textTertiary }]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
        <Text style={[s.walletAddr, { color: theme.textPrimary }]}>
          {isConnected && account ? formatAddress(account.address) : 'Not connected'}
        </Text>
      </View>

      {/* Security */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>SECURITY</Text>
        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          <View style={[s.settingRow, { borderBottomColor: theme.cardBorder }]}>
            <Text style={s.settingEmoji}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingTitle, { color: hasBiometric ? theme.textPrimary : theme.textTertiary }]}>Biometric Lock</Text>
              <Text style={[s.settingDesc, { color: theme.textTertiary }]}>
                {hasBiometric ? 'Use fingerprint or face to unlock' : 'Not available on this device'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              disabled={!hasBiometric}
              trackColor={{ false: theme.cardBorder, true: theme.orange }}
              thumbColor={theme.bgBase}
            />
          </View>
          <View style={s.settingRow}>
            <Text style={s.settingEmoji}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingTitle, { color: theme.textPrimary }]}>Push Notifications</Text>
              <Text style={[s.settingDesc, { color: theme.textTertiary }]}>Alerts for resolutions and payouts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: theme.cardBorder, true: theme.orange }}
              thumbColor={theme.bgBase}
            />
          </View>
        </View>
      </View>

      {/* Dark Mode */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>APPEARANCE</Text>
        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          <View style={s.settingRow}>
            <Text style={s.settingEmoji}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingTitle, { color: theme.textPrimary }]}>Dark Mode</Text>
              <Text style={[s.settingDesc, { color: theme.textTertiary }]}>Toggle light / dark theme</Text>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={v => setColorScheme(v ? 'dark' : 'light')}
              trackColor={{ false: theme.cardBorder, true: theme.orange }}
              thumbColor={theme.bgBase}
            />
          </View>
        </View>
      </View>

      {/* Account */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>ACCOUNT</Text>
        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          <TouchableOpacity style={[s.actionRow, { borderBottomColor: theme.cardBorder }]} onPress={() => navigation.navigate('History' as never)} activeOpacity={0.7}>
            <Text style={s.settingEmoji}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingTitle, { color: theme.textPrimary }]}>Activity Log</Text>
              <Text style={[s.settingDesc, { color: theme.textTertiary }]}>View transaction history</Text>
            </View>
            <Text style={[s.arrow, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionRow, { borderBottomColor: theme.cardBorder }]} onPress={() => navigation.navigate('Terms' as never)} activeOpacity={0.7}>
            <Text style={s.settingEmoji}>📜</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingTitle, { color: theme.textPrimary }]}>Terms of Service</Text>
              <Text style={[s.settingDesc, { color: theme.textTertiary }]}>Read our terms</Text>
            </View>
            <Text style={[s.arrow, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionRow} onPress={() => navigation.navigate('About' as never)} activeOpacity={0.7}>
            <Text style={s.settingEmoji}>ℹ️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingTitle, { color: theme.textPrimary }]}>About MAGMA</Text>
              <Text style={[s.settingDesc, { color: theme.textTertiary }]}>Version {APP_VERSION}</Text>
            </View>
            <Text style={[s.arrow, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Disconnect */}
      <View style={s.section}>
        {!isConnected && (
          <TouchableOpacity style={[s.btn, { borderColor: theme.orange, backgroundColor: 'rgba(255,107,53,0.08)' }]} onPress={() => connect()} activeOpacity={0.7}>
            <Text style={[s.btnText, { color: theme.orange }]}>Connect Wallet</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.btn, { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)', marginTop: 8 }]}
          onPress={handleDisconnect}
          disabled={isDisconnecting || !isConnected}
          activeOpacity={0.7}
        >
          <Text style={[s.btnText, { color: '#EF4444' }]}>
            {isDisconnecting ? 'Disconnecting...' : isConnected ? 'Disconnect Wallet' : 'No Wallet Connected'}
          </Text>
        </TouchableOpacity>
        <Text style={[s.dangerNote, { color: theme.textTertiary }]}>
          Disconnecting requires reconnect for transactions
        </Text>
      </View>

      {/* Footer */}
      <View style={[s.footer, { borderTopColor: theme.cardBorder }]}>
        <Text style={[s.footerLogo, { color: theme.orange }]}>MAGMA</Text>
        <Text style={[s.footerSub, { color: theme.textTertiary }]}>Version {APP_VERSION} · © 2026 MAGMA Protocol</Text>
      </View>
    </ScrollView>
  );
};

const makeStyles = (theme: any, insets: any) => StyleSheet.create({
  container:     { flex: 1 },
  content:       { padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 },
  tierCard:      { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', gap: 4, backgroundColor: theme.bgSurface },
  tierEmoji:     { fontSize: 48, marginBottom: 4 },
  tierName:      { fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  tierDesc:      { fontSize: 13, marginBottom: 8 },
  tierStats:     { flexDirection: 'row', alignItems: 'center', gap: 0, width: '100%', marginTop: 12 },
  tierStat:      { flex: 1, alignItems: 'center', gap: 2 },
  tierStatValue: { fontSize: 18, fontWeight: '700' },
  tierStatLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  tierStatDivider: { width: 1, height: 32 },
  progressWrap:  { width: '100%', marginTop: 16, gap: 6 },
  progressBar:   { height: 6, borderRadius: 3, overflow: 'hidden', width: '100%' },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, textAlign: 'center' },
  card:          { backgroundColor: theme.bgSurface, borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder, padding: 16 },
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel:     { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  cardValue:     { fontSize: 15, fontWeight: '600' },
  cardSub:       { fontSize: 11, marginTop: 2 },
  badge:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  dot:           { width: 6, height: 6, borderRadius: 3 },
  badgeText:     { fontSize: 11, fontWeight: '600' },
  walletAddr:    { fontSize: 15, fontWeight: '600', marginTop: 8 },
  section:       { gap: 8 },
  sectionTitle:  { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginLeft: 4 },
  settingRow:    { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 12 },
  actionRow:     { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 12 },
  settingEmoji:  { fontSize: 20, width: 28, textAlign: 'center' },
  settingTitle:  { fontSize: 14, fontWeight: '600' },
  settingDesc:   { fontSize: 12, marginTop: 1 },
  arrow:         { fontSize: 20, fontWeight: '300' },
  btn:           { borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  btnText:       { fontSize: 14, fontWeight: '700' },
  dangerNote:    { fontSize: 11, textAlign: 'center', marginTop: 6 },
  footer:        { alignItems: 'center', paddingTop: 24, borderTopWidth: 1, gap: 4 },
  footerLogo:    { fontSize: 18, fontWeight: '800', letterSpacing: 4 },
  footerSub:     { fontSize: 11 },
});

export default ProfileScreen;
