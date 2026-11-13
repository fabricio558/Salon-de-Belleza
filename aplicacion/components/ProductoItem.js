import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import SelectorCantidad from './SelectorCantidad';

// Por debajo de este stock se avisa "últimas unidades".
const STOCK_BAJO = 5;

export const formatearPrecio = (precio) => `$${Number(precio).toLocaleString('es-AR')}`;

// Fila de producto del catálogo. Mismo estilo que ServicioItem.
// producto: { nombreProducto, marca, descripcion, imagenUrl, precioVenta, stock }
// onAgregar: al tocar "Agregar al carrito".
// cantidadEnCarrito / onCambiarCantidad: si el producto ya está en el carrito se muestra
// el selector − cantidad + (máximo: el stock; bajar a 0 lo quita).
export default function ProductoItem({ producto, onAgregar, cantidadEnCarrito = 0, onCambiarCantidad }) {
  const stockBajo = producto.stock <= STOCK_BAJO;
  const enCarrito = cantidadEnCarrito > 0 && onCambiarCantidad;

  return (
    <View style={styles.fila}>
      {producto.imagenUrl ? (
        <Image source={{ uri: producto.imagenUrl }} style={styles.imagen} />
      ) : (
        <View style={[styles.imagen, styles.imagenGenerica]}>
          <Text style={styles.iconoGenerico}>🧴</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.nombre}>{producto.nombreProducto}</Text>
        {producto.marca ? <Text style={styles.marca}>{producto.marca}</Text> : null}
        {producto.descripcion ? (
          <Text style={styles.descripcion} numberOfLines={2}>{producto.descripcion}</Text>
        ) : null}

        <View style={styles.filaInferior}>
          <View>
            <Text style={styles.precio}>{formatearPrecio(producto.precioVenta)}</Text>
            {stockBajo && (
              <Text style={styles.stockBajo}>
                {producto.stock === 1 ? '¡Última unidad!' : `¡Últimas ${producto.stock} unidades!`}
              </Text>
            )}
          </View>
          {enCarrito ? (
            <View style={styles.contenedorSelector}>
              <SelectorCantidad
                valor={cantidadEnCarrito}
                min={0}
                max={producto.stock}
                onCambiar={(cantidad) => onCambiarCantidad(producto, cantidad)}
              />
              <Text style={styles.textoEnCarrito}>
                {cantidadEnCarrito >= producto.stock ? 'Máximo disponible' : 'En el carrito'}
              </Text>
            </View>
          ) : (
            <Pressable style={styles.boton} onPress={() => onAgregar(producto)}>
              <Text style={styles.textoBoton}>Agregar al carrito</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  imagen: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginRight: 15,
  },
  imagenGenerica: {
    backgroundColor: '#F5EDEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoGenerico: {
    fontSize: 30,
  },
  info: {
    flex: 1,
  },
  nombre: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '600',
  },
  marca: {
    fontSize: 12,
    color: '#B8838A',
    fontWeight: '700',
    marginTop: 2,
  },
  descripcion: {
    fontSize: 12,
    color: '#777777',
    marginTop: 4,
  },
  filaInferior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  precio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  stockBajo: {
    fontSize: 11,
    color: '#EF6C00',
    fontWeight: '700',
    marginTop: 2,
  },
  boton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  contenedorSelector: {
    alignItems: 'center',
  },
  textoEnCarrito: {
    fontSize: 10,
    color: '#666666',
    marginTop: 3,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
