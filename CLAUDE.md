# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sistema de gestión para un salón de belleza (código, comentarios y UI en español). El repo tiene tres partes:

- `aplicacion/`: la app móvil (Expo SDK 51, React Native 0.74, JS). Acá se hace la mayor parte del trabajo.
- `api_proyecto/`: API JSON en PHP + MySQL que usa la app. XAMPP la sirve desde `C:\xampp\htdocs\salonBelleza`.
- `proyecto/`: versión web vieja en PHP/HTML. Usa otra base (`salondebelleza`) y la app no la usa.

## Base de datos

La base vigente es **`mydb`**, con el esquema en `mydb.sql` (en la raíz del repo). `api_proyecto/db.php` se conecta con mysqli a `localhost`, usuario `root`, sin contraseña, base `mydb`, y deja la conexión en la variable global `$conn`.

Tablas y columnas principales (nombres exactos de `mydb.sql`):

- `usuarios`: `idUsuarios`, `nombres`, `apellido`, `nombreUsuario`, `fechaNacimiento`, `correo`, `contrasena`, `fechaCreacion`, `estado` (→ `estado.idEstado`), `idRol` (→ `roles.idRol`, por defecto 1).
- `roles`: `idRol`, `nombreRol`.
- Subtipos de usuario. Su PK es también FK a `usuarios.idUsuarios`, así que el id del subtipo es el mismo número que `idUsuarios`:
  - `clientes`: `idClientes`, `notaAlergias`, `notaPreferencias`.
  - `estilistas`: `idEstilistas`, `porcentajeComision`, `horaEntrada`, `horaSalida`.
  - `recepcionista`: `idUsuarios`, `salario`, `fechaContratacion`.
  - `gerente`: `idGerente`, `salario`, `fechaContratacion`.
- `citas`: `idCitas`, `fechaHora`, `estado_cita_idEstado` (→ `estado_cita`), `clientes` (→ `clientes.idClientes`), `estilistas` (→ `estilistas.idEstilistas`), `horaInicio`, `horaFin`.
- `citas_servicios`: `citas_idCitas`, `servicios_idServicios` (→ `services`), `cantidad`, `precioHistorico`.
- `services` (la tabla se llama `services`, no `servicios`): `idServicios`, `servicio`, `precio`, `estado` (→ `estado.idEstado`).
- `estilistas_servicios`: `idUsuarios` (→ `estilistas.idEstilistas`), `idServicios` (→ `services`).
- `estado_cita`: `idEstado`, `estado_cita`. Valores: 1 Activa, 2 Cancelada, 3 Finalizada, 4 En Curso.
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
- **Fechas** que consume la app: devolverlas como `UNIX_TIMESTAMP(...)`.
- **IPs**: no hardcodearlas. La URL base de la API se toma siempre de `aplicacion/direcIP/ip.js` (`BASE_URL`).
- **HTTP**: usar `axios` en código nuevo (no `fetch`).
- **Flujo de una feature**: BD → endpoint en `api_proyecto/services/` → registrarlo en `router.php` → pantalla/componente en la app.
- **Dependencias de la app**: `npx expo install <paquete>` desde `aplicacion/`, nunca en la raíz del repo.
- **`aplicacion/utils/generarFacturaPdf.js` está en desarrollo**: no commitearlo hasta que el usuario lo indique.

## Arquitectura de la app

- Entrada: `index.js` → `registerRootComponent(prueba.js)` → `navigation.js`. `prueba.js` es el componente raíz (el test lo importa; no existe `App.js`).
- `navigation.js`: stack nativo (`Cargando` → `Bienvenida` / `InicioSesion` / `MainDrawer`). `Cargando` revisa la clave `user_session` de AsyncStorage para saltear el login. `MainDrawer` arma las pantallas según el `idRol` de la sesión. Cerrar sesión borra `user_session` y vuelve a `Bienvenida`.
- **Roles** (`roles.idRol`): 1 = cliente, 2 = estilista, 3 = recepcionista, 4 = gerente. Cada uno tiene su tabla de subtipo (`clientes`, `estilistas`, `recepcionista`, `gerente`). Hoy el drawer solo tiene pantallas para 1 (HomeCliente, CrearCita, GestionPerfil) y 2 (HomeEstilista, AgendaSemanal, FichaCliente, GestionPerfilEstilista). Los dos roles comparten nombres de pantalla como `"Inicio"` y `"Mi Perfil"`.
- Sesión: `InicioSesion.js` guarda en `user_session` el `data` que devuelve el login (`idUsuarios`, `idEstilistas`, `nombres`, `apellido`, `idRol`) como JSON. Las pantallas leen de ahí el id del usuario.
- `components/` tiene la UI reutilizable (tarjetas, ítems de lista, `TimerServicio`). `utils/generarFacturaPdf.js` arma una factura en HTML y la imprime o comparte con `expo-print`/`expo-sharing`.

## Arquitectura de la API (`api_proyecto/`)

- `index.php` agrega los headers de CORS y JSON e incluye `router.php`, que deriva a `services/*.php` según el método HTTP y `?action=`:
  - GET: `get_citas`, `get_cliente`/`get_clientes`, `get_servicios`, `get_estilistas` (si no coincide, `get.php`)
  - POST: `login`, `crear_cita`, `iniciar_servicio`, `finalizar_servicio`, `update_servicios_cita` (si no coincide, `post.php`)
- Los services leen el body con `json_decode(file_get_contents('php://input'), true)`, usan el `$conn` global de `db.php` con `require_once __DIR__ . '/../db.php'` y responden `{ success, message, data }`.

## Deuda técnica conocida

- **Tres formas de llamar a la API** desde la app: `index.php?action=...`, `router.php?action=...` (sin los headers de CORS de `index.php`) y `services/<archivo>.php` directo. Lo correcto es `index.php?action=...`.
- **Endpoints sin registrar en `router.php`**, que la app llama directo: `get_citasDiarias`, `get_citasSemanal`, `get_estilista`, `update_cliente`, `update_estilista`.
- **`idEstilistas` en `login.php`**: lo devuelve copiando `idUsuarios` para todos los usuarios, sin mirar el rol. El valor coincide para los estilistas (`estilistas.idEstilistas` es FK a `usuarios.idUsuarios`), pero los clientes también reciben un `idEstilistas` aunque no sean estilistas.
- **`get.php` y `post.php`** usan `include 'db.php'` relativo, así que solo funcionan a través del router. Los demás usan `require_once __DIR__ . '/../db.php'`.
- **`package.json` y `node_modules` en la raíz** no corresponden: las dependencias de la app van en `aplicacion/package.json`.
- **Contraseñas en texto plano**: `login.php` compara `contrasena` directo en SQL (no usa `password_hash`/`password_verify`).
- **Inyección SQL en `post.php`**: el `INSERT INTO usuarios` interpola los datos del body en la consulta.
