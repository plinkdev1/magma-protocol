const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/LoadingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(
  `  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';`,
  `  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';`
);

fs.writeFileSync(fp, c);
console.log('✅ runOnJS imported');
