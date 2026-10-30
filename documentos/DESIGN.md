# Sistema de Diseño Visual y Especificación de Interfaz — GYM VIP

> **Ubicación Canónica:** `gymvip-frontend/documentos/DESIGN.md`  
> **Referencia de Figma:** [Diseñar admin GYM VIP](https://www.figma.com/make/piR1vQXrTrFeNzY91YopLK/Dise%C3%B1ar-admin-GYM-VIP-Figma?fullscreen=1&t=woiXFH3Upl0170pP-1)  
> **Estética:** Luxury Dark & Gold Fitness  
> **Fecha de Actualización:** 30 de Octubre de 2026  
> **Referencias Históricas:** [`historico/DESIGN_SYSTEM.md`](./historico/DESIGN_SYSTEM.md)

---

## 1. Fundamentos Visuales y Dirección de Arte

La interfaz de **GYM VIP** proyecta exclusividad, sobriedad y alto rendimiento deportivo. Se descartan elementos visuales genéricos (como coronas emoji, gradientes estridentes o estilos cripto/fintech) en favor de una estética elegante y minimalista fundamentada en fondos oscuros profundos, acentos dorados satinados y fotografía de alta calidad.

### Tokens de Color y Tipografía (`index.css`)
- **Fondo Primario (`--color-bg`):** `#0B0D12` (Zinc oscuro profundo).
- **Superficie de Paneles (`--color-surface-panel`):** `rgba(18, 20, 26, 0.92)` con desenfoque de fondo (`backdrop-filter: blur(16px)`).
- **Acento Dorado Primario (`--color-gold`):** `#D4AF37` (Oro clásico satinado, contraste auditado para texto y bordes).
- **Borde Dorado Sutil (`--color-gold-border`):** `rgba(212, 175, 55, 0.28)`.
- **Texto Principal (`--color-text-primary`):** `#F3F4F6` (Blanco cálido de alta legibilidad).
- **Texto Secundario (`--color-text-secondary`):** `#9CA3AF` (Gris medio).
- **Semántica:**
  - Éxito / Vigente: `#10B981` (Esmeralda).
  - Alerta / Por Vencer: `#F59E0B` (Ámbar).
  - Error / Vencido: `#EF4444` (Carmesí).
- **Tipografía:** Sistema nativo sans-serif (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`), asegurando renderizado nítido en Windows, macOS y Linux.

---

## 2. Pantalla de Acceso (Login Centrado Sobrio)

### Especificación de Composición
A diferencia de los paneles partidos de dos columnas, la composición final adopta un diseño centrado de alto impacto:
1. **Fondo de Pantalla Completa:** Utiliza el recurso gráfico oficial [`hero-athlete.jpg`](../src/assets/hero-athlete.jpg) encuadrado con `background-size: cover; background-position: center;`.
2. **Capa de Oscurecimiento:** Gradiente radial profundo (`radial-gradient(circle, rgba(11, 13, 18, 0.78), rgba(11, 13, 18, 0.94))`) con desenfoque (`backdrop-filter: blur(8px)`), garantizando lectura cómoda y contraste según WCAG 2.1 AA.
3. **Tarjeta de Acceso Centrada:** Ancho máximo de `440px`, bordes redondeados (`16px`), borde perimetral dorado sutil y sombra multinivel profunda (`0 20px 48px -8px rgba(0, 0, 0, 0.85)`).
4. **Logotipo GYM VIP:** Monograma estilizado "VIP" en caja sobria, tipografía dorada en caja alta `GYM VIP` y subtítulo institucional `CENTRO DE ENTRENAMIENTO EXCLUSIVO`.
5. **Formulario Limpio:** Campos de correo institucional y contraseña con iconos SVG interiores. **Sin credenciales precargadas ni botones de acceso rápido o demo.** Mensajes de error seguros sin divulgación de existencia de cuentas.

---

## 3. Pantalla de Sesión Bloqueada (Lock Screen)

Para cumplir con la política de seguridad y privacidad en mostrador:
- **Disparador:** Inactividad de 15 minutos continuos sin eventos de usuario (`mousemove`, `keydown`, `click`) o respuesta `401 Unauthorized` del backend.
- **Ocultamiento Operativo:** Desmonta completamente el panel administrativo (`AdminLayout`) impidiendo que datos de socios o membresías queden visibles en el DOM.
- **Tarjeta de Bloqueo:** Presenta la identidad de la cuenta conocida (correo institucional, inicial de avatar y rol `ADMIN` o `RECEPCION`).
- **Reautenticación:** Pide únicamente la contraseña del usuario actual para llamar a `/api/v1/auth/login`. Al revalidar con éxito, reactiva la sesión sin recargar la aplicación completa.
- **Acción Alternativa:** Enlace "Iniciar sesión con otra cuenta" que limpia completamente la sesión y redirige al formulario de Login general.

---

## 4. Estructura de Vistas Administrativas y Componentes

| Vista / Pantalla | Componente React | Elementos Clave de Diseño |
| :--- | :--- | :--- |
| **Shell / Layout** | [`AdminLayout.jsx`](../src/templates/AdminLayout.jsx) | Header con avatar de usuario y badge de rol dorado; Sidebar colapsable con iconos vectoriales SVG nativos ([`Icons.jsx`](../src/components/common/Icons.jsx)) y drawer móvil. |
| **Dashboard** | [`HomePage.jsx`](../src/pages/HomePage.jsx) | Banner de bienvenida con textura del atleta, 3 tarjetas KPI con métricas en tiempo real y 4 accesos rápidos a operaciones críticas. Textos limpios sin etiquetas HU. |
| **Socios** | [`ClientsPage.jsx`](../src/pages/ClientsPage.jsx) | Tabla con chips dorados de código de socio, avatares generativos por inicial y columna de **Acciones diferenciadas** con botones "Ver Ficha" (solo lectura) y "Editar" (concurrencia y auditoría). |
| **Planes** | [`PlansPage.jsx`](../src/pages/PlansPage.jsx) | Cuadrícula de tarjetas de tarifas luxury con precios destacados en Soles (`PEN`), duración fija de 30 días y control de versionado. |
| **Personal** | [`StaffPage.jsx`](../src/pages/StaffPage.jsx) | Padrón de colaboradores con badges de rol semánticos y bloqueo estricto para perfiles sin privilegios de administrador. |
| **Membresías** | [`MembershipsPage.jsx`](../src/pages/MembershipsPage.jsx) | Proceso de cobro en mostrador con cotización en tiempo real, calendario visual de cobertura de 30 días, clave de idempotencia y constancia interna de cobro con botón de copia. |
| **Vigencias** | [`CoveragePage.jsx`](../src/pages/CoveragePage.jsx) | Tarjetas de cobertura con indicadores de estado (`VIGENTE`, `POR_VENCER`, `VENCIDO`) y acceso directo a renovación. |
| **Verificación** | [`VerificationPage.jsx`](../src/pages/VerificationPage.jsx) | Pantalla de mostrador con buscador rápido y tarjeta gigante de veredicto autoritativo (`ACCESO PERMITIDO` en verde esmeralda / `ACCESO DENEGADO` en rojo carmesí con motivo y regularización). |
| **Configuraciones** | [`SettingsPage.jsx`](../src/pages/SettingsPage.jsx) | Administración de umbral de alertas de vencimiento (1–30 días con persistencia en `localStorage`), datos de la sede central y catálogo de medios de pago. |

---

## 5. Accesibilidad y Responsividad (WCAG 2.1 AA)

- **Foco Visible:** Todos los elementos interactivos (`button`, `input`, `a`) cuentan con indicador de foco `outline: 2px solid var(--color-gold-hover)` con desplazamiento de 2px.
- **Reducción de Movimiento:** Regla `@media (prefers-reduced-motion: reduce)` que inhabilita animaciones y transiciones para usuarios sensibles.
- **Adaptabilidad Móvil (<768px):** La tarjeta de login se adapta al 100% del ancho de pantalla móvil, la barra lateral se convierte en drawer deslizable accesible y las tablas incorporan desplazamiento horizontal suave con scrollbar estilizado.

