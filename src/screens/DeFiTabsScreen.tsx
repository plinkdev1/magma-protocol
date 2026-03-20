import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeFiScreen from './DeFiScreen';
import ControlMissionScreen from './ControlMissionScreen';

const TopTab = createMaterialTopTabNavigator();

const DeFiTabsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <TopTab.Navigator
      initialRouteName="DeFi"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#09080C',
          elevation:        0,
          shadowOpacity:    0,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
          marginTop:        insets.top,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#FF6B35',
          height:           2,
          borderRadius:     1,
        },
        tabBarActiveTintColor:   '#FF6B35',
        tabBarInactiveTintColor: '#9B95A8',
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
