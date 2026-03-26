import 'react-native-get-random-values';
import React from 'react';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppDrawer, AppHeader } from './AppDrawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Rocket, LineChart, Wallet, User } from 'lucide-react-native';
import { WalletProvider } from './src/context/WalletContext';
import { ThemeProvider } from './src/theme/ThemeContext';

import FeedScreen from './src/screens/FeedScreen';
import LaunchScreen from './src/screens/LaunchScreen';
import DeFiScreen from './src/screens/DeFiScreen';
import DeFiTabsScreen from './src/screens/DeFiTabsScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ConvictionProfileScreen from './src/screens/ConvictionProfileScreen';
import NarrativeDetailScreen from './src/screens/NarrativeDetailScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const COLORS = {
  background: '#09080C',
  primary:    '#FF6B35',
  accent:     '#FFB347',
  text:       '#F2EEF8',
  muted:      '#9B95A8',
  card:       '#111018',
  border:     'rgba(255,255,255,0.06)',
};

export type RootTabParamList = {
  Feed: undefined;
  Launch: undefined;
  DeFi: undefined;
  Portfolio: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  NarrativeDetail: { narrativeId: string };
  History: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

const TabBarIcon = ({ icon: Icon, focused }: { icon: React.ElementType; focused: boolean }) => (
  <Icon size={24} color={focused ? COLORS.primary : COLORS.muted} strokeWidth={focused ? 2.5 : 2} />
);

function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused }) => {
          const iconMap = { Feed: Home, Launch: Rocket, DeFi: LineChart, Portfolio: Wallet, Profile: User };
          const Icon = iconMap[route.name as keyof typeof iconMap];
          return Icon ? <TabBarIcon icon={Icon} focused={focused} /> : null;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: 'Feed' }} />
      <Tab.Screen name="Launch" component={LaunchScreen} options={{ tabBarLabel: 'Launch' }} />
      <Tab.Screen name="DeFi" component={DeFiTabsScreen} options={{ tabBarLabel: 'DeFi' }} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} options={{ tabBarLabel: 'Portfolio' }} />
      <Tab.Screen name="Profile" component={ConvictionProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [appState, setAppState] = React.useState<'loading' | 'onboarding' | 'main'>('loading');

  const handleLoadComplete = React.useCallback(async () => {
    try {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      if (seen === 'true') {
        setAppState('main');
      } else {
        setAppState('onboarding');
      }
    } catch {
      setAppState('onboarding');
    }
  }, []);

  const handleOnboardingComplete = React.useCallback(async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch {}
    setAppState('main');
  }, []);

  return (
    <ThemeProvider>
      <WalletProvider>
      {appState === 'loading' && <LoadingScreen onLoadComplete={handleLoadComplete} />}
      {appState === 'onboarding' && <OnboardingScreen onComplete={handleOnboardingComplete} />}
      {appState === 'main' && (
        <>
          <StatusBar style="light" backgroundColor={COLORS.background} />
          <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
              <SafeAreaProvider>
                <NavigationContainer
                  theme={{
                    ...DefaultTheme,
                    dark: true,
                    colors: {
                      ...DefaultTheme.colors,
                      primary: COLORS.primary,
                      background: COLORS.background,
                      card: COLORS.card,
                      text: COLORS.text,
                      border: COLORS.border,
                      notification: COLORS.accent,
                    },
                  }}
                >
                  <AppDrawer>
                    <AppHeader />
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="Main" component={AppTabs} />
                      <Stack.Screen name="NarrativeDetail" component={NarrativeDetailScreen} />
                      <Stack.Screen name="History" component={TransactionHistoryScreen} />
                    </Stack.Navigator>
                  </AppDrawer>
                </NavigationContainer>
              </SafeAreaProvider>
            </QueryClientProvider>
          </GestureHandlerRootView>
        </>
      )}
      </WalletProvider>
    </ThemeProvider>
  );
}
