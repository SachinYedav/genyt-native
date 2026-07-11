const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent Metro from resolving duplicate packages from the local module's node_modules
const path = require('path');
config.resolver.blockList = [
  ...config.resolver.blockList || [],
  new RegExp(path.resolve(__dirname, 'modules/genyt-youtube-extractor/node_modules') + '/.*'),
];

module.exports = config;
