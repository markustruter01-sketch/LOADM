const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure resolver configuration
config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts, 'bin'],
};

module.exports = config;