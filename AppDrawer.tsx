import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './src/theme/ThemeContext';
import { radius, spacing } from './src/theme/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawerParamList = {
  MainTabs: undefined;
};

// ─── Persistent Header ────────────────────────────────────────────────────────

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
      {/* Left — hamburger */}
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

      {/* Center — logo */}
      <View style={styles.headerCenter}>
        <Text style={[styles.logoText, { color: theme.orange }]}>MAGMA</Text>
        {title && (
          <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>{title}</Text>
        )}
      </View>

      {/* Right — search + history + wallet */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.headerIcon, { color: theme.textSecondary }]}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.headerIcon, { color: theme.textSecondary }]}>🕐</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.walletPill, { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: theme.borderMedium }]}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Text style={[styles.walletPillText, { color: theme.orange }]}>⬡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Drawer Content ───────────────────────────────────────────────────────────

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
  const insets = useSafeAreaInsets();

  const go = (screen: string) => {
    navigation.closeDrawer();
    navigation.navigate(screen);
  };

  return (
    <View style={[styles.drawerContainer, { backgroundColor: theme.bgElevated }]}>
      {/* Logo area */}
      <View style={[styles.drawerHeader, { paddingTop: insets.top + 16, borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.drawerLogo, { color: theme.orange }]}>🌋 MAGMA</Text>
        <Text style={[styles.drawerSubtitle, { color: theme.textTertiary }]}>Conviction Capital Markets</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.drawerScroll}>

        <DrawerSection title="MAGMA CORE">
          <DrawerItem emoji="🏠" label="Feed"              onPress={() => go('Feed')} />
          <DrawerItem emoji="🚀" label="Submit Narrative"  onPress={() => go('Launch')} />
          <DrawerItem emoji="💼" label="My Portfolio"      onPress={() => go('Portfolio')} />
          <DrawerItem emoji="📊" label="DeFi / Control"    onPress={() => go('DeFi')} />
        </DrawerSection>

        <DrawerSection title="NOVA">
          <DrawerItem emoji="⚡" label="My Conviction Score" onPress={() => go('Profile')} />
          <DrawerItem emoji="🌊" label="Echo Pool"           onPress={() => go('Profile')} />
          <DrawerItem emoji="✍️" label="Creator Studio"      onPress={() => go('Launch')} />
        </DrawerSection>

        <DrawerSection title="EXIDANTE ECOSYSTEM">
          <DrawerItem emoji="🔮" label="CYPHER"  onPress={() => {}} muted badge="Soon" />
          <DrawerItem emoji="🌐" label="ORIGIN"  onPress={() => {}} muted badge="Soon" />
        </DrawerSection>

        <DrawerSection title="SETTINGS">
          {/* Theme toggle */}
          <View style={[styles.drawerItem, styles.drawerThemeRow]}>
            <Text style={styles.drawerItemEmoji}>🌙</Text>
            <Text style={[styles.drawerItemLabel, { color: theme.textPrimary, flex: 1 }]}>Dark Mode</Text>
            <Switch
              value={colorScheme === 'dark' || colorScheme === 'system'}
              onValueChange={(v) => setColorScheme(v ? 'dark' : 'light')}
              trackColor={{ false: theme.cardBorder, true: theme.orange }}
              thumbColor={theme.bgBase}
            />
          </View>
          <DrawerItem emoji="📜" label="Terms & Conditions" onPress={() => go('Terms')} />
          <DrawerItem emoji="ℹ️"  label="About MAGMA"        onPress={() => {}} />
        </DrawerSection>

      </ScrollView>

      {/* Footer */}
      <View style={[styles.drawerFooter, { borderTopColor: theme.cardBorder, paddingBottom: insets.bottom + 8 }]}>
        <Text style={[styles.drawerVersion, { color: theme.textTertiary }]}>
          MAGMA Protocol v1.0.0-alpha · ExiDante Corp
        </Text>
      </View>
    </View>
  );
};

// ─── Drawer Navigator ─────────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
