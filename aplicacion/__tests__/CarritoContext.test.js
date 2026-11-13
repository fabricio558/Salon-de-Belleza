import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { it, expect, beforeEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CarritoProvider, useCarrito } from '../context/CarritoContext';

const shampoo = { idProductos: 1, nombreProducto: 'Shampoo', marca: 'X', imagenUrl: null, precioVenta: 9500, stock: 3 };
const tintura = { idProductos: 2, nombreProducto: 'Tintura', marca: 'Y', imagenUrl: null, precioVenta: 7800, stock: 10 };

// Monta el provider y devuelve una función que lee el valor actual del contexto.
const montar = async (props = { idUsuario: 7, habilitado: true }) => {
  let actual;
  const Lector = () => {
    actual = useCarrito();
    return null;
  };
  let arbol;
  await act(async () => {
    arbol = renderer.create(
      <CarritoProvider {...props}>
        <Lector />
      </CarritoProvider>
    );
  });
  return { leer: () => actual, arbol };
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('agrega productos sin superar el stock y calcula cantidad y total', async () => {
  const { leer, arbol } = await montar();
  await act(async () => { leer().agregar(shampoo, 2); });
  await act(async () => { leer().agregar(shampoo, 5); }); // pediría 7, hay 3
  await act(async () => { leer().agregar(tintura, 1); });

  expect(leer().cantidadDe(1)).toBe(3);
  expect(leer().cantidadTotal).toBe(4);
  expect(leer().total).toBe(3 * 9500 + 7800);
  arbol.unmount();
});

it('cambiarCantidad respeta el stock y 0 quita el producto', async () => {
  const { leer, arbol } = await montar();
  await act(async () => { leer().agregar(shampoo, 1); });
  await act(async () => { leer().cambiarCantidad(1, 10); });
  expect(leer().cantidadDe(1)).toBe(3);

  await act(async () => { leer().cambiarCantidad(1, 0); });
  expect(leer().items).toHaveLength(0);
  arbol.unmount();
});

it('sincronizar quita productos que ya no están, baja cantidades y avisa cambios de precio', async () => {
  const { leer, arbol } = await montar();
  await act(async () => { leer().agregar(shampoo, 3); });
  await act(async () => { leer().agregar(tintura, 2); });

  let avisos;
  await act(async () => {
    // Shampoo: ahora quedan 2 y subió de precio. Tintura: ya no se vende.
    avisos = leer().sincronizar([{ ...shampoo, stock: 2, precioVenta: 9900 }]);
  });

  expect(leer().items).toHaveLength(1);
  expect(leer().cantidadDe(1)).toBe(2);
  expect(leer().items[0].precioVenta).toBe(9900);
  expect(avisos).toHaveLength(3);
  arbol.unmount();
});

it('guarda el carrito en AsyncStorage por usuario y lo recupera al volver a montar', async () => {
  const primero = await montar({ idUsuario: 7, habilitado: true });
  await act(async () => { primero.leer().agregar(tintura, 4); });
  primero.arbol.unmount();

  expect(JSON.parse(await AsyncStorage.getItem('carrito_7'))[0].cantidad).toBe(4);
  expect(await AsyncStorage.getItem('carrito_8')).toBeNull();

  const segundo = await montar({ idUsuario: 7, habilitado: true });
  expect(segundo.leer().cantidadDe(2)).toBe(4);
  segundo.arbol.unmount();

  const otroUsuario = await montar({ idUsuario: 8, habilitado: true });
  expect(otroUsuario.leer().items).toHaveLength(0);
  otroUsuario.arbol.unmount();
});

it('no está habilitado para roles que no son cliente', async () => {
  const { leer, arbol } = await montar({ idUsuario: 11, habilitado: false });
  expect(leer().habilitado).toBe(false);
  arbol.unmount();
});
