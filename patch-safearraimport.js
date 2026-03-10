const fs = require('fs');
const path = require('path');

const files = [
  'src/screens/DeFiScreen.tsx',
  'src/screens/PortfolioScreen.tsx',
];

files.forEach(rel => {
  const fp = path.join(__dirname, rel);
  let c = fs.readFileSync(fp, 'utf8');

  if (!c.includes('useSafeAreaInsets')) {
    c = `import { useSafeAreaInsets } from 'react-native-safe-area-context';\n` + c;
    fs.writeFileSync(fp, c);
    console.log('✅ Fixed safe area import: ' + rel);
  } else {
    console.log('⚠️  Already has it: ' + rel);
  }
});
