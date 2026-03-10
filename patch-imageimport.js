const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(
  `  TouchableWithoutFeedback,\n} from 'react-native';`,
  `  TouchableWithoutFeedback,\n  Image,\n} from 'react-native';`
);

fs.writeFileSync(fp, c);
console.log('✅ Image import added');
