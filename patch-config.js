// patch-config.js
// Run from C:\PROJECTS\MAGMA-APP with: node patch-config.js
const fs = require('fs');
const path = require('path');

const RAILWAY_URL = 'https://magma-backend-production-9f5b.up.railway.app';
const LOCAL_URL   = 'http://10.0.2.2:3000';

// ── 1. Create src/config.ts ──────────────────────────────────────────────────
const configContent = `// src/config.ts
// Toggle DEV to switch between local and Railway backend
const DEV = true;

export const API_URL = DEV
  ? '${LOCAL_URL}'       // local emulator (Metro running)
  : '${RAILWAY_URL}'; // jury / production
`;

const configPath = path.join(__dirname, 'src', 'config.ts');
fs.writeFileSync(configPath, configContent);
console.log('✅ Created src/config.ts');

// ── 2. Files to patch ────────────────────────────────────────────────────────
const filesToPatch = [
  'src/screens/FeedScreen.tsx',
  'src/screens/LaunchScreen.tsx',
  'src/screens/PortfolioScreen.tsx',
  'src/components/AgentProgress.tsx',
];

let totalReplaced = 0;

filesToPatch.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping (not found): ${relPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const before = content;

  // Remove any existing API_URL import from config to avoid duplicates
  content = content.replace(/import\s+\{?\s*API_URL\s*\}?\s+from\s+['"][^'"]+config['"]\s*;\n?/g, '');

  // Count how many Railway URLs exist
  const count = (content.match(new RegExp(RAILWAY_URL.replace(/\./g, '\\.'), 'g')) || []).length;

  if (count === 0) {
    console.log(`⏭️  No Railway URLs found in ${relPath}`);
    return;
  }

  // Add import after the last existing import line
  const importLine = `import { API_URL } from '../config';`;
  // Insert after last import
  content = content.replace(
    /((?:^import .+;\n)+)/m,
    (match) => match.trimEnd() + '\n' + importLine + '\n'
  );

  // Replace all occurrences of the Railway URL string
  content = content
    .replace(new RegExp(`['"\`]${RAILWAY_URL.replace(/\./g, '\\.')}['"\`]`, 'g'), 'API_URL')
    .replace(new RegExp(`${RAILWAY_URL.replace(/\./g, '\\.')}`, 'g'), '\${API_URL}');

  if (content !== before) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Patched ${relPath} (${count} URL${count > 1 ? 's' : ''} replaced)`);
    totalReplaced += count;
  }
});

console.log(`\n🌋 Done. ${totalReplaced} Railway URLs replaced.`);
console.log('   To switch to Railway: open src/config.ts and set DEV = false');
console.log('   To use local:         set DEV = true  (default)');
console.log('\n   Make sure local backend is running: cd C:\\PROJECTS\\MAGMA-BACKEND && npx tsx src/server.ts');
