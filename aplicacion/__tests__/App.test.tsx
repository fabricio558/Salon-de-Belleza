/**
 * @format
 */

import 'react-native';
import React from 'react';
// prueba.js es el componente raíz que registra index.js
import App from '../prueba';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

it('renders correctly', async () => {
  let tree: renderer.ReactTestRenderer | undefined;
  await act(async () => {
    tree = renderer.create(<App />);
  });
  tree?.unmount();
});
