const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Fix slide to fill remaining space and push text to top
c = c.replace(
  `slide: { flex: 1, alignItems: 'center', paddingTop: 72, paddingHorizontal: 32, width: W, justifyContent: 'flex-start' },`,
  `slide: { flex: 1, alignItems: 'center', paddingTop: 72, paddingHorizontal: 32, width: W },`
);

// Fix container - remove space-between, let slide flex push button down
c = c.replace(
  `container: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'space-between' },`,
  `container: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },`
);

// Fix bottomArea - pin to absolute bottom
c = c.replace(
  `bottomArea: { paddingBottom: 36, paddingTop: 20, paddingHorizontal: 32, width: W, alignItems: 'center', gap: 12 },`,
  `bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 48, paddingTop: 16, paddingHorizontal: 32, alignItems: 'center', gap: 12, backgroundColor: C.bg },`
);

// Add paddingBottom to slide so content doesnt hide behind button
c = c.replace(
  `slide: { flex: 1, alignItems: 'center', paddingTop: 72, paddingHorizontal: 32, width: W },`,
  `slide: { flex: 1, alignItems: 'center', paddingTop: 72, paddingBottom: 140, paddingHorizontal: 32, width: W },`
);

fs.writeFileSync(fp, c);
console.log('✅ Button pinned to bottom');
