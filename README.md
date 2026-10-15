# GYM VIP — Frontend Web (Base Funcional Sprint 1 — Acosta)

> **Repositorio Oficial:** [gymvip-frontend](https://github.com/gymvip-upeu/gymvip-frontend.git)  
> **Organización:** `gymvip-upeu`  
> **Responsable del Incremento:** Andre Acosta (Base común + HU-01, HU-04, HU-06)  
> **Rama de Desarrollo:** `base-acosta`  
> **Stack Base:** React 18, Vite 6, Vanilla CSS Luxury Dark/Gold Design System, Arquitectura por Capas Generales.

---

## 1. Alcance Activo y Delimitación

Este repositorio contiene la interfaz de usuario de la **Base Funcional Acosta**, delimitada a las tres Historias de Usuario autorizadas:
1. **HU-01 — Registro de Clientes:** Alta modal de clientes mayores de edad (18+), unicidad documental con soporte a 409 Conflict, consulta paginada de socios y modal "Ver Ficha" con código de socio determinista `MAR-XXXXXX`. Formulario enfocado en datos reales del socio, sin casillas legales ficticias.
2. **HU-04 — Personal y Roles:** Nómina de colaboradores, asignación de roles operativos (`ADMIN` / `RECEPCION`), protección activa contra la inactivación del último administrador y revocación de sesiones. Protegido en frontend y backend (HTTP 403 para RECEPCION).
3. **HU-06 — Catálogo de Planes:** Catálogo tarifario responsivo en Soles (PEN), visualización de versiones congeladas (`Versión N`), regla de 30 días obligatorios en planes mensuales, y mutaciones exclusivas para `ADMIN` (alta, edición de tarifa incrementando versión e inactivación con confirmación). RECEPCION cuenta con vista de solo lectura.
4. **Dashboard de Inicio:** Pantalla con métricas reales leídas desde los endpoints activos (socios totales, planes activos, personal en servicio) y delimitación de alcance.

> [!IMPORTANT]
> **Delimitación de Alcance:**  
> Las tareas de asignación/contratación de membresías y cobro presencial (HU-07, HU-08, HU-10) corresponden a Alexander, y la búsqueda avanzada, edición de socios, cálculo de vigencias y verificación de acceso (HU-02, HU-09, HU-11, HU-12) corresponden a Jorge. Para el detalle exhaustivo, consulte [docs/ESTADO_FRONTEND_SPRINT1.md](docs/ESTADO_FRONTEND_SPRINT1.md).

---

## 2. Organización por Capas Generales y Responsabilidades

El frontend organiza sus componentes bajo `src/` por responsabilidad técnica:

```
src/
├── api/                # Clientes de transporte HTTP y llamadas a endpoints REST
├── assets/             # Recursos estáticos locales (isotipo oficial de corona dorada)
├── components/         # Componentes UI reutilizables (common, feedback, modals)
├── config/             # Configuración pública de entorno (environment.js)
├── contexts/           # Estado reactivo global compartido (AuthContext.jsx)
├── hooks/              # Hooks desacoplados de estado y efectos (useClients, usePlans, useStaff)
├── pages/              # Pantallas principales (HomePage, ClientsPage, PlansPage, StaffPage)
├── routes/             # Enrutamiento de vistas y guardas de navegación (AppRoutes.jsx)
├── services/           # Lógica y orquestación de operaciones de negocio (auth, client, plan, staff)
├── templates/          # Composición de layout (AdminLayout, Header, Sidebar colapsable)
├── themes/             # Tokens del sistema de diseño (tokens.js)
├── utils/              # Funciones auxiliares puras de formato y fechas (formatters, dateUtils)
├── validators/         # Validación UX de formularios previa al envío HTTP
├── App.jsx             # Punto de entrada reactivo con AuthProvider
├── index.css           # Estilos globales y tokens CSS Vanilla Dark & Gold
└── main.jsx            # Montaje React 18 createRoot
```

---

## 3. Shell y Diseño Luxury Dark & Gold

- **Tokens Oficiales:**
  - Fondo: `#0B0D12` | Superficies: `#151922` / `#1D2330` | Borde: `#303746`
  - Dorado VIP: `#D4AF37` | Hover Dorado: `#E5C158`
  - Texto Principal: `#F5F5F4` | Secundario: `#B7BECA`
- **Sidebar Colapsable:**
  - Ancho expandido: `256px` | Ancho colapsado: `76px`.
  - Botón solo icono (`PanelLeftClose` / `PanelLeftOpen`) con `aria-expanded` y `aria-controls="app-sidebar"`. Sin texto visible "Contraer".
  - Persistencia en `localStorage('gymvip_sidebar_collapsed')`.
- **Drawer Móvil (< 768px):**
  - Botón menú en cabecera, drawer deslizante sobre backdrop oscuro. Cierre al navegar o presionar `Escape`.
- **Header Compacto:**
  - Altura: `68px` con glassmorphism moderado (`backdrop-filter: blur(10px)`).

---

## 4. Configuración de Entorno (.env)

El frontend solo utiliza la variable pública `VITE_API_BASE_URL`.

### `.env.example`
```properties
# Dejar vacío en local para consumir el proxy relativo de Vite (puerto 8080)
# En producción/Render: URL pública del backend (ej. https://gymvip-backend.onrender.com)
VITE_API_BASE_URL=
```

> [!CAUTION]
> **Seguridad:** Las variables con prefijo `VITE_` se empaquetan en el bundle del navegador. **NUNCA** incluya credenciales de base de datos (`DB_PASSWORD`), claves secretas ni tokens privados en este archivo.

---

## 5. Instrucciones de Ejecución y Compilación

### 5.1 Iniciar en Modo Desarrollo
```bash
npm install
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 5.2 Compilar para Producción
```bash
npm run build
```
Genera el paquete estático optimizado en la carpeta `dist/`.

---

## 6. Documentación Canónica

El documento único consolidado de estado técnico dentro del frontend se ubica en:
👉 **[docs/ESTADO_FRONTEND_SPRINT1.md](docs/ESTADO_FRONTEND_SPRINT1.md)**

La documentación integral de arquitectura, análisis, diseño y producto de GYM VIP se centraliza en la carpeta canónica de la raíz del workspace: `GYMVIP/documentos/` (`ARCHITECTURE.md`, `C4_BASE_ACTUAL.md`, `ERD_BASE_ACTUAL.md`, `DESIGN_SYSTEM.md`, `PRD.md`, `HANDOFF_BASE_SPRINT1.md`).
