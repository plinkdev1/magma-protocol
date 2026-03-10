const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/screens/ProfileScreen.tsx');
let c = fs.readFileSync(filePath, 'utf8');

c = c.replace(
  `const [magmaBalance, set(0);`,
  `const [magmaBalance, setMagmaBalance] = useState(0);`
);

fs.writeFileSync(filePath, c);
console.log('✅ ProfileScreen fixed');
