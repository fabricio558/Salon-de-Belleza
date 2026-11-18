import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { accion } from '../utils/api';
import Header from '../components/header';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { formatearMonto, ESTADOS_EN_PROCESO } from '../utils/pagos';
import { formatearFecha } from '../utils/fechas';
import { normalizarTexto } from '../utils/texto';

const PESTANAS = [
  { clave: 'pendientes', etiqueta: 'Para retirar' },
  { clave: 'historial', etiqueta: 'Historial' },
];

// Estado del pedido para la etiqueta de la tarjeta.
const describirEstado = (pedido) => {
  if (pedido.estado === 'entregado') {
    return { texto: 'Entregado', fondo: '#E8F5E9', color: '#2E7D32' };
  }
  if (pedido.estado === 'cancelado') {
    const porQuien = {
      cliente: 'Cancelado por el cliente',
      salon: 'Cancelado por el salón',
      vencimiento: 'Venció sin retirar',
    };
    return { texto: porQuien[pedido.canceladoPor] || 'Cancelado', fondo: '#FFEBEE', color: '#C62828' };
  }
  return { texto: 'Reservado', fondo: '#FFF3E0', color: '#EF6C00' };
};

// Cómo se paga (o se pagó) el pedido.
// tipo: 'pagado' | 'proceso' | 'local' | 'sinElegir' | 'noAplica'.
export const describirPagoPedido = (pedido) => {
  if (pedido.pagado) {
    return {
      tipo: 'pagado',
      texto: `✓ Pagado con ${pedido.medioPago || 'Mercado Pago'}${pedido.fechaPago ? ` el ${formatearFecha(pedido.fechaPago)}` : ''}`,
    };
  }
  if (pedido.estado !== 'pendiente') {
    return { tipo: 'noAplica', texto: 'Sin cobro' };
  }
  if (ESTADOS_EN_PROCESO.includes(pedido.estadoPagoMp)) {
    return { tipo: 'proceso', texto: '⏳ Pago con Mercado Pago en proceso' };
  }
  if (pedido.medioPagoLocal) {
    return { tipo: 'local', texto: `🏪 Paga en el local con ${pedido.medioPagoLocal}` };
  }
  return { tipo: 'sinElegir', texto: 'Sin pagar · el cliente no eligió cómo pagar' };
};

// Búsqueda por palabras, en cualquier orden y sin tildes: cada palabra tiene que aparecer en
// el nombre del cliente, su nombre de usuario, su correo o el número de pedido ("#12" o "12").
// Así "fabricio segovia", "segovia", "fabri_zx" o "#12 fabricio" encuentran el pedido, aunque
// el teclado agregue un espacio al final.
export const filtrarPedidos = (pedidos, busqueda) => {
  const palabras = normalizarTexto(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) {
    return pedidos;
  }
  return pedidos.filter((p) => {
    const texto = normalizarTexto(
      [p.cliente, p.nombreUsuario, p.correo, `#${p.idPedido}`].filter(Boolean).join(' ')
    );
    return palabras.every((palabra) => texto.includes(palabra));
  });
};

const ESTILOS_PAGO = {
  pagado: { fondo: '#E8F5E9', color: '#2E7D32' },
  proceso: { fondo: '#FFF3E0', color: '#EF6C00' },
  local: { fondo: '#E3F2FD', color: '#1565C0' },
  sinElegir: { fondo: '#F5F5F5', color: '#555555' },
  noAplica: { fondo: '#F5F5F5', color: '#888888' },
};

// Pedidos de productos de todos los clientes, para el recepcionista: los reservados que
// faltan retirar (con su estado de pago y cómo los paga el cliente) y el historial.
// "Entregar" marca el pedido como retirado y, si no está pagado, lo cobra en el mostrador.
export default function PedidosRecepcion({ navigation }) {
  const [vista, setVista] = useState('pendientes');
  // Se cargan las dos listas: las pestañas eligen cuál mostrar y la búsqueda recorre ambas.
  const [listas, setListas] = useState({ pendientes: [], historial: [] });
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const [medios, setMedios] = useState([]);
  const [pedidoACobrar, setPedidoACobrar] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  const pedirVista = async (nombre) => {
    const response = await api.get(`${accion('get_pedidos_salon')}&vista=${nombre}`);
    if (!esRespuestaValida(response.data)) {
      console.log('get_pedidos_salon devolvió una respuesta inválida:', response.data);
      throw new Error('Respuesta inválida del servidor');
    }
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    return response.data.data;
  };

  const cargarPedidos = async () => {
    try {
      setError(null);
      const [pendientes, historial] = await Promise.all([pedirVista('pendientes'), pedirVista('historial')]);
      setListas({ pendientes, historial });
    } catch (err) {
      console.log('Error en get_pedidos_salon:', err);
      setError(err.response ? mensajeDeError(err) : err.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPedidos();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const cambiarVista = (nueva) => setVista(nueva);

  const refrescar = () => {
    setRefrescando(true);
    cargarPedidos();
  };

  const entregar = async (pedido, medio = null) => {
    setProcesandoId(pedido.idPedido);
    try {
      const response = await api.post(accion('entregar_pedido'), {
        idPedido: pedido.idPedido,
        ...(medio ? { idMedios_pago: medio.idMedios_pago } : {}),
      });
      if (!esRespuestaValida(response.data)) {
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else {
        Alert.alert(response.data.success ? 'Pedido entregado' : 'Atención', response.data.message);
        if (response.data.success) {
          setPedidoACobrar(null);
        }
      }
      await cargarPedidos();
    } catch (err) {
      console.log('Error en entregar_pedido:', err);
      Alert.alert('Error', mensajeDeError(err));
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirCobro = async (pedido) => {
    setPedidoACobrar(pedido);
    if (medios.length > 0) {
      return;
    }
    try {
      const response = await api.get(accion('get_medios_pago'));
      if (!esRespuestaValida(response.data) || !response.data.success) {
        throw new Error(response.data?.message || 'Respuesta inválida del servidor');
      }
      setMedios(response.data.data.filter((m) => !m.esMercadoPago));
    } catch (err) {
      console.log('Error en get_medios_pago:', err);
      Alert.alert('Error', err.response ? mensajeDeError(err) : err.message);
      setPedidoACobrar(null);
    }
  };

  const alPresionarEntregar = (pedido) => {
    const pago = describirPagoPedido(pedido);
    if (pago.tipo === 'proceso') {
      Alert.alert(
        'Pago en proceso',
        'El cliente tiene un pago con Mercado Pago que todavía no se confirmó. Esperá a que se acredite antes de entregarlo.'
      );
      return;
    }
    if (pedido.pagado) {
      Alert.alert('Entregar pedido', `¿Entregar el pedido #${pedido.idPedido} a ${pedido.cliente}? Ya está pagado.`, [
        { text: 'Volver', style: 'cancel' },
        { text: 'Entregar', onPress: () => entregar(pedido) },
      ]);
      return;
    }
    abrirCobro(pedido);
  };

  const confirmarCobro = (medio) => {
    const pedido = pedidoACobrar;
    Alert.alert(
      'Cobrar y entregar',
      `¿Cobrar ${formatearMonto(pedido.montoTotal)} a ${pedido.cliente} en ${medio.medioPago} y entregar el pedido #${pedido.idPedido}?`,
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cobrar y entregar', onPress: () => entregar(pedido, medio) },
      ]
    );
  };

  // Con texto en el buscador se busca en las dos pestañas (primero los reservados);
  // sin búsqueda se muestra la pestaña elegida.
  const buscando = busqueda.trim() !== '';
  const pedidos = listas[vista];
  const filtrados = buscando
    ? filtrarPedidos([...listas.pendientes, ...listas.historial], busqueda)
    : pedidos;

  const renderResumen = () => {
    if (buscando || vista !== 'pendientes' || pedidos.length === 0) {
      return null;
    }
    const pagados = pedidos.filter((p) => p.pagado);
    const aCobrar = pedidos.filter((p) => !p.pagado);
    const totalACobrar = aCobrar.reduce((suma, p) => suma + p.montoTotal, 0);
    const porMedio = {};
    aCobrar.forEach((p) => {
      const clave = ESTADOS_EN_PROCESO.includes(p.estadoPagoMp)
        ? 'MP en proceso'
        : p.medioPagoLocal || 'Sin elegir';
      porMedio[clave] = (porMedio[clave] || 0) + 1;
    });
    return (
      <View style={styles.resumen}>
        <View style={styles.celdaResumen}>
          <Text style={styles.numeroResumen}>{pedidos.length}</Text>
          <Text style={styles.etiquetaResumen}>para retirar</Text>
        </View>
        <View style={styles.celdaResumen}>
          <Text style={[styles.numeroResumen, styles.verde]}>{pagados.length}</Text>
          <Text style={styles.etiquetaResumen}>ya pagados</Text>
        </View>
        <View style={styles.celdaResumen}>
          <Text style={styles.numeroResumen}>{formatearMonto(totalACobrar)}</Text>
          <Text style={styles.etiquetaResumen}>a cobrar en el local</Text>
        </View>
        {aCobrar.length > 0 && (
          <Text style={styles.detalleResumen}>
            {Object.entries(porMedio)
              .map(([medio, cantidad]) => `${medio}: ${cantidad}`)
              .join('  ·  ')}
          </Text>
        )}
      </View>
    );
  };

  const renderPedido = (pedido) => {
    const estado = describirEstado(pedido);
    const pago = describirPagoPedido(pedido);
    const estiloPago = ESTILOS_PAGO[pago.tipo];
    const pendiente = pedido.estado === 'pendiente';

    return (
      <View key={pedido.idPedido} style={styles.tarjeta}>
        <View style={styles.filaSuperior}>
          <View style={styles.flex}>
            <Text style={styles.cliente}>{pedido.cliente}</Text>
            <Text style={styles.fecha}>
              Pedido #{pedido.idPedido} · {formatearFecha(pedido.fecha)} {pedido.hora}
            </Text>
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
            <Text style={styles.textoLinea}>{formatearMonto(linea.cantidad * linea.precioUnitario)}</Text>
          </View>
        ))}

        <View style={styles.filaTotal}>
          <Text style={styles.textoTotal}>Total</Text>
          <Text style={styles.textoTotal}>{formatearMonto(pedido.montoTotal)}</Text>
        </View>

        <View style={[styles.cajaPago, { backgroundColor: estiloPago.fondo }]}>
          <Text style={[styles.textoPago, { color: estiloPago.color }]}>{pago.texto}</Text>
        </View>

        {pendiente ? (
          <>
            {!pedido.pagado && (
              <Text style={styles.vence}>
                Vence el {formatearFecha(pedido.fechaVence)} a las {pedido.horaVence}
              </Text>
            )}
            {procesandoId === pedido.idPedido ? (
              <ActivityIndicator color="#000000" style={styles.indicador} />
            ) : (
              <Pressable
                style={[styles.botonEntregar, pago.tipo === 'proceso' && styles.botonDeshabilitado]}
                onPress={() => alPresionarEntregar(pedido)}
                disabled={procesandoId !== null}
              >
                <Text style={styles.textoEntregar}>
                  {pedido.pagado ? 'Entregar' : `Cobrar ${formatearMonto(pedido.montoTotal)} y entregar`}
                </Text>
              </Pressable>
            )}
          </>
        ) : (
          pedido.fechaCierre && (
            <Text style={styles.cierre}>
              {pedido.estado === 'entregado' ? 'Entregado' : 'Cerrado'} el {formatearFecha(pedido.fechaCierre)}{' '}
              {pedido.horaCierre}
              {pedido.cerradoPor ? ` por ${pedido.cerradoPor}` : ''}
            </Text>
          )
        )}
      </View>
    );
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
    if (filtrados.length === 0) {
      return (
        <View style={styles.tarjetaMensaje}>
          <Text style={styles.textoAyuda}>
            {busqueda.trim()
              ? 'No hay pedidos que coincidan con la búsqueda.'
              : vista === 'pendientes'
                ? 'No hay pedidos reservados para retirar.'
                : 'Todavía no hay pedidos entregados ni cancelados.'}
          </Text>
        </View>
      );
    }
    return (
      <>
        {buscando && (
          <Text style={styles.textoResultados}>
            {filtrados.length} {filtrados.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'} (reservados e
            historial)
          </Text>
        )}
        {filtrados.map(renderPedido)}
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
        <Text style={styles.titulo}>PEDIDOS</Text>
        <Text style={styles.subtitulo}>Productos reservados por los clientes y cómo los pagan.</Text>

        <View style={styles.filaPestanas}>
          {PESTANAS.map(({ clave, etiqueta }) => {
            const activa = vista === clave;
            return (
              <Pressable
                key={clave}
                style={[styles.pestana, activa && styles.pestanaActiva]}
                onPress={() => cambiarVista(clave)}
              >
                <Text style={[styles.textoPestana, activa && styles.textoPestanaActiva]}>
                  {etiqueta}
                  {cargando ? '' : ` (${listas[clave].length})`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={styles.buscador}
          placeholder="Buscar por cliente, usuario, correo o n° de pedido"
          placeholderTextColor="#999999"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {!cargando && !error && renderResumen()}
        {renderContenido()}
      </ScrollView>

      <Modal
        visible={pedidoACobrar !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPedidoACobrar(null)}
      >
        <View style={styles.fondoModal}>
          <View style={styles.modal}>
            <Text style={styles.tituloModal}>Cobrar y entregar</Text>
            {pedidoACobrar && (
              <>
                <Text style={styles.subtituloModal}>
                  Pedido #{pedidoACobrar.idPedido} · {pedidoACobrar.cliente} ·{' '}
                  {formatearMonto(pedidoACobrar.montoTotal)}
                </Text>
                <Text style={styles.eleccionCliente}>
                  {pedidoACobrar.medioPagoLocal
                    ? `El cliente eligió pagar con ${pedidoACobrar.medioPagoLocal}.`
                    : 'El cliente no eligió cómo pagar en el local.'}
                </Text>
              </>
            )}
            {medios.length === 0 || procesandoId !== null ? (
              <ActivityIndicator color="#000000" style={styles.indicador} />
            ) : (
              medios.map((medio) => {
                const elegido = medio.medioPago === pedidoACobrar?.medioPagoLocal;
                return (
                  <Pressable
                    key={medio.idMedios_pago}
                    style={[styles.botonMedio, elegido && styles.botonMedioElegido]}
                    onPress={() => confirmarCobro(medio)}
                  >
                    <Text style={[styles.textoMedio, elegido && styles.textoMedioElegido]}>
                      {medio.medioPago}
                      {elegido ? '  (elegido por el cliente)' : ''}
                    </Text>
                  </Pressable>
                );
              })
            )}
            <Pressable
              style={styles.botonCerrar}
              onPress={() => setPedidoACobrar(null)}
              disabled={procesandoId !== null}
            >
              <Text style={styles.textoCerrar}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  flex: {
    flex: 1,
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
    marginBottom: 12,
  },
  filaPestanas: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    padding: 3,
  },
  pestana: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  pestanaActiva: {
    backgroundColor: '#000000',
  },
  textoPestana: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
  },
  textoPestanaActiva: {
    color: '#FFFFFF',
  },
  buscador: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000000',
    marginBottom: 12,
  },
  textoResultados: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  resumen: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  celdaResumen: {
    flex: 1,
    alignItems: 'center',
  },
  numeroResumen: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000000',
  },
  verde: {
    color: '#2E7D32',
  },
  etiquetaResumen: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
  detalleResumen: {
    width: '100%',
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
    marginTop: 8,
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
  cliente: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B8838A',
  },
  fecha: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
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
  cajaPago: {
    borderRadius: 8,
    padding: 9,
    marginTop: 10,
  },
  textoPago: {
    fontSize: 13,
    fontWeight: '700',
  },
  vence: {
    fontSize: 12,
    color: '#EF6C00',
    marginTop: 8,
  },
  botonEntregar: {
    marginTop: 10,
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    backgroundColor: '#9E9E9E',
  },
  textoEntregar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cierre: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  indicador: {
    marginVertical: 12,
  },
  cargando: {
    marginTop: 40,
  },
  tarjetaMensaje: {
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
  },
  textoError: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
  },
  textoAyuda: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  subtituloModal: {
    fontSize: 14,
    color: '#333333',
    marginTop: 4,
  },
  eleccionCliente: {
    fontSize: 13,
    color: '#1565C0',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 8,
    marginVertical: 10,
  },
  botonMedio: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 6,
  },
  botonMedioElegido: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  textoMedio: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  textoMedioElegido: {
    color: '#FFFFFF',
  },
  botonCerrar: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  textoCerrar: {
    color: '#666666',
    fontWeight: '700',
  },
});
