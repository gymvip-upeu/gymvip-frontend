# MODELOS_BASE_ACTUAL.md — Modelos de Software (Base Activa)

> **Proyecto:** GYM VIP (VIP CENTER FIT)  
> **Alcance:** Base Funcional Sprint 1 — Incremento Acosta (HU-01, HU-04, HU-06)  
> **Nota Metodológica:** Alexander mantiene la responsabilidad general del modelado UML del equipo. Este documento contiene los modelos representativos de la base implementada y probada por Acosta, utilizando sintaxis Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`).

---

## 1. Modelo de Negocio (Flujos Operativos)

### 1.1 Flujo de Registro de Clientes y Consentimientos (HU-01)
```mermaid
flowchart TD
    Inicio([Inicio: Socio solicita inscripción]) --> Datos[Recepción ingresa nombres, documento y fecha de nacimiento]
    Datos --> ValidaEdad{¿Es mayor de 18 años?}
    ValidaEdad -- No --> RechazaEdad[Rechazo: Registro restringido a mayores de edad - HTTP 400]
    ValidaEdad -- Sí --> Consentimientos[Socio toma conocimiento de Términos y Privacidad Ley N° 29733]
    Consentimientos --> Marketing{¿Autoriza marketing opcional por Email/WhatsApp?}
    Marketing -- Sí --> MarcaOpcionales[Registra consentimientos otorgados como verdaderos]
    Marketing -- No --> DejaDesmarcados[Registra consentimientos como falsos]
    MarcaOpcionales --> PersisteCliente
    DejaDesmarcados --> PersisteCliente[Guarda Cliente y Consentimientos en transacción atómica]
    PersisteCliente --> ValidaUnicidad{¿Existe documento en el país?}
    ValidaUnicidad -- Sí --> ErrorDuplicado[Conflicto: Documento ya registrado - HTTP 409]
    ValidaUnicidad -- No --> ExitoCliente[Socio registrado con éxito - HTTP 201]
```

### 1.2 Flujo de Modificación y Versionado de Planes (HU-06)
```mermaid
flowchart TD
    InicioPlan([Inicio: Administrador edita plan]) --> ReglaMes{¿Es plan mensual?}
    ReglaMes -- Sí --> Check30{¿Duración es exactamente 30 días?}
    Check30 -- No --> Error30[Rechazo: Planes mensuales deben durar exactamente 30 días - HTTP 400]
    Check30 -- Sí --> GeneraVersion[Genera nueva PlanVersion inmutable con precio y condiciones]
    ReglaMes -- No --> GeneraVersion
    GeneraVersion --> GuardaPlan[Actualiza Plan y persiste nueva versión en BD]
    GuardaPlan --> ExitoPlan[Plan actualizado con nueva versión - HTTP 200]
```

---

## 2. Modelo de Requerimientos (Casos de Uso Aproximados)

*Nota:* Dado que Mermaid no ofrece una sintaxis formal nativa para diagramas de casos de uso UML (`usecase`), se utiliza `flowchart` estructurado como aproximación funcional con estereotipos.

```mermaid
flowchart LR
    subgraph Actores
        Admin["👤 Administrador"]
        Recepcion["👤 Recepcionista"]
    end

    subgraph CasosDeUso["Casos de Uso del Incremento (Sprint 1 - Acosta)"]
        UC01["(UC-01: Registrar Cliente y Consentimientos)"]
        UC02["(UC-02: Consultar Ficha Básica de Cliente)"]
        UC04_1["(UC-04.1: Listar Personal del Gimnasio)"]
        UC04_2["(UC-04.2: Registrar Nuevo Colaborador)"]
        UC04_3["(UC-04.3: Modificar Rol de Colaborador)"]
        UC04_4["(UC-04.4: Inactivar Colaborador y Revocar Sesiones)"]
        UC06_1["(UC-06.1: Consultar Catálogo de Planes)"]
        UC06_2["(UC-06.2: Crear Nuevo Plan y Tarifa)"]
        UC06_3["(UC-06.3: Actualizar Precio y Generar Versión)"]
        UC06_4["(UC-06.4: Inactivar Plan Comercial)"]
    end

    Recepcion --> UC01
    Recepcion --> UC02
    Recepcion --> UC06_1

    Admin --> UC01
    Admin --> UC02
    Admin --> UC04_1
    Admin --> UC04_2
    Admin --> UC04_3
    Admin --> UC04_4
    Admin --> UC06_1
    Admin --> UC06_2
    Admin --> UC06_3
    Admin --> UC06_4
```

---

## 3. Diagramas de Secuencia (Interacciones Críticas)

### 3.1 Registrar Cliente Exitoso vs Duplicado Compuesto (HU-01)
```mermaid
sequenceDiagram
    autonumber
    actor Rec as Recepcionista
    participant UI as ClientsView (React)
    participant API as ClientController (Spring)
    participant Svc as ClientService
    participant Repo as ClientRepository
    participant DB as PostgreSQL / H2

    Rec->>UI: Ingresa datos (DNI 12345678, PER, mayor de edad) y consentimientos
    UI->>API: POST /api/v1/clients (Payload JSON)
    API->>Svc: registerClient(cmd)
    Svc->>Svc: Validar edad >= 18
    Svc->>Repo: existsByCountryCodeAndDocumentTypeAndDocumentNumber("PER", "DNI", "12345678")
    Repo->>DB: SELECT COUNT(*) WHERE country_code='PER' AND doc_type='DNI' AND doc_num='12345678'
    DB-->>Repo: 0 (No existe)
    Svc->>Repo: save(Client + List<ClientConsent>)
    Repo->>DB: INSERT INTO clients ... ; INSERT INTO client_consents ...
    DB-->>Repo: Confirmado (UUID generado)
    Svc-->>API: ClientResponse
    API-->>UI: HTTP 201 Created
    UI-->>Rec: Muestra confirmación y actualiza tabla

    Note over Rec,DB: Escenario Alternativo: Documento Duplicado Concurrente
    Rec->>UI: Intenta registrar mismo DNI 12345678
    UI->>API: POST /api/v1/clients
    API->>Svc: registerClient(cmd)
    Svc->>Repo: save(Client)
    Repo->>DB: INSERT INTO clients ...
    DB-->>Repo: Error Violación Constraint UK_CLIENT_DOCUMENT
    Repo-->>API: DataIntegrityViolationException
    API-->>UI: HTTP 409 Conflict {"message": "Ya existe un cliente con ese documento"}
    UI-->>Rec: Alerta de conflicto preservando datos en el formulario
```

### 3.2 Inactivar Colaborador con Revocación de Sesiones y Protección Último Admin (HU-04)
```mermaid
sequenceDiagram
    autonumber
    actor Adm as Administrador
    participant UI as StaffView (React)
    participant API as AccountController
    participant Svc as AccountManagementService
    participant AccRepo as AccountRepository
    participant SessRepo as SessionRepository
    participant DB as PostgreSQL

    Adm->>UI: Clic en "Inactivar" colaborador
    UI->>API: PUT /api/v1/accounts/{id}/status {"status": "INACTIVO"}
    API->>Svc: updateStatus(id, "INACTIVO")
    Svc->>AccRepo: findById(id)
    AccRepo-->>Svc: Account
    alt Es el único Administrador Activo
        Svc->>AccRepo: countActiveAdmins()
        AccRepo-->>Svc: 1
        Svc-->>API: ConflictException("No se puede inactivar al último administrador activo")
        API-->>UI: HTTP 409 Conflict
        UI-->>Adm: Alerta: Operación rechazada para salvaguardar el sistema
    else Colaborador secundario
        Svc->>Svc: account.setStatus("INACTIVO")
        Svc->>AccRepo: save(account)
        Svc->>SessRepo: revokeByAccountId(id, now())
        SessRepo->>DB: UPDATE user_sessions SET revoked_at=now() WHERE account_id=id
        DB-->>SessRepo: Sesiones invalidadas
        Svc-->>API: AccountResponse
        API-->>UI: HTTP 200 OK
        UI-->>Adm: Actualiza estado en tabla e informa revocación de sesiones
    end
```

### 3.3 Control de Permisos: Recepción intenta crear un Plan (Rechazo 403 Forbidden)
```mermaid
sequenceDiagram
    autonumber
    actor Rec as Recepcionista
    participant UI as PlansView (React)
    participant Filter as SessionTokenFilter
    participant API as PlanController
    
    Note over Rec,UI: Recepcionista intenta invocar mutación administrativa
    Rec->>UI: Petición forzada POST /api/v1/plans
    UI->>Filter: POST /api/v1/plans [Header: Token de RECEPCION]
    Filter->>Filter: Valida token y establece SecurityContext (ROLE_RECEPCION)
    Filter->>API: Invoca createPlan()
    API->>API: Verifica @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    API-->>UI: HTTP 403 Forbidden {"error": "Acceso denegado: rol insuficiente"}
    UI-->>Rec: Notificación de permiso denegado
```

---

## 4. Máquinas de Estado

### 4.1 Estados de Cuenta Institucional (`AccountStatus`)
```mermaid
stateDiagram-v2
    [*] --> ACTIVO : Alta de Colaborador por ADMIN
    ACTIVO --> INACTIVO : Inactivación por ADMIN (Revoca sesiones activas)
    INACTIVO --> ACTIVO : Reactivación autorizada por ADMIN
    ACTIVO --> ACTIVO : Cambio de rol (ADMIN <-> RECEPCION)
    note right of INACTIVO
        Rechaza cualquier intento de login
        e invalida tokens existentes en tiempo real.
    end note
```

### 4.2 Estados y Ciclo de Vida del Plan Comercial (`PlanStatus` y `PlanVersion`)
```mermaid
stateDiagram-v2
    [*] --> ACTIVO_v1 : Alta de Plan (Genera Version 1)
    ACTIVO_v1 --> ACTIVO_v2 : Modificación de Tarifa/Condiciones (Genera Version 2 inmutable)
    ACTIVO_v2 --> INACTIVO : Inactivación Lógica (Oculto para nuevas ventas)
    INACTIVO --> ACTIVO_v2 : Reactivación comercial
    note right of ACTIVO_v2
        Las membresías históricas conservan
        el vínculo a la versión que contrataron.
    end note
```

---

## 5. Trazabilidad Completa: HU → Caso → Componente → Endpoint → Tabla → Prueba

| HU | Caso de Uso | Componentes Principales | Endpoint HTTP | Tablas de Persistencia | Suite de Prueba Verificada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-01** | UC-01 Registro Socio Adulto | `ClientController`<br>`ClientService` / `ClientServiceImpl`<br>`ClientsView.jsx` | `POST /api/v1/clients` | `clients`<br>`documents`<br>`audit_events` | `ClientIntegrationTest` |
| **HU-01** | UC-02 Lectura y Ficha Básica | `ClientController`<br>`ClientService` / `ClientServiceImpl`<br>`ClientsView.jsx` | `GET /api/v1/clients`<br>`GET /api/v1/clients/{id}`<br>`GET /api/v1/clients/code/{code}` | `clients`<br>`documents` | `ClientIntegrationTest` |
| **HU-04** | UC-04.1 Listar Personal | `AccountController`<br>`AccountService` / `AccountServiceImpl`<br>`StaffView.jsx` | `GET /api/v1/accounts` | `accounts`<br>`account_roles` | `AccountManagementIntegrationTest` |
| **HU-04** | UC-04.2 Alta de Personal | `AccountController`<br>`AccountService` / `AccountServiceImpl`<br>`StaffView.jsx` | `POST /api/v1/accounts` | `accounts`<br>`account_roles`<br>`audit_events` | `AccountManagementIntegrationTest` |
| **HU-04** | UC-04.3 Modificar Rol | `AccountController`<br>`AccountService` / `AccountServiceImpl`<br>`StaffView.jsx` | `PATCH /api/v1/accounts/{id}/role` | `accounts`<br>`account_roles`<br>`audit_events` | `AccountManagementIntegrationTest` |
| **HU-04** | UC-04.4 Inactivar y Revocar | `AccountController`<br>`AccountService` / `AccountServiceImpl`<br>`StaffView.jsx` | `PATCH /api/v1/accounts/{id}/status`<br>`POST /api/v1/accounts/{id}/revoke-sessions` | `accounts`<br>`sessions`<br>`audit_events` | `AccountManagementIntegrationTest` |
| **HU-06** | UC-06.1 Consultar Planes | `PlanController`<br>`PlanService` / `PlanServiceImpl`<br>`PlansView.jsx` | `GET /api/v1/plans`<br>`GET /api/v1/plans/{id}` | `plans`<br>`plan_versions` | `PlanIntegrationTest` |
| **HU-06** | UC-06.2 Crear Plan y Tarifa | `PlanController`<br>`PlanService` / `PlanServiceImpl`<br>`PlansView.jsx` | `POST /api/v1/plans` | `plans`<br>`plan_versions`<br>`audit_events` | `PlanIntegrationTest` |
| **HU-06** | UC-06.3 Nueva Versión Plan | `PlanController`<br>`PlanService` / `PlanServiceImpl`<br>`PlansView.jsx` | `PUT /api/v1/plans/{id}` | `plans`<br>`plan_versions`<br>`audit_events` | `PlanIntegrationTest` |
| **HU-06** | UC-06.4 Inactivar Plan | `PlanController`<br>`PlanService` / `PlanServiceImpl`<br>`PlansView.jsx` | `PATCH /api/v1/plans/{id}/status` | `plans`<br>`audit_events` | `PlanIntegrationTest` |
