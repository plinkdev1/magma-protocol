import React, { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';

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
  error: '#ff3355',
};

// Tier definitions
interface Tier {
  name: string;
  minBalance: number;
  maxBalance: number;
  color: string;
  icon: string;
  description: string;
}

const TIERS: Tier[] = [
  { name: 'Ember', minBalance: 0, maxBalance: 999, color: '#ff6b35', icon: '🔥', description: 'Just getting started' },
  { name: 'Flare', minBalance: 1000, maxBalance: 9999, color: '#ffb347', icon: '🌟', description: 'Rising influence' },
  { name: 'Magma', minBalance: 10000, maxBalance: 99999, color: '#ff3355', icon: '🌋', description: 'Core community member' },
  { name: 'Core', minBalance: 100000, maxBalance: Infinity, color: '#00ff88', icon: '💎', description: 'Elite tier holder' },
];

const APP_VERSION = '1.0.0-alpha';

const ProfileScreen: React.FC = () => {
  const { account, isConnected, disconnect, isConnected: isWalletConnected } = useAuthorization();
  const insets = useSafeAreaInsets();
  const [magmaBalance, setMagmaBalance] = useState(0);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const badgeScale = useSharedValue(1);
  const badgeRotate = useSharedValue(0);

  // Get current tier
  const getCurrentTier = useCallback((): Tier => {
    return TIERS.find((tier) => magmaBalance >= tier.minBalance && magmaBalance <= tier.maxBalance) || TIERS[0];
  }, [magmaBalance]);

  const currentTier = getCurrentTier();

  // Check biometric support
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometric(hasHardware && isEnrolled);
      } catch (error) {
        console.error('[ProfileScreen] Biometric check failed:', error);
        setHasBiometric(false);
      }
    };
    checkBiometric();
  }, []);

  // Check notification permissions
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
      } catch (error) {
        console.error('[ProfileScreen] Notification check failed:', error);
      }
    };
    checkNotifications();
  }, []);

  // Animate badge on mount
  useEffect(() => {
    badgeScale.value = withSpring(1.1, { damping: 10 }, () => {
      badgeScale.value = withTiming(1, { duration: 300 });
    });
  }, [currentTier]);

  // Toggle biometric lock
  const toggleBiometric = useCallback(async (value: boolean) => {
    if (!value) {
      setBiometricEnabled(false);
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometric Not Available',
          'Your device does not support biometric authentication or no biometrics are enrolled.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Lock',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setBiometricEnabled(true);
        Alert.alert('Success', 'Biometric lock enabled', [{ text: 'OK' }]);
      } else {
        Alert.alert('Failed', 'Authentication failed', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('[ProfileScreen] Biometric toggle failed:', error);
      Alert.alert('Error', 'Failed to enable biometric lock', [{ text: 'OK' }]);
    }
  }, []);

  // Toggle notifications
  const toggleNotifications = useCallback(async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

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
      } else {
        Alert.alert('Permission Denied', 'Notification permission was not granted', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('[ProfileScreen] Notification toggle failed:', error);
      Alert.alert('Error', 'Failed to enable notifications', [{ text: 'OK' }]);
    }
  }, []);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet? You will need to reconnect to perform transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setIsDisconnecting(true);
            try {
              await disconnect();
              Alert.alert('Disconnected', 'Wallet disconnected successfully', [{ text: 'OK' }]);
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect wallet', [{ text: 'OK' }]);
            } finally {
              setIsDisconnecting(false);
            }
          },
        },
      ]
    );
  }, [disconnect]);

  // Format address
  const formatAddress = useCallback((address: string) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, []);

  // Animated badge style
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }, { rotate: `${badgeRotate.value}deg` }],
  }));

  // Tier Badge component
  const TierBadge = () => (
    <Animated.View style={[styles.tierBadge, badgeStyle]}>
      <View style={[styles.tierBadgeIcon, { backgroundColor: `${currentTier.color}20` }]}>
        <Text style={styles.tierBadgeEmoji}>{currentTier.icon}</Text>
      </View>
      <Text style={[styles.tierBadgeName, { color: currentTier.color }]}>{currentTier.name}</Text>
      <Text style={styles.tierBadgeDescription}>{currentTier.description}</Text>
      <View style={styles.tierBadgeBalance}>
        <Text style={styles.tierBadgeBalanceValue}>{magmaBalance.toLocaleString()}</Text>
        <Text style={styles.tierBadgeBalanceLabel}>$MAGMA</Text>
      </View>
    </Animated.View>
  );

  // Wallet Card component
  const WalletCard = () => (
    <View style={styles.walletCard}>
      <View style={styles.walletCardHeader}>
        <Text style={styles.walletCardLabel}>Connected Wallet</Text>
        <View style={[styles.connectionStatus, styles.connectionStatusConnected]}>
          <View style={styles.connectionDot} />
          <Text style={styles.connectionText}>Connected</Text>
        </View>
      </View>
      <Text style={styles.walletAddress} numberOfLines={1}>
        {account ? account.toBase58() : 'Not connected'}
      </Text>
      <Text style={styles.walletAddressShort}>
        {account ? formatAddress(account.toBase58()) : 'Not connected'}
      </Text>
    </View>
  );

  // Setting Row component
  const SettingRow = ({
    icon,
    title,
    description,
    value,
    onValueChange,
    disabled = false,
  }: {
    icon: string;
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingRowIcon}>
        <Text style={styles.settingRowIconText}>{icon}</Text>
      </View>
      <View style={styles.settingRowInfo}>
        <Text style={[styles.settingRowTitle, disabled && styles.settingRowTitleDisabled]}>
          {title}
        </Text>
        <Text style={[styles.settingRowDescription, disabled && styles.settingRowDescriptionDisabled]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: COLORS.cardBorder, true: COLORS.primary }}
        thumbColor={COLORS.background}
      />
    </View>
  );

  // Settings Section component
  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.settingsSection}>
      <Text style={styles.settingsSectionTitle}>{title}</Text>
      <View style={styles.settingsSectionContent}>{children}</View>
    </View>
  );

  // Tier Progress component
  const TierProgress = () => {
    const currentIndex = TIERS.findIndex((t) => t.name === currentTier.name);
    const nextTier = TIERS[currentIndex + 1];
    const progress = nextTier
      ? Math.min(((magmaBalance - currentTier.minBalance) / (nextTier.minBalance - currentTier.minBalance)) * 100, 100)
      : 100;

    return (
      <View style={styles.tierProgress}>
        <View style={styles.tierProgressHeader}>
          <Text style={styles.tierProgressLabel}>Progress to {nextTier?.name || 'Max'}</Text>
          <Text style={styles.tierProgressValue}>{progress.toFixed(1)}%</Text>
        </View>
        <View style={styles.tierProgressBar}>
          <View style={[styles.tierProgressBarFill, { width: `${progress}%`, backgroundColor: currentTier.color }]} />
        </View>
        {nextTier && (
          <Text style={styles.tierProgressRemaining}>
            {(nextTier.minBalance - magmaBalance).toLocaleString()} $MAGMA remaining
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Tier Badge */}
      <TierBadge />

      {/* Tier Progress */}
      {currentTier.name !== 'Core' && <TierProgress />}

      {/* Wallet Card */}
      <WalletCard />

      {/* Security Settings */}
      <SettingsSection title="Security">
        <SettingRow
          icon="🔐"
          title="Biometric Lock"
          description="Use fingerprint or face to unlock"
          value={biometricEnabled}
          onValueChange={toggleBiometric}
          disabled={!hasBiometric}
        />
        {!hasBiometric && (
          <Text style={styles.settingNote}>Biometric authentication not available on this device</Text>
        )}
      </SettingsSection>

      {/* Notifications Settings */}
      <SettingsSection title="Notifications">
        <SettingRow
          icon="🔔"
          title="Push Notifications"
          description="Receive alerts for score changes and payouts"
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
        />
      </SettingsSection>

      {/* Account Settings */}
      <SettingsSection title="Account">
        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
          <View style={styles.actionRowIcon}>
            <Text style={styles.actionRowIconText}>📋</Text>
          </View>
          <View style={styles.actionRowInfo}>
            <Text style={styles.actionRowTitle}>View Activity Log</Text>
            <Text style={styles.actionRowDescription}>See your transaction history</Text>
          </View>
          <Text style={styles.actionRowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
          <View style={styles.actionRowIcon}>
            <Text style={styles.actionRowIconText}>🛡️</Text>
          </View>
          <View style={styles.actionRowInfo}>
            <Text style={styles.actionRowTitle}>Privacy Settings</Text>
            <Text style={styles.actionRowDescription}>Manage data and visibility</Text>
          </View>
          <Text style={styles.actionRowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
          <View style={styles.actionRowIcon}>
            <Text style={styles.actionRowIconText}>❓</Text>
          </View>
          <View style={styles.actionRowInfo}>
            <Text style={styles.actionRowTitle}>Help & Support</Text>
            <Text style={styles.actionRowDescription}>FAQs and contact support</Text>
          </View>
          <Text style={styles.actionRowArrow}>→</Text>
        </TouchableOpacity>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="Danger Zone">
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleDisconnect}
          disabled={isDisconnecting || !isConnected}
          activeOpacity={0.7}
        >
          <Text style={styles.dangerButtonIcon}>👛</Text>
          <Text style={styles.dangerButtonText}>
            {isDisconnecting ? 'Disconnecting...' : isConnected ? 'Disconnect Wallet' : 'No Wallet Connected'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.dangerNote}>
          Disconnecting will require you to reconnect to perform transactions
        </Text>
      </SettingsSection>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoLogo}>MAGMA</Text>
        <Text style={styles.appInfoVersion}>Version {APP_VERSION}</Text>
        <Text style={styles.appInfoCopyright}>© 2026 MAGMA Protocol</Text>
        <View style={styles.appInfoLinks}>
          <TouchableOpacity>
            <Text style={styles.appInfoLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.appInfoLinkDivider}>•</Text>
          <TouchableOpacity>
            <Text style={styles.appInfoLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={styles.appInfoLinkDivider}>•</Text>
          <TouchableOpacity>
            <Text style={styles.appInfoLink}>Docs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 0,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  tierBadge: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    marginBottom: 16,
  },
  tierBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tierBadgeEmoji: {
    fontSize: 40,
  },
  tierBadgeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Syne-Bold',
  },
  tierBadgeDescription: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 12,
    fontFamily: 'Syne-Regular',
  },
  tierBadgeBalance: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierBadgeBalanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Syne-Bold',
  },
  tierBadgeBalanceLabel: {
    fontSize: 14,
    color: COLORS.muted,
    marginLeft: 4,
    fontFamily: 'Syne-Regular',
  },
  tierProgress: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  tierProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierProgressLabel: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  tierProgressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Syne-Bold',
  },
  tierProgressBar: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tierProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  tierProgressRemaining: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    fontFamily: 'Syne-Regular',
  },
  walletCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletCardLabel: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionStatusConnected: {
    backgroundColor: `${COLORS.success}20`,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
    fontFamily: 'Syne-Regular',
  },
  walletAddress: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  walletAddressShort: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
    fontFamily: 'Syne-Bold',
  },
  settingsSection: {
    marginBottom: 16,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Syne-Bold',
  },
  settingsSectionContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingRowIconText: {
    fontSize: 18,
  },
  settingRowInfo: {
    flex: 1,
  },
  settingRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
  settingRowTitleDisabled: {
    color: COLORS.muted,
  },
  settingRowDescription: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    fontFamily: 'Syne-Regular',
  },
  settingRowDescriptionDisabled: {
    color: COLORS.muted,
    opacity: 0.7,
  },
  settingNote: {
    fontSize: 11,
    color: COLORS.muted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontStyle: 'italic',
    fontFamily: 'Syne-Regular',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  actionRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionRowIconText: {
    fontSize: 18,
  },
  actionRowInfo: {
    flex: 1,
  },
  actionRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
  actionRowDescription: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    fontFamily: 'Syne-Regular',
  },
  actionRowArrow: {
    fontSize: 18,
    color: COLORS.muted,
  },
  dangerZone: {
    marginBottom: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.error}15`,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: 8,
  },
  dangerButtonIcon: {
    fontSize: 18,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
    fontFamily: 'Syne-Bold',
  },
  dangerNote: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Syne-Regular',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  appInfoLogo: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 4,
    fontFamily: 'Syne-Bold',
    marginBottom: 8,
  },
  appInfoVersion: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  appInfoCopyright: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
    fontFamily: 'Syne-Regular',
  },
  appInfoLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  appInfoLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'Syne-Regular',
  },
  appInfoLinkDivider: {
    fontSize: 12,
    color: COLORS.muted,
    marginHorizontal: 8,
  },
});

export default ProfileScreen;
