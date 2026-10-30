## Tokens Oficiales — Dark & Gold Luxury (Frontend Web React)

El frontend de GYM VIP implementa la identidad **Dark & Gold Luxury**, optimizada para alto contraste, ergonomía en turnos de recepción y estética premium:

```css
:root {
  /* Fondo y Superficies */
  --color-bg: #0B0D12;
  --color-surface-panel: #151922;
  --color-surface-elevated: #1D2330;
  --color-surface-input: #11141B;
  --color-border: #303746;
  --color-border-focus: #D4AF37;

  /* Marca Dorada VIP */
  --color-gold: #D4AF37;
  --color-gold-hover: #E5C158;
  --color-gold-subtle: rgba(212, 175, 55, 0.12);
  --color-gold-border: rgba(212, 175, 55, 0.35);

  /* Textos y Contraste */
  --color-text-primary: #F5F5F4;
  --color-text-secondary: #B7BECA;
  --color-text-muted: #7E8B9B;

  /* Estados Semánticos (Alto Contraste) */
  --color-success: #22C55E;
  --color-success-bg: rgba(34, 197, 94, 0.12);
  --color-success-border: rgba(34, 197, 94, 0.3);

  --color-warning: #F59E0B;
  --color-warning-bg: rgba(245, 158, 11, 0.12);
  --color-warning-border: rgba(245, 158, 11, 0.3);

  --color-danger: #EF4444;
  --color-danger-bg: rgba(239, 68, 68, 0.12);
  --color-danger-border: rgba(239, 68, 68, 0.3);

  --color-neutral: #94A3B8;
  --color-neutral-bg: rgba(148, 163, 184, 0.1);

  /* Dimensiones Clave */
  --sidebar-width-expanded: 256px;
  --sidebar-width-collapsed: 76px;
  --header-height: 68px;
}
```

---

## Especificaciones y Guía Figma (Nomenclatura Canónica)

Convención de nombres para frames: `[ÉPICA]/[HISTORIA]/[PANTALLA]/[ESTADO]`
- `E01/HU-01/Alta-Cliente/Formulario-Datos`: Formulario modal centrado en datos reales del socio (nombres, apellidos, tipo de documento, número de documento, fecha de nacimiento, teléfono, correo opcional). **Sin casillas legales ficticias.**
- `E01/HU-01/Alta-Cliente/Validacion-Menor`: Bloqueo accesible a menores de 18 años (HTTP 400).
- `E01/HU-01/Alta-Cliente/Conflicto-409`: Advertencia ante documento duplicado.
- `E01/HU-01/Clientes/Lista-Resultados`: Tabla paginada con código de socio (ej. `MAR-XXXXXX`) y botón para ver ficha.
- `E01/HU-04/Personal/Nomina-Admin`: Gestión de cuentas ADMIN / RECEPCION, cambio de rol e inactivación protegida del último admin.
- `E02/HU-06/Planes/Catalogo-Lista`: Grid de tarifas en PEN, duración obligatoria de 30 días para mensualidades, versionado y cambio de estado.


## Guía de implementación

Web: React y CSS/tokens; si el proyecto ya usa una librería de componentes, adaptarla a estas variables. Motion/Framer Motion es opcional para transiciones útiles, nunca dependencia para entender el estado. Figma debe ser la fuente de frames y componentes editables; el código real conecta API y sustituye datos ficticios. En Kotlin Multiplatform se comparten contratos y modelos de presentación cuando aporte valor; los controles de autenticación y almacenamiento seguro respetan la plataforma.
