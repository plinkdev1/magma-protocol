const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Center content vertically in the slide area
c = c.replace(
  `slide: { flex: 1, alignItems: 'center', paddingTop: 72, paddingBottom: 140, paddingHorizontal: 32, width: W },`,
  `slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 72, paddingBottom: 140, paddingHorizontal: 32, width: W },`
);

fs.writeFileSync(fp, c);
console.log('✅ Content centered vertically');
