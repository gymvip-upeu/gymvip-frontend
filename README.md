# GYM VIP — Frontend Web (Base Funcional Sprint 1 — Acosta)

> **Repositorio Oficial:** [gymvip-frontend](https://github.com/gymvip-upeu/gymvip-frontend.git)  
> **Organización:** `gymvip-upeu`  
> **Responsable del Incremento:** Andre Acosta (Base común + HU-01, HU-04, HU-06)  
> **Rama de Desarrollo:** `base-acosta`  
> **Stack Base:** React 18, Vite 5, JavaScript (ES Modules), Vanilla CSS Design System (Dark & Gold Luxury).

---

## 1. Alcance Activo y Delimitación

Este frontend implementa la interfaz de usuario modular correspondiente al incremento asignado a Acosta:
1. **Base Común:** Cliente HTTP centralizado (`apiClient.js`) con resolución de `VITE_API_BASE_URL`, gestión reactiva de sesión y roles (`AuthContext.jsx`), navegación lateral adaptativa por permisos (`Sidebar.jsx`), y tokens visuales inspirados en el Design System Dark & Gold.
2. **HU-01 — Registrar Clientes:** Formulario de alta con validación de mayoría de edad (≥ 18 años), selección de tipo documental (DNI, CE, PASAPORTE), consentimientos legales independientes (Términos, Privacidad Ley N° 29733, Marketing Email y Marketing WhatsApp desmarcados por defecto) y listado básico de lectura de socios registrados.
3. **HU-04 — Roles y Gestión de Personal:** Pantalla administrativa `StaffView.jsx` (restringida a rol `ADMIN`): tabla del personal con estados, KPIs de cuentas activas/inactivas, modal para registrar colaboradores con rol inicial, acción para alternar roles (ADMIN / RECEPCION) y acción para inactivar cuentas con confirmación y retroalimentación de revocación de sesiones.
4. **HU-06 — Catálogo de Planes:** Catálogo de planes `PlansView.jsx`: tarjetas y tabla con estado del plan, formulario modal para crear nuevo plan con regla de duración mensual (30 días exactos), modal para actualizar precio/condiciones (generando nueva versión inmutable) y toggle para inactivación lógica. Consulta habilitada para `RECEPCION` y acciones de mutación exclusivas para `ADMIN`.

> [!IMPORTANT]
> **Delimitación de Alcance:**  
> Se han retirado del menú lateral y de las rutas activas todos los accesos a membresías activas, cobros/pagos, reportes financieros y notificaciones. No se dejan botones simulados ni mocks de módulos que corresponden a los otros compañeros de equipo.

---

## 2. Estructura Modular del Proyecto

```
src/
├── api/
│   └── apiClient.js        # Cliente Fetch desacoplado con interceptores de sesión y URL base
├── assets/                 # Recursos gráficos
├── components/
│   ├── ClientsView.jsx     # Vista de Clientes (HU-01: Alta, consentimientos, listado)
│   ├── PlansView.jsx       # Vista de Planes (HU-06: Catálogo, versionado, inactivación)
│   ├── StaffView.jsx       # Vista de Personal y Roles (HU-04: Gestión ADMIN)
│   └── Sidebar.jsx         # Menú lateral con filtrado dinámico por roles
├── context/
│   └── AuthContext.jsx     # Estado global de autenticación, usuario, rol y login/logout
├── App.jsx                 # Layout principal, gestión de vistas activas y cabecera
├── index.css               # Design System: tokens CSS, tipografía, botones, tablas y accesibilidad
└── main.jsx                # Punto de entrada de la aplicación React
```

---

## 3. Design System Dark & Gold Luxury

La interfaz implementa las especificaciones cromáticas y de accesibilidad aprobadas:
- **Fondo General:** `#0B0D12` (Negro profundo obsidiana).
- **Superficies y Tarjetas:** `#151922` (Gris carbón) y bordes `#1D2330`.
- **Acentos Dorados:** Primario `#D4AF37`, hover `#E5C158` y brillo de enfoque `#F3E5AB`.
- **Tipografía y Textos:** Primario `#F5F5F4` (Blanco marfil), secundario `#B7BECA` y tenue `#717A8C`.
- **Estados de Interfaz:** Cada vista contempla explícitamente los 4 estados:
  - **Loading:** Indicador visual sobrio de carga.
  - **Empty:** Mensajes explicativos cuando no hay registros disponibles.
  - **Error:** Alertas de error con retroalimentación del servidor (400, 401, 403, 409).
  - **Success:** Notificaciones de confirmación de operaciones.
- **Accesibilidad:** Contraste WCAG AA, objetivos táctiles mínimos de 44px (`min-height: 44px`), navegación por teclado y soporte para reducción de movimiento (`prefers-reduced-motion`).

---

## 4. Configuración de Variables de Entorno

El frontend se conecta al backend mediante una variable pública de Vite.  
Crea el archivo `.env` en la raíz de `gymvip-frontend` tomando como referencia `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

> [!CAUTION]
> **Seguridad de Variables:**  
> Ninguna credencial de base de datos, clave privada o secreto de servidor debe incluirse en variables con prefijo `VITE_`, ya que estas se compilan en el bundle público del navegador.

---

## 5. Ejecución y Build

### Requisitos
- Node.js 18+ (recomendado Node.js 22 LTS)
- npm 9+

### Instalación de Dependencias
```powershell
npm install
```

### Ejecutar en Modo Desarrollo
```powershell
npm run dev
```
La aplicación iniciará por defecto en `http://localhost:5173`.

### Compilación para Producción (Build)
```powershell
npm run build
```
**Resultado de Verificación Ejecutada:**
- Compilación Vite completada con éxito.
- Directorio `dist/` generado con bundles optimizados.
- **0 errores de sintaxis, 0 fallos de importación.**

---

## 6. Puntos de Extensión para Compañeros

1. **Vistas de Membresías y Pagos:** Crear `MembershipsView.jsx` y `PaymentsView.jsx` en `src/components/`, registrándolas en `App.jsx` y añadiendo las opciones correspondientes en `Sidebar.jsx`.
2. **Reutilización de Componentes:** Utilizar los estilos globales de `.btn-gold`, `.gym-card`, `.data-table`, `.badge` y `.modal-overlay` definidos en `src/index.css`.
3. **Consumo API:** Reutilizar `apiClient.get()`, `apiClient.post()`, `apiClient.put()` definidos en `src/api/apiClient.js`, los cuales inyectan automáticamente el token de sesión activo.
