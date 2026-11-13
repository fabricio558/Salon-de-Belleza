module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  // Estos paquetes se publican sin transpilar (ESM/JSX/assets) y Jest
  // tiene que pasarlos por Babel.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@react-navigation|expo(nent)?|@expo(nent)?/.*|expo-.*|react-native-.*)/)',
  ],
};
