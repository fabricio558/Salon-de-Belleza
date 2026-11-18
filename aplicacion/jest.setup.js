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

jest.mock('expo-linking', () => ({
  createURL: jest.fn((ruta) => `exp://localhost:8081/--/${ruta}`),
}));
