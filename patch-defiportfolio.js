const fs = require('fs');
const path = require('path');

[
  ['src/screens/DeFiScreen.tsx', 'const [refreshing, set(false);', 'const [refreshing, setRefreshing] = useState(false);'],
  ['src/screens/PortfolioScreen.tsx', 'const [refreshing, set(false);', 'const [refreshing, setRefreshing] = useState(false);'],
].forEach(([rel, bad, good]) => {
  const fp = path.join(__dirname, rel);
  let c = fs.readFileSync(fp, 'utf8');
  if (c.includes(bad)) {
    c = c.replace(bad, good);
    fs.writeFileSync(fp, c);
    console.log(`✅ Fixed ${rel}`);
  } else {
    console.log(`⚠️  Not found in ${rel}`);
  }
});
