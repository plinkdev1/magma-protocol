const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const badAppTabs = `function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <AppTabs />
  );
}`;

const goodAppTabs = `function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.muted,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
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
      <Tab.Screen name="DeFi" component={DeFiScreen} options={{ tabBarLabel: 'DeFi' }} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} options={{ tabBarLabel: 'Portfolio' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}`;

if (content.includes(badAppTabs)) {
  content = content.replace(badAppTabs, goodAppTabs);
  fs.writeFileSync(filePath, content);
  console.log('✅ AppTabs fixed — Tab.Navigator restored');
} else {
  console.log('❌ Pattern not found');
}
