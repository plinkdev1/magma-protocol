const fs = require('fs');
const path = require('path');

// Fix 1: OnboardingScreen WALLETS array
const fp1 = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
let c1 = fs.readFileSync(fp1, 'utf8');

// Find and replace the WALLETS array entirely
const oldWallets = c1.substring(c1.indexOf('const WALLETS = ['), c1.indexOf('];', c1.indexOf('const WALLETS = [')) + 2);
const newWallets = `const WALLETS = [
  { logo: require('../../assets/logos/wallets/phantom.png'), name: 'Phantom', sub: 'Recommended · MWA' },
  { logo: require('../../assets/logos/wallets/backpack.png'), name: 'Backpack', sub: 'Solana Native' },
  { logo: require('../../assets/logos/wallets/solflare.png'), name: 'Solflare', sub: 'Ledger Compatible' },
];`;
c1 = c1.replace(oldWallets, newWallets);
fs.writeFileSync(fp1, c1);
console.log('✅ WALLETS array fixed');

// Fix 2: DeFiScreen - inject EcosystemGrid
const fp2 = path.join(__dirname, 'src/screens/DeFiScreen.tsx');
let c2 = fs.readFileSync(fp2, 'utf8');

if (!c2.includes('EcosystemGrid')) {
  // Add Image import
  c2 = c2.replace('  Dimensions,\n} from \'react-native\';', '  Dimensions,\n  Image,\n} from \'react-native\';');

  // Inject component + JSX + styles
  c2 = c2.replace(
    '// Ecosystem styles added below\nexport default DeFiScreen;',
    `export default DeFiScreen;`
  );

  // Add component before the main return
  c2 = c2.replace(
    '  return (\n    <ScrollView',
    `  const ECOSYSTEM = [
    { name: 'Meteora', logo: require('../../assets/logos/protocols/meteora.png') },
    { name: 'Kamino', logo: require('../../assets/logos/protocols/kamino.png') },
    { name: 'Save', logo: require('../../assets/logos/protocols/save.png') },
    { name: 'Jupiter', logo: require('../../assets/logos/protocols/jupiter.png') },
    { name: 'Orca', logo: require('../../assets/logos/protocols/orca.png') },
    { name: 'Raydium', logo: require('../../assets/logos/protocols/raydium.png') },
    { name: 'Jito', logo: require('../../assets/logos/protocols/jito.png') },
    { name: 'Marinade', logo: require('../../assets/logos/protocols/marinade.png') },
    { name: 'Phantom', logo: require('../../assets/logos/wallets/phantom.png') },
    { name: 'Backpack', logo: require('../../assets/logos/wallets/backpack.png') },
    { name: 'Solflare', logo: require('../../assets/logos/wallets/solflare.png') },
    { name: 'Seeker', logo: require('../../assets/logos/wallets/seeker.png') },
    { name: 'Sol Mobile', logo: require('../../assets/logos/wallets/solanamobile.png') },
  ];

  return (\n    <ScrollView`
  );

  // Add grid to JSX
  c2 = c2.replace(
    '      <VaultAllocation />\n    </ScrollView>',
    `      <VaultAllocation />
      {/* Ecosystem Grid */}
      <Text style={styles.sectionTitle}>Solana Ecosystem</Text>
      <View style={styles.ecosystemGrid}>
        {ECOSYSTEM.map((item) => (
          <View key={item.name} style={styles.ecosystemCard}>
            <Image source={item.logo} style={styles.ecosystemLogo} resizeMode="contain" />
            <Text style={styles.ecosystemName}>{item.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>`
  );

  // Add styles
  c2 = c2.replace(
    '  allocationPercentage: {\n    fontSize: 13,\n    fontWeight: \'700\',\n    color: COLORS.muted,\n    fontFamily: \'Syne-Bold\',\n  },\n});',
    `  allocationPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    fontFamily: 'Syne-Bold',
  },
  ecosystemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  ecosystemCard: {
    width: (SCREEN_WIDTH - 32 - 40) / 5,
    alignItems: 'center',
    backgroundColor: '#130b02',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  ecosystemLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  ecosystemName: {
    fontSize: 8,
    color: 'rgba(255,232,208,0.5)',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});`
  );

  fs.writeFileSync(fp2, c2);
  console.log('✅ DeFiScreen ecosystem grid injected');
} else {
  console.log('⚠️  EcosystemGrid already exists');
}
