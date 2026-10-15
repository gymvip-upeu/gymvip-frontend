# ESTADO_FRONTEND_SPRINT1.md — Estado Técnico y Arquitectura General del Frontend

> **Proyecto:** GYM VIP (VIP CENTER FIT)  
> **Componente:** Frontend Web Administrativo y de Recepción (React 18 + Vite)  
> **Responsable:** Andre Acosta  
> **Fecha de Intervención:** 15 de Octubre de 2026  
> **Rama de Trabajo:** `base-acosta` (desarrollada en `refactor/layered-architecture-frontend`)  
> **Repositorio Remoto:** `https://github.com/gymvip-upeu/gymvip-frontend.git`  
> **Fuente Canónica del Proyecto:** `GYMVIP/documentos/` (en la raíz del workspace, fuera de Git)

---

## A. Alcance de la Intervención y Estado de Verificación

Esta intervención refactoriza la estructura interna del frontend de una organización modular por features a una **arquitectura por carpetas generales y responsabilidades**, manteniendo intactos los contratos HTTP con el backend Spring Boot y la estética oficial Dark & Gold Luxury.

### Distinción de Estados
- **Reportado:** Documentos anteriores declaraban compilación React exitosa y contratos con el backend en Clean Architecture modular.
- **Observado:** Se observó que el frontend contaba con carpetas `features/` (auth, clients, plans, staff, home), archivos residuales (`ESTADO_FRONTEND_BASE.md`, subcarpetas `docs/ux/`) y referencias a endpoints.
- **Probado / Ejecutado:** Se reorganizó la totalidad del código bajo carpetas generales (`api`, `assets`, `components`, `config`, `contexts`, `hooks`, `pages`, `routes`, `services`, `templates`, `themes`, `utils`, `validators`), se verificó la compilación de producción con Vite (`npm run build` PASS en 7.26s, 64 módulos transformados) y la ausencia de errores de resolución o imports rotos.

> [!IMPORTANT]
> **Límites de Alcance:**  
> - No se modificó `gymvip-backend`, su base de datos, configuraciones ni dependencias.  
> - No se desarrollaron las pantallas ni la lógica de las HU de Alexander (HU-07, HU-08, HU-10) ni de Jorge (HU-02, HU-09, HU-11, HU-12).  
> - No se declara concluido todo el Sprint 1 global; únicamente se entrega la base funcional del incremento Acosta.

---

## B. Estructura Final por Carpetas Generales y Responsabilidades

```
src/
├── api/                # Transporte remoto y llamadas HTTP a endpoints REST
│   ├── httpClient.js   # Wrapper fetch con base URL, inyección de token y manejador 401
│   ├── authApi.js      # /api/v1/auth (login, logout, me)
│   ├── clientApi.js    # /api/v1/clients (búsqueda paginada, detalle, alta)
│   ├── planApi.js      # /api/v1/plans (catálogo, detalle, alta, edición, estado)
│   └── staffApi.js     # /api/v1/accounts (nómina, alta, cambio de rol, status)
├── assets/             # Recursos estáticos locales
│   └── logo.svg        # Isotipo oficial corona GYM VIP en color dorado
├── components/         # Componentes UI reutilizables y modales
│   ├── common/         # Componentes genéricos de interfaz (Button, Badge, Alert, Modal)
│   ├── feedback/       # Indicadores de estado de consulta (LoadingState, EmptyState)
│   └── modals/         # Modales de interacción (LoginModal, ClientRegisterModal, ClientDetailModal, PlanModal, StaffModal)
├── config/             # Configuración pública de entorno
│   └── environment.js  # Lectura segura de VITE_API_BASE_URL y metadata
├── contexts/           # Estado reactivo global compartido
│   └── AuthContext.jsx # AuthProvider y useAuth (sesión, usuario, rol y desautenticación)
├── hooks/              # Hooks de estado y efectos de interfaz desacoplados
│   ├── useClients.js   # Consulta, paginación y búsqueda de socios
│   ├── usePlans.js     # Catálogo, filtrado por estado y toggle de activación
│   └── useStaff.js     # Nómina de colaboradores, actualización de roles e inactivación
├── pages/              # Pantallas principales del sistema
│   ├── HomePage.jsx    # Dashboard con métricas clave y delimitación de alcance
│   ├── ClientsPage.jsx # Padrón de socios, búsqueda por DNI/código, alta y ficha (HU-01)
│   ├── PlansPage.jsx   # Tarifario en PEN, modal de alta/edición y versiones (HU-06)
│   └── StaffPage.jsx   # Nómina de trabajadores, cambio de roles y protección último admin (HU-04)
├── routes/             # Enrutamiento y control de vistas
│   └── AppRoutes.jsx   # Composición de navegación con AdminLayout y guardas de acceso
├── services/           # Operaciones de negocio, coordinación y pre-validación
│   ├── authService.js  # Flujos de login, logout, verificación y comprobación de roles
│   ├── clientService.js# Orquestación de alta de socios y consulta
│   ├── planService.js  # Orquestación de planes con validación de duración y precios
│   └── staffService.js # Orquestación de colaboradores y control de cuentas
├── templates/          # Composición y estructura del layout
│   ├── AdminLayout.jsx # Shell principal contenedor de Sidebar, Header y Main
│   ├── Header.jsx      # Barra superior compacta (~68px) con título dinámico y perfil
│   └── Sidebar.jsx     # Menú lateral colapsable (256px / 76px) con botón de icono y drawer móvil
├── themes/             # Tokens del sistema de diseño
│   └── tokens.js       # Constantes JavaScript de colores, layout y tipografía
├── utils/              # Funciones auxiliares puras reutilizables
│   ├── formatters.js   # Formato de moneda Soles (S/ PEN), fechas y documentos
│   └── dateUtils.js    # Cálculo determinista de edad y comprobación de mayoría de edad
├── validators/         # Validación UX de formularios previa al envío HTTP
│   ├── authValidator.js   # Correo institucional y contraseña requeridos
│   ├── clientValidator.js # Mayoría de edad (18+), obligatorios y correo opcional
│   ├── planValidator.js   # Precio PEN > 0, duración > 0 e invariante de 30 días para mensualidades
│   └── staffValidator.js  # Validación de roles autorizados (ADMIN / RECEPCION)
├── App.jsx             # Punto de entrada reactivo con AuthProvider
├── index.css           # Estilos globales y tokens CSS Vanilla
└── main.jsx            # Montaje React 18 createRoot
```

### Qué se limpió y reubicó
- **Eliminación modular:** Se retiraron las carpetas `src/features/`, `src/app/`, `src/shared/` y `src/context/`.
- **Eliminación de duplicados documentales:** Se retiraron `ESTADO_FRONTEND_BASE.md` de la raíz, y `COMMIT_LOG_BASE.md`, `ESTADO_FRONTEND_BASE.md`, `HANDOFF_BASE_SPRINT1.md`, `ux/DESIGN_SYSTEM.md`, `ux/FIGMA_SPECS.md` de `docs/`.
- **Consolidación en la raíz:** Los tokens y especificaciones Figma se consolidaron en `GYMVIP/documentos/DESIGN_SYSTEM.md`.

---

## C. Sistema de Diseño Implementado (Dark & Gold Luxury)

| Aspecto | Implementación Concreta | Justificación / Contraste |
| :--- | :--- | :--- |
| **Fondo Principal** | `#0B0D12` (Negro profundo obsidiana) | Reduce fatiga visual en turnos prolongados de recepción. |
| **Superficies** | Panel: `#151922`, Elevada: `#1D2330`, Campos: `#11141B` | Jerarquía visual clara y opaca; sin glassmorphism detrás de datos o tablas. |
| **Bordes** | Estándar: `#303746`, Foco accesible: `#D4AF37` | Delimitación nítida de controles (anillo de foco visible con Tab). |
| **Marca Dorada** | Primario: `#D4AF37` (Oro clásico), Hover: `#E5C158` | Distintivo visual premium de GYM VIP; texto oscuro `#0B0D12` sobre botón dorado. |
| **Tipografía** | Inter, sans-serif del sistema (`14px` base UI, `16px` lectura, `28px`/`36px` títulos) | Alta legibilidad técnica y soporte multi-navegador. |
| **Sidebar** | Expandido: `256px`, Plegado: `76px` | Alternable mediante botón de **solo icono** con tooltip, `aria-expanded` y persistencia en `localStorage`. |
| **Drawer Móvil** | Abre desde la izquierda, fondo oscurecido (`drawer-backdrop`), tecla `Escape` para cerrar. | Soporte responsivo completo en smartphones (<768px). |
| **Header** | Altura compacta `68px` con título de vista dinámico y píldora de usuario con rol. | Sin textos truncados ni scroll horizontal global. |
| **Modales** | Centrados, `role="dialog"`, `aria-modal="true"`, foco en primer campo, cierre con `Escape` y botón `✕`. | Formularios legibles, mensajes de error contextuales. |
| **Animaciones** | Transiciones suaves de 150–200ms con respeto estricto a `@media (prefers-reduced-motion: reduce)` (desactivadas a 0ms). | Experiencia sobria y accesible. |

---

## D. Estado Funcional de las HU de Acosta Conectadas a la API

### 1. HU-01: Registro y Consulta de Clientes
- **Implementado en Frontend:** Formulario modal en `ClientRegisterModal.jsx` solicitando estrictamente: Nombres, Apellidos, Tipo de Documento (DNI/CE/Pasaporte), Número de Documento, Fecha de Nacimiento, Teléfono y Correo Electrónico (claramente rotulado como **Opcional**). **Sin casillas de consentimiento legal ficticias.**
- **Validación en Cliente:** Bloqueo inmediato con badge rojo si la fecha de nacimiento corresponde a un menor de 18 años.
- **Conexión API:** `POST /api/v1/clients` enviando los datos limpios. Captura de error HTTP 409 Conflict ante documento duplicado con mensaje amigable.
- **Visualización:** Tabla de socios con código de socio (ej. `MAR-XXXXXX`), búsqueda interactiva por código, nombre o documento, y modal `ClientDetailModal.jsx` para ver la ficha completa.
- **Pendiente:** Inscripción de menores con apoderado/tutor legal (diferida para sprints posteriores según el plan).

### 2. HU-04: Nómina de Personal y Gestión de Roles
- **Implementado en Frontend:** Pantalla `StaffPage.jsx` disponible exclusivamente para usuarios con rol `ADMIN`. Recepcionistas visualizan pantalla de restricción HTTP 403.
- **Operaciones Conectadas:**
  - `GET /api/v1/accounts`: Carga de la nómina de colaboradores.
  - `POST /api/v1/accounts`: Alta de personal con roles `ADMIN` o `RECEPCION` mediante `StaffModal.jsx`.
  - `PATCH /api/v1/accounts/{id}/role`: Modal para actualizar rol operativo.
  - `PATCH /api/v1/accounts/{id}/status`: Inactivación de cuenta con confirmación explícita (envía `{"status": "INACTIVO"}`).
- **Protección Último Admin:** Si el backend responde HTTP 409 Conflict al intentar degradar o inactivar al último administrador, la UI captura el error y lo muestra en un banner de advertencia accesible.

### 3. HU-06: Catálogo de Planes y Tarifas
- **Implementado en Frontend:** Pantalla `PlansPage.jsx` con grid de tarjetas de tarifas en PEN.
- **Operaciones Conectadas:**
  - `GET /api/v1/plans`: Listado de planes con filtro de estado (`Todos`, `Activos`, `Inactivos`).
  - `POST /api/v1/plans`: Creación de tarifas con validación estricta de precio positivo y regla de **exactamente 30 días** si el nombre incluye denominación mensual.
  - `PUT /api/v1/plans/{id}`: Edición que incrementa la versión inmutable conservando el historial.
  - `PATCH /api/v1/plans/{id}/status`: Toggle de activación/inactivación con modal de confirmación.
- **Permisos UI:** Recepción puede consultar tarifas pero los botones de edición y nuevo plan quedan ocultos (solo lectura).

---

## E. Matriz Completa del Sprint 1 (Equipo GYM VIP)

| HU | Nombre de Historia | Responsable | Estado Frontend Real | Dependencia Backend | Pendiente para Entrega del Sprint |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **HU-01** | Registrar cliente | **Acosta** | **CONECTADO & PROBADO** | `POST /api/v1/clients` | Ninguno en alcance base; menores diferidos. |
| **HU-02** | Buscar y editar cliente | **Jorge** (Propuesto) | **PENDIENTE (Base Lista)** | `PUT /api/v1/clients/{id}` | Formulario de edición en ficha y filtros avanzados. |
| **HU-04** | Roles y cuentas de personal | **Acosta** | **CONECTADO & PROBADO** | `GET/POST/PATCH /api/v1/accounts` | Ninguno; roles restringidos a ADMIN y RECEPCION. |
| **HU-06** | Catálogo de planes | **Acosta** | **CONECTADO & PROBADO** | `GET/POST/PUT/PATCH /api/v1/plans` | Ninguno en alcance base. |
| **HU-07** | Asignar / contratar membresía | **Alexander** (Propuesto) | **PENDIENTE** | `POST /api/v1/memberships` | Modal de selección de plan, período y asignación a socio. |
| **HU-08** | Registrar pago presencial | **Alexander** (Propuesto) | **PENDIENTE** | `POST /api/v1/payments` | Formulario de cobro presencial (efectivo/tarjeta) y recibo. |
| **HU-09** | Consultar vigencia | **Jorge** (Propuesto) | **PENDIENTE** | `GET /api/v1/memberships/{id}/validity` | Badges de vigencia (Vigente / Por Vencer / Vencido). |
| **HU-10** | Renovar membresía | **Alexander** (Propuesto) | **PENDIENTE** | `POST /api/v1/memberships/{id}/renew` | Botón y flujo de renovación de 30 días exactos. |
| **HU-11** | Reporte próximos a vencer | **Jorge** (Propuesto) | **PENDIENTE** | `GET /api/v1/reports/expiring` | Vista o tabla de alertas de socios por vencer. |
| **HU-12** | Verificación de acceso (Manual) | **Jorge** (Propuesto) | **PENDIENTE** | `POST /api/v1/access/verify` | Pantalla de control de puerta en recepción (validación por DNI; QR diferido). |

---

## F. Configuración de Entorno, Comandos y Verificaciones

### Variables de Entorno (`.env.example`)
El frontend únicamente requiere una variable pública para definir la URL base de la API:
```properties
# URL pública de la API REST backend (Spring Boot)
# En desarrollo local con proxy de Vite, puede dejarse vacía ('') para usar el proxy local /api
VITE_API_BASE_URL=
```
*Si se conecta a un backend remoto:* `VITE_API_BASE_URL=https://api-gymvip.onrender.com`.  
*No se versiona `.env` privado ni contiene secretos o tokens.*

### Comandos de Ejecución
```bash
# 1. Instalar dependencias exactas
npm ci

# 2. Iniciar servidor de desarrollo (puerto 5173 por defecto)
npm run dev

# 3. Compilar bundle de producción
npm run build

# 4. Previsualizar bundle de producción localmente
npm run preview
```

### Resultados de Verificación
- **Compilación de Producción (`npm run build`):** **APROBADO** (7.26s, 64 módulos transformados, 0 errores, 0 warnings).
- **Inspección de Dependencias (`npm ls`):** **APROBADO** (React 18.3.1, ReactDOM 18.3.1, Vite 6.4.4, `@vitejs/plugin-react` 4.3.4).
- **Resolución de Rutas y Navegación:** **APROBADO** (`AppRoutes.jsx`, `AdminLayout.jsx`).
- **Navegador en Vivo / End-to-End con API Activa:** **NO EJECUTADO** (Requiere el backend levantado en el puerto 8080 con PostgreSQL).

---

## G. Tareas de Alexander y Jorge (Guía de Extensión sobre esta Base)

Para evitar duplicaciones y mantener la arquitectura por capas, los compañeros deben extender los siguientes archivos sin crear estructuras paralelas:

### Alexander — Bloque 2 (Propuesto): HU-07, HU-08, HU-10
1. **HU-07 (Contratar Membresía):**
   - Crear `src/api/membershipApi.js` con `createMembershipApi(payload, token)`.
   - Crear `src/services/membershipService.js`.
   - Crear modal `src/components/modals/AssignMembershipModal.jsx` reutilizando `Button`, `Modal` y los planes activos cargados desde `usePlans`.
2. **HU-08 (Cobro Presencial):**
   - Crear `src/api/paymentApi.js` con `registerPaymentApi(payload, token)` y `listPaymentsByClientApi(clientId, token)`.
   - Crear modal `src/components/modals/PaymentModal.jsx` para registrar efectivo o transferencia física.
3. **HU-10 (Renovación):**
   - Conectar endpoint de renovación al botón "Renovar" en la ficha del socio o tarjeta de membresía.
4. **Reglas para Alexander:**
   - **No crear carpetas `features/` ni duplicar `AuthProvider`, `httpClient` o `AdminLayout`.**
   - Consumir los DTOs y el token provistos por `useAuth()`.

### Jorge — Bloque 3 (Propuesto): HU-02, HU-09, HU-11, HU-12 (Corte Manual)
1. **HU-02 (Buscar y Editar Cliente):**
   - Extender `src/api/clientApi.js` agregando `updateClientApi(id, data, token)`.
   - Extender `src/pages/ClientsPage.jsx` para permitir editar datos de contacto directamente en la ficha.
2. **HU-09 (Cálculo de Vigencia) y HU-11 (Listado de Vencimientos):**
   - Crear `src/pages/ValidityPage.jsx` o agregar pestaña en socios para filtrar por estado: `Vigente`, `Próximo a Vencer (<= 5 días)`, `Vencido`.
   - Crear componente de badge semántico con icono + texto (`Vigente` verde, `Por Vencer` ámbar, `Vencido` rojo).
3. **HU-12 (Verificación Manual de Acceso):**
   - Crear pantalla `src/pages/AccessControlPage.jsx` donde el recepcionista tipea el DNI o código de socio y visualiza si el acceso está autorizado o denegado según la vigencia calculada en el backend.
   - **No implementar hardware QR ni app móvil en esta etapa.**
4. **Reglas para Jorge:**
   - La vigencia autoritativa la determina el backend con la política de fechas acordada (30 días exactos, inicio inclusivo / fin exclusivo). No recalcular reglas de negocio inconsistentes en el navegador.

---

## H. Roadmap Resumido del Proyecto GYM VIP

Consulte la planificación integral canónica en **`GYMVIP/documentos/PLAN_HU_Y_SPRINTS.md`**:

- **Sprint 1 (En curso):** Base estructural (Acosta), Contratación/Pagos (Alexander) y Consulta de Vigencias/Acceso manual (Jorge).
- **Sprint 2:** Renovaciones automáticas, excepciones autorizadas por administración, corte de membresías y reportes financieros iniciales.
- **Sprint 3:** Oferta comercial avanzada, promociones corporativas, congelamiento de membresías y gestión de convenios.
- **Sprint 4:** Notificaciones multicanal transaccionales (vía correo / WhatsApp) para avisos de cobro y bienvenida.
- **Sprint 5:** Aplicación móvil del socio (KMP) con código QR dinámico y consulta de ficha propia.
- **Sprint 6:** Auditoría de seguridad integral, pasarelas de pago online y pase a producción en nube Render.
