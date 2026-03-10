const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/LaunchScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Guard all Haptics calls
c = c.replace(/Haptics\./g, 'Haptics?.');

fs.writeFileSync(fp, c);
console.log('✅ Haptics calls guarded');
