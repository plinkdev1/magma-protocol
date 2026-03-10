const fs = require('fs');
const path = require('path');

const files = [
  'src/components/AgentProgress.tsx',
  'src/screens/PortfolioScreen.tsx',
];

files.forEach(rel => {
  const fp = path.join(__dirname, rel);
  let c = fs.readFileSync(fp, 'utf8');
  if (!c.includes("from '../config'") && !c.includes("from '../../config'") && !c.includes("from './config'")) {
    const importLine = rel.includes('components') 
      ? "import { API_URL } from '../config';\n"
      : "import { API_URL } from '../config';\n";
    c = importLine + c;
    fs.writeFileSync(fp, c);
    console.log('✅ Fixed import: ' + rel);
  } else {
    console.log('⚠️  Already has import: ' + rel);
  }
});
