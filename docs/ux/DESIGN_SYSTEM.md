# DESIGN SYSTEM — GYM VIP (VIP CENTER FIT)

**Versión:** 1.0 Canónica — 11 de octubre de 2026  
**Ámbito:** Frontend Web Administrativo (React) y App Móvil Socio (KMP)  
**Principios rectores:**

1. **Velocidad de Operación:** Recepción debe poder registrar un socio o verificar un estado en menos de 3 pasos; búsqueda persistente y retroalimentación inmediata.
2. **Estética Premium Sobria:** Superficie clara (`surface.0: #FFFFFF`, `surface.50: #F5F8F6`), alto contraste tipográfico, acentos enérgicos con la paleta de la marca. Glassmorphism moderado solo en cabeceras o tarjetas decorativas, nunca detrás de tablas, formularios o datos críticos.
3. **Semántica Visual de Estados:** Badges con icono + texto para estados de membresía y contacto (nunca color por sí solo).
4. **Accesibilidad e Inclusión:** Contraste WCAG AA, objetivos táctiles >= 44px, navegación por teclado completa y soporte obligatorio de `prefers-reduced-motion`.

---

## 1. Tokens de Color (CSS Custom Properties)

```css
:root {
  /* Marca Primaria */
  --color-brand-700: #114e46; /* Acciones principales, sidebar, botones primarios */
  --color-brand-600: #166b5f; /* Hover de acciones principales */
  --color-brand-500: #1c806c; /* Enlaces y acentos activos */
  --color-brand-100: #d8efea; /* Fondos tenues de selección */

  /* Acento Vibrante */
  --color-accent-500: #d9f36a; /* CTAs destacados y badges de atención */
  --color-accent-600: #b8d644; /* Hover de acento */

  /* Tintas y Textos */
  --color-ink-900: #14201d; /* Texto principal de alto contraste */
  --color-ink-700: #2c3b37; /* Encabezados secundarios y etiquetas */
  --color-ink-600: #52635d; /* Texto secundario y placeholders */
  --color-ink-400: #8e9e98; /* Deshabilitados y bordes sutiles */

  /* Superficies y Fondos */
  --color-surface-0: #ffffff; /* Tarjetas, modales, tablas */
  --color-surface-50: #f5f8f6; /* Fondo general de aplicación */
  --color-surface-100: #ebf0ed; /* Fondo de paneles y campos */

  /* Bordes y Separadores */
  --color-border: #d9e3de; /* Separadores estándar y campos de texto */
  --color-border-focus: #114e46; /* Anillo de foco accesible */

  /* Estados Semánticos (Icono + Texto) */
  --color-success: #146c43; /* Vigente / Aprobado / Éxito */
  --color-success-bg: #e7f6ec;
  --color-warning: #8b5a00; /* Próxima a vencer / Pendiente */
  --color-warning-bg: #fff8e6;
  --color-danger: #b42330; /* Vencida / Rechazado / Error */
  --color-danger-bg: #fdf0f1;
  --color-neutral: #52635d; /* Sin membresía / Inactivo */
  --color-neutral-bg: #f0f4f2;

  /* Tipografía */
  --font-family:
    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px - texto mínimo interfaz */
  --font-size-base: 1rem; /* 16px - cuerpo */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px - subencabezados */
  --font-size-2xl: 1.75rem; /* 28px - títulos */
  --font-size-3xl: 2.25rem; /* 36px - hero */

  /* Espaciado */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Radios */
  --radius-sm: 4px;
  --radius-md: 8px; /* Campos de formulario */
  --radius-lg: 12px; /* Tarjetas y modales */
  --radius-xl: 20px; /* Paneles destacados */
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm: 0 1px 2px rgba(20, 32, 29, 0.05);
  --shadow-md:
    0 4px 6px -1px rgba(20, 32, 29, 0.08), 0 2px 4px -1px rgba(20, 32, 29, 0.04);
  --shadow-lg:
    0 10px 15px -3px rgba(20, 32, 29, 0.1),
    0 4px 6px -2px rgba(20, 32, 29, 0.05);

  /* Transiciones */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: 0ms !important;
    --transition-normal: 0ms !important;
  }
}
```

---

## 2. Componentes Fundamentales de Interfaz

### Botón Primario

- Fondo: `--color-brand-700`, Texto: `--color-surface-0`.
- Altura mínima: 44px (touch target accesible).
- Radio: `--radius-md`. Hover: `--color-brand-600`. Foco visible: anillo de 2px con offset de 2px.

### Badges Semánticos de Membresía

- `VIGENTE`: Fondo `--color-success-bg`, Texto e icono `--color-success`.
- `PRÓXIMA A VENCER`: Fondo `--color-warning-bg`, Texto e icono `--color-warning`.
- `VENCIDA`: Fondo `--color-danger-bg`, Texto e icono `--color-danger`.
- `SIN MEMBRESÍA`: Fondo `--color-neutral-bg`, Texto e icono `--color-neutral`.

### Formularios y Casillas de Consentimiento

- Las casillas para Términos de Servicio y Aviso de Privacidad son controles independientes con enlaces hacia sus textos vigentes.
- Casillas comerciales (WhatsApp y Correo) opcionales y desmarcadas por defecto.
- Alerta explícita para mayores de edad; advertencia inmediata si la fecha de nacimiento corresponde a menor de 18 años.

### Estados de Pantalla Obligatorios

Todo componente de consulta (planes, clientes, membresías) gestiona 4 estados:

1. `Loading`: Skeleton pulsante sutil.
2. `Empty`: Ilustración mínima y mensaje: «No se encontraron clientes que coincidan con la búsqueda.»
3. `Error`: Mensaje comprensible con botón de reintento.
4. `Success`: Presentación de datos con métricas claramente rotuladas `(Datos de demostración)` cuando no sean de producción.

⚛️ React
🎬 Framer Motion
🎨 CSS

✨ Features:
• Smooth Add to Cart Animation
• Dynamic Quantity Controls
• Interactive Micro Animations
• Responsive Design
• Clean & Modern UI
A modern dashboard featuring premium glassmorphism, neon purple and blue accents, interactive analytics, and a sleek UI experience. 🚀

📊 Modern Dashboard UI
💎 Glassmorphism Effects
📈 Interactive Analytics
⚡ Smooth Transitions
🎨 Neon Purple & Blue Theme
📱 Responsive Design
⚛️ React + CSS
corecioes, hacer ams fluido el flujo con menos texto y aliviar al usaurio ,
modal para los crud salvo read
hash aleatorio con nombres para usuario y dejar en claro y

Registro de pago presencial seri asm un plan
asiganr plan caledario visuald esde cuando inicia 30 dias, dejar el fluo mas claro
que el modulo de agegar cliente solo se agreguen datos del cliente y quita l aparte de terminos y el cuadro de potecciond e datos, y caudros inncesario de ese tipo, considerar que en la tabla de clientes tendri q haber fecha de regsitreo y una columna al ultimo de acciones dodne ahbarina pequeños botones de editar eliminar y visualizar datos y te llevaria a ver todod sus datos, correo opcional
, los modulosd emembresias y planes deberian deser mas claros y y en cada uno de llos deberia de realiazarse su propias funcioanlidades , sin que se vea toda la lista de clientes
