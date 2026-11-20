# Sistema de diseño (blanco y negro)

Todo el tema está en `theme/theme.js`: `colors`, `spacing`, `typography`, `fuentes`, `radius`, `shadows`, `ESTADOS_CITA` y `estiloEstadoCita`. Los componentes base están en `components/ui/`.

## Reglas

- Nada de colores ni tamaños sueltos en un `StyleSheet`: siempre `colors.*`, `spacing.*`, `typography.*`, `radius.*`.
- Un solo `Boton` `primary` (negro) por pantalla; el resto `secondary` (borde) o `text`.
- Márgenes laterales `spacing.pantalla` (24), entre secciones `spacing.seccion` (32), entre tarjetas `spacing.entreTarjetas` (12).
- Áreas táctiles de 44 × 44 o más (`spacing.toqueMinimo`).
- El color solo para estados (`success`, `error`, `warning`, `enCurso`), siempre con ícono y texto.
- Íconos: `Ionicons` de `@expo/vector-icons`, no emojis.

## Contraste (WCAG AA)

| Texto / elemento | Fondo | Contraste |
| --- | --- | --- |
| `textPrimary` #0A0A0A | blanco / `surfaceMuted` #FAFAFA | 19.8 / 19.0 |
| `textOnPrimary` #FFFFFF | `primary` #0A0A0A / `primaryPressed` #2B2B2B | 19.8 / 14.2 |
| `textSecondary` #5C5C5C | blanco / #FAFAFA / `surfaceSubtle` #F2F2F2 | 6.7 / 6.4 / 6.0 |
| Confirmada #0A0A0A | #F2F2F2 | 17.7 |
| `success` #3E5C45 | `successSoft` #EDF2EE | 6.6 |
| `error` #8C3A36 | `errorSoft` #F6ECEB / blanco | 6.5 / 7.6 |
| `warning` #8A4A1C | `warningSoft` #F8ECE3 / blanco | 5.9 / 6.8 |
| `goldText` #7D5F28 | blanco / `goldSoft` #F7F1E6 / #F2F2F2 | 5.9 / 5.3 / 5.3 |
| `goldOnDark` #CDB07A | `primary` #0A0A0A / `primaryPressed` #2B2B2B | 9.5 / 6.8 |
| `gold` #A8854A (solo gráfico, no texto) | blanco / #FAFAFA | 3.4 / 3.3 (mínimo 3:1 para elementos gráficos) |
| `enCurso` #2F4A5F | `enCursoSoft` #E9EFF3 / blanco | 8.0 / 9.3 |
| Borde de input `borderStrong` #8A8A8A | blanco / #FAFAFA | 3.4 / 3.3 (mínimo 3:1 para controles) |
| Deshabilitado #757575 | `disabled` #E0E0E0 | 3.5 (los controles inactivos están exentos) |

`border` #E6E6E6 es solo decorativo (tarjetas y separadores), nunca el único límite de un control.

## Acento dorado

Un dorado cálido y apagado (latón envejecido / champagne) que rompe el blanco y negro
sin competir con él. El negro sigue siendo el color de la acción; el dorado es la firma.

| Token | Hex | Para qué |
| --- | --- | --- |
| `gold` | #A8854A | Elementos gráficos sobre claro: aro del avatar, puntos indicadores, filetes cortos, íconos decorativos. **No para texto.** |
| `goldText` | #7D5F28 | Texto e íconos chicos sobre claro (etiquetas, lema, texto de badges dorados). |
| `goldOnDark` | #CDB07A | Texto e íconos sobre negro o grafito (ítem activo del menú, etiqueta de la tarjeta destacada). |
| `goldLine` | #E3CF9F | Divisores y filetes puramente decorativos (no transmiten información). |
| `goldSoft` | #F7F1E6 | Fondo de badges y etiquetas doradas (`<Badge tono="dorado" />`). Solo superficies chicas. |

**Sí:** aros y bordes finos (1 px) de avatares o de una tarjeta destacada; el indicador de
"dónde estás" (ítem activo del menú, día con tu horario elegido); etiquetas en mayúsculas de
tarjetas negras; badges de marca (rol, "Destacado", "Nuevo"); un filete corto (24–32 px) bajo
un título o el logo.

**No:** fondos de pantalla, tarjetas o botones rellenos de dorado; el botón principal (sigue
negro); estados de cita o avisos (para eso están `success`, `error`, `warning`, `enCurso`); texto
largo; más de 2 o 3 detalles dorados visibles a la vez en la misma pantalla. Si dudás, no lo uses:
el dorado funciona porque es escaso.

`warning` pasó de ocre (#7A5B1E) a terracota (#8A4A1C) para no confundirse con el dorado:
un "Pendiente" no tiene que parecer un detalle de marca.

Dónde está aplicado hoy: menú lateral (`navigation.js`: filete, lema e ítem activo), cabecera
de "Mi Perfil" (aro del avatar e insignia de rol), tarjeta destacada del resumen y el punto del
día elegido en la agenda de `CrearCita`.

## Cómo usarlo

```js
import { colors, spacing, typography, radius } from '../theme';
import { Boton, Input, Tarjeta, Badge, Chip, EstadoVacio, Texto, Titulo } from '../components/ui';
```

## Cómo migrar una pantalla

1. Importá el tema y los componentes (arriba).
2. Fondo de la pantalla: `backgroundColor: colors.background`, márgenes con `paddingHorizontal: spacing.pantalla`.
3. Reemplazá los `Pressable` + `Text` que hacen de botón por `<Boton titulo="..." variante="primary|secondary|text" />`. Un solo primario.
4. Reemplazá los `TextInput` por `<Input label="..." error={...} />`.
5. Las tarjetas pasan a `<Tarjeta>` (o `variante="cita"` con `colorBorde={estiloEstadoCita(idEstado).borde}`), y los estados de cita a `<Badge estado={idEstado} />`.
6. Títulos con `<Titulo nivel="h1">` y textos con `<Texto variante="bodySmall" color="textSecondary">`, o con `...typography.x` en el `StyleSheet`.
7. Cambiá cada hex que quede por su token (`'#000000'` → `colors.textPrimary`, `'#666666'` → `colors.textSecondary`, `'#EEEEEE'` → `colors.border`, ...). Para encontrarlos: `grep -n "#[0-9A-Fa-f]\{3,6\}" screens/MiPantalla.js`.
8. Emojis por íconos: `<Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />`.
9. No toques la lógica: solo el JSX de presentación y el `StyleSheet`.

Los nombres anteriores (`primaryText`, `textMuted`, `surfaceAlt`, `accent`, ...) siguen existiendo como alias en `theme.js` para las pantallas ya migradas; en código nuevo usá los nombres por función.
