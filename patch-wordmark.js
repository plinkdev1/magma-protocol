const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/LoadingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(
  `appNameMask:  { fontFamily: 'SpaceMono', fontSize: 42, fontWeight: '700', letterSpacing: 6 },`,
  `appNameMask:  { fontFamily: 'SpaceMono', fontSize: 42, fontWeight: '700', letterSpacing: 6, color: '#ff6b35' },`
);

fs.writeFileSync(fp, c);
console.log('✅ MAGMA wordmark color fixed');
