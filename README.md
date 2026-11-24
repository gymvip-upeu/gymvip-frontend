# GYM VIP — Frontend Web Administrativo y Operativo (`gymvip-frontend`)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![React Version](https://img.shields.io/badge/React-18.3.1-blue.svg)]()
[![Vite Version](https://img.shields.io/badge/Vite-6.4.4-purple.svg)]()
[![UI Library](https://img.shields.io/badge/Material%20UI-v5-007FFF.svg)]()
[![Charts Library](https://img.shields.io/badge/%40mui%2Fx--charts-v7.27.0-ff69b4.svg)]()
[![Branch](https://img.shields.io/badge/branch-ACOSTA--MEJORAS--Y--ACTUALIZACIONES-yellow.svg)]()
[![License](https://img.shields.io/badge/license-Academic%20Proprietary-lightgrey.svg)]()

> **Ubicación en el Workspace:** `gymvip-frontend/`  
> **Organización Oficial:** [gymvip-upeu/gymvip-frontend](https://github.com/gymvip-upeu/gymvip-frontend)  
> **Documentación Centralizada:** `../documentos/`  
> **Fecha de Actualización:** 23 de Noviembre de 2026 | Revisión Canónica v2.5

---

## 1. Nombre del Componente
**GYM VIP Web Administration & Operations Portal** (`gymvip-frontend`).

---

## 2. Propósito
Proveer la interfaz gráfica web centralizada (SPA) para la gestión operativa en recepción, la administración de personal y planes, el control de vigencias y cobros, y la visualización analítica del gimnasio **VIP CENTER FIT**, bajo el sistema de diseño Luxury Dark & Gold.

---

## 3. Responsabilidades
- **Autenticación y Sesión Segura:** Inicio de sesión con JWT, cierre de sesión remoto concurrente y bloqueo por inactividad a los 15 minutos (Lock Screen).
- **Control de Mostrador y Recepción:** Verificación de acceso en tiempo real, validación visual de coberturas, feed en vivo de marcaciones de asistencia y atención de alertas urgentes.
- **Cobranzas y Afiliación:** Cotización dinámica, cobro presencial en efectivo/tarjeta/digital con emisión de constancia `VIP-...`, renovación continua y generación de órdenes CulqiLink.
- **Tienda y Despacho:** Validación de comprobantes de pago de suplementos y entrega de pedidos mediante lectura de ticket de retiro QR.
- **Dashboard Analítico (Fase 13):** Panel ejecutivo de 5 niveles con visualizaciones `@mui/x-charts` (distribución de planes, afluencia semanal, vencimientos) con aislamiento RBAC financiero.
- **Gestión de Personal y Catálogo:** Administración de colaboradores, roles y versiones inmutables de tarifas comerciales.
- **Observabilidad:** Integración de Sentry ErrorBoundary y Performance Tracing con sanitización total de PII.

---

## 4. Arquitectura
Single Page Application (SPA) basada en componentes modulares desacoplados:
- **Enrutamiento y Guardas (`AppRoutes.jsx`):** React Router DOM v6 con rutas protegidas (`ProtectedRoute`) que evalúan autenticación y rol de usuario.
- **Gestión de Estado Global (`contexts/`):** `AuthContext` (estado de sesión, token, claims y temporizador de inactividad) y `ThemeContext` (paleta Dark & Gold, contraste y preferencias).
- **Plantillas y Layouts (`templates/`):** `AdminLayout` (Topbar institucional, Popover de preferencias, Drawer móvil y Sidebar canónico).
- **Capa de Abstracción de Red (`api/`):** `httpClient.js` con inyección de cabeceras Bearer, manejo centralizado de respuestas HTTP 401, 403, 409 y propagación tipada de errores.
- **Vistas Operativas (`pages/`):** 21 páginas especializadas orientadas a tareas de negocio.

---

## 5. Tecnologías y Versiones Reales
| Tecnología | Versión Oficial | Propósito |
|---|---|---|
| **Node.js** | 20.x LTS / 22.x | Entorno de ejecución JavaScript del desarrollador |
| **npm** | 10.x | Gestor reproducible de paquetes |
| **React** | 18.3.1 | Biblioteca declarativa de interfaz de usuario |
| **Vite** | 6.4.4 | Herramienta de compilación rápida y servidor de desarrollo |
| **Material UI (MUI)** | 5.16.x | Sistema base de componentes UI |
| **MUI X-Charts** | 7.27.0 | Gráficos SVG interactivos (PieChart, BarChart) |
| **@sentry/react** | 11.15.0 | Telemetría de errores y monitoreo de rendimiento |
| **Vanilla CSS Tokens** | Custom CSS | Variables Luxury Dark & Gold (`#0B1320`, `#D4AF37`) |

---

## 6. Estructura de Carpetas
```text
gymvip-frontend/
├── index.html                   # Entrada principal HTML con tipografía y favicon
├── package.json                 # Dependencias y scripts de ejecución
├── package-lock.json            # Bloqueo estricto de versiones
├── vite.config.js               # Configuración Vite, plugins y Sentry sourcemaps
├── vercel.json                  # Reglas de enrutamiento y reescritura SPA
├── CONTRIBUTING.md              # Estándar obligatorio de commits
├── README.md                    # Esta documentación canónica
├── src/
│   ├── main.jsx                 # Bootstrap de la aplicación y montaje en DOM
│   ├── AppRoutes.jsx            # Tabla de rutas y protección RBAC
│   ├── index.css                # Tokens CSS Dark & Gold y utilidades globales
│   ├── api/                     # Clientes HTTP (httpClient, auth, dashboardApi, etc.)
│   ├── components/              # Modales, tarjetas de cobertura, tablas y alertas
│   ├── contexts/                # AuthContext, ThemeContext
│   ├── hooks/                   # useAuth, useClients, usePlans, useAttendance, etc.
│   ├── pages/                   # 21 Vistas (HomePage, ClientsPage, CoveragePage, etc.)
│   ├── templates/               # AdminLayout, Sidebar, Header
│   └── themes/                  # Extensiones temáticas
└── tests/                       # Suites automatizadas de contratos y cliente HTTP
```

---

## 7. Funcionalidades
1. **Dashboard Analítico Multi-nivel (Fase 13):** Resumen operativo, Donut de cobertura, afluencia 7 días, vencimientos por rango y finanzas exclusivas para `ADMIN`.
2. **Directorio y Gestión de Socios (HU-01, HU-02):** Alta reactiva con ApiPeruDev, edición concurrente (409) y visor de ficha técnica.
3. **Importación Masiva de Socios (HU-06):** Procesamiento de Excel con preview interactivo, exclusión de filas y resolución de conflictos.
4. **Seguimiento de Vigencias (HU-09, HU-11):** Filtros por urgencia de vencimiento y cálculo de días restantes.
5. **Afiliación y Cobranzas (HU-07, HU-08, HU-10):** Calendario visual de vigencias, cobro en mostrador e integración CulqiLink.
6. **Verificación de Ingreso y Torniquete (HU-12, HU-13):** Mostrador de recepción con lector de asistencias y feed en tiempo real.
7. **Tienda y Despacho de Suplementos (HU-50):** Aprobación de referencias y entrega con token QR.
8. **Configuración y Canales:** Monitoreo de recordatorios WhatsApp y estado de microservicios.

---

## 8. Usuarios y Roles Correspondientes
| Rol Web | Vistas y Módulos Autorizados | Restricciones de Seguridad |
|---|---|---|
| `ADMIN` | Todas las páginas: Dashboard (con finanzas), Socios, Staff, Planes, Cobros, Despacho, Ajustes | Ninguna en la aplicación web |
| `RECEPCION` | Dashboard operativo (sin finanzas), Socios, Cobertura, Cobros, Verificación, Despacho | Sin acceso a Staff, Ajustes del sistema ni balance contable |
| `AUDITOR` | Dashboard completo, Vigencias, Libro de Auditoría y Reportes de cobranza | Modo lectura exclusivamente; sin altas ni cobros |

---

## 9. Requisitos Previos
- **Node.js:** Versión 20 LTS o 22 LTS instalada (`node -v`).
- **npm:** Versión 10+ (`npm -v`).
- **Navegador Web Moderno:** Google Chrome 120+, Mozilla Firefox 120+ o Edge.

---

## 10. Instalación desde Cero
```powershell
# 1. Clonar el repositorio
git clone https://github.com/gymvip-upeu/gymvip-frontend.git
Set-Location gymvip-frontend

# 2. Situarse en la rama de trabajo
git checkout ACOSTA-MEJORAS-Y-ACTUALIZACIONES

# 3. Instalación limpia y exacta de dependencias
npm ci
```

---

## 11. Variables de Entorno
Crear el archivo `.env` en la raíz de `gymvip-frontend/` (nunca colocar contraseñas ni secretos):
```env
# URL base de la API Backend REST
VITE_API_BASE_URL=http://localhost:8081

# Entorno de ejecución
VITE_APP_ENV=development

# Telemetría Sentry (opcional en desarrollo local)
VITE_SENTRY_DSN=https://placeholder_key@o0.ingest.sentry.io/0
```

---

## 12. Configuración Local
Asegurarse de que el backend (`gymvip-backend`) esté ejecutándose en el puerto 8081 o en la URL definida en `VITE_API_BASE_URL`.

---

## 13. Comandos de Ejecución
```powershell
# Iniciar servidor de desarrollo con recarga en caliente (HMR)
npm run dev
```
La aplicación abrirá por defecto en `http://localhost:5173`.

---

## 14. Comandos de Compilación
```powershell
# Compilación para producción optimizada
npm run build

# La salida estática se generará en la carpeta dist/
# Para previsualizar el bundle compilado localmente:
npm run preview
```

---

## 15. Pruebas
```powershell
# Ejecutar suite de pruebas de cliente HTTP, contratos y dashboard
npm test
```
*Total de pruebas ejecutadas:* 122 tests pasando satisfactoriamente.

---

## 16. Integraciones
- **gymvip-backend:** Comunicación RESTful autenticada vía JSON y tokens Bearer.
- **Sentry Cloud:** Captura automática de excepciones no controladas y rendimiento web con anonimización de datos sensibles.

---

## 17. Seguridad
- **Protección de Rutas:** Validación de token activo y redirección inmediata a `/login` o `/unauthorized`.
- **Lock Screen por Inactividad:** Detección de ausencia de interacción de usuario tras 15 minutos, requiriendo reingreso de contraseña sin perder el contexto de trabajo.
- **Sanitización de Datos:** No se almacenan contraseñas en memoria persistente; el token JWT reside en `localStorage` con expiración coordinada.

---

## 18. Despliegue
- **Plataforma Productiva:** Vercel Hosting.
- **Configuración de Enrutamiento (`vercel.json`):**
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **URL de Producción:** `https://gymvip-frontend.vercel.app`

---

## 19. Solución de Problemas Frecuentes
- **Error `Failed to fetch` o CORS:** Verificar que `gymvip-backend` esté arriba y permita el origen `http://localhost:5173` en su configuración CORS.
- **Pantalla en blanco tras actualizar:** Limpiar la caché del navegador o `localStorage` para descartar tokens antiguos incompatibles.

---

## 20. Limitaciones Conocidas
- **Sidebar:** Conforme a la Directiva de Ingeniería, el código de `Sidebar.jsx` permanece intacto; su reorganización se encuentra detallada en la propuesta formal [`documentos/propuestas/PROPUESTA_SIDEBAR.md`](../documentos/propuestas/PROPUESTA_SIDEBAR.md).

---

## 21. Enlaces hacia los Otros Repositorios
- **Backend API:** [gymvip-backend](https://github.com/gymvip-upeu/gymvip-backend)
- **App Móvil:** [gymvip-mobile](https://github.com/gymvip-upeu/gymvip-mobile)
- **Comunicaciones:** [gymvip-ms-comunicaciones](https://github.com/gymvip-upeu/gymvip-ms-comunicaciones)
- **Portal Público:** [gymvip-Landing-Page](https://github.com/gymvip-upeu/gymvip-Landing-Page)

---

## 22. Enlaces hacia Diagramas
- **Flujos Funcionales Web:** `../documentos/diagramas/09-Flujos-Funcionales/`
- **Arquitectura de Interfaz y Tokens:** `../documentos/frontend/ESTANDAR_UI_ESTILOS.md`

---

## 23. Enlaces hacia ESTADO_PROYECTO.md
- Documento Central: [`../documentos/ESTADO_PROYECTO.md`](../documentos/ESTADO_PROYECTO.md)
- Informe del Dashboard: [`../documentos/frontend/MEJORA_DASHBOARD.md`](../documentos/frontend/MEJORA_DASHBOARD.md)

---

## 24. Fecha y Revisión de Referencia
- **Fecha:** 23 de Noviembre de 2026.
- **Revisión de Ingeniería:** Consolidación Maestra Sprint 1 & 2 / Release Candidate v2.5.
- **Autoría:** Equipo de Ingeniería GYM VIP / VIP CENTER FIT.
