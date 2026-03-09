const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);

const originalGetPolyfills = config.serializer.getPolyfills
  ? config.serializer.getPolyfills.bind(config.serializer)
  : () => [];

config.serializer.getPolyfills = (ctx) => [
  path.resolve(__dirname, 'shims/define-guard.js'),
  ...originalGetPolyfills(ctx),
];

const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('@irys/sdk') && moduleName.includes('hack')) {
    return { type: 'sourceFile', filePath: require.resolve('./shims/irys-hack-shim.js') };
  }
  if (originalResolver) return originalResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;