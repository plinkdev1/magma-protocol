const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/screens/LaunchScreen.tsx');
let c = fs.readFileSync(filePath, 'utf8');

c = c.replace(
  `const [currentStep, set<Step>(1);`,
  `const [currentStep, setCurrentStep] = useState<Step>(1);`
);

fs.writeFileSync(filePath, c);
console.log('✅ LaunchScreen line 69 fixed');
