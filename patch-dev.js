const fs = require('fs');
fs.writeFileSync('src/config.ts', `const DEV = true;\nexport const API_URL = DEV\n  ? 'http://10.0.2.2:3000'\n  : 'https://magma-backend-production-9f5b.up.railway.app';\n`);
console.log('✅ API set to local');
