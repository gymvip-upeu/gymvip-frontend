# ESTADO_FRONTEND_SPRINT1.md â€” Estado TÃ©cnico y Arquitectura General del Frontend

> **Proyecto:** GYM VIP (VIP CENTER FIT)
> **Componente:** Frontend Web Administrativo y de RecepciÃ³n (React 18 + Vite)
> **Responsable:** Andre Acosta
> **Fecha de IntervenciÃ³n:** 19 de Octubre de 2026
> **Rama Oficial de Entrega:** `feature/s1-andre-hu01-hu04-hu06` (descendiente del commit raÃ­z vacÃ­o de `main` y `develop`)
> **Repositorio Remoto:** `https://github.com/gymvip-upeu/gymvip-frontend.git`
> **Fuente CanÃ³nica del Proyecto:** `GYMVIP/documentos/` (en la raÃ­z del workspace, fuera de Git)

---

## A. Alcance de la IntervenciÃ³n y Estado de VerificaciÃ³n

Esta intervenciÃ³n refactoriza la estructura interna del frontend de una organizaciÃ³n modular por features a una **arquitectura por carpetas generales y responsabilidades**, manteniendo intactos los contratos HTTP con el backend Spring Boot y la estÃ©tica oficial Dark & Gold Luxury.

### DistinciÃ³n de Estados
- **Reportado:** Documentos anteriores declaraban compilaciÃ³n React exitosa y contratos con el backend en Clean Architecture modular.
- **Observado:** Se observÃ³ que el frontend contaba con carpetas `features/` (auth, clients, plans, staff, home), archivos residuales (`ESTADO_FRONTEND_BASE.md`, subcarpetas `docs/ux/`) y referencias a endpoints.
- **Probado / Ejecutado:** Se reorganizÃ³ la totalidad del cÃ³digo bajo carpetas generales (`api`, `assets`, `components`, `config`, `contexts`, `hooks`, `pages`, `routes`, `services`, `templates`, `themes`, `utils`, `validators`), se verificÃ³ la compilaciÃ³n de producciÃ³n con Vite (`npm run build` PASS en 3.38s, 64 mÃ³dulos transformados) y la ausencia de errores de resoluciÃ³n o imports rotos.
- **Depurado y Corregido (19/10/2026):**
  - CorrecciÃ³n de cÃ¡lculo de edad en `src/utils/dateUtils.js`: ahora parsea fechas `YYYY-MM-DD` de forma determinista en hora local, resolviendo el bug de desfase UTC-5 de medianoche que descalificaba a usuarios que cumplÃ­an 18 aÃ±os el dÃ­a de la consulta.
  - Ajuste de contacto en `src/validators/clientValidator.js` y `src/components/modals/ClientRegisterModal.jsx`: el telÃ©fono y correo ahora son estrictamente opcionales; el telÃ©fono se valida sÃ³lo si se ingresa (7â€“15 dÃ­gitos) y el DNI exige exactamente 8 dÃ­gitos numÃ©ricos.
  - Manejo seguro de cadenas nulas/indefinidas en `src/services/clientService.js`.
  - ValidaciÃ³n de pase diario en `src/validators/planValidator.js`: duraciÃ³n obligatoria de exactamente 1 dÃ­a.

> [!IMPORTANT]
> **LÃ­mites de Alcance:**
> - No se modificÃ³ `gymvip-backend`, su base de datos, configuraciones ni dependencias.
> - No se desarrollaron las pantallas ni la lÃ³gica de las HU de Alexander (HU-07, HU-08, HU-10) ni de Jorge (HU-02, HU-09, HU-11, HU-12).
> - No se declara concluido todo el Sprint 1 global; Ãºnicamente se entrega la base funcional del incremento Acosta.

---

## B. Estructura Final por Carpetas Generales y Responsabilidades

```
src/
â”œâ”€â”€ api/                # Transporte remoto y llamadas HTTP a endpoints REST
â”‚   â”œâ”€â”€ httpClient.js   # Wrapper fetch con base URL, inyecciÃ³n de token y manejador 401
â”‚   â”œâ”€â”€ authApi.js      # /api/v1/auth (login, logout, me)
â”‚   â”œâ”€â”€ clientApi.js    # /api/v1/clients (bÃºsqueda paginada, detalle, alta)
â”‚   â”œâ”€â”€ planApi.js      # /api/v1/plans (catÃ¡logo, detalle, alta, ediciÃ³n, estado)
â”‚   â””â”€â”€ staffApi.js     # /api/v1/accounts (nÃ³mina, alta, cambio de rol, status)
â”œâ”€â”€ assets/             # Recursos estÃ¡ticos locales
â”‚   â””â”€â”€ logo.svg        # Isotipo oficial corona GYM VIP en color dorado
â”œâ”€â”€ components/         # Componentes UI reutilizables y modales
â”‚   â”œâ”€â”€ common/         # Componentes genÃ©ricos de interfaz (Button, Badge, Alert, Modal)
â”‚   â”œâ”€â”€ feedback/       # Indicadores de estado de consulta (LoadingState, EmptyState)
â”‚   â””â”€â”€ modals/         # Modales de interacciÃ³n (LoginModal, ClientRegisterModal, ClientDetailModal, PlanModal, StaffModal)
â”œâ”€â”€ config/             # ConfiguraciÃ³n pÃºblica de entorno
â”‚   â””â”€â”€ environment.js  # Lectura segura de VITE_API_BASE_URL y metadata
â”œâ”€â”€ contexts/           # Estado reactivo global compartido
â”‚   â””â”€â”€ AuthContext.jsx # AuthProvider y useAuth (sesiÃ³n, usuario, rol y desautenticaciÃ³n)
â”œâ”€â”€ hooks/              # Hooks de estado y efectos de interfaz desacoplados
â”‚   â”œâ”€â”€ useClients.js   # Consulta, paginaciÃ³n y bÃºsqueda de socios
â”‚   â”œâ”€â”€ usePlans.js     # CatÃ¡logo, filtrado por estado y toggle de activaciÃ³n
â”‚   â””â”€â”€ useStaff.js     # NÃ³mina de colaboradores, actualizaciÃ³n de roles e inactivaciÃ³n
â”œâ”€â”€ pages/              # Pantallas principales del sistema
â”‚   â”œâ”€â”€ HomePage.jsx    # Dashboard con mÃ©tricas clave y delimitaciÃ³n de alcance
â”‚   â”œâ”€â”€ ClientsPage.jsx # PadrÃ³n de socios, bÃºsqueda por DNI/cÃ³digo, alta y ficha (HU-01)
â”‚   â”œâ”€â”€ PlansPage.jsx   # Tarifario en PEN, modal de alta/ediciÃ³n y versiones (HU-06)
â”‚   â””â”€â”€ StaffPage.jsx   # NÃ³mina de trabajadores, cambio de roles y protecciÃ³n Ãºltimo admin (HU-04)
â”œâ”€â”€ routes/             # Enrutamiento y control de vistas
â”‚   â””â”€â”€ AppRoutes.jsx   # ComposiciÃ³n de navegaciÃ³n con AdminLayout y guardas de acceso
â”œâ”€â”€ services/           # Operaciones de negocio, coordinaciÃ³n y pre-validaciÃ³n
â”‚   â”œâ”€â”€ authService.js  # Flujos de login, logout, verificaciÃ³n y comprobaciÃ³n de roles
â”‚   â”œâ”€â”€ clientService.js# OrquestaciÃ³n de alta de socios y consulta
â”‚   â”œâ”€â”€ planService.js  # OrquestaciÃ³n de planes con validaciÃ³n de duraciÃ³n y precios
â”‚   â””â”€â”€ staffService.js # OrquestaciÃ³n de colaboradores y control de cuentas
â”œâ”€â”€ templates/          # ComposiciÃ³n y estructura del layout
â”‚   â”œâ”€â”€ AdminLayout.jsx # Shell principal contenedor de Sidebar, Header y Main
â”‚   â”œâ”€â”€ Header.jsx      # Barra superior compacta (~68px) con tÃ­tulo dinÃ¡mico y perfil
â”‚   â””â”€â”€ Sidebar.jsx     # MenÃº lateral colapsable (256px / 76px) con botÃ³n de icono y drawer mÃ³vil
â”œâ”€â”€ themes/             # Tokens del sistema de diseÃ±o
â”‚   â””â”€â”€ tokens.js       # Constantes JavaScript de colores, layout y tipografÃ­a
â”œâ”€â”€ utils/              # Funciones auxiliares puras reutilizables
â”‚   â”œâ”€â”€ formatters.js   # Formato de moneda Soles (S/ PEN), fechas y documentos
â”‚   â””â”€â”€ dateUtils.js    # CÃ¡lculo determinista de edad en hora local y mayorÃ­a de edad (18+)
â”œâ”€â”€ validators/         # ValidaciÃ³n UX de formularios previa al envÃ­o HTTP
â”‚   â”œâ”€â”€ authValidator.js   # Correo institucional y contraseÃ±a requeridos
â”‚   â”œâ”€â”€ clientValidator.js # MayorÃ­a de edad (18+), DNI 8 dÃ­gitos, telÃ©fono y correo opcionales
â”‚   â”œâ”€â”€ planValidator.js   # Precio PEN > 0, duraciÃ³n > 0, 30 dÃ­as para mensualidades y 1 dÃ­a para diario
â”‚   â””â”€â”€ staffValidator.js  # ValidaciÃ³n de roles autorizados (ADMIN / RECEPCION)
â”œâ”€â”€ App.jsx             # Punto de entrada reactivo con AuthProvider
â”œâ”€â”€ index.css           # Estilos globales y tokens CSS Vanilla
â””â”€â”€ main.jsx            # Montaje React 18 createRoot
```

### QuÃ© se limpiÃ³ y reubicÃ³
- **EliminaciÃ³n modular:** Se retiraron las carpetas `src/features/`, `src/app/`, `src/shared/` y `src/context/`.
- **EliminaciÃ³n de duplicados documentales:** Se retiraron `ESTADO_FRONTEND_BASE.md` de la raÃ­z, y `COMMIT_LOG_BASE.md`, `ESTADO_FRONTEND_BASE.md`, `HANDOFF_BASE_SPRINT1.md`, `ux/DESIGN_SYSTEM.md`, `ux/FIGMA_SPECS.md` de `docs/`.
- **ConsolidaciÃ³n en la raÃ­z:** Los tokens y especificaciones Figma se consolidaron en `GYMVIP/documentos/DESIGN_SYSTEM.md`.

---

## C. Sistema de DiseÃ±o Implementado (Dark & Gold Luxury)

| Aspecto | ImplementaciÃ³n Concreta | JustificaciÃ³n / Contraste |
| :--- | :--- | :--- |
| **Fondo Principal** | `#0B0D12` (Negro profundo obsidiana) | Reduce fatiga visual en turnos prolongados de recepciÃ³n. |
| **Superficies** | Panel: `#151922`, Elevada: `#1D2330`, Campos: `#11141B` | JerarquÃ­a visual clara y opaca; sin glassmorphism detrÃ¡s de datos o tablas. |
| **Bordes** | EstÃ¡ndar: `#303746`, Foco accesible: `#D4AF37` | DelimitaciÃ³n nÃ­tida de controles (anillo de foco visible con Tab). |
| **Marca Dorada** | Primario: `#D4AF37` (Oro clÃ¡sico), Hover: `#E5C158` | Distintivo visual premium de GYM VIP; texto oscuro `#0B0D12` sobre botÃ³n dorado. |
| **TipografÃ­a** | Inter, sans-serif del sistema (`14px` base UI, `16px` lectura, `28px`/`36px` tÃ­tulos) | Alta legibilidad tÃ©cnica y soporte multi-navegador. |
| **Sidebar** | Expandido: `256px`, Plegado: `76px` | Alternable mediante botÃ³n de **solo icono** con tooltip, `aria-expanded` y persistencia en `localStorage`. |
| **Drawer MÃ³vil** | Abre desde la izquierda, fondo oscurecido (`drawer-backdrop`), tecla `Escape` para cerrar. | Soporte responsivo completo en smartphones (<768px). |
| **Header** | Altura compacta `68px` con tÃ­tulo de vista dinÃ¡mico y pÃ­ldora de usuario con rol. | Sin textos truncados ni scroll horizontal global. |
| **Modales** | Centrados, `role="dialog"`, `aria-modal="true"`, foco en primer campo, cierre con `Escape` y botÃ³n `âœ•`. | Formularios legibles, mensajes de error contextuales. |
| **Animaciones** | Transiciones suaves de 150â€“200ms con respeto estricto a `@media (prefers-reduced-motion: reduce)` (desactivadas a 0ms). | Experiencia sobria y accesible. |

---

## D. Estado Funcional de las HU de Acosta Conectadas a la API

### 1. HU-01: Registro y Consulta de Clientes
- **Implementado en Frontend:** Formulario modal en `ClientRegisterModal.jsx` solicitando estrictamente: Nombres, Apellidos, Tipo de Documento (DNI/CE/Pasaporte), NÃºmero de Documento (DNI de exactamente 8 dÃ­gitos), Fecha de Nacimiento, TelÃ©fono (rotulado como **Opcional**) y Correo ElectrÃ³nico (rotulado como **Opcional**). **Sin casillas de consentimiento legal ficticias.**
- **ValidaciÃ³n en Cliente:** Bloqueo inmediato con badge rojo si la fecha de nacimiento corresponde a un menor de 18 aÃ±os calculado en hora local.
- **ConexiÃ³n API:** `POST /api/v1/clients` enviando los datos limpios y normalizados. Captura de error HTTP 409 Conflict ante documento duplicado con mensaje amigable.
- **VisualizaciÃ³n:** Tabla de socios con cÃ³digo de socio (ej. `MAR-XXXXXX`), bÃºsqueda interactiva por cÃ³digo, nombre o documento, y modal `ClientDetailModal.jsx` para ver la ficha completa.
- **Pendiente:** InscripciÃ³n de menores con apoderado/tutor legal (diferida para sprints posteriores segÃºn el plan).

### 2. HU-04: NÃ³mina de Personal y GestiÃ³n de Roles
- **Implementado en Frontend:** Pantalla `StaffPage.jsx` disponible exclusivamente para usuarios con rol `ADMIN`. Recepcionistas visualizan pantalla de restricciÃ³n HTTP 403.
- **Operaciones Conectadas:**
  - `GET /api/v1/accounts`: Carga de la nÃ³mina de colaboradores.
  - `POST /api/v1/accounts`: Alta de personal con roles `ADMIN` o `RECEPCION` mediante `StaffModal.jsx`.
  - `PATCH /api/v1/accounts/{id}/role`: Modal para actualizar rol operativo.
  - `PATCH /api/v1/accounts/{id}/status`: InactivaciÃ³n de cuenta con confirmaciÃ³n explÃ­cita (envÃ­a `{"status": "INACTIVO"}`).
- **ProtecciÃ³n Ãšltimo Admin:** Si el backend responde HTTP 409 Conflict al intentar degradar o inactivar al Ãºltimo administrador, la UI captura el error y lo muestra en un banner de advertencia accesible.

### 3. HU-06: CatÃ¡logo de Planes y Tarifas
- **Implementado en Frontend:** Pantalla `PlansPage.jsx` con grid de tarjetas de tarifas en PEN.
- **Operaciones Conectadas:**
  - `GET /api/v1/plans`: Listado de planes con filtro de estado (`Todos`, `Activos`, `Inactivos`).
  - `POST /api/v1/plans`: CreaciÃ³n de tarifas con validaciÃ³n estricta de precio positivo, regla de **exactamente 30 dÃ­as** si el nombre incluye denominaciÃ³n mensual, y regla de **exactamente 1 dÃ­a** si es diario.
  - `PUT /api/v1/plans/{id}`: EdiciÃ³n que incrementa la versiÃ³n inmutable conservando el historial.
  - `PATCH /api/v1/plans/{id}/status`: Toggle de activaciÃ³n/inactivaciÃ³n con modal de confirmaciÃ³n.
- **Permisos UI:** RecepciÃ³n puede consultar tarifas pero los botones de ediciÃ³n y nuevo plan quedan ocultos (solo lectura).

---

## E. Matriz Completa del Sprint 1 (Equipo GYM VIP)

| HU | Nombre de Historia | Responsable | Estado Frontend Real | Dependencia Backend | Pendiente para Entrega del Sprint |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **HU-01** | Registrar cliente | **Acosta** | **CONECTADO & PROBADO** | `POST /api/v1/clients` | Ninguno en alcance base; menores diferidos. |
| **HU-02** | Buscar y editar cliente | **Jorge** (Propuesto) | **PENDIENTE (Base Lista)** | `PUT /api/v1/clients/{id}` | Formulario de ediciÃ³n en ficha y filtros avanzados. |
| **HU-04** | Roles y cuentas de personal | **Acosta** | **CONECTADO & PROBADO** | `GET/POST/PATCH /api/v1/accounts` | Ninguno; roles restringidos a ADMIN y RECEPCION. |
| **HU-06** | CatÃ¡logo de planes | **Acosta** | **CONECTADO & PROBADO** | `GET/POST/PUT/PATCH /api/v1/plans` | Ninguno en alcance base. |
| **HU-07** | Asignar / contratar membresÃ­a | **Alexander** (Propuesto) | **PENDIENTE** | `POST /api/v1/memberships` | Modal de selecciÃ³n de plan, perÃ­odo y asignaciÃ³n a socio. |
| **HU-08** | Registrar pago presencial | **Alexander** (Propuesto) | **PENDIENTE** | `POST /api/v1/payments` | Formulario de cobro presencial (efectivo/tarjeta) y recibo. |
| **HU-09** | Consultar vigencia | **Jorge** (Propuesto) | **PENDIENTE** | `GET /api/v1/memberships/{id}/validity` | Badges de vigencia (Vigente / Por Vencer / Vencido). |
| **HU-10** | Renovar membresÃ­a | **Alexander** (Propuesto) | **PENDIENTE** | `POST /api/v1/memberships/{id}/renew` | BotÃ³n y flujo de renovaciÃ³n de 30 dÃ­as exactos. |
| **HU-11** | Reporte prÃ³ximos a vencer | **Jorge** (Propuesto) | **PENDIENTE** | `GET /api/v1/reports/expiring` | Vista o tabla de alertas de socios por vencer. |
| **HU-12** | VerificaciÃ³n de acceso (Manual) | **Jorge** (Propuesto) | **PENDIENTE** | `POST /api/v1/access/verify` | Pantalla de control de puerta en recepciÃ³n (validaciÃ³n por DNI; QR diferido). |

---

## F. ConfiguraciÃ³n de Entorno, Comandos y Verificaciones

### Variables de Entorno (`.env.example`)
El frontend Ãºnicamente requiere una variable pÃºblica para definir la URL base de la API:
```properties
# URL pÃºblica de la API REST backend (Spring Boot)
# En desarrollo local con proxy de Vite, puede dejarse vacÃ­a ('') para usar el proxy local /api
VITE_API_BASE_URL=
```
*Si se conecta a un backend remoto:* `VITE_API_BASE_URL=https://api-gymvip.onrender.com`.
*No se versiona `.env` privado ni contiene secretos o tokens.*

### Comandos de EjecuciÃ³n
```bash
# 1. Instalar dependencias exactas
npm ci

# 2. Iniciar servidor de desarrollo (puerto 5173 por defecto)
npm run dev

# 3. Compilar bundle de producciÃ³n
npm run build

# 4. Previsualizar bundle de producciÃ³n localmente
npm run preview
```

### Resultados de VerificaciÃ³n
- **CompilaciÃ³n de ProducciÃ³n (`npm run build`):** **APROBADO** (3.38s, 64 mÃ³dulos transformados, 0 errores, 0 warnings).
- **InspecciÃ³n de Dependencias (`npm ls`):** **APROBADO** (React 18.3.1, ReactDOM 18.3.1, Vite 6.4.4, `@vitejs/plugin-react` 4.3.4 resueltos con npm 11.5.2).
- **ResoluciÃ³n de Rutas y NavegaciÃ³n:** **APROBADO** (`AppRoutes.jsx`, `AdminLayout.jsx`).
- **VerificaciÃ³n UI en Navegador en Vivo:** **APROBADO** (Probado mediante `browser_subagent` con servidor Vite local en puerto 5173; renderizado exitoso de LoginModal, tokens Dark & Gold Luxury, inputs de acceso, botones de demo y validaciones de formulario. GrabaciÃ³n de sesiÃ³n WebP y capturas PNG almacenadas en artefactos).
- **End-to-End Integrado con API Activa y PostgreSQL:** **APROBADO** (Ejecutado con backend en puerto 8081 y PostgreSQL 17.11 en Render nube mediante subagente de navegador en vivo. Flujo completo: Login con credenciales demo `admin@vipcenterfit.pe`, navegaciÃ³n a Socios, registro de nuevo socio `Joaquin Vega Silva` con DNI `78901234`, validaciÃ³n de mayorÃ­a de edad (31 aÃ±os), datos de contacto opcionales, generaciÃ³n de cÃ³digo `JOA-W38DM6` y verificaciÃ³n de persistencia en PostgreSQL de Render con ID `dc82a49b-07f8-44a4-a5a7-578fd2784b1a`. GrabaciÃ³n de sesiÃ³n: `postgres_e2e_full_verification_1792430845645.webp`, capturas: `after_submit_1792433007611.png`).

---

## G. Tareas de Alexander y Jorge (GuÃ­a de ExtensiÃ³n sobre esta Base)

Para evitar duplicaciones y mantener la arquitectura por capas, los compaÃ±eros deben extender los siguientes archivos sin crear estructuras paralelas:

### Alexander â€” Bloque 2 (Propuesto): HU-07, HU-08, HU-10
1. **HU-07 (Contratar MembresÃ­a):**
   - Crear `src/api/membershipApi.js` con `createMembershipApi(payload, token)`.
   - Crear `src/services/membershipService.js`.
   - Crear modal `src/components/modals/AssignMembershipModal.jsx` reutilizando `Button`, `Modal` y los planes activos cargados desde `usePlans`.
2. **HU-08 (Cobro Presencial):**
   - Crear `src/api/paymentApi.js` con `registerPaymentApi(payload, token)` y `listPaymentsByClientApi(clientId, token)`.
   - Crear modal `src/components/modals/PaymentModal.jsx` para registrar efectivo o transferencia fÃ­sica.
3. **HU-10 (RenovaciÃ³n):**
   - Conectar endpoint de renovaciÃ³n al botÃ³n "Renovar" en la ficha del socio o tarjeta de membresÃ­a.
4. **Reglas para Alexander:**
   - **No crear carpetas `features/` ni duplicar `AuthProvider`, `httpClient` o `AdminLayout`.**
   - Consumir los DTOs y el token provistos por `useAuth()`.

### Jorge â€” Bloque 3 (Propuesto): HU-02, HU-09, HU-11, HU-12 (Corte Manual)
1. **HU-02 (Buscar y Editar Cliente):**
   - Extender `src/api/clientApi.js` agregando `updateClientApi(id, data, token)`.
   - Extender `src/pages/ClientsPage.jsx` para permitir editar datos de contacto directamente en la ficha.
2. **HU-09 (CÃ¡lculo de Vigencia) y HU-11 (Listado de Vencimientos):**
   - Crear `src/pages/ValidityPage.jsx` o agregar pestaÃ±a en socios para filtrar por estado: `Vigente`, `PrÃ³ximo a Vencer (<= 5 dÃ­as)`, `Vencido`.
   - Crear componente de badge semÃ¡ntico con icono + texto (`Vigente` verde, `Por Vencer` Ã¡mbar, `Vencido` rojo).
3. **HU-12 (VerificaciÃ³n Manual de Acceso):**
   - Crear pantalla `src/pages/AccessControlPage.jsx` donde el recepcionista tipea el DNI o cÃ³digo de socio y visualiza si el acceso estÃ¡ autorizado o denegado segÃºn la vigencia calculada en el backend.
   - **No implementar hardware QR ni app mÃ³vil en esta etapa.**
4. **Reglas para Jorge:**
   - La vigencia autoritativa la determina el backend con la polÃ­tica de fechas acordada (30 dÃ­as exactos, inicio inclusivo / fin exclusivo). No recalcular reglas de negocio inconsistentes en el navegador.

---

## H. Roadmap Resumido del Proyecto GYM VIP

Consulte la planificaciÃ³n integral canÃ³nica en **`GYMVIP/documentos/PLAN_HU_Y_SPRINTS.md`**:

- **Sprint 1 (En curso):** Base estructural (Acosta), ContrataciÃ³n/Pagos (Alexander) y Consulta de Vigencias/Acceso manual (Jorge).
- **Sprint 2:** Renovaciones automÃ¡ticas, excepciones autorizadas por administraciÃ³n, corte de membresÃ­as y reportes financieros iniciales.
- **Sprint 3:** Oferta comercial avanzada, promociones corporativas, congelamiento de membresÃ­as y gestiÃ³n de convenios.
- **Sprint 4:** Notificaciones multicanal transaccionales (vÃ­a correo / WhatsApp) para avisos de cobro y bienvenida.
- **Sprint 5:** AplicaciÃ³n mÃ³vil del socio (KMP) con cÃ³digo QR dinÃ¡mico y consulta de ficha propia.
- **Sprint 6:** AuditorÃ­a de seguridad integral, pasarelas de pago online y pase a producciÃ³n en nube Render.

---

## I. Instrucciones para los Agentes de Alexander y Jorge (Protocolo de Relevo)

Para garantizar la consistencia de la arquitectura por capas, el sistema de diseÃ±o Dark & Gold y evitar duplicaciones en el frontend:

a) **Verificar publicaciÃ³n y commits base:** Verificar que la rama `origin/feature/s1-andre-hu01-hu04-hu06` estÃ© publicada en GitHub y comprobar la pareja de commits entregada por AndrÃ© en backend y frontend.
b) **CreaciÃ³n de ramas individuales:** Crear su rama de trabajo individual exclusivamente desde `origin/feature/s1-andre-hu01-hu04-hu06`:
   - Alexander: `feature/s1-alexander-hu07-hu08-hu10`
   - Jorge: `feature/s1-jorge-hu02-hu09-hu11-hu12`
   *NUNCA crear su rama desde `develop` ni `main`, ya que ambas ramas comienzan con un Ã¡rbol vacÃ­o y no contienen el cÃ³digo base.*
c) **Conservar cÃ³digo base heredado:** Preservar la arquitectura por capas bajo `src/`, el shell `AdminLayout`, `Header`, `Sidebar`, el sistema de tokens Luxury Dark & Gold y el cliente HTTP `apiClient.js`. **No reintroducir carpetas `features/`**.
d) **Implementar Ãºnicamente su alcance autorizado:** Limitarse estrictamente a las HU asignadas para el Sprint 1 (Alexander: HU-07, HU-08, HU-10; Jorge: HU-02, HU-09, HU-11, HU-12 manual).
e) **ValidaciÃ³n y pruebas pertinentes:** Ejecutar `npm run build` y comprobar los estados de interfaz (carga, datos, vacÃ­o, error, Ã©xito) contra el backend en puerto 8081 y PostgreSQL Render.
f) **ActualizaciÃ³n documental y commits coherentes:** Actualizar `docs/ESTADO_FRONTEND_SPRINT1.md` y crear commits atÃ³micos por funcionalidad usando rutas explÃ­citas tras revisar `git diff`.
g) **Push con upstream de su propia rama:** Publicar su rama individual mediante `git push --set-upstream origin <nombre-de-rama>` en los repositorios afectados.
h) **ComprobaciÃ³n de sincronizaciÃ³n remota:** Verificar mediante `git ls-remote --heads origin` que el hash remoto coincide con el commit local final de su entrega.
i) **Entrega de enlaces reales:** Registrar en su informe los enlaces exactos de ramas y commits creados en GitHub.
j) **ProhibiciÃ³n de fusiÃ³n prematura:** **NO fusionar todavÃ­a a `develop` ni `main`**, ni borrar ramas de compaÃ±eros. La unificaciÃ³n de ramas se realizarÃ¡ en la sesiÃ³n de integraciÃ³n coordinada por el equipo.


## Continuidad de Alexander — 26/10/2026

HU-07/08/10 añadidas en su rama individual. Ver [estado actual](ESTADO_ALEXANDER_SPRINT1.md) y [matriz](MATRIZ_ALEXANDER_S1.md). Esta actualización no atribuye a André ni a Wagner aceptación del incremento nuevo.
