import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';
import { validarHorario, formatearFechaHora } from '../utils/horarios';
import { formatearFecha, dateDesdeFechaHora, isoDesdeDate, horaDesdeDate } from '../utils/fechas';

// Mismos límites que citas_cambios.php.
const MENSAJE_MIN = 5;
const MENSAJE_MAX = 255;

// Botones "Reprogramar" y "Cancelar" para el estilista (sus citas) y el recepcionista
// (cualquier cita activa). Piden un mensaje para el cliente, que lo ve en "Mis Citas".
// cita: { idCitas, fecha: 'AAAA-MM-DD', hora: 'HH:MM' } (en hora del salón).
// onCambio: se llama después de un cambio exitoso (para recargar la lista).
export default function AccionesCitaSalon({ cita, nombreCliente, onCambio }) {
  const [accion, setAccion] = useState(null); // 'cancelar' | 'reprogramar' | null
  const [nuevaFecha, setNuevaFecha] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const abrir = (tipo) => {
    setAccion(tipo);
    setNuevaFecha(null);
    setMensaje('');
  };

  const cerrar = () => {
    if (!enviando) {
      setAccion(null);
    }
  };

  const elegirNuevaFecha = () => {
    const inicial = nuevaFecha || dateDesdeFechaHora(cita.fecha, cita.hora);

    DateTimePickerAndroid.open({
      value: inicial,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (event, fecha) => {
        if (event.type !== 'set' || !fecha) {
          return;
        }
        if (fecha.getDay() === 0) {
          Alert.alert('Horario no disponible', 'El local permanece cerrado los domingos.');
          return;
        }
        DateTimePickerAndroid.open({
          value: inicial,
          mode: 'time',
          is24Hour: true,
          onChange: (event2, hora) => {
            if (event2.type !== 'set' || !hora) {
              return;
            }
            const elegida = new Date(fecha);
            elegida.setHours(hora.getHours(), hora.getMinutes(), 0, 0);
            const validacion = validarHorario(elegida);
            if (!validacion.valido) {
              Alert.alert('Horario no disponible', validacion.mensaje);
              return;
            }
            setNuevaFecha(elegida);
          },
        });
      },
    });
  };

  const confirmar = async () => {
    const texto = mensaje.trim();
    if (accion === 'reprogramar' && !nuevaFecha) {
      Alert.alert('Atención', 'Elegí la nueva fecha y hora.');
      return;
    }
    if (texto.length < MENSAJE_MIN) {
      Alert.alert('Atención', 'Escribile al cliente un mensaje explicando el motivo.');
      return;
    }

    setEnviando(true);
    try {
      const session = await AsyncStorage.getItem('user_session');
      const idSolicitante = session ? JSON.parse(session).idUsuarios : null;
      if (!idSolicitante) {
        Alert.alert('Atención', 'No se encontró tu sesión. Volvé a iniciar sesión.');
        return;
      }

      const action = accion === 'cancelar' ? 'cancelar_cita_salon' : 'reprogramar_cita_salon';
      const datos = { idSolicitante, idCitas: cita.idCitas, mensaje: texto };
      if (accion === 'reprogramar') {
        datos.fechaHora = formatearFechaHora(nuevaFecha);
      }
      const response = await api.post(`/index.php?action=${action}`, datos);

      if (!esRespuestaValida(response.data)) {
        console.log(`${action} devolvió una respuesta inválida:`, response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        setAccion(null);
        Alert.alert('Listo', response.data.message);
        if (onCambio) {
          onCambio();
        }
      } else {
        Alert.alert('Atención', response.data.message);
      }
    } catch (err) {
      console.log('Error al modificar la cita:', err);
      Alert.alert('Error', mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const esCancelar = accion === 'cancelar';
  const fechaActual = `${formatearFecha(cita.fecha)} a las ${cita.hora}`;

  return (
    <>
      <View style={styles.fila}>
        <Pressable style={[styles.boton, styles.botonReprogramar]} onPress={() => abrir('reprogramar')}>
          <Text style={styles.textoReprogramar}>📅 Reprogramar</Text>
        </Pressable>
        <Pressable style={[styles.boton, styles.botonCancelar]} onPress={() => abrir('cancelar')}>
          <Text style={styles.textoCancelar}>✖ Cancelar</Text>
        </Pressable>
      </View>

      <Modal animationType="slide" transparent={true} visible={accion !== null} onRequestClose={cerrar}>
        <View style={styles.overlay}>
          <View style={styles.contenido}>
            <Text style={styles.titulo}>{esCancelar ? 'Cancelar cita' : 'Reprogramar cita'}</Text>
            <Text style={styles.subtitulo}>
              {nombreCliente ? `${nombreCliente} · ` : ''}{fechaActual}
            </Text>

            {!esCancelar && (
              <>
                <Text style={styles.etiqueta}>Nueva fecha y hora</Text>
                <Pressable style={styles.selectorFecha} onPress={elegirNuevaFecha} disabled={enviando}>
                  <Text style={nuevaFecha ? styles.textoFecha : styles.textoPlaceholder}>
                    {nuevaFecha
                      ? `${formatearFecha(isoDesdeDate(nuevaFecha))} a las ${horaDesdeDate(nuevaFecha)}`
                      : 'Tocá para elegir'}
                  </Text>
                </Pressable>
              </>
            )}

            <Text style={styles.etiqueta}>Mensaje para el cliente</Text>
            <TextInput
              style={styles.inputMensaje}
              value={mensaje}
              onChangeText={setMensaje}
              placeholder={esCancelar
                ? 'Ej.: El estilista tuvo un imprevisto. Disculpá las molestias.'
                : 'Ej.: Tuvimos que mover tu turno por un problema en el salón.'}
              placeholderTextColor="#999999"
              multiline
              maxLength={MENSAJE_MAX}
              editable={!enviando}
            />
            <Text style={styles.contador}>{mensaje.length}/{MENSAJE_MAX} · El cliente lo verá en "Mis Citas".</Text>

            <View style={styles.filaBotonesModal}>
              <Pressable style={[styles.botonModal, styles.botonVolver]} onPress={cerrar} disabled={enviando}>
                <Text style={styles.textoVolver}>Volver</Text>
              </Pressable>
              <Pressable
                style={[styles.botonModal, esCancelar ? styles.botonConfirmarCancelar : styles.botonConfirmar, enviando && styles.deshabilitado]}
                onPress={confirmar}
                disabled={enviando}
              >
                {enviando
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.textoConfirmar}>{esCancelar ? 'Cancelar cita' : 'Reprogramar'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    marginTop: 10,
    width: '100%',
  },
  boton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  botonReprogramar: {
    borderWidth: 1,
    borderColor: '#000000',
  },
  botonCancelar: {
    borderWidth: 1,
    borderColor: '#C62828',
  },
  textoReprogramar: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  textoCancelar: {
    color: '#C62828',
    fontWeight: 'bold',
    fontSize: 13,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenido: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    marginTop: 12,
    marginBottom: 6,
  },
  selectorFecha: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
  },
  textoFecha: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  textoPlaceholder: {
    fontSize: 14,
    color: '#999999',
  },
  inputMensaje: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: '#000000',
    textAlignVertical: 'top',
  },
  contador: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
  },
  filaBotonesModal: {
    flexDirection: 'row',
    marginTop: 18,
  },
  botonModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  botonVolver: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textoVolver: {
    color: '#333333',
    fontWeight: 'bold',
  },
  botonConfirmar: {
    backgroundColor: '#000000',
  },
  botonConfirmarCancelar: {
    backgroundColor: '#C62828',
  },
  textoConfirmar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  deshabilitado: {
    opacity: 0.6,
  },
});
