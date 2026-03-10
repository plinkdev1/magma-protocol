const fs = require('fs');
const path = require('path');

const screens = [
  'src/screens/FeedScreen.tsx',
  'src/screens/LaunchScreen.tsx',
  'src/screens/DeFiScreen.tsx',
  'src/screens/PortfolioScreen.tsx',
  'src/screens/ProfileScreen.tsx',
];

screens.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) { console.log(`⚠️  Not found: ${relPath}`); return; }

  let c = fs.readFileSync(fullPath, 'utf8');

  // 1. Add useSafeAreaInsets import
  if (!c.includes('useSafeAreaInsets')) {
    if (c.includes("from 'react-native-safe-area-context'")) {
      c = c.replace(
        /import\s*\{([^}]+)\}\s*from\s*'react-native-safe-area-context'/,
        (m, inner) => `import {${inner.trim()}, useSafeAreaInsets } from 'react-native-safe-area-context'`
      );
    } else {
      c = c.replace(
        /^(import .+;\n)/m,
        `$1import { useSafeAreaInsets } from 'react-native-safe-area-context';\n`
      );
    }
  }

  // 2. Add insets hook inside the component (after first const [ or first useState)
  if (!c.includes('useSafeAreaInsets()')) {
    c = c.replace(
      /const \[(\w+), set\w+\] = useState/,
      `const insets = useSafeAreaInsets();\n  const [$1, set`
    );
    // fallback if no useState
    if (!c.includes('useSafeAreaInsets()')) {
      c = c.replace(
        /const (\w+Screen): React\.FC = \(\) => \{/,
        `const $1: React.FC = () => {\n  const insets = useSafeAreaInsets();`
      );
    }
  }

  // 3. Add paddingTop to container style
  c = c.replace(
    /container:\s*\{(\s*flex:\s*1,\s*backgroundColor:\s*COLORS\.background,)/,
    `container: {$1\n    paddingTop: 0,`
  );

  // 4. Wrap return view with paddingTop inset
  c = c.replace(
    /return \(\s*<View style=\{styles\.container\}>/,
    `return (\n    <View style={[styles.container, { paddingTop: insets.top }]}>`
  );

  fs.writeFileSync(fullPath, c);
  console.log(`✅ Patched ${relPath}`);
});
