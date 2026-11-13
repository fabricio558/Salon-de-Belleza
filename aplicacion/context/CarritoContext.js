import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Carrito del cliente, compartido por las pantallas y guardado en AsyncStorage
// con una clave por usuario (dos cuentas en el mismo celular no lo comparten).
//
// Cada item guarda una copia del producto (nombre, precio, stock, imagen) para poder
// mostrarlo sin conexión. Esa copia puede quedar vieja: sincronizar() la actualiza con
// get_productos. El precio y el stock reales los valida SIEMPRE el backend al confirmar.

const CarritoContext = createContext({ habilitado: false });

export const useCarrito = () => useContext(CarritoContext);

const claveStorage = (idUsuario) => `carrito_${idUsuario}`;

const copiaDeProducto = (producto) => ({
  idProductos: producto.idProductos,
  nombreProducto: producto.nombreProducto,
  marca: producto.marca,
  imagenUrl: producto.imagenUrl,
  precioVenta: Number(producto.precioVenta),
  stock: Number(producto.stock),
});

// habilitado: solo el cliente tiene carrito. idUsuario: dueño del carrito.
export function CarritoProvider({ idUsuario, habilitado, children }) {
  const [items, setItems] = useState([]);
  const cargado = useRef(false);
  // Última lista, para funciones que se llaman después de un await (evita leer una copia vieja).
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Cargar el carrito guardado del usuario.
  useEffect(() => {
    cargado.current = false;
    setItems([]);
    if (!habilitado || !idUsuario) {
      return;
    }
    let cancelado = false;
    AsyncStorage.getItem(claveStorage(idUsuario))
      .then((guardado) => {
        if (!cancelado && guardado) {
          const lista = JSON.parse(guardado);
          if (Array.isArray(lista)) {
            setItems(lista.filter((i) => i && i.idProductos && i.cantidad > 0));
          }
        }
      })
      .catch((err) => console.log('No se pudo leer el carrito guardado:', err))
      .finally(() => {
        if (!cancelado) {
          cargado.current = true;
        }
      });
    return () => {
      cancelado = true;
    };
  }, [idUsuario, habilitado]);

  // Guardar cada cambio (después de la carga inicial, para no pisar lo guardado con []).
  useEffect(() => {
    if (!habilitado || !idUsuario || !cargado.current) {
      return;
    }
    AsyncStorage.setItem(claveStorage(idUsuario), JSON.stringify(items))
      .catch((err) => console.log('No se pudo guardar el carrito:', err));
  }, [items, idUsuario, habilitado]);

  const valor = useMemo(() => {
    const cantidadDe = (idProductos) => items.find((i) => i.idProductos === idProductos)?.cantidad || 0;

    // Suma `cantidad` al producto, sin superar su stock. Devuelve la cantidad que quedó.
    const agregar = (producto, cantidad = 1) => {
      const copia = copiaDeProducto(producto);
      const actual = cantidadDe(copia.idProductos);
      const nueva = Math.min(actual + cantidad, copia.stock);
      setItems((lista) => {
        if (lista.some((i) => i.idProductos === copia.idProductos)) {
          return lista.map((i) => (i.idProductos === copia.idProductos ? { ...i, ...copia, cantidad: nueva } : i));
        }
        return nueva > 0 ? [...lista, { ...copia, cantidad: nueva }] : lista;
      });
      return nueva;
    };

    // Fija la cantidad (0 o menos quita el producto); nunca supera el stock conocido.
    const cambiarCantidad = (idProductos, cantidad) => {
      setItems((lista) => lista
        .map((i) => (i.idProductos === idProductos ? { ...i, cantidad: Math.min(cantidad, i.stock) } : i))
        .filter((i) => i.cantidad > 0));
    };

    const quitar = (idProductos) => setItems((lista) => lista.filter((i) => i.idProductos !== idProductos));

    const vaciar = () => setItems([]);

    // Actualiza las copias con los productos que devolvió get_productos (activos y con stock).
    // Quita los que ya no están y baja cantidades que superan el stock. Devuelve avisos para el usuario.
    const sincronizar = (productosServidor) => {
      const porId = new Map(productosServidor.map((p) => [p.idProductos, p]));
      const avisos = [];
      const nuevaLista = [];
      itemsRef.current.forEach((item) => {
        const producto = porId.get(item.idProductos);
        if (!producto) {
          avisos.push(`"${item.nombreProducto}" ya no está disponible y se quitó del carrito.`);
          return;
        }
        const copia = copiaDeProducto(producto);
        let cantidad = item.cantidad;
        if (cantidad > copia.stock) {
          cantidad = copia.stock;
          avisos.push(`De "${copia.nombreProducto}" quedan ${copia.stock}: ajustamos la cantidad.`);
        }
        if (copia.precioVenta !== item.precioVenta) {
          avisos.push(`"${copia.nombreProducto}" cambió de precio.`);
        }
        nuevaLista.push({ ...copia, cantidad });
      });
      setItems(nuevaLista);
      return avisos;
    };

    return {
      habilitado: Boolean(habilitado && idUsuario),
      items,
      cantidadTotal: items.reduce((acc, i) => acc + i.cantidad, 0),
      total: items.reduce((acc, i) => acc + i.cantidad * i.precioVenta, 0),
      cantidadDe,
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
      sincronizar,
    };
  }, [items, habilitado, idUsuario]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}
