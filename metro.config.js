const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Permite que telemóveis na mesma rede Wi‑Fi acedam ao Metro (Expo Go).
config.server = {
  ...config.server,
  host: '0.0.0.0',
};

module.exports = config;
