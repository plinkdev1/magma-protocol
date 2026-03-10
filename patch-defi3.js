const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/DeFiScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// 1. Add import
c = c.replace(
  "import { usePythPriceFeed } from '../hooks/usePythPriceFeed';",
  "import { usePythPriceFeed } from '../hooks/usePythPriceFeed';\nimport { EcosystemGrid } from '../components/EcosystemGrid';"
);

// 2. Add component after VaultAllocation in JSX
c = c.replace(
  '      <VaultAllocation />\n    </ScrollView>',
  '      <VaultAllocation />\n      <EcosystemGrid />\n    </ScrollView>'
);

fs.writeFileSync(fp, c);
console.log('✅ EcosystemGrid wired into DeFiScreen');
