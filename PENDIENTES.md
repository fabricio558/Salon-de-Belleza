# Pendientes para completar la app

Relevamiento del 13/11/2026 sobre `mydb` (base en vivo), `aplicacion/` y `api_proyecto/`. Roles: cliente (1), estilista (2), recepcionista (3). La tabla `gerente` no se usa.

## 1. Qué puede hacer cada rol hoy y qué le falta

### Cliente (rol 1)
**Hoy:**
- Bienvenida pública con galería, servicios y estilistas (`get_servicios`, `get_estilistas`).
- Registro (`registrar_usuario`), que crea al usuario como cliente.
- Login.
- Inicio (`HomeCliente`): la misma vitrina más el botón "Reservar".
- Reservar cita (`CrearCita` → `crear_cita`), con validación del horario del local.
- Mi Perfil (`GestionPerfil` → `get_clientes` / `update_cliente`): datos, notas de alergias y preferencias, y contraseña.

**Le falta:**
| Falta | Se deduce de |
|---|---|
| ~~Ver sus citas~~ **Hecho** (`MisCitas`, `get_citas_cliente`), falta probar en el celular | `citas`, `estado_cita` |
| ~~Cancelar o reprogramar una cita~~ **Hecho** (`cancelar_cita`, `reprogramar_cita`): solo citas activas y hasta 2 h antes (ver P5) | `estado_cita` (2 = Cancelada) |
| Ver lo que pagó y su comprobante | `pagos`, `pagos_servicios`, `medios_pago` |
| Elegir solo estilistas que hacen el servicio elegido | `estilistas_servicios` (hoy se puede reservar cualquier servicio con cualquier estilista) |
| Cargar su teléfono | `telefonos`, `telefonos_usuarios`, `codigoarea` |

### Estilista (rol 2)
**Hoy:**
- Inicio (`HomeEstilista` → `get_citasDiarias`): citas del día, iniciar y finalizar servicio (`TimerServicio`), modificar los servicios de la cita (`update_servicios_cita`).
- Agenda Semanal (`get_citasSemanal`): las mismas acciones, solo para la semana actual.
- Ficha del cliente (`FichaCliente` → `get_clientes`), de solo lectura.
- Mi Perfil (`get_estilista` / `update_estilista`): datos y contraseña.

**Le falta:**
| Falta | Se deduce de |
|---|---|
| Ver sus comisiones (ganado, liquidado, pendiente) | `comisiones_pagadas`, `estilistas.porcentajeComision`, `pagos` |
| Ver y editar su horario de trabajo (hoy **se borra** al guardar el perfil, ver §5) | `estilistas.horaEntrada/horaSalida` |
| Ver sus servicios y especialidades | `estilistas_servicios`, `estilistas_especialidades`, `especialidades` |
| Navegar a otras semanas | `citas` (`get_citasSemanal` solo trae la actual) |

### Recepcionista (rol 3)
**Hoy** (commiteado, falta probar en el celular; ver §4):
- Inicio con las citas del día de todos los estilistas (`get_citas_dia`).
- Agenda semanal con navegación entre semanas (`get_citas_semana`).
- Usuarios: listado y cambio de rol (`get_usuarios`, `update_rol_usuario`).
- Mi Perfil (`get_perfil_recepcionista`, `update_perfil_recepcionista`, `update_contrasena`).

**Le falta (operativo, del día a día):**
| Falta | Se deduce de |
|---|---|
| Ver las citas finalizadas pendientes de cobro | `citas` (estado 3) sin fila en `pagos` |
| Registrar el cobro (medio de pago, total, detalle) | `pagos`, `pagos_servicios`, `medios_pago` (**vacía**) |
| Comprobante PDF del cobro | `pagos` + `utils/generarFacturaPdf.js` |
| ~~Crear una cita para un cliente~~ **Hecho** ("Agendar Cita": `CrearCita` en modo recepcionista + `get_clientes_lista`), falta probar en el celular | `citas`, `citas_servicios` |
| ~~Cancelar o reprogramar citas~~ **Hecho** (con mensaje al cliente; `cancelar_cita_salon`, `reprogramar_cita_salon`) | `estado_cita` (2), `citas_cambios` |
| Dar de alta un cliente en el mostrador | `usuarios`, `clientes` |
| Vender productos (con o sin cita) | `pagos_productos`, `pagos.citas_idCitas` (que puede ser NULL), `productos.stock` |
| Ver y editar la ficha de un cliente y sus teléfonos | `clientes`, `telefonos_usuarios` |

**Le falta (administración, lo que antes era del gerente):**
| Falta | Se deduce de |
|---|---|
| ABM de servicios (nombre, precio, imagen, activo/inactivo) | `services` (`estado`, `imagenUrl`), `estado` |
| Administrar estilistas: horario, % de comisión, especialidades, servicios que hace | `estilistas`, `especialidades`, `estilistas_especialidades`, `estilistas_servicios` |
| Activar o desactivar usuarios | `usuarios.estado`, `estado` (el login hoy **no** controla `estado`) |
| ABM de medios de pago | `medios_pago` (`estado`) |
| Calcular y liquidar comisiones | `comisiones_pagadas` (`montoComision`, `fechaLiquidacion`, `estado`, `pagos_idPagos`) |
| Productos y stock | `productos` (`stock`, `porcentajeGanancia`, `precioVenta`, `estado`), `movimiento_interno` |
| Proveedores y compras | `proveedores`, `proveedores_productos` (`precioCompraHistorico`), `telefonos_proveedores` |
| Reportes: ingresos por período, por medio de pago y por estilista; servicios más vendidos; stock bajo | `pagos`, `pagos_servicios`, `pagos_productos`, `productos` |
| Datos laborales de recepcionistas (salario, fecha de contratación) | `recepcionista` |

## 2. Referencias al gerente o al `idRol 4` que conviene eliminar
- `api_proyecto/services/update_rol_usuario.php`: la constante `ROL_GERENTE` y el bloqueo "El rol de un gerente no se puede modificar".
- `aplicacion/screens/GestionUsuarios.js`: `ROL_GERENTE`, `esGerente` y la nota "Gerente: su rol no se modifica desde acá".
- `CLAUDE.md`: tabla `gerente` y "4 = gerente" (se corrige en el paso 1).
- `proyecto/PHP/sesion.php:34` (`alert("gerente")`), en la web vieja, que ya no se usa.
- En la base: la fila `roles.idRol = 4` y la tabla `gerente`, con su FK a `usuarios`. Ver la pregunta P1.

## 3. Tablas que no usa ningún endpoint
`gerente` (no se usa), `estado` (sus valores sí se usan como números), `pagos_servicios`, `pagos_productos`, `medios_pago`, `comisiones_pagadas`, `productos`, `proveedores`, `proveedores_productos`, `movimiento_interno`, `especialidades`, `estilistas_especialidades`, `estilistas_servicios`, `telefonos`, `telefonos_usuarios`, `telefonos_proveedores`, `codigoarea`.

`pagos` solo se lee (un `EXISTS` en `consulta_citas.php`), nadie escribe en ella. `recepcionista` solo la lee el perfil y la inserta el cambio de rol.

## 4. Funcionalidades a medio hacer
- **Recepcionista, Etapa 1 y lo que se agregó después**: inicio, agenda semanal, usuarios y perfil están implementados, probados con curl, eslint y jest, y commiteados (`14a4f9a`, `91a3e7d`, `d1cc9f0`, `8afe390`), pero **sin probar en el celular**. Siguen pendientes las etapas 2 a 5 del plan: pendientes de cobro, cobro, comprobante y cita para un cliente.
- **`utils/generarFacturaPdf.js`**: funciona por sí solo, pero no lo usa ninguna pantalla y está sin commitear (por decisión tuya). Depende del cobro. Tiene un error de tipeo ("TOTAL APAGAR").
- **Endpoints sin pantalla**:
  - `get_citas.php` (citas de un estilista, sin uso);
  - `get.php` y `post.php`, que son el destino por defecto del router (ver §5, seguridad).
- **Código muerto**:
  - `GestionPerfil.js` carga `get_estilistas` y no usa el resultado;
  - `aplicacion/registro.js` es un archivo vacío versionado;
  - `components/cita.js` antes no se usaba (ahora sí);
  - `proyecto/` (web vieja) no la referencia nada.
- **TODOs**: solo los de contraseñas en texto plano (`registrar_usuario.php`, `update_contrasena.php`). No hay botones con `onPress` vacío.
- **Datos incompletos**:
  - Nicki (7) y Luis (8) tienen rol estilista sin fila en `estilistas`, así que no aparecen para reservar.
  - Lautaro (11) no tiene fila en `recepcionista`.
  - `medios_pago` está vacía, y sin eso no se puede cobrar.
- **`mydb.sql` está desactualizado**: la base en vivo tiene `usuarios.foto` y `services.imagenUrl`, que el dump no tiene, y el código usa esas dos columnas.

## 5. Requisitos no funcionales pendientes

### Seguridad (lo más urgente)
1. **Filtración de datos**: cualquier GET con una acción desconocida (`index.php?action=loquesea`) cae en `get.php`, que devuelve **todos los clientes con su contraseña**. Lo verifiqué: hoy expone 2 registros.
2. **Sin autenticación ni autorización real**: ningún endpoint sabe quién llama. `update_cliente` y `update_estilista` aceptan cualquier id, así que cualquiera puede cambiar el correo y la contraseña de otro usuario y quedarse con su cuenta. Lo mismo vale para `crear_cita`, `update_servicios_cita`, `iniciar/finalizar_servicio` y `get_clientes`. La verificación de `permisos.php` se basa en un id que manda la app, así que se puede falsificar. Hace falta un token de sesión que emita el login.
3. **Inyección SQL** en `post.php`.
4. **Contraseñas en texto plano**. Además, `get_clientes` y `get_estilista` devuelven la contraseña, y los perfiles de cliente y estilista la comparan en el celular.
5. El login no controla `usuarios.estado`: un usuario inactivo puede entrar.
6. ~~`crear_cita.php` devuelve `$e->getMessage()` al cliente.~~ **Hecho**: ahora lo registra en el log y responde un mensaje genérico.

### Reglas de negocio
- **Hecho**: `crear_cita` y `reprogramar_cita` no permiten superponer citas del mismo estilista. La duración sale de `services.duracionMinutos` (migración 001); hoy **todos los servicios están en 60 minutos y hay que cargar las duraciones reales**.
- `crear_cita` y `reprogramar_cita` todavía no controlan:
  - el horario de trabajo del estilista;
  - que el estilista haga el servicio elegido;
  - que la cita **termine** dentro del horario del local: hoy solo se valida la hora de inicio, así que una cita de 120 minutos a las 19:30 se acepta.
- `update_servicios_cita` (el estilista modifica los servicios de una cita) puede alargar una cita y superponerla con la siguiente: no controla la superposición.
- `TimerServicio` calcula el tiempo transcurrido con el reloj del dispositivo (`Date.now()`): si el reloj del celular o del emulador está mal, el cronómetro muestra un tiempo incorrecto. Los tiempos guardados (`horaInicio`, `horaFin`) son correctos porque los pone MySQL.
- `update_estilista.php` pone en NULL `horaEntrada` y `horaSalida` cada vez que el estilista guarda su perfil.
- `get_citasDiarias` y `get_citasSemanal` calculan el total con el precio actual e ignoran `cantidad`.
- `login.php` devuelve `idEstilistas` a cualquier usuario.
- Un cambio de rol se aplica recién en el próximo login, porque la sesión guarda el rol.

### Manejo de errores
- De los endpoints viejos, 9 no tienen `try/catch`, así que si cae MySQL devuelven HTML: `get_citas`, `get_citasDiarias`, `get_citasSemanal`, `get_clientes`, `get_estilista`, `get_estilistas`, `get_servicios`, `login`, `get.php`/`post.php`.
- Varios no apagan `display_errors`.
- Las pantallas viejas muestran "No se pudo conectar" ante cualquier error y no usan `utils/manejoErrores.js`.
- `InicioSesion.js` usa `fetch` en vez de `axios`.

### Tests
- Hay un solo smoke test (`App.test.tsx`).
- No hay tests de pantallas, de utilidades (`fechas.js` y `manejoErrores.js` se pueden testear fácil) ni del PHP.

### Deuda técnica de `CLAUDE.md`, todavía vigente
- Tres formas de llamar a la API.
- Cinco endpoints que la app llama directo, sin pasar por el router (`get_citasDiarias`, `get_citasSemanal`, `get_estilista`, `update_cliente`, `update_estilista`).
- `include 'db.php'` relativo en `get.php`/`post.php`.
- `package.json` en la raíz.
- Texto plano.
- `post.php`.
- Además: PHP en `Europe/Berlin` (`date()` da el día siguiente desde las 20:00).

## 6. Lista priorizada

Tamaño: **C** chico (menos de medio día) · **M** mediano (1 a 2 días) · **G** grande (3 días o más).

### Prioridad alta
| # | Tarea | Tamaño | Depende de |
|---|---|---|---|
| A1 | Cerrar la filtración: que una acción desconocida devuelva 404 y borrar `get.php`/`post.php` | C | — |
| A2 | Dejar de devolver contraseñas (`get_clientes`, `get_estilista`); que los perfiles de cliente y estilista usen `update_contrasena` | C | — |
| A3 | Probar en el celular lo hecho del recepcionista (inicio, agenda, usuarios, perfil, registro) | C | — |
| A4 | Arreglar `update_estilista` (no borrar el horario) | C | — |
| A5 | Completar las filas de subtipo que faltan (7, 8, 11) y cargar `medios_pago` | C | P3 |
| A6 | Login con token de sesión y validación de rol y dueño en todos los endpoints | G | A1 |
| A7 | Hashear contraseñas (`password_hash`/`password_verify`, migrando las viejas al iniciar sesión) | M | A2 |
| A8 | ~~Cliente: "Mis citas"~~ **Hecho** | M | — |
| A9 | Recepcionista: pendientes de cobro y registro del cobro | M | A5, P4 |
| A10 | ~~Validar superposición de turnos en `crear_cita`~~ **Hecho** (también en `reprogramar_cita`). Falta: cargar las duraciones reales y controlar el fin de la cita y `update_servicios_cita` | C | — |

### Prioridad media
| # | Tarea | Tamaño | Depende de |
|---|---|---|---|
| M1 | ~~Cancelar o reprogramar citas (cliente y recepcionista)~~ **Hecho**: el cliente (hasta 2 h antes) y el estilista o recepcionista (sin plazo, con mensaje obligatorio que el cliente ve en Mis Citas). Historial en `citas_cambios` | M | — |
| M2 | Recepcionista: ~~crear una cita para un cliente~~ (**hecho**); falta dar de alta clientes en el mostrador | C | P6 |
| M3 | Comprobante PDF (integrar `generarFacturaPdf.js`) | C | A9 |
| M4 | ABM de servicios | M | — |
| M5 | Administrar estilistas (horario, comisión, servicios y especialidades) y filtrar estilistas por servicio al reservar | G | P7 |
| M6 | Activar o desactivar usuarios, y que el login lo respete | C | — |
| M7 | Comisiones: cálculo, liquidación y vista del estilista | G | A9, M5, P4 |
| M8 | Unificar las llamadas a `index.php?action=` y agregar try/catch y `display_errors` a los endpoints viejos | M | — |
| M9 | Reportes de ingresos (período, medio de pago, estilista, servicios) | M | A9 |
| M10 | Quitar las referencias al gerente (`update_rol_usuario.php`, `GestionUsuarios.js`) | C | P1 |

### Prioridad baja
| # | Tarea | Tamaño | Depende de |
|---|---|---|---|
| B1 | Productos y stock (ABM y movimientos) | G | P9 |
| B2 | Proveedores y compras | M | B1 |
| B3 | Venta de productos en el cobro o suelta | M | A9, B1 |
| B4 | Teléfonos de usuarios y proveedores | C | B2 |
| B5 | Tests: utilidades, pantallas clave y endpoints PHP | M | — |
| B6 | Limpieza: `registro.js` vacío, `proyecto/`, `package.json` de la raíz, código muerto en `GestionPerfil`, zona horaria de PHP, volver a exportar `mydb.sql` | C | P2, P10 |
| B7 | Navegación entre semanas en la agenda del estilista | C | — |

## 7. Preguntas
- **P1.** ¿Borro la fila `idRol = 4` de `roles` y la tabla `gerente` de la base, o las dejo y solo las ignoro?
- **P2.** ¿Cuál es la fuente de verdad del esquema? La base en vivo tiene columnas (`foto`, `imagenUrl`) que `mydb.sql` no tiene. ¿Vuelvo a exportar el dump?
- **P3.** ¿Qué medios de pago se aceptan? Por ejemplo: efectivo, débito, crédito, transferencia, Mercado Pago.
- **P4.** ¿Cómo se calcula la comisión: `porcentajeComision` sobre el total de servicios de cada pago? ¿Se liquida por período (semanal, mensual)? ¿Los productos generan comisión?
- **P5.** **Resuelta en el código, confirmá si te sirve**: el cliente cancela o reprograma citas activas hasta 2 h antes (`ANTICIPACION_CAMBIO_MINUTOS`); el estilista (sus citas) y el recepcionista (todas), sin plazo y con mensaje obligatorio. Las citas en curso, finalizadas o canceladas no se modifican.
- **P6.** ¿Un cliente dado de alta en el mostrador necesita correo y contraseña, o puede existir sin cuenta?
- **P7.** ¿Qué diferencia hay entre `especialidades` y `estilistas_servicios`? ¿Cuál limita lo que se puede reservar?
- **P8.** ~~¿Columna de duración o turno fijo?~~ **Respondida**: duración por servicio (`services.duracionMinutos`). Pendiente: los valores reales de cada servicio.
- **P9.** ¿Qué registra `movimiento_interno`: ingresos por compra, consumo interno de los estilistas, o ambos? ¿La cantidad lleva signo?
- **P10.** ¿Se puede borrar `proyecto/` (la web vieja)?
- **P11.** Sin gerente, cualquier recepcionista puede cambiarle el rol a otro recepcionista. ¿Hay que impedir que el sistema quede sin ningún recepcionista, o que un recepcionista degrade a otro?

