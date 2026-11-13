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
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../direcIP/ip';
import Header from '../components/header';
import { mensajeDeError, esRespuestaValida } from '../utils/manejoErrores';

// Roles que el recepcionista puede asignar (roles.idRol).
const ROLES_ASIGNABLES = [
  { idRol: 1, etiqueta: 'Cliente' },
  { idRol: 2, etiqueta: 'Estilista' },
  { idRol: 3, etiqueta: 'Recepcionista' },
];
const ROL_GERENTE = 4;

const FILTROS = [{ idRol: null, etiqueta: 'Todos' }, ...ROLES_ASIGNABLES];

const etiquetaRol = (idRol) =>
  ROLES_ASIGNABLES.find((r) => r.idRol === idRol)?.etiqueta || (idRol === ROL_GERENTE ? 'Gerente' : '—');

// Sin tildes y en minúsculas, para que buscar "maria" encuentre "María".
// Si el motor JS no trae normalize() se busca igual, solo que distingue tildes.
const normalizar = (texto) => {
  const minusculas = (texto || '').toLowerCase();
  return typeof minusculas.normalize === 'function'
    ? minusculas.normalize('NFD').replace(/[̀-ͯ]/g, '')
    : minusculas;
};

const obtenerIdPropio = async () => {
  const session = await AsyncStorage.getItem('user_session');
  return session ? JSON.parse(session).idUsuarios : null;
};

export default function GestionUsuarios({ navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [idPropio, setIdPropio] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [error, setError] = useState(null);

  const cargarUsuarios = async () => {
    try {
      setError(null);
      const id = await obtenerIdPropio();
      setIdPropio(id);
      if (!id) {
        setError('No se encontró tu sesión. Volvé a iniciar sesión.');
        return;
      }

      const response = await axios.get(`${BASE_URL}/index.php?action=get_usuarios&idSolicitante=${id}`);

      if (!esRespuestaValida(response.data)) {
        console.log('get_usuarios devolvió una respuesta inválida:', response.data);
        setError('Respuesta inválida del servidor');
      } else if (response.data.success) {
        setUsuarios(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.log('Error en get_usuarios:', err);
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarUsuarios();
    }, [])
  );

  const refrescar = () => {
    setRefrescando(true);
    cargarUsuarios();
  };

  const cambiarRol = async (usuario, idRol) => {
    setActualizandoId(usuario.idUsuarios);
    try {
      const response = await axios.post(`${BASE_URL}/index.php?action=update_rol_usuario`, {
        idSolicitante: idPropio,
        idUsuario: usuario.idUsuarios,
        idRol,
      });

      if (!esRespuestaValida(response.data)) {
        console.log('update_rol_usuario devolvió una respuesta inválida:', response.data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else if (response.data.success) {
        setUsuarios((lista) => lista.map((u) => (
          u.idUsuarios === usuario.idUsuarios
            ? { ...u, idRol: response.data.idRol, nombreRol: response.data.nombreRol }
            : u
        )));
        Alert.alert('Listo', response.data.message);
      } else {
        Alert.alert('Atención', response.data.message);
      }
    } catch (err) {
      console.log('Error en update_rol_usuario:', err);
      Alert.alert('Error', mensajeDeError(err));
    } finally {
      setActualizandoId(null);
    }
  };

  const confirmarCambio = (usuario, idRol) => {
    if (usuario.idRol === idRol) {
      return;
    }
    Alert.alert(
      'Cambiar rol',
      `¿Cambiar a ${usuario.nombres} ${usuario.apellido} de ${etiquetaRol(usuario.idRol)} a ${etiquetaRol(idRol)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cambiar', onPress: () => cambiarRol(usuario, idRol) },
      ]
    );
  };

  const textoBusqueda = normalizar(busqueda.trim());
  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroRol !== null && u.idRol !== filtroRol) {
      return false;
    }
    if (!textoBusqueda) {
      return true;
    }
    return normalizar(`${u.nombres} ${u.apellido} ${u.correo}`).includes(textoBusqueda);
  });

  const contarRol = (idRol) => (idRol === null ? usuarios.length : usuarios.filter((u) => u.idRol === idRol).length);

  const renderUsuario = (usuario) => {
    const esPropio = usuario.idUsuarios === idPropio;
    const esGerente = usuario.idRol === ROL_GERENTE;
    const actualizando = actualizandoId === usuario.idUsuarios;
    const bloqueado = esPropio || esGerente || actualizandoId !== null;

    return (
      <View key={usuario.idUsuarios} style={styles.tarjetaUsuario}>
        <View style={styles.filaNombre}>
          <View style={styles.infoUsuario}>
            <Text style={styles.nombreUsuario}>
              {usuario.nombres} {usuario.apellido}{esPropio ? ' (vos)' : ''}
            </Text>
            <Text style={styles.correoUsuario}>{usuario.correo}</Text>
          </View>
          {actualizando && <ActivityIndicator color="#000000" />}
        </View>

        {esGerente ? (
          <Text style={styles.textoNota}>Gerente: su rol no se modifica desde acá.</Text>
        ) : (
          <View style={styles.selectorRol}>
            {ROLES_ASIGNABLES.map(({ idRol, etiqueta }) => {
              const activo = usuario.idRol === idRol;
              return (
                <Pressable
                  key={idRol}
                  style={[styles.opcionRol, activo && styles.opcionRolActiva, bloqueado && !activo && styles.opcionRolBloqueada]}
                  disabled={bloqueado || activo}
                  onPress={() => confirmarCambio(usuario, idRol)}
                >
                  <Text style={[styles.textoOpcionRol, activo && styles.textoOpcionRolActiva]}>{etiqueta}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {esPropio && <Text style={styles.textoNota}>No podés cambiar tu propio rol.</Text>}
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
    if (usuariosFiltrados.length === 0) {
      return (
        <View style={styles.tarjetaMensaje}>
          <Text style={styles.textoVacio}>No hay usuarios que coincidan.</Text>
        </View>
      );
    }
    return usuariosFiltrados.map(renderUsuario);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
      >
        <View style={styles.encabezado}>
          <Text style={styles.tituloPrincipal}>Usuarios</Text>
          <Text style={styles.subtitulo}>Tocá un rol para asignárselo al usuario.</Text>
        </View>

        <TextInput
          style={styles.buscador}
          placeholder="Buscar por nombre o correo"
          placeholderTextColor="#888888"
          autoCapitalize="none"
          value={busqueda}
          onChangeText={setBusqueda}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaFiltros}>
          {FILTROS.map(({ idRol, etiqueta }) => {
            const activo = filtroRol === idRol;
            return (
              <Pressable
                key={etiqueta}
                style={[styles.chipFiltro, activo && styles.chipFiltroActivo]}
                onPress={() => setFiltroRol(idRol)}
              >
                <Text style={[styles.textoChip, activo && styles.textoChipActivo]}>
                  {etiqueta} ({contarRol(idRol)})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {renderContenido()}
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
    paddingTop: 15,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  encabezado: {
    marginBottom: 12,
  },
  tituloPrincipal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  buscador: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  filaFiltros: {
    marginBottom: 16,
    flexGrow: 0,
  },
  chipFiltro: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    marginRight: 8,
  },
  chipFiltroActivo: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  textoChip: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '600',
  },
  textoChipActivo: {
    color: '#FFFFFF',
  },
  tarjetaUsuario: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 2,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoUsuario: {
    flex: 1,
  },
  nombreUsuario: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  correoUsuario: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  selectorRol: {
    flexDirection: 'row',
  },
  opcionRol: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
  },
  opcionRolActiva: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  opcionRolBloqueada: {
    opacity: 0.4,
  },
  textoOpcionRol: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
  },
  textoOpcionRolActiva: {
    color: '#FFFFFF',
  },
  textoNota: {
    fontSize: 12,
    color: '#888888',
    marginTop: 8,
  },
  cargando: {
    marginTop: 40,
  },
  tarjetaMensaje: {
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
