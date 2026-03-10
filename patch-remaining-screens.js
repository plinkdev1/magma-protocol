const fs = require('fs');
const path = require('path');

const screens = [
  'src/screens/DeFiScreen.tsx',
  'src/screens/PortfolioScreen.tsx',
  'src/screens/ProfileScreen.tsx',
];

screens.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) { console.log(`⚠️  Not found: ${relPath}`); return; }

  let c = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // 1. Add useSafeAreaInsets import if missing
  if (!c.includes('useSafeAreaInsets')) {
    if (c.includes("from 'react-native-safe-area-context'")) {
      c = c.replace(
        /import\s*\{([^}]+)\}\s*from\s*'react-native-safe-area-context'/,
        (m, inner) => `import { ${inner.trim()}, useSafeAreaInsets } from 'react-native-safe-area-context'`
      );
    } else {
      c = `import { useSafeAreaInsets } from 'react-native-safe-area-context';\n` + c;
    }
    changed = true;
  }

  // 2. Add hook call inside component if missing
  if (!c.includes('useSafeAreaInsets()')) {
    // Insert after the first opening brace of the component function
    c = c.replace(
      /^(const \w+Screen[^=]*=.*?=> \{)/m,
      `$1\n  const insets = useSafeAreaInsets();`
    );
    changed = true;
  }

  // 3. Add paddingTop to outermost return View
  if (!c.includes('insets.top')) {
    c = c.replace(
      /return \(\s*\n\s*<View style=\{styles\.container\}>/,
      `return (\n    <View style={[styles.container, { paddingTop: insets.top }]}>`
    );
    changed = true;
  }

  fs.writeFileSync(fullPath, c);
  console.log(changed ? `✅ Patched ${relPath}` : `⚠️  No changes needed: ${relPath}`);
});
