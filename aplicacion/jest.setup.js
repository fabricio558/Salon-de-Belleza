// Mocks de módulos nativos que no existen en el entorno de Jest.
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// Módulos de Expo con código nativo (el preset react-native no los provee).
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'cancel' })),
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'dismiss' })),
}));

// Fuentes: en los tests se dan por cargadas y los archivos .ttf no se importan.
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

jest.mock('@expo-google-fonts/playfair-display', () => ({
  PlayfairDisplay_600SemiBold: 'PlayfairDisplay_600SemiBold',
  PlayfairDisplay_700Bold: 'PlayfairDisplay_700Bold',
}));

jest.mock('@expo-google-fonts/poppins', () => ({
  Poppins_400Regular: 'Poppins_400Regular',
  Poppins_500Medium: 'Poppins_500Medium',
  Poppins_600SemiBold: 'Poppins_600SemiBold',
  Poppins_700Bold: 'Poppins_700Bold',
}));

// Íconos: un componente simple con el nombre del ícono.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icono = ({ name }) => React.createElement(Text, null, name);
  return { Ionicons: Icono, MaterialCommunityIcons: Icono };
});

jest.mock('expo-linking', () => ({
  createURL: jest.fn((ruta) => `exp://localhost:8081/--/${ruta}`),
}));
