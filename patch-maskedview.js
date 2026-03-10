const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/LoadingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Remove MaskedView import
c = c.replace(`import MaskedView from '@react-native-masked-view/masked-view';\n`, '');

// Replace MaskedView gradient wordmark with plain gradient text
c = c.replace(
  `        <MaskedView maskElement={<Text style={s.appNameMask}>MAGMA</Text>}>
          <LinearGradient colors={['#ff2200', '#ff6b35', '#ffb347']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[s.appNameMask, { opacity: 0 }]}>MAGMA</Text>
          </LinearGradient>
        </MaskedView>`,
  `        <Text style={s.appNameMask}>MAGMA</Text>`
);

fs.writeFileSync(fp, c);
console.log('✅ MaskedView removed from LoadingScreen');
