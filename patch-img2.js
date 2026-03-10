const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Find the react-native import block and add Image
c = c.replace('TouchableWithoutFeedback,', 'TouchableWithoutFeedback,\n  Image,');

fs.writeFileSync(fp, c);
console.log('✅ Done');

// Verify
const check = fs.readFileSync(fp, 'utf8');
console.log(check.includes('Image,') ? '✅ Image confirmed in file' : '❌ Still missing');
