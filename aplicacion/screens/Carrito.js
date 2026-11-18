import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';
import Header from '../components/header';
import SelectorCantidad from '../components/SelectorCantidad';
import { formatearPrecio } from '../components/ProductoItem';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { useCarrito } from '../context/CarritoContext';
import { formatearFecha } from '../utils/fechas';

// Carrito del cliente. Al abrirlo se actualizan precio y stock con el servidor.
// El total es orientativo: el precio final lo calcula el backend en crear_pedido.
export default function Carrito({ navigation }) {
  const carrito = useCarrito();
  const [actualizando, setActualizando] = useState(false);
  const [errorSincronizar, setErrorSincronizar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const actualizarConServidor = async () => {
    setActualizando(true);
    setErrorSincronizar(null);
    try {
      const response = await api.get(`/index.php?action=get_productos`);
      if (!esRespuestaValida(response.data)) {
        console.log('get_productos devolvió una respuesta inválida:', response.data);
        setErrorSincronizar('No se pudieron actualizar precios y stock (respuesta inválida del servidor).');
      } else if (response.data.success) {
        const avisos = carrito.sincronizar(response.data.data);
        if (avisos.length > 0) {
          Alert.alert('Actualizamos tu carrito', avisos.join('\n'));
        }
      } else {
        setErrorSincronizar(response.data.message);
      }
    } catch (err) {
      console.log('Error al actualizar el carrito:', err);
      setErrorSincronizar(`No se pudieron actualizar precios y stock. ${mensajeDeError(err)}`);
    } finally {
      setActualizando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Siempre (aunque parezca vacío: puede no haber terminado de cargarse desde AsyncStorage).
      actualizarConServidor();
      // Solo al entrar a la pantalla; carrito.sincronizar siempre lee la lista actual.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const confirmarQuitar = (item) => {
    Alert.alert('Quitar producto', `¿Quitar "${item.nombreProducto}" del carrito?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => carrito.quitar(item.idProductos) },
    ]);
  };

  const confirmarVaciar = () => {
    Alert.alert('Vaciar carrito', '¿Querés quitar todos los productos del carrito?', [
      { text: 'No', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: carrito.vaciar },
    ]);
  };

  const enviarPedido = async () => {
    setConfirmando(true);
    try {
      // Solo ids y cantidades: precio y stock los toma el backend de la base.
      const response = await api.post(`/index.php?action=crear_pedido`, {
        idClientes: carrito.idUsuario,
        items: carrito.items.map((i) => ({ idProductos: i.idProductos, cantidad: i.cantidad })),
      });

      if (!esRespuestaValida(response.data)) {
        console.log('crear_pedido devolvió una respuesta inválida:', response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        const { idPedido, montoTotal, fechaVence } = response.data;
        carrito.vaciar();
        Alert.alert(
          `Pedido #${idPedido} confirmado`,
          `Total: ${formatearPrecio(montoTotal)}.\nRetiralo en el salón antes del ${formatearFecha(fechaVence)}.\n\nEn Mis Pedidos elegí cómo pagarlo: en la app con Mercado Pago o en el local (efectivo o transferencia).`,
          [{ text: 'Ver mis pedidos', onPress: () => navigation.navigate('Mis Pedidos') }]
        );
      } else {
        Alert.alert('No pudimos confirmar el pedido', response.data.message);
        if (response.data.faltantes) {
          // Traer stock y precios actuales para que el carrito refleje lo que hay.
          actualizarConServidor();
        }
      }
    } catch (err) {
      console.log('Error en crear_pedido:', err);
      Alert.alert('Error', mensajeDeError(err));
    } finally {
      setConfirmando(false);
    }
  };

  const confirmarPedido = () => {
    Alert.alert(
      'Confirmar pedido',
      `Vas a reservar ${carrito.cantidadTotal} ${carrito.cantidadTotal === 1 ? 'producto' : 'productos'} por ${formatearPrecio(carrito.total)}.\n\nLo retirás en el salón y lo pagás en la app (Mercado Pago) o en el local (efectivo o transferencia). Tenés 7 días para retirarlo.`,
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Confirmar', onPress: enviarPedido },
      ]
    );
  };

  const renderItem = (item) => (
    <View key={item.idProductos} style={styles.fila}>
      {item.imagenUrl ? (
        <Image source={{ uri: item.imagenUrl }} style={styles.imagen} />
      ) : (
        <View style={[styles.imagen, styles.imagenGenerica]}>
          <Text style={styles.iconoGenerico}>🧴</Text>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.filaSuperior}>
          <Text style={styles.nombre}>{item.nombreProducto}</Text>
          <Pressable onPress={() => confirmarQuitar(item)} hitSlop={8}>
            <Text style={styles.quitar}>Quitar</Text>
          </Pressable>
        </View>
        <Text style={styles.precioUnitario}>{formatearPrecio(item.precioVenta)} c/u</Text>
        <View style={styles.filaInferior}>
          <SelectorCantidad
            valor={item.cantidad}
            min={1}
            max={item.stock}
            onCambiar={(cantidad) => carrito.cambiarCantidad(item.idProductos, cantidad)}
          />
          <Text style={styles.subtotal}>{formatearPrecio(item.cantidad * item.precioVenta)}</Text>
        </View>
        {item.cantidad >= item.stock && (
          <Text style={styles.avisoStock}>Llegaste al stock disponible ({item.stock}).</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>MI CARRITO</Text>
          {carrito.items.length > 0 && (
            <Pressable onPress={confirmarVaciar} hitSlop={8}>
              <Text style={styles.vaciar}>Vaciar</Text>
            </Pressable>
          )}
        </View>

        {actualizando && (
          <View style={styles.filaActualizando}>
            <ActivityIndicator size="small" color="#000000" />
            <Text style={styles.textoActualizando}>Actualizando precios y stock…</Text>
          </View>
        )}
        {errorSincronizar && <Text style={styles.textoError}>{errorSincronizar}</Text>}

        {carrito.items.length === 0 ? (
          <View style={styles.tarjetaMensaje}>
            <Text style={styles.textoVacio}>Tu carrito está vacío.</Text>
            <Pressable style={styles.botonSecundario} onPress={() => navigation.navigate('Productos')}>
              <Text style={styles.textoBotonSecundario}>VER PRODUCTOS</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {carrito.items.map(renderItem)}

            <View style={styles.resumen}>
              <View style={styles.filaResumen}>
                <Text style={styles.textoResumen}>Productos</Text>
                <Text style={styles.textoResumen}>{carrito.cantidadTotal}</Text>
              </View>
              <View style={[styles.filaResumen, styles.filaTotal]}>
                <Text style={styles.textoTotal}>TOTAL</Text>
                <Text style={styles.textoTotal}>{formatearPrecio(carrito.total)}</Text>
              </View>
              <Text style={styles.notaTotal}>
                El total final lo confirma el salón con los precios y el stock del momento.
              </Text>
            </View>

            <Pressable
              style={[styles.botonPrincipal, (confirmando || actualizando) && styles.botonDeshabilitado]}
              onPress={confirmarPedido}
              disabled={confirmando || actualizando}
            >
              {confirmando
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.textoBotonPrincipal}>CONFIRMAR PEDIDO</Text>}
            </Pressable>
            <Text style={styles.notaRetiro}>Retiro en el salón · pagás en la app o en el local · 7 días para retirarlo.</Text>
            <Pressable style={styles.botonSecundario} onPress={() => navigation.navigate('Productos')}>
              <Text style={styles.textoBotonSecundario}>SEGUIR COMPRANDO</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
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
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  vaciar: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C62828',
  },
  filaActualizando: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  textoActualizando: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  fila: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  imagen: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginRight: 14,
  },
  imagenGenerica: {
    backgroundColor: '#F5EDEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoGenerico: {
    fontSize: 26,
  },
  info: {
    flex: 1,
  },
  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nombre: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginRight: 10,
  },
  quitar: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: 'bold',
  },
  precioUnitario: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
  filaInferior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  subtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  avisoStock: {
    fontSize: 11,
    color: '#EF6C00',
    marginTop: 4,
  },
  resumen: {
    marginTop: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  textoResumen: {
    fontSize: 14,
    color: '#333333',
  },
  filaTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
    marginTop: 4,
  },
  textoTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  notaTotal: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
  },
  botonPrincipal: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  notaRetiro: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  textoBotonSecundario: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
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
    fontSize: 12,
    color: '#C62828',
    marginBottom: 6,
  },
});
