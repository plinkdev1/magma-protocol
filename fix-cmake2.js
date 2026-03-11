const fs = require('fs');
const fp = 'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake';
let c = fs.readFileSync(fp, 'utf8');

// Find the first endif() after the first LIBCXX_APP block and cut everything after it
const marker = 'endif()\n# c++_shared link fix';
const idx = c.indexOf(marker);
if (idx !== -1) {
  c = c.slice(0, idx + 8); // keep up to and including 'endif()'
  fs.writeFileSync(fp, c);
  console.log('✅ Duplicate block removed, file ends at:', c.slice(-50));
} else {
  console.log('❌ Marker not found');
}
