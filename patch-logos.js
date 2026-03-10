const fs = require('fs');
const path = require('path');

// ─── 1. DeFiScreen — add ecosystem grid ──────────────────────────────────────
const defiPath = path.join(__dirname, 'src/screens/DeFiScreen.tsx');
let defi = fs.readFileSync(defiPath, 'utf8');

// Add Image import
defi = defi.replace(
  `  Dimensions,\n} from 'react-native';`,
  `  Dimensions,\n  Image,\n} from 'react-native';`
);

// Add ecosystem grid component before the return statement
const ecosystemGrid = `
  // Ecosystem Grid component
  const EcosystemGrid = () => {
    const ECOSYSTEM = [
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
    return (
      <View style={styles.ecosystemWrap}>
        <Text style={styles.sectionTitle}>Solana Ecosystem</Text>
        <View style={styles.ecosystemGrid}>
          {ECOSYSTEM.map((item) => (
            <View key={item.name} style={styles.ecosystemCard}>
              <Image
                source={item.logo}
                style={styles.ecosystemLogo}
                resizeMode="contain"
              />
              <Text style={styles.ecosystemName}>{item.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

`;

defi = defi.replace(
  `  return (\n    <ScrollView`,
  ecosystemGrid + `  return (\n    <ScrollView`
);

// Add EcosystemGrid to JSX after VaultAllocation
defi = defi.replace(
  `      {/* Vault Allocation */}\n      <Text style={styles.sectionTitle}>Your Vaults</Text>\n      <VaultAllocation />\n    </ScrollView>`,
  `      {/* Vault Allocation */}\n      <Text style={styles.sectionTitle}>Your Vaults</Text>\n      <VaultAllocation />\n      {/* Ecosystem */}\n      <EcosystemGrid />\n    </ScrollView>`
);

// Add ecosystem styles
defi = defi.replace(
  `export default DeFiScreen;`,
  `// Ecosystem styles added below
export default DeFiScreen;`
);

defi = defi.replace(
  `  allocationPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    fontFamily: 'Syne-Bold',
  },
});`,
  `  allocationPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    fontFamily: 'Syne-Bold',
  },
  ecosystemWrap: {
    marginTop: 8,
  },
  ecosystemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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

fs.writeFileSync(defiPath, defi);
console.log('✅ DeFiScreen ecosystem grid added');

// ─── 2. OnboardingScreen — replace emoji wallets with real logos ──────────────
const onboardPath = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
let onboard = fs.readFileSync(onboardPath, 'utf8');

// Add Image import
onboard = onboard.replace(
  `import {\n  View,\n  Text,\n  StyleSheet,\n  Dimensions,\n  TouchableOpacity,\n  ScrollView,\n  StatusBar,\n  TouchableWithoutFeedback,\n} from 'react-native';`,
  `import {\n  View,\n  Text,\n  StyleSheet,\n  Dimensions,\n  TouchableOpacity,\n  ScrollView,\n  StatusBar,\n  TouchableWithoutFeedback,\n  Image,\n} from 'react-native';`
);

// Replace WALLETS array with logo-based version
onboard = onboard.replace(
  `const WALLETS = [
  { emoji: '👻', name: 'Phantom', sub: 'Recommended · MWA' },
  { emoji: '🎒', name: 'Backpack', sub: 'Solana Native' },
  { emoji: '🦅', name: 'Solflare', sub: 'Ledger Compatible' },
];`,
  `const WALLETS = [
  { logo: require('../../assets/logos/wallets/phantom.png'), name: 'Phantom', sub: 'Recommended · MWA' },
  { logo: require('../../assets/logos/wallets/backpack.png'), name: 'Backpack', sub: 'Solana Native' },
  { logo: require('../../assets/logos/wallets/solflare.png'), name: 'Solflare', sub: 'Ledger Compatible' },
];`
);

// Replace emoji render with Image
onboard = onboard.replace(
  `          <Text style={vis.walletEmoji}>{w.emoji}</Text>`,
  `          <Image source={w.logo} style={vis.walletLogo} resizeMode="contain" />`
);

// Replace walletEmoji style with walletLogo
onboard = onboard.replace(
  `  walletEmoji: { fontSize: 24 },`,
  `  walletLogo: { width: 32, height: 32, borderRadius: 6 },`
);

// Fix the checkmark - replace encoded character
onboard = onboard.replace(
  `{selected === i && <Text style={vis.walletCheck}>✓</Text>}`,
  `{selected === i && <Text style={vis.walletCheck}>✓</Text>}`
);

fs.writeFileSync(onboardPath, onboard);
console.log('✅ OnboardingScreen wallet logos added');
