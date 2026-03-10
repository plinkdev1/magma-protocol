const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace everything between <NavigationContainer ...> and </NavigationContainer> 
content = content.replace(
  /<Tab\.Navigator[\s\S]*?<\/Tab\.Navigator>/,
  '<AppTabs />'
);

fs.writeFileSync(filePath, content);
console.log('✅ Tab.Navigator replaced with <AppTabs />');
