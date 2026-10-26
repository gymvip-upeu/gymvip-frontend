> **Incremento Alexander S1 — 26/10/2026:** HU-07/08/10 implementadas en `feature/s1-alexander-hu07-hu08-hu10`. Contratación/cobro/renovación conectadas con API y PostgreSQL real; 42 pruebas backend y build frontend correctos. Validación local PostgreSQL 18.4; Render 17, acuerdos con Jorge/Wagner y aceptación formal pendientes. Ver [estado](docs/ESTADO_ALEXANDER_SPRINT1.md) y [matriz de criterios](docs/MATRIZ_ALEXANDER_S1.md). La descripción de la entrega original de André se conserva debajo como antecedente.

# GYM VIP â€” Frontend Web (Base Funcional Sprint 1 â€” Acosta)

> **Repositorio Oficial:** [gymvip-frontend](https://github.com/gymvip-upeu/gymvip-frontend.git)
> **OrganizaciÃ³n:** `gymvip-upeu`
> **Responsable del Incremento:** Andre Acosta (Base comÃºn + HU-01, HU-04, HU-06)
> **Rama Publicada de Entrega:** `feature/s1-andre-hu01-hu04-hu06`
> **Stack Base:** React 18.3.1, Vite 6.4.4, Vanilla CSS Luxury Dark/Gold Design System, Arquitectura por Capas Generales.

---

## 1. PolÃ­tica de Ramas y Acceso al CÃ³digo

> [!IMPORTANT]
> **IMPORTANTE â€” CÃ³mo obtener la aplicaciÃ³n:**
> Las ramas `main` y `develop` han sido inicializadas con un **Ã¡rbol de archivos vacÃ­o** de acuerdo con la estrategia de integraciÃ³n diferida del equipo. Clonar `main` o `develop` no entrega el cÃ³digo funcional en esta etapa.
> Para descargar y trabajar sobre la base completa entregada por AndrÃ©:
> ```bash
> git clone https://github.com/gymvip-upeu/gymvip-frontend.git
> cd gymvip-frontend
> git checkout feature/s1-andre-hu01-hu04-hu06
> ```

- **`main`**: Contiene el commit inicial con Ã¡rbol vacÃ­o. Reservada para despliegues de producciÃ³n unificados.
- **`develop`**: Apunta inicialmente al commit vacÃ­o de `main`. Reservada para la integraciÃ³n posterior del equipo.
- **`feature/s1-andre-hu01-hu04-hu06`**: Rama oficial con la base de interfaz, diseÃ±o, componentes, vistas y validaciones de HU-01, HU-04 y HU-06.
- **Ramas de Alexander y Jorge**: DeberÃ¡n crearse a partir de `origin/feature/s1-andre-hu01-hu04-hu06` (nunca desde `develop` mientras estÃ© vacÃ­a).

---

## 2. Alcance Activo y MÃ³dulos de Interfaz

Este repositorio contiene la interfaz de usuario de la **Base Funcional Acosta**, delimitada a las tres Historias de Usuario autorizadas:

1. **Dashboard de Inicio (`HomePage.jsx`):**
   - Tarjetas de mÃ©tricas vivas conectadas al backend (Socios registrados, Planes en catÃ¡logo, Colaboradores en nÃ³mina).
   - Banner de delimitaciÃ³n de alcance del Sprint 1 y estado del sistema.
2. **HU-01 â€” Registro de Clientes (`ClientsPage.jsx`):**
   - Formulario modal de alta de socio con validaciÃ³n UX en tiempo real.
   - RestricciÃ³n estricta de mayorÃ­a de edad (â‰¥ 18 aÃ±os).
   - Soporte a respuesta HTTP 409 Conflict ante duplicados documentales.
   - Formato de DNI peruano de exactamente 8 dÃ­gitos numÃ©ricos.
   - Campos de telÃ©fono y correo opcionales.
   - Tabla paginada de socios con buscador y modal "Ver Ficha" con cÃ³digo de socio (ej. `JOA-W38DM6`).
3. **HU-04 â€” Roles y Personal (`StaffPage.jsx`):**
   - NÃ³mina de colaboradores con roles operativos (`ADMIN` / `RECEPCION`).
   - Modal de alta con contraseÃ±as enmascaradas y confirmaciÃ³n.
   - Cambio de rol y estado activo/inactivo con confirmaciÃ³n.
   - ProtecciÃ³n activa contra la inactivaciÃ³n del Ãºltimo administrador y revocaciÃ³n de sesiones.
   - Restringido en interfaz y rechazado con HTTP 403 en backend si accede `RECEPCION`.
4. **HU-06 â€” CatÃ¡logo de Planes (`PlansPage.jsx`):**
   - CatÃ¡logo tarifario responsivo con precios en Soles (PEN).
   - Indicador visual de versiones histÃ³ricas (`VersiÃ³n N`).
   - Regla inquebrantable de 30 dÃ­as para planes mensuales.
   - Mutaciones exclusivas para rol `ADMIN`: alta, ediciÃ³n de tarifa (incrementando versiÃ³n) e inactivaciÃ³n lÃ³gica.
   - Vista de solo lectura para rol `RECEPCION`.

> [!IMPORTANT]
> **DelimitaciÃ³n de Alcance â€” Tareas Pendientes:**
> - **Alexander (Parte 2):** Modales y flujos para asignaciÃ³n/contrataciÃ³n de membresÃ­as (HU-07), cobro presencial (HU-08) y renovaciÃ³n (HU-10).
> - **Jorge (Parte 3):** EdiciÃ³n de datos de contacto de socios en ficha (HU-02), badges de vigencia (HU-09), reporte de prÃ³ximos a vencer (HU-11) y pantalla de control manual de acceso en recepciÃ³n (HU-12).
> - Para el detalle exhaustivo, consulte [docs/ESTADO_FRONTEND_SPRINT1.md](docs/ESTADO_FRONTEND_SPRINT1.md).

---

## 3. Arquitectura y Stack TecnolÃ³gico

### 3.1 Versiones segÃºn Manifests y Lockfile
- **React:** `18.3.1` (segÃºn `package.json` y `package-lock.json`)
- **React DOM:** `18.3.1`
- **Vite:** `6.4.4`
- **Plugin React:** `@vitejs/plugin-react: 4.3.4`
- **Iconos:** `lucide-react: 1.16.0`
- **Gestor de Paquetes:** npm compatible con lockfile v3 (`npm ci` recomendado).

### 3.2 Estructura por Capas Generales
```
src/
â”œâ”€â”€ api/                # Transporte HTTP (apiClient.js, authApi.js, clientApi.js, planApi.js, staffApi.js)
â”œâ”€â”€ assets/             # Recursos estÃ¡ticos locales
â”œâ”€â”€ components/         # Componentes UI reutilizables (common, feedback, modals)
â”œâ”€â”€ config/             # ConfiguraciÃ³n de entorno pÃºblico (environment.js)
â”œâ”€â”€ contexts/           # Contexto reactivo global (AuthContext.jsx)
â”œâ”€â”€ hooks/              # Custom hooks desacoplados (useClients, usePlans, useStaff)
â”œâ”€â”€ pages/              # Vistas principales (HomePage, ClientsPage, PlansPage, StaffPage)
â”œâ”€â”€ routes/             # Enrutamiento y guardas de navegaciÃ³n (AppRoutes.jsx)
â”œâ”€â”€ services/           # OrquestaciÃ³n de casos de uso
â”œâ”€â”€ templates/          # Layout principal (AdminLayout, Header, Sidebar colapsable)
â”œâ”€â”€ themes/             # Tokens del sistema de diseÃ±o (tokens.js)
â”œâ”€â”€ utils/              # Funciones auxiliares puras (formatters.js, dateUtils.js)
â”œâ”€â”€ validators/         # Validadores de formularios previa peticiÃ³n HTTP
â”œâ”€â”€ App.jsx             # Punto de entrada con AuthProvider
â”œâ”€â”€ index.css           # Estilos globales y tokens CSS Vanilla Dark & Gold
â””â”€â”€ main.jsx            # Montaje createRoot
```

### 3.3 Shell y Sistema de DiseÃ±o Luxury Dark & Gold
- Paleta: Fondo (`#0B0D12`), Superficies (`#151922` / `#1D2330`), Bordes (`#303746`), Acento Dorado (`#D4AF37`, hover `#E5C158`).
- Sidebar colapsable (256px / 76px) con persistencia en `localStorage` y accesibilidad ARIA (`aria-expanded`, `aria-controls`).
- Drawer mÃ³vil (< 768px) con backdrop oscuro y tecla Escape.

---

## 4. ConfiguraciÃ³n de Entorno, Puertos y Flujo de Datos

### 4.1 Flujo Seguro de Datos
```
[Frontend (Vite :5173)] â”€â”€(HTTP/JSON)â”€â”€> [Backend (Spring Boot :8081)] â”€â”€(JDBC/TLS)â”€â”€> [PostgreSQL 17 (Render)]
```
- El frontend se comunica **exclusivamente con el backend**; nunca accede directamente a PostgreSQL.

### 4.2 ConfiguraciÃ³n `.env.example`
```properties
# Dejar vacÃ­o en desarrollo local para consumir el proxy relativo de Vite (redirige a http://localhost:8081)
# En despliegue en la nube: URL pÃºblica del backend (ej. https://gymvip-backend.onrender.com)
VITE_API_BASE_URL=
```

> [!CAUTION]
> **Seguridad Estricta:** En Vite, cualquier variable con prefijo `VITE_` se expone directamente en el cÃ³digo JavaScript compilado al cliente. **NUNCA** coloque credenciales de base de datos (`DB_PASSWORD`), claves secretas ni tokens de servicio en variables `VITE_*`.

---

## 5. Instrucciones de CompilaciÃ³n y EjecuciÃ³n

```bash
# 1. Instalar dependencias exactas del lockfile
npm ci

# 2. Iniciar servidor de desarrollo (puerto 5173)
npm run dev

# 3. Compilar bundle de producciÃ³n
npm run build

# 4. Previsualizar bundle de producciÃ³n localmente
npm run preview
```

---

## 6. Estado de VerificaciÃ³n y Pendientes

- **CompilaciÃ³n de ProducciÃ³n (`npm run build`):** **APROBADO** (0 errores, 0 warnings).
- **Prueba End-to-End en Vivo con Subagente de Navegador:** **APROBADO** (Probado contra backend en puerto 8081 y PostgreSQL 17.11 en Render; flujo completado: login demo ADMIN, navegaciÃ³n a Socios, registro de cliente `Joaquin Vega Silva` `JOA-W38DM6` con validaciÃ³n de 31 aÃ±os y datos opcionales, y confirmaciÃ³n de persistencia fÃ­sica en Render).
  - *Nota:* Esta prueba certifica el flujo real de autenticaciÃ³n y alta de socio. No se atribuye cobertura E2E exhaustiva a vistas secundarias no probadas interactivamente.
- **RevisiÃ³n Visual y de AceptaciÃ³n por Wagner:** **PENDIENTE** (Pendiente de sesiÃ³n formal de evaluaciÃ³n y firma de criterios).

Consulte la bitÃ¡cora tÃ©cnica de frontend en:
ðŸ‘‰ **[docs/ESTADO_FRONTEND_SPRINT1.md](docs/ESTADO_FRONTEND_SPRINT1.md)**

## Incremento Jorge — 26/10/2026

La rama `feature/s1-jorge-hu02-hu09-hu11-hu12` integra la base de André y la dependencia de Alexander, y añade edición/auditoría de clientes, vigencias, listado de vencimientos y verificación manual. Se mantiene el stack y el lockfile heredados. Ver [estado y pruebas de Jorge](docs/ESTADO_JORGE_SPRINT1.md), [contrato API](docs/CONTRATO_JORGE_S1.md) y [matriz de los 72 criterios](docs/MATRIZ_JORGE_S1.md). Validación técnica local realizada; revisión del equipo/Wagner y Render pendientes. No implica merge a main/develop ni despliegue.
