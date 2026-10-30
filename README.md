# GYM VIP — Frontend Web

> **Sistema:** GYM VIP (VIP Center Fit) — Gestión Integral de Gimnasio Luxury Fitness<br>
> **Repositorio:** [gymvip-frontend](https://github.com/gymvip-upeu/gymvip-frontend.git)<br>
> **Rama documentada:** `feature/s1-jorge-hu02-hu09-hu11-hu12`<br>
> **Estado del incremento:** Base consolidada de Sprint 1 con los aportes integrados de André Acosta, Alexander y Jorge.

---

## 1. Presentación y Estado Actual

GYM VIP es una aplicación web SPA (*Single Page Application*) orientada a la administración operativa, atención en recepción y control de socios de un centro fitness de alta gama. Este repositorio contiene la interfaz de usuario desarrollada con React 18 y Vite, utilizando un sistema de diseño propio *Luxury Dark & Gold*.

La rama actual **`feature/s1-jorge-hu02-hu09-hu11-hu12`** reúne todo el trabajo funcional frontend del Sprint 1, integrando de forma acumulativa los aportes del equipo:
1. **Base técnica y diseño base (André Acosta):** Shell responsivo (`AdminLayout`), barra lateral colapsable y drawer móvil, autenticación reactiva (`AuthContext`), catálogo de planes (HU-06), nómina de personal (HU-04) y formulario de alta de socios (HU-01).
2. **Membresías y cobros (Alexander):** Pantalla de afiliación (`MembershipsPage`), cotización con calendario visual de vigencia (HU-07), cobro presencial en efectivo y digital con constancia e idempotencia (HU-08) y flujo de renovación (HU-10).
3. **Auditoría, vigencias y control de acceso (Jorge):** Edición de datos de socios con control optimista de concurrencia e historial de auditoría campo por campo (HU-02), visualización de cobertura y alertas de vencimiento (HU-09 y HU-11 en `CoveragePage`), y verificación manual de ingreso en recepción (HU-12 en `VerificationPage`).

> [!NOTE]
> De acuerdo con la estrategia de integración diferida del equipo, las ramas `main` y `develop` conservan un árbol vacío inicial. Todo el código frontend activo de este sprint se ubica en esta rama.

---

## 2. Funcionalidades por Historia de Usuario y Responsable

A continuación se detalla la correspondencia de componentes, vistas y responsabilidades del Sprint 1:

| HU | Responsable | Funcionalidad Disponible | Ubicación Principal en el Código |
| :--- | :--- | :--- | :--- |
| **Base Común** | André | Shell principal con Sidebar colapsable y Drawer móvil para pantallas < 768px. Autenticación con persistencia en `localStorage`, redirección segura por rol (`ADMIN` / `RECEPCION`) y cliente HTTP desacoplado con interceptores de token. | `templates/AdminLayout.jsx`, `templates/Sidebar.jsx`, `contexts/AuthContext.jsx`, `api/httpClient.js`, `index.css` |
| **HU-01** | André | Alta y consulta de socios. Modal con validación en tiempo real (edad ≥ 18 años, DNI de 8 dígitos, teléfono y correo opcionales). Tabla paginada de clientes con buscador y modal de visualización de ficha con código de socio (ej. `JOA-W38DM6`). | `pages/ClientsPage.jsx`, `components/modals/ClientRegisterModal.jsx`, `components/modals/ClientDetailModal.jsx`, `hooks/useClients.js` |
| **HU-04** | André | Nómina de colaboradores con roles operativos (`ADMIN` / `RECEPCION`). Alta con contraseñas enmascaradas, cambio interactivo de roles y cambio de estado activo/inactivo con confirmación. Exclusivo para administradores. | `pages/StaffPage.jsx`, `components/modals/StaffModal.jsx`, `hooks/useStaff.js`, `api/staffApi.js` |
| **HU-06** | André | Catálogo tarifario responsivo en Soles (PEN). Indicador visual de versiones históricas (`Versión N`), regla estricta de 30 días para planes mensuales. Edición de tarifa e inactivación lógica solo para rol `ADMIN`. | `pages/PlansPage.jsx`, `components/modals/PlanModal.jsx`, `hooks/usePlans.js`, `api/planApi.js` |
| **HU-07** | Alexander | Contratación de membresías para clientes existentes con planes activos. Cotización interactiva, resumen comercial con snapshot de condiciones y componente visual de calendario. | `pages/MembershipsPage.jsx`, `components/common/MembershipCalendar.jsx`, `api/membershipApi.js` |
| **HU-08** | Alexander | Registro de cobro presencial en efectivo, tarjeta o billeteras digitales (Yape/Plin). Emisión de constancia interna (`VIP-...`), conservación de operaciones inciertas en `sessionStorage` para reintentos idempotentes. | `pages/MembershipsPage.jsx`, `api/membershipApi.js` |
| **HU-10** | Alexander | Renovación anticipada o vencida con soporte de cambio de plan para el nuevo periodo. Historial de periodos y cobros anteriores por cliente. | `pages/MembershipsPage.jsx`, `api/membershipApi.js` |
| **HU-02** | Jorge | Edición de datos del cliente (nombres, apellidos, documento, teléfono y correo) para `ADMIN` y `RECEPCION` en `ClientManageModal.jsx`. Control de concurrencia con detección de conflicto (409) conservando datos del formulario. Pestaña de historial de cambios auditados (`client_changes`) disponible exclusivamente para `ADMIN`. | `components/modals/ClientManageModal.jsx`, `pages/ClientsPage.jsx`, `hooks/useClients.js`, `api/jorgeApi.js`, `themes/jorge.css` |
| **HU-09** | Jorge | Indicadores visuales de estado de cobertura basados en la evaluación autoritativa del servidor (`VIGENTE`, `POR_VENCER`, `VENCIDO`, `CANCELADA`, `SIN_MEMBRESIA`). Badges y tarjetas informativas con fechas exactas de inicio y fin. | `components/common/CoverageCard.jsx`, `pages/CoveragePage.jsx`, `themes/jorge.css` |
| **HU-11** | Jorge | Pantalla de seguimiento de vigencias (`CoveragePage.jsx`) con filtros por texto/código, plan, estado (filtro `ALERTAS` por defecto) y rango de fechas. Ordenamiento por urgencia de vencimiento y conservación de filtros al navegar a renovar en `MembershipsPage`. | `pages/CoveragePage.jsx`, `api/jorgeApi.js` |
| **HU-12** | Jorge | Pantalla de verificación manual de acceso en recepción (`VerificationPage.jsx`). Búsqueda de socio y validación inmediata contra el servidor; limpieza de permisos anteriores ante errores de red o nueva búsqueda para evitar autorizaciones falsas. | `pages/VerificationPage.jsx`, `api/jorgeApi.js` |

### Delimitación de Alcance (Fuera de este Incremento)
- No incluye componentes para aplicación móvil (KMP / Compose Multiplatform).
- No incluye integración de cámara web ni escaneo de códigos QR.
- No incluye conexión con molinetes físicos, torniquetes o marcación automática de asistencia.
- No incluye pasarelas de pago electrónico en línea (Webpay, Stripe) ni controladores de hardware POS.
- No incluye vistas de inventario, ventas de tienda ni reportería financiera de Sprint 2.

---

## 3. Arquitectura y Stack Tecnológico

### 3.1 Versiones según Manifiesto y Lockfile
- **React:** `18.3.1` (según `package.json` y `package-lock.json`).
- **React DOM:** `18.3.1`.
- **Vite:** `6.4.4` (versión resuelta en `package-lock.json`; especificación `^6.2.0` en `package.json`).
- **Plugin React de Vite:** `@vitejs/plugin-react: 4.3.4`.
- **Estilos:** Vanilla CSS con variables nativas y sistema de diseño Dark & Gold.
- **Gestor de paquetes:** `npm` compatible con lockfile v3 (`npm ci`).

> [!IMPORTANT]
> **Aclaración sobre Dependencias de UI:** Este proyecto **NO utiliza `lucide-react`, `framer-motion` ni librerías pesadas de componentes externos**. Toda la iconografía se renderiza mediante elementos SVG nativos en línea y emojis, optimizando el tamaño del paquete compilado y eliminando dependencias innecesarias.

### 3.2 Estructura por Capas
```
src/
├── api/             # Clientes de transporte HTTP (apiClient, authApi, clientApi, jorgeApi, membershipApi, planApi, staffApi)
├── assets/          # Recursos estáticos locales
├── components/      # Componentes UI reutilizables
│   ├── common/      # Alert, Badge, Button, CoverageCard, MembershipCalendar, Modal
│   ├── feedback/    # LoadingState y spinners
│   └── modals/      # ClientDetailModal, ClientManageModal, ClientRegisterModal, LoginModal, PlanModal, StaffModal
├── config/          # Configuración de variables públicas (environment.js)
├── contexts/        # Estado reactivo global de autenticación (AuthContext.jsx)
├── hooks/           # Custom hooks desacoplados (useClients, usePlans, useStaff)
├── pages/           # Vistas principales (HomePage, ClientsPage, CoveragePage, VerificationPage, MembershipsPage, PlansPage, StaffPage)
├── routes/          # Definición de rutas y control de acceso (AppRoutes.jsx)
├── templates/       # Plantilla de diseño general (AdminLayout, Header, Sidebar)
├── themes/          # Hojas de estilo y tokens de diseño (tokens.js, jorge.css, memberships.css)
├── utils/           # Funciones puras auxiliares (dateUtils, formatters)
├── validators/      # Validaciones del lado del cliente antes del envío HTTP
├── App.jsx          # Componente raíz envuelto en AuthProvider
├── index.css        # Estilos globales y tokens CSS Dark & Gold
└── main.jsx         # Punto de entrada y montaje con ReactDOM.createRoot
```

### 3.3 Sistema de Diseño Luxury Dark & Gold
- **Paleta de Colores:** Fondo profundo (`#0B0D12`), Superficies elevadas (`#151922` / `#1D2330`), Bordes (`#303746`), Acento Dorado VIP (`#D4AF37`, hover `#E5C158`), Estados de alerta (`#EF4444`, `#F59E0B`, `#10B981`).
- **Barra Lateral:** Colapsable (256px / 76px) con persistencia en `localStorage` y atributos ARIA de accesibilidad (`aria-expanded`, `aria-controls`).
- **Drawer Móvil:** Activación para resoluciones menores a 768px con oscurecimiento de fondo y cierre mediante tecla `Escape`.

### 3.4 Flujo de Datos Seguro
```
[Frontend (Vite :5173)] ──(HTTP/JSON)──> [Backend (Spring Boot :8081)] ──(JDBC/TLS)──> [PostgreSQL 17]
```
El frontend interactúa **exclusivamente con la API REST del backend** mediante tokens de sesión. Nunca se conecta directamente al motor de base de datos.

---

## 4. Requisitos y Configuración Segura

### 4.1 Requisitos Previos
- **Node.js:** Versión 20.x o superior LTS (verificado en Node 22.x).
- **npm:** Versión 10.x o superior.

### 4.2 Variables de Entorno (`.env`)
En desarrollo local, el archivo `vite.config.js` incluye un proxy que redirige automáticamente todas las peticiones con prefijo `/api` a `http://localhost:8081`.

Plantilla de configuración (`.env.example`):
```properties
# Dejar vacío en desarrollo local para utilizar el proxy automático de Vite (:5173 -> :8081)
# En despliegue en la nube: URL base pública de la API backend (ej. https://gymvip-backend.onrender.com)
VITE_API_BASE_URL=
```

> [!CAUTION]
> **Seguridad Estricta en Frontend:** Todas las variables con prefijo `VITE_` son embebidas en el bundle compilado de JavaScript accesible públicamente por cualquier usuario. **NUNCA** incluya credenciales de base de datos (`DB_PASSWORD`), cadenas de conexión JDBC, contraseñas de personal ni secretos de firma en archivos del frontend.

---

## 5. Cómo Ejecutar y Probar

Los scripts oficiales configurados en `package.json` son:

```bash
# 1. Instalar dependencias exactas según el lockfile
npm ci

# 2. Iniciar el servidor local de desarrollo (puerto 5173)
npm run dev

# 3. Ejecutar las pruebas automatizadas de cliente HTTP y lógica
npm test

# 4. Ejecutar específicamente las pruebas de transporte de membresías
npm test:membership

# 5. Compilar el paquete optimizado para producción
npm run build

# 6. Previsualizar localmente el paquete de producción compilado
npm run preview
```

---

## 6. Estado de Verificación y Pendientes

### 6.1 Implementado en Código en esta Rama
- ✅ **Shell y autenticación:** Layout responsivo, navegación controlada por roles, login modal y tokens.
- ✅ **HU-01, HU-04, HU-06 (André):** Registro de clientes, nómina de staff y catálogo tarifario con versionado.
- ✅ **HU-07, HU-08, HU-10 (Alexander):** Afiliación con calendario, cobro presencial multimoneda e idempotencia, y renovación continua.
- ✅ **HU-02, HU-09, HU-11, HU-12 (Jorge):** Edición con auditoría en `ClientManageModal.jsx`, badges de vigencia, vista de vencimientos con filtros en `CoveragePage.jsx` y verificación manual en `VerificationPage.jsx`.

### 6.2 Pruebas Ejecutadas en este Entorno
- **Pruebas automatizadas (`npm test`):** **APROBADO** (11 pruebas ejecutadas con el runner nativo de Node; 11 pass, 0 fail, 0 canceled).
  - 6 pruebas de Jorge (`tests/jorgeApi.test.js`): control de respuestas truncadas, manejo de fallos de red sin autorizaciones falsas, preservación de errores 409 para el formulario y codificación de filtros.
  - 5 pruebas de Alexander (`tests/membershipApi.test.js`): respuestas parciales, retención de clave de idempotencia, manejo de conflictos y propagación de fallos de red.
- **Compilación de producción (`npm run build`):** **APROBADO** (74 módulos transformados, 0 errores, 0 warnings; bundle generado en `dist/` en 7.67s).

### 6.3 Pruebas Reportadas en Documentos Técnicos Previos
- **Validación E2E en Chrome por Jorge (26/10/2026):** Edición de cliente con concurrencia optimista (409), visualización de auditoría para `ADMIN`, verificación manual de acceso con rechazo seguro y navegación con persistencia de filtros al ir a renovar. Comprobado en viewport de escritorio y móvil (390px).
- **Validación E2E de Alexander (26/10/2026):** Contratación en efectivo y renovación con Yape mediante Vite 5173 → Spring Boot 8081 → PostgreSQL local con emisión de constancias `VIP-...`.
- **Validación E2E de André (19/10/2026):** Flujo completo de login, alta de socio y comprobación de persistencia contra PostgreSQL 17.11 en Render.

### 6.4 Pendientes de Aceptación Formal
- **Revisión Visual y de Aceptación por el Product Owner (Wagner):** Presentación formal de interfaces, experiencia de usuario y validación de criterios de aceptación con el cliente/patrocinador.
- **Validación E2E en Entorno Cloud Oficial:** Verificación integral del frontend conectado al backend y PostgreSQL 17.11 desplegados en Render.
- **Revisión de Código e Integración:** Aprobación entre pares (*code review*) y posterior integración de la rama del sprint a `develop` y `main` (sin realizar fusiones en esta fase).

---

## 7. Documentación Técnica Detallada

Para consultar el detalle de contratos de interfaz, matrices de criterios de aceptación y bitácoras del frontend:
- [Contrato de Interfaces y Flujos de Jorge (HU-02, 09, 11, 12)](docs/CONTRATO_JORGE_S1.md)
- [Estado Técnico de Jorge y Resultados Frontend](docs/ESTADO_JORGE_SPRINT1.md)
- [Matriz de Criterios de Aceptación de Jorge (72 criterios)](docs/MATRIZ_JORGE_S1.md)
- [Estado Técnico de Alexander (HU-07, 08, 10)](docs/ESTADO_ALEXANDER_SPRINT1.md)
- [Matriz de Criterios de Alexander (54 criterios)](docs/MATRIZ_ALEXANDER_S1.md)
- [Bitácora de Frontend de André (Base Funcional)](docs/ESTADO_FRONTEND_SPRINT1.md)
