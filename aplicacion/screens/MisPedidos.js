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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';
import Header from '../components/header';
import OpcionesPago from '../components/OpcionesPago';
import ResumenPagoLocal, { ModalResumenPagoLocal } from '../components/ResumenPagoLocal';
import { formatearPrecio } from '../components/ProductoItem';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { obtenerPagosPendientes, ESTADOS_EN_PROCESO } from '../utils/pagos';
import { formatearFecha } from '../utils/fechas';
import { useCarrito } from '../context/CarritoContext';

// Cómo se muestra cada estado (pedidos.estado + canceladoPor).
const describirEstado = (pedido) => {
  if (pedido.estado === 'pendiente' && pedido.pagado) {
    return { texto: 'Pagado · para retirar', fondo: '#E8F5E9', color: '#2E7D32' };
  }
  if (pedido.estado === 'pendiente') {
    return { texto: 'Pendiente de retiro', fondo: '#FFF3E0', color: '#EF6C00' };
  }
  if (pedido.estado === 'entregado') {
    return { texto: 'Entregado', fondo: '#E8F5E9', color: '#2E7D32' };
  }
  const porQuien = {
    cliente: 'Cancelado por vos',
    salon: 'Cancelado por el salón',
    vencimiento: 'Venció sin retirar',
  };
  return { texto: porQuien[pedido.canceladoPor] || 'Cancelado', fondo: '#FFEBEE', color: '#C62828' };
};

// Pedidos de productos del cliente: pendientes de retiro (con opciones de pago y de cancelar)
// e historial. Cada pedido sin pagar se puede pagar en la app (Mercado Pago) o marcar para
// pagar en el local (efectivo o transferencia). Arriba se resume todo lo que el cliente
// eligió pagar en el local, citas incluidas.
export default function MisPedidos({ navigation }) {
  const { idUsuario } = useCarrito();
  const [pedidos, setPedidos] = useState([]);
  const [pendientesPago, setPendientesPago] = useState(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [error, setError] = useState(null);

  // Citas y pedidos sin pagar, con el medio elegido para el local. Si falla, la lista de
  // pedidos se muestra igual (solo sin la opción de pagar en el local).
  const cargarPendientesPago = async () => {
    try {
      setPendientesPago(await obtenerPagosPendientes());
    } catch (err) {
      console.log('Error en get_pagos_pendientes:', err);
    }
  };

  const alElegirPagoLocal = async () => {
    await cargarPendientesPago();
    setMostrarResumen(true);
  };

  const cargarPedidos = async () => {
    try {
      setError(null);
      if (!idUsuario) {
        setError('No se encontró tu sesión. Volvé a iniciar sesión.');
        return;
      }
      cargarPendientesPago();
      const response = await api.get(`/index.php?action=get_pedidos_cliente&idClientes=${idUsuario}`);

      if (!esRespuestaValida(response.data)) {
        console.log('get_pedidos_cliente devolvió una respuesta inválida:', response.data);
        setError('Respuesta inválida del servidor');
      } else if (response.data.success) {
        setPedidos(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.log('Error en get_pedidos_cliente:', err);
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPedidos();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idUsuario])
  );

  const refrescar = () => {
    setRefrescando(true);
    cargarPedidos();
  };

  const cancelar = async (pedido) => {
    setCancelandoId(pedido.idPedido);
    try {
      const response = await api.post(`/index.php?action=cancelar_pedido`, {
        idClientes: idUsuario,
        idPedido: pedido.idPedido,
      });
      if (!esRespuestaValida(response.data)) {
        console.log('cancelar_pedido devolvió una respuesta inválida:', response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else {
        Alert.alert(response.data.success ? 'Listo' : 'Atención', response.data.message);
      }
      await cargarPedidos();
    } catch (err) {
      console.log('Error en cancelar_pedido:', err);
      Alert.alert('Error', mensajeDeError(err));
    } finally {
      setCancelandoId(null);
    }
  };

  const confirmarCancelacion = (pedido) => {
    Alert.alert(
      `Cancelar pedido #${pedido.idPedido}`,
      '¿Querés cancelar este pedido? Los productos vuelven a estar disponibles para otros clientes.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelar(pedido) },
      ]
    );
  };

  const renderPendiente = (pedido) => {
    const enProceso = ESTADOS_EN_PROCESO.includes(pedido.estadoPagoMp);
    if (pedido.pagado) {
      return (
        <Text style={styles.avisoPagado}>
          ✓ Pagado con {pedido.medioPago || 'Mercado Pago'}
          {pedido.fechaPago ? ` el ${formatearFecha(pedido.fechaPago)}` : ''}. Ya podés retirarlo en el salón.
        </Text>
      );
    }
    return (
      <>
        <Text style={styles.avisoRetiro}>
          Retiralo en el salón antes del {formatearFecha(pedido.fechaVence)} a las {pedido.horaVence}.
        </Text>
        <OpcionesPago
          tipo="pedido"
          item={{ ...pedido, id: pedido.idPedido, pagado: 0 }}
          mediosLocal={pendientesPago?.mediosLocal || []}
          onCambio={cargarPedidos}
          onElegirLocal={alElegirPagoLocal}
        />
        {!enProceso &&
          (cancelandoId === pedido.idPedido ? (
            <ActivityIndicator color="#000000" style={styles.indicador} />
          ) : (
            <Pressable
              style={styles.botonCancelar}
              onPress={() => confirmarCancelacion(pedido)}
              disabled={cancelandoId !== null}
            >
              <Text style={styles.textoCancelar}>Cancelar pedido</Text>
            </Pressable>
          ))}
      </>
    );
  };

  const renderPedido = (pedido) => {
    const estado = describirEstado(pedido);
    const esPendiente = pedido.estado === 'pendiente';

    return (
      <View key={pedido.idPedido} style={styles.tarjeta}>
        <View style={styles.filaSuperior}>
          <View>
            <Text style={styles.numero}>Pedido #{pedido.idPedido}</Text>
            <Text style={styles.fecha}>{formatearFecha(pedido.fecha)} · {pedido.hora}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: estado.fondo }]}>
            <Text style={[styles.textoChip, { color: estado.color }]}>{estado.texto}</Text>
          </View>
        </View>

        {pedido.productos.map((linea) => (
          <View key={linea.idProductos} style={styles.linea}>
            <Text style={styles.textoLinea} numberOfLines={1}>
              {linea.cantidad} × {linea.nombreProducto}
            </Text>
            <Text style={styles.textoLinea}>{formatearPrecio(linea.cantidad * linea.precioUnitario)}</Text>
          </View>
        ))}

        <View style={styles.filaTotal}>
          <Text style={styles.textoTotal}>Total</Text>
          <Text style={styles.textoTotal}>{formatearPrecio(pedido.montoTotal)}</Text>
        </View>

        {esPendiente && renderPendiente(pedido)}
        {pedido.estado === 'entregado' && pedido.medioPago && (
          <Text style={styles.detalleCierre}>
            Pagado con {pedido.medioPago}{pedido.fechaCierre ? ` el ${formatearFecha(pedido.fechaCierre)}` : ''}.
          </Text>
        )}
      </View>
    );
  };

  const pendientes = pedidos.filter((p) => p.estado === 'pendiente');
  const historial = pedidos.filter((p) => p.estado !== 'pendiente');

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
    if (pedidos.length === 0) {
      return (
        <View style={styles.tarjetaMensaje}>
          <Text style={styles.textoVacio}>Todavía no hiciste pedidos.</Text>
          <Pressable style={styles.botonSecundario} onPress={() => navigation.navigate('Productos')}>
            <Text style={styles.textoBotonSecundario}>VER PRODUCTOS</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <>
        <ResumenPagoLocal pendientes={pendientesPago} />
        {pendientes.length > 0 && <Text style={styles.tituloSeccion}>Para retirar</Text>}
        {pendientes.map(renderPedido)}
        {historial.length > 0 && <Text style={styles.tituloSeccion}>Historial</Text>}
        {historial.map(renderPedido)}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
      >
        <Text style={styles.titulo}>MIS PEDIDOS</Text>
        <Text style={styles.subtitulo}>
          Retirás en el salón. Pagás en la app con Mercado Pago o en el local (efectivo o transferencia).
        </Text>
        {renderContenido()}
      </ScrollView>

      <ModalResumenPagoLocal
        visible={mostrarResumen}
        pendientes={pendientesPago}
        onClose={() => setMostrarResumen(false)}
      />
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
  titulo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
    marginBottom: 10,
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    marginTop: 14,
    marginBottom: 8,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 2,
  },
  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  numero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  fecha: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  textoChip: {
    fontSize: 11,
    fontWeight: '700',
  },
  linea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  textoLinea: {
    fontSize: 13,
    color: '#333333',
    flexShrink: 1,
    marginRight: 8,
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
    marginTop: 6,
  },
  textoTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
  },
  avisoRetiro: {
    fontSize: 12,
    color: '#EF6C00',
    marginTop: 10,
  },
  avisoPagado: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
    marginTop: 10,
  },
  botonCancelar: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C62828',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  textoCancelar: {
    color: '#C62828',
    fontWeight: 'bold',
    fontSize: 13,
  },
  indicador: {
    marginTop: 12,
  },
  detalleCierre: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
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
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 10,
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
});
