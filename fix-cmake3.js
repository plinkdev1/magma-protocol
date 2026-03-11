const fs = require('fs');
const fp = 'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake';
let c = fs.readFileSync(fp, 'utf8');

// Try both CRLF and LF
const marker1 = 'endif()\r\n# c++_shared link fix';
const marker2 = 'endif()\n# c++_shared link fix';
const idx = c.indexOf(marker1) !== -1 ? c.indexOf(marker1) : c.indexOf(marker2);
const markerLen = c.indexOf(marker1) !== -1 ? 8 : 8;

if (idx !== -1) {
  c = c.slice(0, idx + markerLen);
  fs.writeFileSync(fp, c);
  console.log('✅ Fixed, ends at:', JSON.stringify(c.slice(-30)));
} else {
  // Just truncate at the second find_library
  const second = c.indexOf('find_library(LIBCXX_APP', c.indexOf('find_library(LIBCXX_APP') + 1);
  if (second !== -1) {
    c = c.slice(0, second).trimEnd() + '\n';
    fs.writeFileSync(fp, c);
    console.log('✅ Fixed via second indexOf, ends at:', JSON.stringify(c.slice(-50)));
  } else {
    console.log('❌ Could not fix');
  }
}
