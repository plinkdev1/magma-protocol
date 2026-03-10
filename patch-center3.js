const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(
  `slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 20, paddingBottom: 160, paddingHorizontal: 32, width: W },`,
  `slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, width: W, paddingBottom: 0 },`
);

fs.writeFileSync(fp, c);
console.log('✅ Fixed');
