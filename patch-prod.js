const fs = require('fs');
const fp = 'src/config.ts';
fs.writeFileSync(fp, `const DEV = false;
export const API_URL = DEV
  ? 'http://10.0.2.2:3000'
  : 'https://magma-backend-production-9f5b.up.railway.app';
`);
console.log('✅ API set to production');
