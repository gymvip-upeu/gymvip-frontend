# Catálogo de Contratos y Endpoints de API — GYM VIP

> **Ubicación Canónica:** `gymvip-frontend/documentos/APIDOCUMENTATION.md`  
> **Versión de API:** v1 (`/api/v1`)  
> **Servidor Base:** `http://localhost:8081`  
> **Fecha de Actualización:** 30 de Octubre de 2026  
> **Referencias Históricas:** [`historico/API_CONTRACTS.md`](./historico/API_CONTRACTS.md)

Todos los endpoints operativos de GYM VIP requieren comunicación segura mediante JSON y utilizan el prefijo autoritativo `/api/v1`. La autenticación se realiza mediante tokens Bearer opacos (UUID) gestionados en la tabla de sesiones activas.

---

## 1. Módulo de Autenticación y Sesión (`/api/v1/auth`)

### 1.1 Iniciar Sesión / Desbloquear Sesión
- **Ruta:** `POST /api/v1/auth/login`
- **Rol Requerido:** Público (Cualquier colaborador activo)
- **Descripción:** Valida credenciales contra hash BCrypt y genera una sesión activa con token UUID de 24 horas. Se utiliza tanto para el login inicial como para el desbloqueo de sesión por inactividad.
- **Request Body:**
```json
{
  "email": "admin@vipcenterfit.pe",
  "password": "Password123!"
}
```
- **Respuestas:**
  - `200 OK`:
  ```json
  {
    "token": "7b8f9e2d1c4a4b5e8f1a2b3c4d5e6f7a",
    "accountId": 1,
    "email": "admin@vipcenterfit.pe",
    "roles": ["ADMIN"]
  }
  ```
  - `401 Unauthorized`:
  ```json
  {
    "message": "Credenciales de acceso incorrectas"
  }
  ```
  - `401 Unauthorized` (cuenta inactiva):
  ```json
  {
    "message": "La cuenta de acceso se encuentra inactiva"
  }
  ```

### 1.2 Cerrar Sesión
- **Ruta:** `POST /api/v1/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Respuestas:**
  - `204 No Content`: Sesión eliminada de base de datos.

### 1.3 Consultar Sesión Actual
- **Ruta:** `GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Respuestas:**
  - `200 OK`: Retorna `email` y lista de `roles`.
  - `401 Unauthorized`: Token no proporcionado o expirado.

---

## 2. Módulo de Clientes y Socios (`/api/v1/clients`)

### 2.1 Padrón Paginado y Búsqueda
- **Ruta:** `GET /api/v1/clients?query={texto}&page={num}&size={tam}`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** `ADMIN`, `RECEPCION`
- **Respuestas:**
  - `200 OK`:
  ```json
  {
    "content": [
      {
        "id": 101,
        "memberCode": "MAR-882314",
        "firstName": "Carlos",
        "lastName": "Mendoza",
        "email": "carlos.mendoza@email.pe",
        "phone": "+51 987 654 321",
        "birthDate": "1994-05-18",
        "version": 1,
        "createdAt": "2026-10-15T14:30:00",
        "documents": [
          { "documentType": "DNI", "documentNumber": "72849102" }
        ]
      }
    ],
    "totalPages": 5,
    "totalElements": 48,
    "number": 0
  }
  ```

### 2.2 Registrar Nuevo Socio
- **Ruta:** `POST /api/v1/clients`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** `ADMIN`, `RECEPCION`
- **Request Body:**
```json
{
  "firstName": "Lucía",
  "lastName": "Vargas",
  "email": "lucia.vargas@email.pe",
  "phone": "+51 912 345 678",
  "birthDate": "1998-11-20",
  "documents": [
    { "documentType": "DNI", "documentNumber": "45892104" }
  ]
}
```
- **Respuestas:**
  - `201 Created`: Retorna el cliente creado con su `memberCode` autogenerado y `version: 0`.
  - `400 Bad Request`: Error de validación (documento duplicado, fecha inválida).

### 2.3 Edición con Control de Concurrencia Optimista
- **Ruta:** `PUT /api/v1/clients/{id}`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** `ADMIN`, `RECEPCION`
- **Request Body:**
```json
{
  "firstName": "Lucía Andrea",
  "lastName": "Vargas",
  "email": "lucia.vargas@email.pe",
  "phone": "+51 999 888 777",
  "version": 0
}
```
- **Respuestas:**
  - `200 OK`: Cliente actualizado, `version` incrementada a 1, registro inmutable insertado en `client_audits`.
  - `409 Conflict`: Si el campo `version` no coincide con el registro actual de la base de datos (otro usuario modificó el registro previamente). El frontend captura este error para refrescar los datos sin perder información.

### 2.4 Consultar Libro de Auditoría de un Socio
- **Ruta:** `GET /api/v1/clients/{id}/audit`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** Exclusivo `ADMIN`
- **Respuestas:**
  - `200 OK`: Lista cronológica de cambios con fecha, autor de la modificación, campo alterado, valor anterior y valor nuevo.

---

## 3. Módulo de Catálogo de Planes (`/api/v1/plans`)

### 3.1 Listar Planes Vigentes
- **Ruta:** `GET /api/v1/plans`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** `ADMIN`, `RECEPCION`
- **Respuestas:**
  - `200 OK`:
  ```json
  [
    {
      "id": 1,
      "name": "Plan Black VIP Mensual",
      "price": 189.00,
      "currency": "PEN",
      "durationDays": 30,
      "version": 1,
      "active": true
    }
  ]
  ```

### 3.2 Crear / Actualizar Plan
- **Ruta:** `POST /api/v1/plans` (Crear) o `PUT /api/v1/plans/{id}` (Actualizar)
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** Exclusivo `ADMIN`
- **Nota de Versionado:** Toda actualización incrementa la versión para no alterar el historial financiero de membresías contratadas con la tarifa anterior.

---

## 4. Módulo de Personal y Cuentas (`/api/v1/accounts`)

### 4.1 Listar Nómina de Colaboradores
- **Ruta:** `GET /api/v1/accounts`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** Exclusivo `ADMIN`

### 4.2 Crear Colaborador
- **Ruta:** `POST /api/v1/accounts`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** Exclusivo `ADMIN`
- **Request Body:**
```json
{
  "email": "recepcion2@vipcenterfit.pe",
  "password": "Password123!",
  "roles": ["RECEPCION"]
}
```

### 4.3 Actualizar Rol / Inactivar Cuenta
- **Ruta:** `PATCH /api/v1/accounts/{id}/role` y `PATCH /api/v1/accounts/{id}/status`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** Exclusivo `ADMIN`
- **Protección de Seguridad:** Rechaza con `400 Bad Request` si la operación intenta revocar el rol o inactivar al último administrador con vida en el sistema.

---

## 5. Módulo de Membresías y Cobro Presencial (`/api/v1/memberships`)

### 5.1 Cobro Presencial Atómico (Venta Inicial o Renovación)
- **Ruta:** `POST /api/v1/memberships/cash-sale`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: CASH-{UUID}` (Obligatorio para evitar doble cobro)
- **Roles:** `ADMIN`, `RECEPCION`
- **Request Body:**
```json
{
  "clientId": 101,
  "planId": 1,
  "paymentMethod": "EFECTIVO",
  "amount": 189.00,
  "currency": "PEN"
}
```
- **Respuestas:**
  - `201 Created`:
  ```json
  {
    "membershipId": 402,
    "clientId": 101,
    "receiptNumber": "VIP-20261030-00402",
    "startDate": "2026-10-30",
    "endDate": "2026-11-29",
    "policy": "Cobertura por 30 días calendario",
    "amountPaid": 189.00,
    "currency": "PEN"
  }
  ```
  - `409 Conflict`: Transacción rechazada si la clave de idempotencia ya fue procesada o si existe una condición inconsistente.

---

## 6. Módulo de Cobertura y Verificación de Acceso (`/api/v1/coverage`)

### 6.1 Resumen y Filtro de Vigencias
- **Ruta:** `GET /api/v1/coverage/summary?query={texto}&state={VIGENTE|POR_VENCER|VENCIDO}&page={num}`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** `ADMIN`, `RECEPCION`

### 6.2 Verificación Manual en Mostrador
- **Ruta:** `GET /api/v1/coverage/verify-access?clientId={id}` o `?documentNumber={dni}`
- **Headers:** `Authorization: Bearer <token>`
- **Roles:** `ADMIN`, `RECEPCION`
- **Respuestas:**
  - `200 OK` (Permitido):
  ```json
  {
    "allowed": true,
    "clientId": "101",
    "clientName": "Carlos Mendoza",
    "memberCode": "MAR-882314",
    "state": "VIGENTE",
    "message": "Acceso Autorizado. Membresía vigente hasta el 29/11/2026.",
    "checkedAt": "2026-10-30T10:15:00",
    "timezone": "America/Lima"
  }
  ```
  - `200 OK` (Denegado):
  ```json
  {
    "allowed": false,
    "clientId": "105",
    "clientName": "Ana Paredes",
    "memberCode": "MAR-119283",
    "state": "VENCIDO",
    "message": "Acceso Denegado. La membresía venció el 20/10/2026. Proceder a renovación.",
    "checkedAt": "2026-10-30T10:15:00",
    "timezone": "America/Lima"
  }
  ```

