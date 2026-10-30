# C4_BASE_ACTUAL.md — Modelo Arquitectónico C4 (Arquitectura por Capas)

> **Proyecto:** GYM VIP (VIP CENTER FIT)  
> **Alcance:** Base Funcional Sprint 1 — Incremento Acosta (HU-01, HU-04, HU-06)  
> **Patrón Arquitectónico Backend:** Arquitectura por Capas Generales (`controller`, `service`, `repository`, `entity`, `dto`, `mapper`, `security`, `config`, `enums`, `exception`, `util`).  
> **Notación:** Modelo C4 implementado con diagramas Mermaid estructurados.

---

## 1. Nivel 1: Diagrama de Contexto del Sistema (C1)

Muestra los usuarios institucionales activos, la frontera del sistema actual implementado y las relaciones con actores/sistemas futuros del ecosistema GYM VIP.

```mermaid
flowchart TB
    subgraph Actores["Actores Humanos"]
        Admin["👤 Administrador del Gimnasio<br><i>[Persona]</i><br>Gestiona personal, roles institucionales y catálogo de planes."]
        Recepcion["👤 Personal de Recepción<br><i>[Persona]</i><br>Registra clientes y consulta catálogo de planes."]
        ClienteFuturo["👤 Socio del Gimnasio<br><i>[Persona - FUTURO]</i><br>Acceso a reservas y portal móvil."]
    end

    subgraph SistemaActual["Frontera del Sistema GYM VIP (Base Activa Acosta)"]
        GymVipSystem["🏢 <b>Sistema de Gestión GYM VIP</b><br><i>[Sistema de Software]</i><br>Plataforma centralizada con frontend web y API REST por capas para alta de socios, catálogo de planes y administración de cuentas."]
    end

    subgraph SistemasFuturos["Sistemas Externos y Futuros (Fuera de Base de Acosta)"]
        AppMovil["📱 Aplicación Móvil Socios<br><i>[Flutter - HU Futura]</i>"]
        GatewayPagos["💳 Pasarela de Pagos<br><i>[Servicio Externo - HU Futura]</i>"]
        CommsService["💬 Plataforma de Mensajería WhatsApp<br><i>[API Meta / Twilio - HU Futura]</i>"]
    end

    Admin -->|"Administra personal y planes [HTTPS]"| GymVipSystem
    Recepcion -->|"Registra socios y consulta planes [HTTPS]"| GymVipSystem
    ClienteFuturo -.->|"Interactuará en sprints posteriores"| AppMovil
    GymVipSystem -.->|"Integraciones diferidas"| GatewayPagos
    GymVipSystem -.->|"Notificaciones diferidas"| CommsService

    classDef activeSystem fill:#151922,stroke:#D4AF37,stroke-width:2px,color:#F5F5F4;
    classDef actorStyle fill:#1D2330,stroke:#B7BECA,stroke-width:1px,color:#F5F5F4;
    classDef futureStyle fill:#0B0D12,stroke:#717A8C,stroke-width:1px,stroke-dasharray: 5 5,color:#717A8C;

    class GymVipSystem activeSystem;
    class Admin,Recepcion actorStyle;
    class ClienteFuturo,AppMovil,GatewayPagos,CommsService futureStyle;
```

---

## 2. Nivel 2: Diagrama de Contenedores (C2)

Describe los tres contenedores de software que conforman la base técnica activa y sus protocolos de comunicación.

```mermaid
flowchart TB
    subgraph Usuarios["Usuarios"]
        UserAdmin["👤 Administrador"]
        UserRecepcion["👤 Recepcionista"]
    end

    subgraph Contenedores["Arquitectura de Contenedores GYM VIP"]
        WebApp["🌐 <b>Single Page Application</b><br><i>[React 18 + Vite / JavaScript]</i><br>Interfaz Dark & Gold con módulos para clientes, planes y gestión de personal."]
        BackendApi["⚙️ <b>API Backend por Capas</b><br><i>[Spring Boot 3.4.3 / Java 21-24]</i><br>Servicios REST organizados por capas: controller, service, repository, entity, security, mapper."]
        Database[("🗄️ <b>Base de Datos Relacional</b><br><i>[PostgreSQL 16 / Render]</i><br>Persistencia relacional con esquema versionado por Flyway.")]
    end

    UserAdmin -->|"Interactúa con UI [HTTPS]"| WebApp
    UserRecepcion -->|"Interactúa con UI [HTTPS]"| WebApp
    WebApp -->|"Consume endpoints REST [JSON / Bearer Token / CORS]"| BackendApi
    BackendApi -->|"Lee y escribe datos [JDBC / HikariCP / Puerto 5432]"| Database

    classDef cont fill:#151922,stroke:#D4AF37,stroke-width:2px,color:#F5F5F4;
    classDef usr fill:#1D2330,stroke:#B7BECA,stroke-width:1px,color:#F5F5F4;
    classDef db fill:#0B0D12,stroke:#E5C158,stroke-width:2px,color:#F5F5F4;

    class WebApp,BackendApi cont;
    class UserAdmin,UserRecepcion usr;
    class Database db;
```

---

## 3. Nivel 3: Diagrama de Componentes Backend (C3 — Arquitectura por Capas)

Estructura interna de `gymvip-backend` organizada por capas horizontales de responsabilidad:

```mermaid
flowchart TB
    subgraph SecurityLayer["Capa de Seguridad (com.gymvip.security)"]
        TokenFilter["TokenAuthenticationFilter<br><i>[Filtro Bearer / X-Auth-Token]</i>"]
        SecConfig["SecurityConfig<br><i>[RBAC, CORS y SecurityFilterChain]</i>"]
    end

    subgraph ControllerLayer["Capa de Controladores (com.gymvip.controller)"]
        ClientCtrl["ClientController<br><i>[/api/v1/clients]</i>"]
        AccountCtrl["AccountController<br><i>[/api/v1/accounts]</i>"]
        AuthCtrl["AuthController<br><i>[/api/v1/auth]</i>"]
        PlanCtrl["PlanController<br><i>[/api/v1/plans]</i>"]
    end

    subgraph ServiceLayer["Capa de Servicios y Negocio (com.gymvip.service / service.impl)"]
        ClientSvc["ClientService / ClientServiceImpl<br><i>[Validación edad >= 18, código socio, unicidad]</i>"]
        AccountSvc["AccountService / AccountServiceImpl<br><i>[BCrypt, último admin, revocación sesiones]</i>"]
        AuthSvc["AuthService / AuthServiceImpl<br><i>[Validación credenciales, emisión sesiones]</i>"]
        PlanSvc["PlanService / PlanServiceImpl<br><i>[Regla 30 días mensual, versionado inmutable]</i>"]
        AuditSvc["AuditService / AuditServiceImpl<br><i>[Trazabilidad de operaciones]</i>"]
    end

    subgraph MapperLayer["Capa de Mappers (com.gymvip.mapper)"]
        ClientMap["ClientMapper<br><i>[DTO <-> Entity]</i>"]
        AccountMap["AccountMapper<br><i>[DTO <-> Entity]</i>"]
        PlanMap["PlanMapper<br><i>[DTO <-> Entity / Snapshot]</i>"]
    end

    subgraph RepositoryLayer["Capa de Repositorios (com.gymvip.repository)"]
        ClientRepo["ClientRepository<br><i>[Spring Data JPA]</i>"]
        DocRepo["DocumentRepository<br><i>[Spring Data JPA]</i>"]
        AccountRepo["AccountRepository<br><i>[Spring Data JPA]</i>"]
        SessionRepo["SessionRepository<br><i>[Spring Data JPA]</i>"]
        PlanRepo["PlanRepository<br><i>[Spring Data JPA]</i>"]
        PlanVerRepo["PlanVersionRepository<br><i>[Spring Data JPA]</i>"]
        AuditRepo["AuditEventRepository<br><i>[Spring Data JPA]</i>"]
    end

    subgraph EntityLayer["Capa de Entidades JPA (com.gymvip.entity)"]
        ClientEnt["Client & Document"]
        AccountEnt["Account & Session"]
        PlanEnt["Plan & PlanVersion"]
        AuditEnt["AuditEvent"]
    end

    subgraph DatabaseLayer["Persistencia"]
        FlywayMig["Flyway Migration Engine<br><i>[V1, V2]</i>"]
        Postgres[(PostgreSQL)]
    end

    %% Relaciones de llamada entre capas
    TokenFilter --> SessionRepo
    TokenFilter --> AccountRepo
    SecConfig --> TokenFilter

    ClientCtrl --> ClientSvc
    AccountCtrl --> AccountSvc
    AuthCtrl --> AuthSvc
    PlanCtrl --> PlanSvc

    ClientSvc --> ClientMap
    ClientSvc --> ClientRepo
    ClientSvc --> DocRepo
    ClientSvc --> AuditSvc

    AccountSvc --> AccountMap
    AccountSvc --> AccountRepo
    AccountSvc --> SessionRepo
    AccountSvc --> AuditSvc

    AuthSvc --> AccountRepo
    AuthSvc --> SessionRepo

    PlanSvc --> PlanMap
    PlanSvc --> PlanRepo
    PlanSvc --> PlanVerRepo
    PlanSvc --> AuditSvc

    AuditSvc --> AuditRepo

    %% Relaciones repositorio a BD
    ClientRepo --> Postgres
    DocRepo --> Postgres
    AccountRepo --> Postgres
    SessionRepo --> Postgres
    PlanRepo --> Postgres
    PlanVerRepo --> Postgres
    AuditRepo --> Postgres
    FlywayMig --> Postgres

    classDef ctrl fill:#1D2330,stroke:#D4AF37,stroke-width:1px,color:#F5F5F4;
    classDef svc fill:#151922,stroke:#3B82F6,stroke-width:1px,color:#F5F5F4;
    classDef repo fill:#0B0D12,stroke:#10B981,stroke-width:1px,color:#F5F5F4;
    classDef sec fill:#2D1B36,stroke:#EC4899,stroke-width:1px,color:#F5F5F4;
    classDef db fill:#0B0D12,stroke:#E5C158,stroke-width:2px,color:#F5F5F4;

    class ClientCtrl,AccountCtrl,AuthCtrl,PlanCtrl ctrl;
    class ClientSvc,AccountSvc,AuthSvc,PlanSvc,AuditSvc,ClientMap,AccountMap,PlanMap svc;
    class ClientRepo,DocRepo,AccountRepo,SessionRepo,PlanRepo,PlanVerRepo,AuditRepo repo;
    class TokenFilter,SecConfig sec;
    class Postgres,FlywayMig db;
```

---

## 4. Diagrama Histórico de Referencia (Clean Architecture previa)

> [!NOTE]
> Este diagrama refleja la estructura modular previa (`clients`, `identity`, `plans`, `audit`, `shared`) conservado con fines de trazabilidad histórica:

```mermaid
flowchart LR
    subgraph ModuloPrevio["Estructura Modular Anterior (HISTÓRICA)"]
        direction TB
        API_MOD["api/ (Controllers, DTOs)"] --> APP_MOD["application/ (UseCases, Ports)"]
        APP_MOD --> DOM_MOD["domain/ (Models, Exceptions)"]
        APP_MOD --> INF_MOD["infrastructure/ (JPA Entities, Repositories, Adapters)"]
    end
```
