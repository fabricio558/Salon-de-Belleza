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

- `usuarios`: `idUsuarios`, `nombres`, `apellido`, `nombreUsuario`, `fechaNacimiento`, `correo`, `contrasena` (hash de `password_hash`; las viejas en texto plano se rehashean al iniciar sesión), `fechaCreacion`, `estado` (→ `estado.idEstado`), `idRol` (→ `roles.idRol`, por defecto 1).
- `sesiones` (migración 005): `idSesion`, `usuarios_idUsuarios`, `tokenHash` (SHA-256 del token), `creadaEl`, `expiraEl` (30 días), `revocadaEl` (al cerrar sesión).
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
- `pedidos` y `pedidos_productos` (migración 004): pedidos de productos que el cliente confirma en la app y **retira en el salón**. Los paga en la app con Mercado Pago (migración 007) o en el local. `estado`: `pendiente` → `entregado` o `cancelado` (`canceladoPor`: `cliente`, `salon` o `vencimiento`). `venceEl` = confirmación + 7 días. `precioUnitario` es el precio al confirmar. `pagos_idPagos` se completa al pagar con MP o al cobrarlo en el salón. Un pedido pagado (o con un pago de MP en proceso) no vence y el cliente no lo puede cancelar. `medios_pago` tiene Efectivo, Transferencia, QR / billetera virtual y Mercado Pago.
- `medioPagoLocal` en `citas` y `pedidos` (migración 007, FK a `medios_pago`): el cliente eligió pagar en el local con Efectivo o Transferencia (`MEDIOS_PAGO_LOCAL`); `NULL` = no eligió. Es solo un aviso para el salón: no registra ningún cobro.
- `estado`: `idEstado`, `estado`. Valores: 1 Activo, 2 Inactivo (para `usuarios` y `services`).
- Pagos: `pagos` (`idPagos`, `fechaHora`, `montoTotal`, `clientes_idUsuarios`, `citas_idCitas`, `medios_pago_idMedios_pago`), `pagos_servicios`, `pagos_productos`, `medios_pago` (+ "Mercado Pago", migración 006), `comisiones_pagadas`.
  - Una cita está **pagada** si `SUM(pagos.montoTotal)` de la cita cubre su total (`SUM(citas_servicios.cantidad * precioHistorico)`); el saldo es la diferencia. Pagar no cambia `estado_cita`.
  - `pagos_mp` (migración 006): cada intento de cobro con Mercado Pago (una preferencia de Checkout Pro), de una cita (`citas_idCitas`) o de un pedido (`pedidos_idPedido`, migración 007): exactamente uno de los dos. `externalReference` = `cita-<idCitas>-<idPagoMp>` o `pedido-<idPedido>-<idPagoMp>`, `mpPaymentId`, `estado` (`creada` o el `status` de MP), `monto` (lo calcula el servidor), `origen` (`cliente`/`recepcion`), `venceEl` (24 h), `pagos_idPagos` (el cobro registrado al aprobarse).
  - `mp_notificaciones` (migración 006): log de cada webhook recibido (firma, si se procesó, error).
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

Jest usa el preset `react-native` y `jest.setup.js` (mocks de gesture-handler, AsyncStorage, reanimated, `expo-web-browser` y `expo-linking`; un módulo de Expo con código nativo nuevo necesita su mock ahí). Si agregás un paquete sin transpilar (`@react-navigation`, `expo-*`, `react-native-*`, ...), sumalo a `transformIgnorePatterns` en `jest.config.js`; si no, los tests fallan con errores de sintaxis ESM/JSX. `react-test-renderer` tiene que tener la misma versión que `react` (18.2.0).

## Reglas

- **SQL**: siempre prepared statements con `bind_param`. Nunca interpolar variables en la consulta.
- **Fechas** que consume la app:
  - devolverlas como `UNIX_TIMESTAMP(...)` para cálculos (duraciones, cronómetro, ordenar);
  - **para mostrarlas**, devolver además `fecha` (`DATE(...)`) y `hora` (`TIME_FORMAT(..., '%H:%i')`) formateadas por MySQL, y usar esos textos en la app. Convertir el timestamp con `new Date()` usa la zona horaria del dispositivo: un emulador en GMT muestra 3 horas de más.
- **IPs**: no hardcodearlas. La URL base de la API está solo en `aplicacion/direcIP/ip.js`: `ENTORNO` elige entre `'local'` (`IP_LOCAL`) y `'ngrok'` (`NGROK_URL`).
- **HTTP**: usar la instancia `api` de `aplicacion/utils/api.js` (axios con `baseURL`, token de sesión y header de ngrok): `api.get(accion('get_servicios'))`. Nunca `fetch`, ni `axios` con `BASE_URL` a mano, ni `router.php`/`services/*.php` directo.
- **Sesión**: los endpoints nuevos identifican al usuario con `requerirSesion($conn, [roles])` de `auth.php` (token en el header `X-Session-Token`), no con un id que mande la app en el body.
- **Pagos**: los montos se calculan siempre en el servidor con datos de la base; nunca se aceptan precios ni totales que mande la app.
- **Flujo de una feature**: BD → endpoint en `api_proyecto/services/` → registrarlo en `router.php` → pantalla/componente en la app.
- **Dependencias de la app**: `npx expo install <paquete>` desde `aplicacion/`, nunca en la raíz del repo.
- **`aplicacion/utils/generarFacturaPdf.js` está en desarrollo**: no commitearlo hasta que el usuario lo indique.

## Arquitectura de la app

- Entrada: `index.js` → `registerRootComponent(prueba.js)` → `navigation.js`. `prueba.js` es el componente raíz (el test lo importa; no existe `App.js`).
- `navigation.js`: stack nativo (`Cargando` → `Bienvenida` / `InicioSesion` / `MainDrawer`). `Cargando` revisa la clave `user_session` de AsyncStorage para saltear el login (si la sesión guardada no tiene `token`, la borra). `MainDrawer` arma las pantallas según el `idRol` de la sesión. Cerrar sesión llama a `logout` (revoca el token), borra `user_session` y vuelve a `Bienvenida`. Si una respuesta trae 401 con `sesionInvalida`, `utils/api.js` borra la sesión y `navigation.js` vuelve a `Bienvenida`.
- **Roles** (`roles.idRol`): 1 = cliente, 2 = estilista, 3 = recepcionista. **No hay rol gerente**: las tareas administrativas (servicios, estilistas, comisiones, stock, proveedores, reportes) son del recepcionista. Cada rol tiene su tabla de subtipo (`clientes`, `estilistas`, `recepcionista`); al cambiar el rol de un usuario hay que crear la fila del subtipo nuevo (lo hace `update_rol_usuario.php`). Pantallas del drawer por rol:
  - 1: HomeCliente, CrearCita, MisCitas, Productos, Carrito (como "Mi Carrito"), MisPedidos, GestionPerfil.
  - 2: HomeEstilista, AgendaSemanal, FichaCliente, GestionPerfilEstilista.
  - 3: HomeRecepcionista, AgendaRecepcion, CrearCita (como "Agendar Cita"), PedidosRecepcion (como "Pedidos"), GestionUsuarios, GestionPerfilRecepcionista.

  `CrearCita` la usan el cliente y el recepcionista: si el `idRol` de la sesión es 3, primero se elige el cliente (de `get_clientes_lista`) y la cita se crea para ese cliente.

  Los roles comparten nombres de pantalla como `"Inicio"`, `"Agenda Semanal"` y `"Mi Perfil"`. El stack, fuera del drawer, tiene además `Registro` (alta de usuarios, siempre como cliente).
- Sesión: `InicioSesion.js` guarda en `user_session` el `data` que devuelve el login (`idUsuarios`, `idEstilistas` (solo estilistas, si no `null`), `nombres`, `apellido`, `idRol`, `token`) como JSON. Las pantallas leen de ahí el id del usuario; `utils/api.js` manda el `token` en cada pedido.
- Pago de citas y pedidos:
  - **cliente** (`MisCitas` y `MisPedidos` → `components/OpcionesPago.js`, en las citas no canceladas y los pedidos pendientes, con saldo) elige entre:
    - **pagar en la app** con Mercado Pago (Checkout Pro): `utils/pagos.js` `pagarCita`/`pagarPedido` crea la preferencia (`crear_preferencia_cita`/`crear_preferencia_pedido`), abre el checkout con `WebBrowser.openAuthSessionAsync` (MP no permite WebView) y al volver consulta `get_estado_pago_cita`/`get_estado_pago_pedido` (reintenta mientras llega el webhook);
    - **pagar en el local** con Efectivo o Transferencia (`elegir_pago_local`, guarda `medioPagoLocal`). Al elegirlo se abre `ModalResumenPagoLocal` y arriba de las dos pantallas queda `ResumenPagoLocal` (`components/ResumenPagoLocal.js`), con lo pendiente para pagar en el local agrupado por medio y cómo se abona (`get_pagos_pendientes`, `agruparPagoLocal`, `INSTRUCCIONES_PAGO_LOCAL`);
  - **recepcionista** (`HomeRecepcionista` → `components/CobroCita.js`): cobra el saldo en el mostrador (`registrar_cobro_cita`, con `get_medios_pago`) o genera un link de MP para compartir con el cliente. Ve el `medioPagoLocal` que eligió el cliente. En `PedidosRecepcion` ve los pedidos reservados (`get_pedidos_salon`, vistas `pendientes`/`historial`), su estado de pago y cómo los paga el cliente, y los entrega con `entregar_pedido` (si no están pagados, los cobra en el mismo paso con un medio del mostrador; no deja entregar con un pago de MP en proceso). Todavía no puede cancelar pedidos (`canceladoPor = 'salon'`);
  - las `back_urls` apuntan a `retorno_pago` (HTTPS en ngrok), que vuelve a la app con `Linking.createURL('pago')` (`exp://...` en Expo Go). La vuelta es best effort: **la verdad es el webhook / `get_estado_pago_*`**. `app.json` tiene `scheme: salonbelleza` para un futuro development build.
- Carrito del cliente: `context/CarritoContext.js` (`CarritoProvider` envuelve al drawer en `navigation.js`; `useCarrito()` desde cualquier pantalla). Se guarda en AsyncStorage con la clave `carrito_<idUsuarios>` y cada item tiene una copia del producto que `sincronizar()` actualiza con `get_productos`. Solo está habilitado para el rol 1: `Header` muestra el ícono 🛒 con la cantidad. Precio y stock reales los valida siempre el backend. Tests en `__tests__/CarritoContext.test.js`.
- `components/` tiene la UI reutilizable: tarjetas, ítems de lista, `TimerServicio`, `cita.js` para las citas del recepcionista y del cliente (muestra "✓ Pagada"), `OpcionesPago`, `ResumenPagoLocal`, `CobroCita` y `AccionesCitaSalon`. Este último muestra los botones Reprogramar/Cancelar con un modal que pide un mensaje para el cliente; lo usan las pantallas del estilista y del recepcionista en las citas activas.
- `utils/`:
  - `api.js`: instancia de axios (`api`, `accion`, `leerSesion`, `CLAVE_SESION`, `registrarAlExpirarSesion`);
  - `pagos.js`: `pagarCita`/`pagarPedido`, `crearLinkPago`/`crearLinkPagoPedido`, `consultarEstadoPago`/`consultarEstadoPagoPedido`, `elegirPagoLocal`, `obtenerPagosPendientes`, `agruparPagoLocal`, `INSTRUCCIONES_PAGO_LOCAL`, `describirEstadoPago`, `formatearMonto` (tests en `__tests__/pagos.test.js`);
  - `manejoErrores.js` (`mensajeDeError`, `esRespuestaValida`): usarlo en cada llamada nueva;
  - `fechas.js`: formato y aritmética de fechas `AAAA-MM-DD`;
  - `horarios.js`: horario del local (`validarHorario`) y `formatearFechaHora` para enviar al servidor;
  - `texto.js`: `normalizarTexto`, para búsquedas sin tildes ni mayúsculas;
  - `generarFacturaPdf.js`: arma una factura en HTML y la imprime o comparte con `expo-print`/`expo-sharing`.

## Arquitectura de la API (`api_proyecto/`)

- `index.php` agrega los headers de CORS (incluye `X-Session-Token` y `ngrok-skip-browser-warning`; responde 204 a `OPTIONS`) y JSON e incluye `router.php`, que deriva a `services/*.php` según el método HTTP y `?action=` con dos tablas (`$rutasGet`, `$rutasPost`). **Una acción desconocida responde 404** (ya no hay `get.php`/`post.php`).
  - GET: `get_citas`, `get_cliente`/`get_clientes`, `get_servicios`, `get_estilistas`, `get_estilista`, `get_citas_dia`, `get_citas_semana`, `get_citasDiarias`, `get_citasSemanal`, `get_usuarios`, `get_perfil_recepcionista`, `get_citas_cliente`, `get_clientes_lista`, `get_productos`, `get_pedidos_cliente`, `get_estado_pago_cita`, `get_medios_pago`, `get_estado_pago_pedido`, `get_pagos_pendientes`, `get_pedidos_salon`, `retorno_pago` (HTML)
  - POST: `login`, `logout`, `crear_cita`, `iniciar_servicio`, `finalizar_servicio`, `update_servicios_cita`, `registrar_usuario`, `update_rol_usuario`, `update_perfil_recepcionista`, `update_contrasena`, `update_cliente`, `update_estilista`, `cancelar_cita`, `reprogramar_cita`, `cancelar_cita_salon`, `reprogramar_cita_salon`, `crear_pedido`, `cancelar_pedido`, `crear_preferencia_cita`, `registrar_cobro_cita`, `crear_preferencia_pedido`, `elegir_pago_local`, `entregar_pedido`, `webhook_mp`
- `services/`, `migraciones/` y `config/` tienen un `.htaccess` con `Require all denied`: solo se ejecutan por `index.php` (los `include` van por disco). Con ngrok la API queda expuesta a internet.
- Requieren sesión (`requerirSesion`): `get_clientes`, `get_estilista`, `update_cliente`, `update_estilista`, `update_contrasena`, `crear_cita` y todos los de pagos salvo `webhook_mp` y `retorno_pago`. El resto todavía confía en ids del body (ver `PENDIENTES.md`).
- Los services leen el body con `json_decode(file_get_contents('php://input'), true)`, usan el `$conn` global de `db.php` con `require_once __DIR__ . '/../db.php'` y responden `{ success, message, data }`.
- Patrón de los endpoints nuevos (por ejemplo `finalizar_servicio.php` o `get_citas_semana.php`):
  - `display_errors = 0`;
  - `require_once` de `db.php` dentro de un `try/catch (mysqli_sql_exception)` que responde HTTP 500 con JSON.
- Archivos compartidos que no son endpoints (no se registran en el router):
  - `auth.php`: `requerirSesion`, `usuarioDeSesion`, `crearSesion`, `revocarSesion`, `verificarContrasena` (migra texto plano → hash), `hashearContrasena`, `guardarContrasena` y las constantes `ROL_*_AUTH`;
  - `pagos_citas.php`: `totalesCita` (total, pagado, saldo; con `FOR UPDATE` opcional), `registrarPagoCita` (`pagos` + `pagos_servicios` en el primer cobro), `serviciosCita`, `ultimoPagoMpCita`, `avisoCancelacionPagada`, `MEDIOS_PAGO_LOCAL` y `mediosPagoLocal`;
  - `pagos_pedidos.php`: `totalesPedido`, `productosPedido`, `registrarPagoPedido` (`pagos` + `pagos_productos` y `pedidos.pagos_idPagos`), `pedidoTienePagoMpEnProceso`, `ultimoPagoMpPedido`;
  - `mercadopago.php`: API REST de MP con curl (sin SDK): `mpConfig`, `mpIniciarCobro` (fila de `pagos_mp` + preferencia, para cita o pedido), `mpCrearPreferencia`, `mpObtenerPago`, `mpBuscarPagoPorReferencia`, `mpFirmaValida` (HMAC-SHA256 de `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`), `aplicarEstadoPago` (idempotente: registra el cobro una sola vez) y `urlRetornoAppValida`. Las credenciales están en `C:\xampp\salon_config\mercadopago.php`, **fuera de htdocs y del repo** (plantilla: `api_proyecto/config/mercadopago.example.php`);
  - `consulta_citas.php`: `obtenerCitasEntre`, `agregarEstadoPago` (total/pagado/saldo/pagada), `validarFecha`, `fechaHoy`;
  - `comun.php`: `leerJsonBody` (responde "datos no válidos" si el body no es JSON en UTF-8);
  - `pedidos.php`: `vencerPedidos` (se llama al principio de cada endpoint de pedidos, porque no hay tareas programadas), `devolverStockPedido`, `marcarPedidoCancelado`, `esClienteActivo` y `DIAS_VENCIMIENTO_PEDIDO`. El stock se reserva al confirmar y vuelve al cancelar o vencer (los pedidos pagados no vencen). `crear_pedido` bloquea los productos con `FOR UPDATE` en orden de id y toma precio y stock de la base;
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
- PHP convierte `?data.id=` en `$_GET['data_id']` (lo usa `webhook_mp.php`).

## ngrok y Mercado Pago (sandbox)

- ngrok: `ngrok start salon` (endpoint `salon` en `%LocalAppData%\ngrok\ngrok.yml`, `upstream.url: 80`, `url:` el dev domain fijo de la cuenta) o `ngrok http 80 --url https://open-prude-curse.ngrok-free.dev` (el dominio de la cuenta; ojo: **puerto 80**, el ejemplo del dashboard usa 8080 y da `ERR_NGROK_8012`). Inspector en http://127.0.0.1:4040. En la app, `ENTORNO = 'ngrok'` en `direcIP/ip.js`.
- MP: credenciales de la cuenta de prueba **vendedor** en `C:\xampp\salon_config\mercadopago.php`; webhook configurado en Tus integraciones → Webhooks (modo prueba, evento Pagos) apuntando a `https://<dominio>/salonBelleza/api_proyecto/index.php?action=webhook_mp`. Pagar con la cuenta de prueba **comprador** y tarjetas de prueba (titular `APRO` aprobado, `OTHE` rechazado, `CONT` pendiente).
- Reintegros: no hay reintegro automático. Al cancelar una cita pagada, la respuesta avisa y el reintegro se hace a mano desde el panel de MP.

## Deuda técnica conocida

El relevamiento completo de lo que falta (funcionalidades por rol, seguridad, tablas sin usar y prioridades) está en `PENDIENTES.md`.

- **Autorización parcial**: solo algunos endpoints usan el token de sesión (ver arriba). Los demás (`get_citas_*`, `iniciar/finalizar_servicio`, `update_servicios_cita`, cancelaciones, `permisos.php` con `idSolicitante`, pedidos) siguen confiando en ids que manda la app.
- **`package.json` y `node_modules` en la raíz** no corresponden: las dependencias de la app van en `aplicacion/package.json`.
- **Pagos con MP reintegrados o contracargados** quedan marcados en `pagos_mp.estado`, pero su fila de `pagos` no se revierte (la cita sigue figurando pagada).
