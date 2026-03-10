const fs = require('fs');
const path = require('path');

const screens = [
  'src/screens/DeFiScreen.tsx',
  'src/screens/PortfolioScreen.tsx',
  'src/screens/ProfileScreen.tsx',
];

screens.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  let c = fs.readFileSync(fullPath, 'utf8');

  if (c.includes('insets.top')) {
    console.log(`⚠️  Already patched: ${relPath}`);
    return;
  }

  // These screens use ScrollView as root — patch style prop on ScrollView
  const before = `style={styles.container}`;
  const after  = `style={[styles.container, { paddingTop: insets.top }]}`;

  if (c.includes(before)) {
    // Only replace the FIRST occurrence (the root ScrollView)
    c = c.replace(before, after);
    fs.writeFileSync(fullPath, c);
    console.log(`✅ Patched ${relPath}`);
  } else {
    console.log(`❌ Pattern not found in ${relPath}`);
  }
});
