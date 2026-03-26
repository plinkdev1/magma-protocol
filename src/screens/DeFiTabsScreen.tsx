import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeFiScreen from './DeFiScreen';
import { useTheme } from '../theme/ThemeContext';
import ControlMissionScreen from './ControlMissionScreen';

const TopTab = createMaterialTopTabNavigator();

const DeFiTabsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <TopTab.Navigator
      initialRouteName="DeFi"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.bgBase,
          elevation:        0,
          shadowOpacity:    0,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
          marginTop:        0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#FF6B35',
          height:           2,
          borderRadius:     1,
        },
        tabBarActiveTintColor:   theme.orange,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize:      13,
          fontWeight:    '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        tabBarPressColor: 'rgba(255,107,53,0.10)',
      }}
    >
      <TopTab.Screen name="DeFi"    component={DeFiScreen} />
      <TopTab.Screen name="Control" component={ControlMissionScreen} options={{ title: 'Control Mission' }} />
    </TopTab.Navigator>
  );
};

export default DeFiTabsScreen;
