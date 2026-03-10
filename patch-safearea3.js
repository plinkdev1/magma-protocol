const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldBlock = `            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: COLORS.background,
                  borderTopColor: COLORS.muted,
                  borderTopWidth: 1,
                  height: 65,
                  paddingBottom: 5,
                  paddingTop: 10,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.muted,
                tabBarLabelStyle: {
                  fontSize: 12,
                  fontWeight: '600',
                  marginTop: 4,
                },
                tabBarIcon: ({ focused }) => {
                  const iconMap = {
                    Feed: Home,
                    Launch: Rocket,
                    DeFi: LineChart,
                    Portfolio: Wallet,
                    Profile: User,
                  };
                  const Icon = iconMap[route.name as keyof typeof iconMap];
                  return Icon ? <TabBarIcon icon={Icon} focused={focused} /> : null;
                },
              })}
            >
              <Tab.Screen
                name="Feed"
                component={FeedScreen}
                options={{ tabBarLabel: 'Feed' }}
              />
              <Tab.Screen
                name="Launch"
                component={LaunchScreen}
                options={{ tabBarLabel: 'Launch' }}
              />
              <Tab.Screen
                name="DeFi"
                component={DeFiScreen}
                options={{ tabBarLabel: 'DeFi' }}
              />
              <Tab.Screen
                name="Portfolio"
                component={PortfolioScreen}
                options={{ tabBarLabel: 'Portfolio' }}
              />
              <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Profile' }}
              />
            </Tab.Navigator>`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, '            <AppTabs />');
  fs.writeFileSync(filePath, content);
  console.log('✅ Done');
} else {
  console.log('❌ Block not found - printing current App.tsx JSX section for debug:');
  const start = content.indexOf('<Tab.Navigator');
  const end = content.indexOf('</Tab.Navigator>') + 16;
  console.log(content.substring(start, end));
}
