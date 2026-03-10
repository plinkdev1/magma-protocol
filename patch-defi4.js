const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/DeFiScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

const idx = c.lastIndexOf('<VaultAllocation />');
if (idx !== -1) {
  c = c.slice(0, idx + 19) + '\n      <EcosystemGrid />' + c.slice(idx + 19);
  fs.writeFileSync(fp, c);
  console.log('✅ EcosystemGrid added at position', idx);
} else {
  console.log('❌ VaultAllocation not found');
}
