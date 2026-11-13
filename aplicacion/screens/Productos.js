import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import BASE_URL from '../direcIP/ip';
import Header from '../components/header';
import ProductoItem, { formatearPrecio } from '../components/ProductoItem';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { useCarrito } from '../context/CarritoContext';

// Catálogo de productos para el cliente (solo activos y con stock, lo filtra el servidor).
export default function Productos({ navigation }) {
  const carrito = useCarrito();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargarProductos = async () => {
    try {
      setError(null);
      const response = await axios.get(`${BASE_URL}/index.php?action=get_productos`);

      if (!esRespuestaValida(response.data)) {
        console.log('get_productos devolvió una respuesta inválida:', response.data);
        setError('Respuesta inválida del servidor');
      } else if (response.data.success) {
        setProductos(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.log('Error en get_productos:', err);
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [])
  );

  const refrescar = () => {
    setRefrescando(true);
    cargarProductos();
  };

  const agregarAlCarrito = (producto) => carrito.agregar(producto, 1);

  // Desde el selector − cantidad +: 0 quita el producto. agregar() también actualiza
  // la copia guardada con el stock y el precio recién traídos del servidor.
  const cambiarCantidad = (producto, cantidad) => {
    if (cantidad <= 0) {
      carrito.quitar(producto.idProductos);
    } else {
      carrito.agregar(producto, cantidad - carrito.cantidadDe(producto.idProductos));
    }
  };

  const renderContenido = () => {
    if (cargando) {
      return <ActivityIndicator size="large" color="#000000" style={styles.cargando} />;
    }
    if (error) {
      return (
        <View style={styles.tarjetaMensaje}>
          <Text style={styles.textoError}>{error}</Text>
          <Text style={styles.textoAyuda}>Deslizá hacia abajo para reintentar.</Text>
        </View>
      );
    }
    if (productos.length === 0) {
      return (
        <View style={styles.tarjetaMensaje}>
          <Text style={styles.textoVacio}>Por ahora no hay productos disponibles.</Text>
        </View>
      );
    }
    return productos.map((producto) => (
      <ProductoItem
        key={producto.idProductos}
        producto={producto}
        onAgregar={agregarAlCarrito}
        cantidadEnCarrito={carrito.cantidadDe(producto.idProductos)}
        onCambiarCantidad={cambiarCantidad}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
      >
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>PRODUCTOS</Text>
          <Text style={styles.subtitulo}>Llevá a casa los productos que usamos en el salón.</Text>
        </View>

        {renderContenido()}
      </ScrollView>

      {carrito.cantidadTotal > 0 && (
        <Pressable style={styles.barraCarrito} onPress={() => navigation.navigate('Mi Carrito')}>
          <Text style={styles.textoBarraCarrito}>
            🛒 Ver carrito ({carrito.cantidadTotal})
          </Text>
          <Text style={styles.textoBarraCarrito}>{formatearPrecio(carrito.total)}</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 90, // espacio para la barra del carrito
    paddingHorizontal: 20,
  },
  barraCarrito: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    elevation: 6,
  },
  textoBarraCarrito: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  encabezado: {
    marginBottom: 6,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  cargando: {
    marginTop: 40,
  },
  tarjetaMensaje: {
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
  },
  textoVacio: {
    fontSize: 14,
    color: '#666666',
  },
  textoError: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
  },
  textoAyuda: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
  },
});
