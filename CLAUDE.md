# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sistema de gestión para un salón de belleza (código, comentarios y UI en español). El repo tiene tres partes:

- `aplicacion/`: la app móvil (Expo SDK 51, React Native 0.74, JS). Acá se hace la mayor parte del trabajo.
- `api_proyecto/`: API JSON en PHP + MySQL que usa la app. XAMPP la sirve desde `C:\xampp\htdocs\salonBelleza`.
- `proyecto/`: versión web vieja en PHP/HTML. Usa otra base (`salondebelleza`) y la app no la usa.

## Base de datos

La base vigente es **`mydb`**, con el esquema en `mydb.sql` (en la raíz del repo). `api_proyecto/db.php` se conecta con mysqli a `localhost`, usuario `root`, sin contraseña, base `mydb`, y deja la conexión en la variable global `$conn`.

Los cambios de esquema van como scripts numerados en `api_proyecto/migraciones/` (por ejemplo `001_duracion_servicios.sql`), que se aplican a mano sobre `mydb`. `mydb.sql` no los incluye: está desactualizado (ver `PENDIENTES.md`).

Tablas y columnas principales (nombres exactos de `mydb.sql`):

- `usuarios`: `idUsuarios`, `nombres`, `apellido`, `nombreUsuario`, `fechaNacimiento`, `correo`, `contrasena`, `fechaCreacion`, `estado` (→ `estado.idEstado`), `idRol` (→ `roles.idRol`, por defecto 1).
- `roles`: `idRol`, `nombreRol`.
- Subtipos de usuario. Su PK es también FK a `usuarios.idUsuarios`, así que el id del subtipo es el mismo número que `idUsuarios`:
  - `clientes`: `idClientes`, `notaAlergias`, `notaPreferencias`.
  - `estilistas`: `idEstilistas`, `porcentajeComision`, `horaEntrada`, `horaSalida`.
  - `recepcionista`: `idUsuarios`, `salario`, `fechaContratacion`.
  - `gerente` (y la fila `idRol = 4` de `roles`) existen en `mydb` pero **no se usan**: la app no tiene rol gerente.
- `citas`: `idCitas`, `fechaHora`, `estado_cita_idEstado` (→ `estado_cita`), `clientes` (→ `clientes.idClientes`), `estilistas` (→ `estilistas.idEstilistas`), `horaInicio`, `horaFin`.
- `citas_servicios`: `citas_idCitas`, `servicios_idServicios` (→ `services`), `cantidad`, `precioHistorico`.
- `services` (la tabla se llama `services`, no `servicios`): `idServicios`, `servicio`, `precio`, `duracionMinutos` (migración 001), `estado` (→ `estado.idEstado`).
- `estilistas_servicios`: `idUsuarios` (→ `estilistas.idEstilistas`), `idServicios` (→ `services`).
- `estado_cita`: `idEstado`, `estado_cita`. Valores: 1 Activa, 2 Cancelada, 3 Finalizada, 4 En Curso.
- `citas_cambios` (migración 002): historial de cancelaciones y reprogramaciones. Columnas: `citas_idCitas`, `tipo` (`cancelacion`/`reprogramacion`), `fechaHoraAnterior`, `fechaHoraNueva`, `mensaje` (obligatorio si el cambio lo hace el salón, NULL si lo hace el cliente), `usuarios_idUsuarios` (autor), `fechaRegistro`.
- `estado`: `idEstado`, `estado`. Valores: 1 Activo, 2 Inactivo (para `usuarios` y `services`).
- Pagos: `pagos` (`idPagos`, `fechaHora`, `montoTotal`, `clientes_idUsuarios`, `citas_idCitas`, `medios_pago_idMedios_pago`), `pagos_servicios`, `pagos_productos`, `medios_pago`, `comisiones_pagadas`.
- Además: `productos`, `proveedores`, `proveedores_productos`, `movimiento_interno`, `especialidades`, `estilistas_especialidades`, `telefonos`, `telefonos_usuarios`, `telefonos_proveedores`, `codigoarea`.

## Comandos (desde `aplicacion/`)

```bash
npm start              # expo start (Metro)
npm run android        # expo start --android
npm run web            # expo start --web
npm run lint           # eslint . (@react-native/eslint-config, Prettier 2.8.8)
npm test               # jest (todos los tests)
npx jest __tests__/App.test.tsx        # un archivo
npx jest -t "renders correctly"        # un test por nombre
```

Jest usa el preset `react-native` y `jest.setup.js` (mocks de gesture-handler, AsyncStorage y reanimated). Si agregás un paquete sin transpilar (`@react-navigation`, `expo-*`, `react-native-*`, ...), sumalo a `transformIgnorePatterns` en `jest.config.js`; si no, los tests fallan con errores de sintaxis ESM/JSX. `react-test-renderer` tiene que tener la misma versión que `react` (18.2.0).

## Reglas

- **SQL**: siempre prepared statements con `bind_param`. Nunca interpolar variables en la consulta.
- **Fechas** que consume la app:
  - devolverlas como `UNIX_TIMESTAMP(...)` para cálculos (duraciones, cronómetro, ordenar);
  - **para mostrarlas**, devolver además `fecha` (`DATE(...)`) y `hora` (`TIME_FORMAT(..., '%H:%i')`) formateadas por MySQL, y usar esos textos en la app. Convertir el timestamp con `new Date()` usa la zona horaria del dispositivo: un emulador en GMT muestra 3 horas de más.
- **IPs**: no hardcodearlas. La URL base de la API se toma siempre de `aplicacion/direcIP/ip.js` (`BASE_URL`).
- **HTTP**: usar `axios` en código nuevo (no `fetch`).
- **Flujo de una feature**: BD → endpoint en `api_proyecto/services/` → registrarlo en `router.php` → pantalla/componente en la app.
- **Dependencias de la app**: `npx expo install <paquete>` desde `aplicacion/`, nunca en la raíz del repo.
- **`aplicacion/utils/generarFacturaPdf.js` está en desarrollo**: no commitearlo hasta que el usuario lo indique.

## Arquitectura de la app

- Entrada: `index.js` → `registerRootComponent(prueba.js)` → `navigation.js`. `prueba.js` es el componente raíz (el test lo importa; no existe `App.js`).
- `navigation.js`: stack nativo (`Cargando` → `Bienvenida` / `InicioSesion` / `MainDrawer`). `Cargando` revisa la clave `user_session` de AsyncStorage para saltear el login. `MainDrawer` arma las pantallas según el `idRol` de la sesión. Cerrar sesión borra `user_session` y vuelve a `Bienvenida`.
- **Roles** (`roles.idRol`): 1 = cliente, 2 = estilista, 3 = recepcionista. **No hay rol gerente**: las tareas administrativas (servicios, estilistas, comisiones, stock, proveedores, reportes) son del recepcionista. Cada rol tiene su tabla de subtipo (`clientes`, `estilistas`, `recepcionista`); al cambiar el rol de un usuario hay que crear la fila del subtipo nuevo (lo hace `update_rol_usuario.php`). Pantallas del drawer por rol:
  - 1: HomeCliente, CrearCita, MisCitas, Productos, Carrito (como "Mi Carrito"), GestionPerfil.
  - 2: HomeEstilista, AgendaSemanal, FichaCliente, GestionPerfilEstilista.
  - 3: HomeRecepcionista, AgendaRecepcion, CrearCita (como "Agendar Cita"), GestionUsuarios, GestionPerfilRecepcionista.

  `CrearCita` la usan el cliente y el recepcionista: si el `idRol` de la sesión es 3, primero se elige el cliente (de `get_clientes_lista`) y la cita se crea para ese cliente.

  Los roles comparten nombres de pantalla como `"Inicio"`, `"Agenda Semanal"` y `"Mi Perfil"`. El stack, fuera del drawer, tiene además `Registro` (alta de usuarios, siempre como cliente).
- Sesión: `InicioSesion.js` guarda en `user_session` el `data` que devuelve el login (`idUsuarios`, `idEstilistas`, `nombres`, `apellido`, `idRol`) como JSON. Las pantallas leen de ahí el id del usuario.
- Carrito del cliente: `context/CarritoContext.js` (`CarritoProvider` envuelve al drawer en `navigation.js`; `useCarrito()` desde cualquier pantalla). Se guarda en AsyncStorage con la clave `carrito_<idUsuarios>` y cada item tiene una copia del producto que `sincronizar()` actualiza con `get_productos`. Solo está habilitado para el rol 1: `Header` muestra el ícono 🛒 con la cantidad. Precio y stock reales los valida siempre el backend. Tests en `__tests__/CarritoContext.test.js`.
- `components/` tiene la UI reutilizable: tarjetas, ítems de lista, `TimerServicio`, `cita.js` para las citas del recepcionista y del cliente, y `AccionesCitaSalon`. Este último muestra los botones Reprogramar/Cancelar con un modal que pide un mensaje para el cliente; lo usan las pantallas del estilista y del recepcionista en las citas activas.
- `utils/`:
  - `manejoErrores.js` (`mensajeDeError`, `esRespuestaValida`): usarlo en cada llamada nueva con axios;
  - `fechas.js`: formato y aritmética de fechas `AAAA-MM-DD`;
  - `horarios.js`: horario del local (`validarHorario`) y `formatearFechaHora` para enviar al servidor;
  - `texto.js`: `normalizarTexto`, para búsquedas sin tildes ni mayúsculas;
  - `generarFacturaPdf.js`: arma una factura en HTML y la imprime o comparte con `expo-print`/`expo-sharing`.

## Arquitectura de la API (`api_proyecto/`)

- `index.php` agrega los headers de CORS y JSON e incluye `router.php`, que deriva a `services/*.php` según el método HTTP y `?action=`:
  - GET: `get_citas`, `get_cliente`/`get_clientes`, `get_servicios`, `get_estilistas`, `get_citas_dia`, `get_citas_semana`, `get_usuarios`, `get_perfil_recepcionista`, `get_citas_cliente`, `get_clientes_lista`, `get_productos` (si no coincide, `get.php`)
  - POST: `login`, `crear_cita`, `iniciar_servicio`, `finalizar_servicio`, `update_servicios_cita`, `registrar_usuario`, `update_rol_usuario`, `update_perfil_recepcionista`, `update_contrasena`, `cancelar_cita`, `reprogramar_cita`, `cancelar_cita_salon`, `reprogramar_cita_salon` (si no coincide, `post.php`)
- Los services leen el body con `json_decode(file_get_contents('php://input'), true)`, usan el `$conn` global de `db.php` con `require_once __DIR__ . '/../db.php'` y responden `{ success, message, data }`.
- Patrón de los endpoints nuevos (por ejemplo `finalizar_servicio.php` o `get_citas_semana.php`):
  - `display_errors = 0`;
  - `require_once` de `db.php` dentro de un `try/catch (mysqli_sql_exception)` que responde HTTP 500 con JSON.
- Archivos compartidos que no son endpoints (no se registran en el router):
  - `consulta_citas.php`: `obtenerCitasEntre`, `validarFecha`, `fechaHoy`;
  - `permisos.php`: `esRecepcionista`, `responderSinPermiso`. El id del solicitante lo manda la app, así que no es una autorización real (ver `PENDIENTES.md`);
  - `horarios.php`:
    - `validarHorarioLocal` (horario del local). La regla está duplicada en `aplicacion/utils/horarios.js`: si cambia, cambiala en los dos;
    - `ANTICIPACION_CAMBIO_MINUTOS` (2 h para cancelar o reprogramar) y `motivoNoModificable`;
    - `citas_cambios.php`, que se apoya en `horarios.php`: cancelar y reprogramar para cliente y salón.
      - `obtenerCitaModificablePorCliente` (cita propia, activa, con 2 h de anticipación);
      - `obtenerCitaParaPersonal` (el recepcionista puede cualquier cita, el estilista solo las suyas; sin anticipación mínima);
      - `moverCita`, `cancelarCitaPorId`, `registrarCambioCita` y `leerJsonBody`.

      Todo cambio de una cita se registra en `citas_cambios`.
    - superposición de citas del mismo estilista: la duración de una cita es `SUM(cantidad * duracionMinutos)` (60 min si no tiene servicios), y solo bloquean las citas activas o en curso. Se usa dentro de una transacción: primero `bloquearAgendaEstilista` (un `FOR UPDATE` sobre `estilistas`) y después `buscarSuperposicion`. Lo usan `crear_cita` y `reprogramar_cita`.
- "Hoy" se toma de MySQL (`CURDATE()`), no de `date()` de PHP: el PHP de XAMPP está en `Europe/Berlin`.

## Deuda técnica conocida

El relevamiento completo de lo que falta (funcionalidades por rol, seguridad, tablas sin usar y prioridades) está en `PENDIENTES.md`.

- **Tres formas de llamar a la API** desde la app: `index.php?action=...`, `router.php?action=...` (sin los headers de CORS de `index.php`) y `services/<archivo>.php` directo. Lo correcto es `index.php?action=...`.
- **Endpoints sin registrar en `router.php`**, que la app llama directo: `get_citasDiarias`, `get_citasSemanal`, `get_estilista`, `update_cliente`, `update_estilista`.
- **`idEstilistas` en `login.php`**: lo devuelve copiando `idUsuarios` para todos los usuarios, sin mirar el rol. El valor coincide para los estilistas (`estilistas.idEstilistas` es FK a `usuarios.idUsuarios`), pero los clientes también reciben un `idEstilistas` aunque no sean estilistas.
- **`get.php` y `post.php`** usan `include 'db.php'` relativo, así que solo funcionan a través del router. Los demás usan `require_once __DIR__ . '/../db.php'`.
- **`package.json` y `node_modules` en la raíz** no corresponden: las dependencias de la app van en `aplicacion/package.json`.
- **Contraseñas en texto plano**: `login.php` compara `contrasena` directo en SQL (no usa `password_hash`/`password_verify`).
- **Inyección SQL en `post.php`**: el `INSERT INTO usuarios` interpola los datos del body en la consulta.
