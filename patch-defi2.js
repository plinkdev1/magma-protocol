const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/DeFiScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// 1. Add Image import
if (!c.includes('Image,')) {
  c = c.replace("  Dimensions,", "  Dimensions,\n  Image,");
  console.log('✅ Image imported');
}

// 2. Add ecosystem data + grid JSX right before </ScrollView>
const gridJSX = `
      {/* Ecosystem Grid */}
      <Text style={styles.sectionTitle}>Solana Ecosystem</Text>
      <View style={styles.ecosystemGrid}>
        {[
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
        ].map((item) => (
          <View key={item.name} style={styles.ecosystemCard}>
            <Image source={item.logo} style={styles.ecosystemLogo} resizeMode="contain" />
            <Text style={styles.ecosystemName}>{item.name}</Text>
          </View>
        ))}
      </View>`;

// Find last </ScrollView> and insert before it
const scrollViewClose = '    </ScrollView>\n  );\n}';
if (!c.includes('ecosystemGrid') && c.includes(scrollViewClose)) {
  c = c.replace(scrollViewClose, gridJSX + '\n    </ScrollView>\n  );\n}');
  console.log('✅ Grid JSX injected');
} else {
  console.log('❌ Could not find ScrollView close — trying alternate');
  // Try alternate
  const idx = c.lastIndexOf('</ScrollView>');
  if (idx !== -1) {
    c = c.slice(0, idx) + gridJSX + '\n    </ScrollView>' + c.slice(idx + 13);
    console.log('✅ Grid JSX injected via lastIndexOf');
  }
}

// 3. Add styles before final });
const styleEnd = '\n});';
const newStyles = `
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
  },`;

const lastBrace = c.lastIndexOf('\n});');
c = c.slice(0, lastBrace) + newStyles + styleEnd;
console.log('✅ Styles added');

fs.writeFileSync(fp, c);
console.log('🌋 DeFiScreen patched');
