const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/LoadingScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Fix: wrap go() callback with runOnJS
c = c.replace(
  `      y.value = withDelay(delay, withTiming(
        H * 0.3 - Math.random() * 80,
        { duration: dur, easing: Easing.out(Easing.quad) },
        () => go()
      ));`,
  `      y.value = withDelay(delay, withTiming(
        H * 0.3 - Math.random() * 80,
        { duration: dur, easing: Easing.out(Easing.quad) },
        () => runOnJS(go)()
      ));`
);

fs.writeFileSync(fp, c);
console.log('✅ Ember runOnJS fix applied');
