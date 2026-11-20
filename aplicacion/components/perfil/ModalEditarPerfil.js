import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { spacing } from '../../theme';
import { Input } from '../ui';
import HojaModal from './HojaModal';
import EtiquetaSeccion from './EtiquetaSeccion';
import AvisoError from './AvisoError';
import { formatearFechaInput, validarDatosPerfil } from '../../utils/perfil';

// Formulario de datos personales en una hoja inferior.
//   seccion: 'datos' → nombre, apellido, correo y nacimiento
//            'notas' → alergias y preferencias (solo clientes)
// Trabaja sobre una copia: si se cancela, el perfil no cambia.
// onGuardar(datos) devuelve una promesa con { ok, message }.
export default function ModalEditarPerfil({ visible, seccion = 'datos', datos, onCerrar, onGuardar }) {
  const [borrador, setBorrador] = useState(datos);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const refApellido = useRef(null);
  const refCorreo = useRef(null);
  const refFecha = useRef(null);

  useEffect(() => {
    if (visible) {
      setBorrador(datos);
      setErrores({});
      setErrorServidor(null);
    }
  }, [visible, datos]);

  const cambiar = (campo) => (valor) => {
    setBorrador((actual) => ({ ...actual, [campo]: valor }));
    if (errores[campo]) {
      setErrores((actual) => ({ ...actual, [campo]: undefined }));
    }
  };

  const guardar = async () => {
    const nuevosErrores = seccion === 'datos' ? validarDatosPerfil(borrador) : {};
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }
    setGuardando(true);
    setErrorServidor(null);
    const resultado = await onGuardar(borrador);
    setGuardando(false);
    if (!resultado.ok) {
      setErrorServidor(resultado.message);
    }
  };

  const esNotas = seccion === 'notas';

  return (
    <HojaModal
      visible={visible}
      titulo={esNotas ? 'Notas para tu estilista' : 'Datos personales'}
      subtitulo={
        esNotas
          ? 'Las ve el equipo antes de atenderte.'
          : 'Así te identificamos en tus citas y pedidos.'
      }
      onCerrar={onCerrar}
      onAccion={guardar}
      cargando={guardando}
      textoAccion="Guardar"
    >
      <AvisoError mensaje={errorServidor} />
      {esNotas ? (
        <>
          <Input
            label="Alergias"
            icono="medkit-outline"
            value={borrador.notaAlergias}
            onChangeText={cambiar('notaAlergias')}
            placeholder="Por ejemplo: amoníaco, látex"
            multiline
            maxLength={255}
            ayuda="Si no tenés, dejalo vacío."
          />
          <Input
            label="Preferencias"
            icono="heart-outline"
            value={borrador.notaPreferencias}
            onChangeText={cambiar('notaPreferencias')}
            placeholder="Por ejemplo: productos veganos, poco calor"
            multiline
            maxLength={255}
          />
        </>
      ) : (
        <>
          <EtiquetaSeccion style={styles.subseccion}>Identidad</EtiquetaSeccion>
          <Input
            label="Nombres"
            value={borrador.nombres}
            onChangeText={cambiar('nombres')}
            error={errores.nombres}
            maxLength={45}
            autoComplete="given-name"
            returnKeyType="next"
            onSubmitEditing={() => refApellido.current?.focus()}
          />
          <Input
            ref={refApellido}
            label="Apellido"
            value={borrador.apellido}
            onChangeText={cambiar('apellido')}
            error={errores.apellido}
            maxLength={45}
            autoComplete="family-name"
            returnKeyType="next"
            onSubmitEditing={() => refCorreo.current?.focus()}
          />
          <EtiquetaSeccion style={styles.subseccion}>Contacto</EtiquetaSeccion>
          <Input
            ref={refCorreo}
            label="Correo electrónico"
            icono="mail-outline"
            value={borrador.correo}
            onChangeText={cambiar('correo')}
            error={errores.correo}
            maxLength={45}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => refFecha.current?.focus()}
          />
          <Input
            ref={refFecha}
            label="Fecha de nacimiento"
            icono="gift-outline"
            value={borrador.fechaNacimiento}
            onChangeText={(texto) => cambiar('fechaNacimiento')(formatearFechaInput(texto))}
            error={errores.fechaNacimiento}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="AAAA-MM-DD"
            ayuda="Opcional."
          />
        </>
      )}
    </HojaModal>
  );
}

const styles = StyleSheet.create({
  subseccion: {
    marginTop: spacing.xs,
  },
});
