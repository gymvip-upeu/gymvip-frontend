# GYM VIP — Frontend Web (Base Funcional Sprint 1 — Acosta)

> **Repositorio Oficial:** [gymvip-frontend](https://github.com/gymvip-upeu/gymvip-frontend.git)  
> **Organización:** `gymvip-upeu`  
> **Responsable del Incremento:** Andre Acosta (Base común + HU-01, HU-04, HU-06)  
> **Rama de Desarrollo:** `base-acosta`  
> **Stack Base:** React 18, Vite 6, Vanilla CSS Luxury Dark/Gold Design System, Clean Architecture por Features.

---

## 1. Alcance Activo y Delimitación

Este repositorio contiene la interfaz de usuario de la **Base Funcional Acosta**, delimitada a las tres Historias de Usuario autorizadas:
1. **HU-01 — Registro de Clientes:** Alta modal de clientes mayores de edad (18+), unicidad documental con soporte a 409 Conflict, consulta paginada de socios y modal "Ver Ficha" con código de socio único `MAR-XXXXXX`. Se retiraron las casillas de términos y casillas de consentimiento conforme a la directriz final de UX.
2. **HU-04 — Personal y Roles:** Nómina de colaboradores, asignación de roles operativos (`ADMIN` / `RECEPCION`), protección activa contra la inactivación del último administrador y revocación de sesiones. Protegido en frontend y backend (HTTP 403 para RECEPCION).
3. **HU-06 — Catálogo de Planes:** Catálogo tarifario responsivo en Soles (PEN), visualización de versiones congeladas (`Versión N`), regla de 30 días en planes mensuales, y mutaciones exclusivas para `ADMIN` (alta, edición de tarifa incrementando versión e inactivación con confirmación). RECEPCION cuenta con vista de solo lectura.
4. **Dashboard de Inicio:** Pantalla con métricas reales leídas desde los endpoints activos (socios totales, planes activos, personal en servicio) y accesos directos.

---

## 2. Organización Clean Architecture en Frontend

Estructura modular por funcionalidades dentro de `src/`:

```
src/
├── app/
│   ├── layout/
│   │   └── AppLayout.jsx           # Shell: sidebar colapsable 256/76px, header 68px, drawer móvil
│   └── providers/
│       └── AuthProvider.jsx        # Context de autenticación, roles y manejo de 401
├── features/
│   ├── auth/                       # Autenticación de colaboradores
│   │   ├── domain/user.js
│   │   ├── infrastructure/authApi.js
│   │   └── presentation/LoginModal.jsx
│   ├── clients/                    # HU-01 Registro y consulta de socios
│   │   ├── domain/client.js
│   │   ├── infrastructure/clientApi.js
│   │   └── presentation/ (ClientsPage.jsx, ClientRegisterModal.jsx, ClientDetailModal.jsx)
│   ├── home/                       # Inicio y Métricas Reales
│   │   └── presentation/HomePage.jsx
│   ├── plans/                      # HU-06 Catálogo y tarifas
│   │   ├── domain/plan.js
│   │   ├── infrastructure/planApi.js
│   │   └── presentation/ (PlansPage.jsx, PlanModal.jsx)
│   └── staff/                      # HU-04 Personal y roles
│       ├── domain/staff.js
│       ├── infrastructure/staffApi.js
│       └── presentation/ (StaffPage.jsx, StaffModal.jsx)
├── shared/
│   ├── config/environment.js       # Lectura de VITE_API_BASE_URL pública
│   ├── http/httpClient.js          # Fetch centralizado con Authorization y 401 handler
│   └── styles/index.css            # Tokens Dark & Gold, componentes, accesibilidad
├── App.jsx                         # Ensamblador principal
└── main.jsx                        # Punto de entrada React
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
