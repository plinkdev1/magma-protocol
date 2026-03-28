import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './src/theme/ThemeContext';
import { useWallet } from './src/context/WalletContext';
import WalletPickerModal from './src/components/WalletPickerModal';
import { radius, spacing } from './src/theme/tokens';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type DrawerParamList = {
  MainTabs: undefined;
};

// â”€â”€â”€ Persistent Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const AppHeader: React.FC<{ title?: string }> = ({ title }) => {
  const { theme, colorScheme, setColorScheme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.header,
      {
        paddingTop:      insets.top + 8,
        backgroundColor: theme.bgBase,
        borderBottomColor: theme.cardBorder,
      },
    ]}>
      {/* Left â€” hamburger */}
      <TouchableOpacity
        style={styles.headerBtn}
        onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.hamburger}>
          <View style={[styles.hamburgerLine, { backgroundColor: theme.textPrimary }]} />
          <View style={[styles.hamburgerLine, { backgroundColor: theme.textPrimary, width: 16 }]} />
          <View style={[styles.hamburgerLine, { backgroundColor: theme.textPrimary }]} />
        </View>
      </TouchableOpacity>

      {/* Center â€” logo */}
      <View style={styles.headerCenter}>
        <Text style={[styles.logoText, { color: theme.orange }]}>MAGMA</Text>
        {title && (
          <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>{title}</Text>
        )}
      </View>

      {/* Right â€” search + history + wallet */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => { navigation.getParent()?.navigate('Search'); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.headerIcon, { color: theme.textSecondary }]}>ðŸ”</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => { setTimeout(() => navigation.getParent()?.navigate('History'), 0); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.headerIcon, { color: theme.textSecondary }]}>ðŸ•</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.walletPill, { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: theme.borderMedium }]}
          onPress={() => { navigation.closeDrawer(); navigation.navigate('Main', { screen: 'Profile' }); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.walletPillText, { color: theme.orange }]}>â¬¡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// â”€â”€â”€ Drawer Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DrawerItem: React.FC<{
  label:    string;
  emoji:    string;
  onPress:  () => void;
  muted?:   boolean;
  badge?:   string;
}> = ({ label, emoji, onPress, muted, badge }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.drawerItem, muted && styles.drawerItemMuted]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.drawerItemEmoji}>{emoji}</Text>
      <Text style={[styles.drawerItemLabel, { color: muted ? theme.textTertiary : theme.textPrimary }]}>
        {label}
      </Text>
      {badge && (
        <View style={[styles.drawerBadge, { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: theme.borderMedium }]}>
          <Text style={[styles.drawerBadgeText, { color: theme.orange }]}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const DrawerSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.drawerSection}>
      <Text style={[styles.drawerSectionTitle, { color: theme.textTertiary }]}>{title}</Text>
      {children}
    </View>
  );
};

export const DrawerContent: React.FC<any> = (props) => {
  const { theme, colorScheme, setColorScheme } = useTheme();
  const navigation = props.navigation;
  const { account, isConnected, disconnect } = useWallet();
  const [showWalletPicker, setShowWalletPicker] = React.useState(false);
  const insets = useSafeAreaInsets();

  const go = (screen: string) => {
    navigation.closeDrawer();
    setTimeout(() => {
      navigation.getParent()?.navigate('Main', { screen });
    }, 300);
  };

  const goStack = (screen: string) => {
    navigation.closeDrawer();
    setTimeout(() => {
      navigation.getParent()?.navigate(screen);
    }, 300);
  };

  const goTab = (tab: string) => {
    navigation.closeDrawer();
    setTimeout(() => {
      navigation.getParent()?.navigate('Main', { screen: tab });
    }, 300);
  };

  return (
    <View style={[styles.drawerContainer, { backgroundColor: theme.bgElevated }]}>
      {/* Logo area */}
      <View style={[styles.drawerHeader, { paddingTop: insets.top + 16, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.drawerLogoRow}>
          <Image source={require('./assets/magma-icon-circle.png')} style={styles.drawerLogoImg} />
          <Text style={[styles.drawerLogo, { color: theme.orange }]}>MAGMA</Text>
        </View>
        <Text style={[styles.drawerSubtitle, { color: theme.textTertiary }]}>Conviction Capital Markets</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.drawerScroll}>

        <DrawerSection title="MAGMA CORE">
          <DrawerItem emoji="ðŸ " label="Feed"              onPress={() => goTab('Feed')} />
          <DrawerItem emoji="ðŸš€" label="Submit Narrative"  onPress={() => goTab('Launch')} />
          <DrawerItem emoji="ðŸ’¼" label="My Portfolio"      onPress={() => goTab('Portfolio')} />
          <DrawerItem emoji="ðŸ“Š" label="DeFi / Control"    onPress={() => goTab('DeFi')} />
        </DrawerSection>

        <DrawerSection title="NOVA">
          <DrawerItem emoji="âš¡" label="My Conviction Score" onPress={() => goTab('Profile')} />
          <DrawerItem emoji="ðŸŒŠ" label="Echo Pool"           onPress={() => goStack('EchoPool')} />
          <DrawerItem emoji="âœï¸" label="Creator Studio"      onPress={() => goStack('CreatorStudio')} />
              <DrawerItem emoji="🏆" label="Leaderboard" onPress={() => goStack('Leaderboard')} />
              <DrawerItem emoji="🌋" label="NFT Cards" onPress={() => goStack('NFT')} />
        </DrawerSection>

        <DrawerSection title="EXIDANTE ECOSYSTEM">
          <DrawerItem emoji="ðŸ”®" label="CYPHER"  onPress={() => {}} muted badge="Soon" />
          <DrawerItem emoji="ðŸŒ" label="ORIGIN"  onPress={() => {}} muted badge="Soon" />
        </DrawerSection>

        <DrawerSection title="WALLET">
          {isConnected && account ? (
            <View style={styles.drawerItem}>
              <Text style={styles.drawerItemEmoji}>ðŸ‘›</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.drawerItemLabel, { color: theme.textPrimary }]}>
                  {account.address ? account.address.slice(0,4) + '...' + account.address.slice(-4) : 'Connected'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => disconnect()}
                style={[styles.drawerBadge, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.30)' }]}
              >
                <Text style={[styles.drawerBadgeText, { color: '#EF4444' }]}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <DrawerItem
              emoji="ðŸ”—"
              label="Connect Wallet"
              onPress={() => setShowWalletPicker(true)}
            />
          )}
          <WalletPickerModal visible={showWalletPicker} onClose={() => setShowWalletPicker(false)} />
        </DrawerSection>

        <DrawerSection title="SETTINGS">
          {/* Theme toggle */}
          <View style={[styles.drawerItem, styles.drawerThemeRow]}>
            <Text style={styles.drawerItemEmoji}>ðŸŒ™</Text>
            <Text style={[styles.drawerItemLabel, { color: theme.textPrimary, flex: 1 }]}>Dark Mode</Text>
            <Switch
              value={colorScheme === 'dark' || colorScheme === 'system'}
              onValueChange={(v) => setColorScheme(v ? 'dark' : 'light')}
              trackColor={{ false: theme.cardBorder, true: theme.orange }}
              thumbColor={theme.bgBase}
            />
          </View>
          <DrawerItem emoji="ðŸ“œ" label="Terms & Conditions" onPress={() => goStack('Terms')} />
          <DrawerItem emoji="â„¹ï¸"  label="About MAGMA"        onPress={() => {}} />
        </DrawerSection>

      </ScrollView>

      {/* Footer */}
      <View style={[styles.drawerFooter, { borderTopColor: theme.cardBorder, paddingBottom: insets.bottom + 8 }]}>
        <Text style={[styles.drawerVersion, { color: theme.textTertiary }]}>
          MAGMA Protocol v1.0.0-alpha Â· ExiDante Corp
        </Text>
      </View>
    </View>
  );
};

// â”€â”€â”€ Drawer Navigator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Drawer = createDrawerNavigator<DrawerParamList>();

export const AppDrawer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown:          false,
        drawerType:           'front',
        drawerStyle: {
          backgroundColor: theme.bgElevated,
          width:           300,
        },
        overlayColor:         'rgba(0,0,0,0.6)',
        swipeEdgeWidth:       40,
      }}
    >
      <Drawer.Screen name="MainTabs">
        {() => <>{children}</>}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
};

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingBottom:     12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  hamburger: {
    gap: 4,
  },
  hamburgerLine: {
    width:        20,
    height:       2,
    borderRadius: 1,
  },
  headerCenter: {
    flex:           1,
    alignItems:     'center',
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            8,
  },
  logoText: {
    fontSize:      18,
    fontWeight:    '800',
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize:   13,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  headerIcon: {
    fontSize: 18,
  },
  walletPill: {
    borderRadius:      radius.full,
    borderWidth:       1,
    paddingVertical:   6,
    paddingHorizontal: 10,
  },
  walletPillText: {
    fontSize:   14,
    fontWeight: '700',
  },
  // Drawer
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xl,
    borderBottomWidth: 1,
  },
  drawerLogoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4,
  },
  drawerLogoImg: {
    width: 32, height: 32, borderRadius: 16,
  },
  drawerLogo: {
    fontSize:      22,
    fontWeight:    '800',
    letterSpacing: 1.5,
    marginBottom:  4,
  },
  drawerSubtitle: {
    fontSize: 12,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerSection: {
    paddingTop:    spacing.xl,
    paddingBottom: spacing.sm,
  },
  drawerSectionTitle: {
    fontSize:          10,
    fontWeight:        '700',
    letterSpacing:     1.5,
    paddingHorizontal: spacing.xl,
    marginBottom:      spacing.sm,
  },
  drawerItem: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   12,
    paddingHorizontal: spacing.xl,
    gap:               spacing.md,
  },
  drawerItemMuted: {
    opacity: 0.5,
  },
  drawerItemEmoji: {
    fontSize: 18,
    width:    28,
  },
  drawerItemLabel: {
    fontSize:   15,
    fontWeight: '500',
  },
  drawerBadge: {
    borderRadius:      radius.full,
    borderWidth:       1,
    paddingVertical:   2,
    paddingHorizontal: 8,
    marginLeft:        'auto',
  },
  drawerBadgeText: {
    fontSize:   10,
    fontWeight: '700',
  },
  drawerThemeRow: {
    // extends drawerItem
  },
  drawerFooter: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.lg,
    borderTopWidth:    1,
  },
  drawerVersion: {
    fontSize:  11,
    textAlign: 'center',
  },
});
