# Estado de la Base Funcional Frontend — GYM VIP
**Responsable:** André Acosta  
**Fecha:** 14 de Octubre de 2026  
**Rama Git:** `base-acosta`  
**Último Commit Base:** `2b83c7b`  
**Stack Técnico:** React 18 | Vite 6 | Vanilla CSS Luxury Dark/Gold | Clean Architecture por Features  
**Consumo de API:** `VITE_API_BASE_URL` centralizada en `src/shared/http/httpClient.js`  

---

## 1. Criterios de Aceptación por Historia de Usuario (DoD)

### HU-01: Registro de Clientes
- [x] **IMPLEMENTADO OBSERVADO:** Formulario modal de alta en `ClientRegisterModal.jsx` exclusivamente con datos del cliente (nombres, apellidos, tipo y número de documento, fecha de nacimiento, teléfono y correo opcional).
- [x] **VERIFICADO:** Retiro absoluto de casillas de términos y casillas de consentimiento ficticias conforme a la última directriz de diseño.
- [x] **VERIFICADO:** Cálculo de edad en caliente (`isAdult` >= 18 años). Alerta clara en caso de menores de edad bloqueando el envío.
- [x] **VERIFICADO:** Preservación de datos en pantalla ante errores de red o conflicto 409 de documento duplicado. Prevención de doble envío (`submitting`).
- [x] **IMPLEMENTADO OBSERVADO:** Tabla de socios con columna "Acciones" conteniendo el botón "Ver Ficha" (`ClientDetailModal.jsx`). Muestra el código oficial de socio `MAR-XXXXXX` y timestamp del servidor.
- [ ] **FUERA DE ESTA BASE (HU-02 Compañero):** Edición de clientes, desactivación lógica e historial deportivo.

### HU-04: Personal y Roles Institucionales
- [x] **IMPLEMENTADO OBSERVADO:** Vista protegida `StaffPage.jsx` accesible únicamente para usuarios con rol `ADMIN`. Recepcionistas reciben pantalla de "Acceso Restringido (HTTP 403)".
- [x] **VERIFICADO:** Creación de personal con asignación de rol `ADMIN` o `RECEPCION` (`StaffModal.jsx`).
- [x] **VERIFICADO:** Modal de cambio de rol operativo y modal de confirmación para inactivar colaborador.
- [x] **VERIFICADO:** Salvaguarda informada contra la inactivación o degradación del último administrador en pantalla y controlada por el backend.
- [x] **VERIFICADO:** Cierre de sesión y revocación en tiempo real si el token es invalidado.

### HU-06: Catálogo de Planes y Tarifas
- [x] **IMPLEMENTADO OBSERVADO:** Catálogo responsivo en tarjetas con precios en Soles PEN (`formatCurrencyPen`), duración en días, beneficios y badges de versión (`Versión N`) y estado (`ACTIVO` / `INACTIVO`).
- [x] **VERIFICADO:** Filtros de catálogo por estado ("Todos", "Planes Activos", "Planes Inactivos").
- [x] **VERIFICADO:** Rol `ADMIN` cuenta con botones "Nuevo Plan", "Editar Tarifa" e "Inactivar/Activar" con confirmación sin borrado físico.
- [x] **VERIFICADO:** Rol `RECEPCION` dispone de vista de solo lectura del catálogo (sin botones de modificación).
- [x] **VERIFICADO:** Validación en modal de que planes mensuales tengan exactamente 30 días.
- [ ] **FUERA DE ESTA BASE (HU Membresías Compañero):** Asignación de plan al cliente, pasarela de pagos y renovaciones.

---

## 2. Shell de Aplicación y Diseño Dorado Luxury

- **Paleta de Tokens Oficial:**
  - Fondo: `#0B0D12`
  - Superficies: `#151922` / `#1D2330` / `#11141B`
  - Borde: `#303746`
  - Dorado de Marca: `#D4AF37`
  - Dorado Hover: `#E5C158`
  - Texto Principal: `#F5F5F4`
  - Texto Secundario: `#B7BECA`
- **Sidebar Plegable:**
  - Expandido: `256px` | Plegado: `76px`.
  - Botón solo icono (`PanelLeftClose` / `PanelLeftOpen`) con `aria-expanded`, `aria-controls="app-sidebar"` y foco visible.
  - Sin texto visible "Contraer". Tooltips contextuales en modo colapsado.
  - Persistencia de preferencia en `localStorage('gymvip_sidebar_collapsed')`.
- **Drawer Móvil (< 768px):**
  - Botón hamburger en topbar, drawer deslizante sobre backdrop oscuro.
  - Cierre automático al navegar, hacer clic en el backdrop o presionar la tecla `Escape`.
- **Header Compacto:**
  - Altura: `68px` con glassmorphism moderado (`backdrop-filter: blur(10px)`).
  - Título contextual dinámico ("Inicio", "Socios y Clientes", "Catálogo de Planes", "Personal y Roles").
  - Pill con correo del usuario activo y badge de rol dorado.
- **Pantalla de Inicio (Dashboard):**
  - Métricas reales obtenidas desde la API activa: total de socios registrados, planes activos en catálogo y colaboradores activos.
  - Accesos directos a las tres HU autorizadas.

---

## 3. Organización Clean Architecture en Frontend

```
src/
├── app/
│   ├── layout/ (AppLayout.jsx - Shell, sidebar plegable 256/76px, topbar compacto, drawer móvil)
│   └── providers/ (AuthProvider.jsx - Context de sesión, roles y desautenticación 401)
├── features/
│   ├── auth/ (domain/user.js, infrastructure/authApi.js, presentation/LoginModal.jsx)
│   ├── clients/ (domain/client.js, infrastructure/clientApi.js, presentation/ClientsPage.jsx, ClientRegisterModal.jsx, ClientDetailModal.jsx)
│   ├── home/ (presentation/HomePage.jsx - Métricas reales y accesos rápidos)
│   ├── plans/ (domain/plan.js, infrastructure/planApi.js, presentation/PlansPage.jsx, PlanModal.jsx)
│   └── staff/ (domain/staff.js, infrastructure/staffApi.js, presentation/StaffPage.jsx, StaffModal.jsx)
├── shared/
│   ├── config/ (environment.js - VITE_API_BASE_URL)
│   ├── http/ (httpClient.js - Cliente centralizado con Authorization y 401 handler)
│   └── styles/ (index.css - Tokens Dark & Gold, componentes, accesibilidad y media queries)
├── App.jsx (Ensamblador principal)
└── main.jsx (Punto de entrada React)
```

---

## 4. Verificaciones de Compilación

Comando ejecutado:
`npm run build`

Resultado:
- **`vite build`:** Éxito en 3.85 segundos.
- 48 módulos transformados sin advertencias de sintaxis.
- Bundle de producción generado limpiamente en `dist/`.
