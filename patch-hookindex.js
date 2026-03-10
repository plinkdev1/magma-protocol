const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/screens/LaunchScreen.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Convert ref to state
c = c.replace(
  `const currentHookIndex = useRef(0);`,
  `const [currentHookIndex, setCurrentHookIndex] = useState(0);`
);

// Fix all .current references
c = c.replace(/currentHookIndex\.current/g, 'currentHookIndex');

// Fix the increment/decrement to use setState
c = c.replace(
  `currentHookIndex += 1;`,
  `setCurrentHookIndex(currentHookIndex + 1);`
);
c = c.replace(
  `currentHookIndex -= 1;`,
  `setCurrentHookIndex(currentHookIndex - 1);`
);

fs.writeFileSync(fp, c);
console.log('✅ hookIndex converted to useState');
