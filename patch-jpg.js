const fs = require('fs');
const files = [
  'src/components/EcosystemGrid.tsx',
  'src/screens/OnboardingScreen.tsx',
  'src/screens/DeFiScreen.tsx',
];
files.forEach(fp => {
  if (!fs.existsSync(fp)) return;
  let c = fs.readFileSync(fp, 'utf8');
  c = c.replace(/assets\/logos\/(.*?)\.png/g, 'assets/logos/$1.jpg');
  fs.writeFileSync(fp, c);
  console.log('✅ Updated:', fp);
});
