const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/DeFiScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// 1. Add Image import if missing
if (!c.includes('  Image,')) {
  c = c.replace("  Dimensions,", "  Dimensions,\n  Image,");
  console.log('✅ Image imported');
}

// 2. Add logo map constant after PROTOCOLS array
const logoMap = `
const PROTOCOL_LOGOS: Record<string, any> = {
  meteora: require('../../assets/logos/protocols/meteora.png'),
  kamino:  require('../../assets/logos/protocols/kamino.png'),
  save:    require('../../assets/logos/protocols/save.png'),
};
`;
if (!c.includes('PROTOCOL_LOGOS')) {
  c = c.replace(
    "const { width: SCREEN_WIDTH } = Dimensions.get('window');",
    "const { width: SCREEN_WIDTH } = Dimensions.get('window');\n" + logoMap
  );
  console.log('✅ PROTOCOL_LOGOS map added');
}

// 3. Replace flame emoji with Image using protocol.id lookup
const idx = c.indexOf('<View style={styles.apyCardIcon}>');
if (idx !== -1) {
  const end = c.indexOf('</View>', idx) + 7;
  const oldBlock = c.slice(idx, end);
  const newBlock = `<View style={styles.apyCardIcon}>
            <Image source={PROTOCOL_LOGOS[protocol.id]} style={{ width: 32, height: 32, borderRadius: 8 }} resizeMode="contain" />
          </View>`;
  c = c.slice(0, idx) + newBlock + c.slice(end);
  console.log('✅ Flame replaced with protocol logo');
}

fs.writeFileSync(fp, c);
console.log('🌋 Done');
