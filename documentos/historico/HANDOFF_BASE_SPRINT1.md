# HANDOFF_BASE_SPRINT1.md — Guía de Transferencia Técnica

> **Proyecto:** GYM VIP (VIP CENTER FIT) — Sprint 1  
> **Emisor:** Andre Acosta (Base Común + HU-01, HU-04, HU-06)  
> **Receptores:** Alexander (Parte 2: HU-07, HU-08, HU-10) y Jorge (Parte 3: HU-02, HU-09, HU-11, HU-12)  
> **Rama Base de Entrega:** `base-acosta`  
> **Repositorios Oficiales:**
> - Backend: `https://github.com/gymvip-upeu/gymvip-backend.git`
> - Frontend: `https://github.com/gymvip-upeu/gymvip-frontend.git`
> **Arquitectura Backend:** Arquitectura por Capas Generales (`controller`, `dto`, `entity`, `enums`, `exception`, `mapper`, `repository`, `security`, `service`, `util`).

---

## 1. ¿Qué Entrega Esta Base Común?

Esta entrega provee el cimiento arquitectónico por capas, persistencia relacional con Flyway, seguridad RBAC estricta y diseño visual sobre el cual Alexander y Jorge construirán sus incrementos sin duplicar modelos ni alterar contratos existentes:
- **Base Backend Funcional:** Spring Boot 3.4.3 por capas, seguridad stateless basada en sesiones/tokens con control RBAC (`ADMIN`, `RECEPCION`), manejo centralizado de excepciones con códigos HTTP estándar (400, 401, 403, 404, 409), carga explícita de `.env` desacoplado y migraciones Flyway (`V1__init_schema.sql`, `V2__add_member_code_to_clients.sql`).
- **Base Frontend Funcional:** React 18 + Vite con arquitectura por capas generales (`api`, `components`, `config`, `contexts`, `hooks`, `pages`, `routes`, `services`, `templates`, `themes`, `utils`, `validators`), cliente centralizado `api/httpClient.js`, contexto reactivo `AuthContext.jsx`, navegación lateral adaptativa por permisos en `Sidebar.jsx`, y diseño integral Dark & Gold Luxury en `index.css`.
- **Historias de Usuario Operativas e Integradas (Acosta):**
  - **HU-01:** Registro de socios adultos (validación ≥ 18 años), unicidad documental compuesta `(country_code, document_type, document_number)` con HTTP 409 Conflict, generación de código de socio alfanumérico único (`MAR-8Q2L7K`) mediante `MemberCodeGenerator`, y endpoints de lectura básica (`GET /api/v1/clients`, `GET /api/v1/clients/{id}`, `GET /api/v1/clients/code/{code}`). Formulario centrado exclusivamente en datos del cliente.
  - **HU-04:** Gestión de personal para administradores (`/api/v1/accounts`), alta con hash seguro BCrypt, asignación de roles `ADMIN` o `RECEPCION`, inactivación de cuenta con revocación inmediata de sesiones activas, y salvaguarda del último administrador activo (HTTP 409 Conflict).
  - **HU-06:** Catálogo de planes, duración mensual estricta de exactamente 30 días, precios en Soles `NUMERIC(12,2) PEN`, versionado inmutable (`PlanVersion`), inactivación lógica y permisos RBAC (consulta para recepción y administrador, mutaciones exclusivas para administrador).

---

## 2. Contratos de API Disponibles (Consumo Inmediato)

| Método | Endpoint | Rol Requerido | Parámetros / Body Principal | Respuesta Éxito | Códigos de Error |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Público | `{ "email": "admin@vipcenterfit.pe", "password": "..." }` | `200 OK` (token, id, email, roles) | `401 Unauthorized` |
| `POST` | `/api/v1/auth/logout` | Autenticado | Header `Authorization: Bearer <token>` | `204 No Content` | `401 Unauthorized` |
| `GET` | `/api/v1/auth/me` | Autenticado | Header `Authorization: Bearer <token>` | `200 OK` (email, roles) | `401 Unauthorized` |
| `POST` | `/api/v1/clients` | `RECEPCION`, `ADMIN` | `{ "firstName": "Mariana", "lastName": "Torres", "countryCode": "PE", "documentType": "DNI", "documentNumber": "71234567", "birthDate": "1996-05-20", "email": "...", "phone": "..." }` | `201 Created` (ClientResponse con memberCode) | `400 Bad Request` (menor de 18 años / faltantes)<br>`409 Conflict` (documento duplicado) |
| `GET` | `/api/v1/clients` | `RECEPCION`, `ADMIN` | Query: `?query=...&page=0&size=20` | `200 OK` (Page<ClientResponse>) | `401`, `403` |
| `GET` | `/api/v1/clients/{id}` | `RECEPCION`, `ADMIN` | Path: `id` (UUID) | `200 OK` (ClientDetailResponse) | `404 Not Found` |
| `GET` | `/api/v1/clients/code/{code}` | `RECEPCION`, `ADMIN` | Path: `memberCode` (String) | `200 OK` (ClientDetailResponse) | `404 Not Found` |
| `GET` | `/api/v1/accounts` | `ADMIN` | Sin parámetros | `200 OK` (List<StaffAccountResponse>) | `403 Forbidden` |
| `POST` | `/api/v1/accounts` | `ADMIN` | `{ "email": "cajero@vipcenterfit.pe", "password": "...", "role": "RECEPCION" }` | `201 Created` (StaffAccountResponse) | `400 Bad Request`, `409 Conflict` |
| `PATCH` | `/api/v1/accounts/{id}/role` | `ADMIN` | `{ "role": "ADMIN" }` | `200 OK` | `400`, `409 Conflict` (último admin) |
| `PATCH` | `/api/v1/accounts/{id}/status` | `ADMIN` | `{ "status": "INACTIVO" }` | `200 OK` (revoca sesiones) | `400`, `409 Conflict` (último admin) |
| `POST` | `/api/v1/accounts/{id}/revoke-sessions` | `ADMIN` | Path: `id` (UUID) | `204 No Content` | `404 Not Found` |
| `GET` | `/api/v1/plans` | Público / Personal | Query opcional: `?status=ACTIVO` | `200 OK` (List<PlanResponse>) | `401`, `403` |
| `GET` | `/api/v1/plans/{id}` | Público / Personal | Path: `id` (UUID) | `200 OK` (PlanResponse) | `404 Not Found` |
| `POST` | `/api/v1/plans` | `ADMIN` | `{ "name": "Plan VIP Mensual", "description": "...", "durationDays": 30, "pricePen": 120.00, "benefits": "..." }` | `201 Created` (PlanResponse) | `400` (mensual != 30 días / precio <= 0)<br>`409 Conflict` (nombre duplicado) |
| `PUT` | `/api/v1/plans/{id}` | `ADMIN` | `{ "name": "...", "description": "...", "durationDays": 30, "pricePen": 130.00, "benefits": "..." }` | `200 OK` (genera nueva `PlanVersion`) | `404 Not Found`, `409 Conflict` |
| `PATCH`| `/api/v1/plans/{id}/status` | `ADMIN` | `{ "status": "INACTIVO" }` | `200 OK` | `400`, `404 Not Found` |

---

## 3. Gobernanza de Código y Coordinación de Migraciones

Para evitar colisiones entre los 3 integrantes, se define la siguiente política de extensiones:

| Capa / Archivo | Responsable Base | Regla de Extensión para Alexander y Jorge |
| :--- | :--- | :--- |
| `com.gymvip.entity.*` | Andre Acosta | Reutilizar `Client`, `Document`, `Account`, `Session`, `Plan`, `PlanVersion`, `AuditEvent`. Alexander añadirá `Membership` y `PaymentRecord` mapeando a las tablas existentes. |
| `com.gymvip.repository.*` | Andre Acosta | Inyectar `ClientRepository`, `PlanRepository`, etc. Agregar nuevos repositorios (`MembershipRepository`, `PaymentRecordRepository`) en esta misma capa. |
| `com.gymvip.service.*` | Andre Acosta | Reutilizar `ClientService`, `PlanService`, `AuditService`. Implementar `MembershipService` y `PaymentService` bajo `service` y `service/impl`. |
| `com.gymvip.controller.*` | Andre Acosta | Agregar `MembershipController`, `PaymentController`, `AccessVerificationController` siguiendo las convenciones REST y `@PreAuthorize`. |
| `com.gymvip.dto.*` | Andre Acosta | Agregar DTOs en `dto/request` y `dto/response`. Mantener validaciones Bean Validation (`@NotNull`, `@Positive`, etc.). |
| `com.gymvip.security.*` | Andre Acosta | **Base cerrada.** Reutilizar `TokenAuthenticationFilter` y permisos RBAC. No duplicar lógica de seguridad. |
| `src/main/resources/db/migration/` | Andre Acosta | **Append-only.** `V1` y `V2` son inmutables. Próxima migración coordinada: **`V3__...sql`**. |

---

## 4. Instrucciones de Arranque para los Compañeros

### Paso 1: Clonar y Situarse en la Rama de Entrega
```bash
git clone https://github.com/gymvip-upeu/gymvip-backend.git
cd gymvip-backend
git checkout base-acosta

git clone https://github.com/gymvip-upeu/gymvip-frontend.git
cd gymvip-frontend
git checkout base-acosta
```

### Paso 2: Configurar y Levantar Backend
```powershell
cd gymvip-backend
Copy-Item .env.example .env

# Configurar en .env las credenciales de PostgreSQL local o Render:
# DB_JDBC_URL=jdbc:postgresql://localhost:5432/gymvip
# DB_USERNAME=postgres
# DB_PASSWORD=postgres

# Para ejecutar suite de pruebas automáticas (usa H2 en memoria aislado para tests):
.\mvnw.cmd test

# Para iniciar la API con PostgreSQL:
.\mvnw.cmd spring-boot:run
```

*Cuentas iniciales generadas en desarrollo (`dev`):*
- **Administrador:** `admin@vipcenterfit.pe` / `Admin123!` (Rol: `ADMIN`)
- **Recepción:** `recepcion@vipcenterfit.pe` / `Recepcion123!` (Rol: `RECEPCION`)

### Paso 3: Configurar y Levantar Frontend
```powershell
cd gymvip-frontend
Copy-Item .env.example .env
npm install
npm run dev
```
Abrir navegador en `http://localhost:5173` e iniciar sesión con las credenciales de personal.

---

## 5. Tareas Específicas Asignadas a Alexander y Jorge

### Alexander — Parte 2 (HU-07, HU-08, HU-10):
- **HU-07 — Asignación y Contratación de Plan:** Vincular socio con `PlanVersion` congelada, período de vigencia y generación atómica de membresía con cobro.
- **HU-08 — Registro de Pagos Presenciales:** Registro de cobros en efectivo, tarjeta o transferencias en `payment_records`, vinculados a la membresía contratada y con rollback ante fallos.
- **HU-10 — Renovación de Membresías:** Aplicar renovación de 30 días exactos consumiendo la política de fechas compartida preparada por Jorge. Idempotencia y auditoría.
- **Frontend:** Implementar vistas de contratación, cobro presencial y renovación en el layout Dark & Gold existente.
- **Modelado:** Continuar la coordinación del análisis y modelado UML general del proyecto.

### Jorge — Parte 3 (HU-02, HU-09, HU-11, HU-12 Corte Manual):
- **HU-02 — Búsqueda y Edición de Socios:** Filtros avanzados, consulta y actualización de contactos/ficha de socio reutilizando `ClientService` y `ClientRepository`.
- **HU-09 — Consulta de Vigencia y Estados:** Cálculo riguroso de vigencia (30 días exactos, inicio inclusivo / fin exclusivo, sin `plusMonths`), estado VIGENTE, PRÓXIMO A VENCER y VENCIDO.
- **HU-11 — Reporte Operativo de Vencimientos:** Bandeja de recepción de socios próximos a vencer para gestión de renovación.
- **HU-12 — Verificación Manual de Acceso en Recepción:** Pantalla rápida para recepcionista donde se digita el `memberCode` o documento y se constata visualmente si el socio tiene membresía vigente o deniega el paso.
- **Frontend:** Vistas de búsqueda, ficha editable, reporte de vencimientos y pantalla de control de acceso manual en recepción.
