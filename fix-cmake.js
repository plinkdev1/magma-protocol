const fs = require('fs');
const fp = 'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake';
let c = fs.readFileSync(fp, 'utf8');

// Remove the duplicate broken block
const duplicate = `\n# c++_shared link fix \ufffd propagates to all autolinked + codegen targets via common_flags\nfind_library(LIBCXX_APP c++_shared)\nif(LIBCXX_APP)\n  target_link_libraries(common_flags INTERFACE \${LIBCXX_APP})\n`;
if (c.includes('find_library(LIBCXX_APP c++_shared)\nif(LIBCXX_APP)\n  target_link_libraries(common_flags INTERFACE ${LIBCXX_APP})\nendif()\n# c++_shared link fix')) {
  c = c.replace(/# c\+\+_shared link fix.*?find_library\(LIBCXX_APP c\+\+_shared\)\nif\(LIBCXX_APP\)\n  target_link_libraries\(common_flags INTERFACE \$\{LIBCXX_APP\}\)\n$/s, '');
  console.log('✅ Duplicate block removed');
} else {
  console.log('Current ending:');
  console.log(c.slice(-300));
}
fs.writeFileSync(fp, c);
