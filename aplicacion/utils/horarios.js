// Horario del local para agendar citas. La misma regla se valida en el servidor
// (api_proyecto/services/horarios.php): si cambia, cambiala en los dos lados.
// Lunes a viernes 08:00-12:00 y 13:30-20:00; sábados 09:00-17:00; domingos cerrado.
export const validarHorario = (fecha) => {
  const dia = fecha.getDay();
  const totalMinutos = fecha.getHours() * 60 + fecha.getMinutes();

  if (dia === 0) {
    return { valido: false, mensaje: 'El local permanece cerrado los domingos.' };
  }

  if (dia >= 1 && dia <= 5) {
    const enTurno1 = totalMinutos >= 8 * 60 && totalMinutos <= 12 * 60;
    const enTurno2 = totalMinutos >= 13 * 60 + 30 && totalMinutos <= 20 * 60;

    if (!enTurno1 && !enTurno2) {
      return {
        valido: false,
        mensaje: 'De lunes a viernes solo puedes agendar de 08:00 a 12:00 y de 13:30 a 20:00.',
      };
    }
  } else if (dia === 6) {
    if (totalMinutos < 9 * 60 || totalMinutos > 17 * 60) {
      return {
        valido: false,
        mensaje: 'Los sábados solo puedes agendar de 09:00 a 17:00.',
      };
    }
  }

  return { valido: true };
};

// Date → 'AAAA-MM-DD HH:MM:00', el formato que esperan crear_cita y reprogramar_cita.
export const formatearFechaHora = (fecha) => {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:00`;
};
