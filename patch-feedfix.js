const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/screens/FeedScreen.tsx');
let c = fs.readFileSync(filePath, 'utf8');

c = c.replace(
  `const [activeFilter, set<FilterType>('All');`,
  `const [activeFilter, setActiveFilter] = useState<FilterType>('All');`
);

fs.writeFileSync(filePath, c);
console.log('✅ FeedScreen line 50 fixed');
