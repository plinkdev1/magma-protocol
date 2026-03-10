const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/LoadingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Remove LinearGradient import
c = c.replace(`import { LinearGradient } from 'expo-linear-gradient';\n`, '');

// Replace gradient progress bar fill with plain View
c = c.replace(
  `              <LinearGradient colors={['#ff2200', '#ff6b35', '#ffb347']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />`,
  `              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ff6b35' }]} />`
);

fs.writeFileSync(fp, c);
console.log('✅ LinearGradient removed from LoadingScreen');
