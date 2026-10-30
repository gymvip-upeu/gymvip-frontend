# Estado del Proyecto, Trazabilidad por HU y Plan de Entrega — GYM VIP

> **Ubicación Canónica:** `gymvip-frontend/documentos/ESTADO_PROYECTO.md`  
> **Incremento:** Sprint 1 — Base Operativa, Rediseño Figma y Seguridad  
> **Ramas Locales:** `feature/ajustes-diseno-documentacion-seguridad` (en ambos repositorios)  
> **Fecha de Actualización:** 30 de Octubre de 2026  
> **Referencias Históricas:** [`historico/HANDOFF_BASE_SPRINT1.md`](./historico/HANDOFF_BASE_SPRINT1.md), [`historico/COMMIT_LOG_BASE.md`](./historico/COMMIT_LOG_BASE.md), [`historico/README_ORGANIZACION_GYMVIP.md`](./historico/README_ORGANIZACION_GYMVIP.md)

---

## 1. Trazabilidad de Historias de Usuario (Sprint 1)

| HU | Nombre de Historia | Responsable | Funcionalidad Disponible | Ubicación Principal en Código | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-01** | Registro de Socios | André | Alta de socios con código determinista único `MAR-XXXXXX` y validación de documentos. | `ClientController.java`, `ClientRegisterModal.jsx` | **Aprobado** |
| **HU-02** | Edición y Auditoría de Socios | Jorge | Edición con control de concurrencia optimista (409 Conflict) y registro inmutable en libro de auditoría. | `ClientService.java`, `ClientManageModal.jsx` | **Aprobado** |
| **HU-04** | Personal y Roles | André | Alta de personal con roles `ADMIN` y `RECEPCION`, hash BCrypt y protección del último administrador. | `AccountController.java`, `StaffPage.jsx` | **Aprobado** |
| **HU-06** | Catálogo de Planes | André | Definición de tarifas estándar de 30 días en Soles (`PEN`) con versionado inmutable. | `PlanController.java`, `PlansPage.jsx` | **Aprobado** |
| **HU-07** | Contratación de Membresías | Alexander | Cálculo automático de cobertura por 30 días calendario y vinculación socio-plan. | `MembershipService.java`, `MembershipsPage.jsx` | **Aprobado** |
| **HU-08** | Cobro Presencial en Caja | Alexander | Cobro en efectivo o mostrador con clave de idempotencia obligatoria y constancia interna `VIP-...`. | `PaymentRepository.java`, `MembershipsPage.jsx` | **Aprobado** |
| **HU-10** | Renovación de Membresías | Alexander | Renovación continua que encadena la nueva vigencia a partir del vencimiento de la actual. | `MembershipService.java`, `MembershipsPage.jsx` | **Aprobado** |
| **HU-09** | Evaluación de Vigencias | Jorge | Cálculo centralizado de estados `VIGENTE`, `POR_VENCER` y `VENCIDO` en zona `America/Lima`. | `CoverageService.java`, `CoveragePage.jsx` | **Aprobado** |
| **HU-11** | Monitoreo de Vencimientos | Jorge | Filtros por urgencia de vencimiento para gestión de cobranza y fidelización de socios. | `CoverageController.java`, `CoveragePage.jsx` | **Aprobado** |
| **HU-12** | Verificación Manual en Mostrador | Jorge | Consulta instantánea por DNI o código con veredicto autoritativo (`ACCESO PERMITIDO` / `DENEGADO`). | `CoverageService.java`, `VerificationPage.jsx` | **Aprobado** |

---

## 2. Aportes Consolidados por Integrante del Equipo

1. **André (HU-01, HU-04, HU-06 y Base Común):**
   - Configuración inicial de Spring Boot 3.4.3, React 18 y Vite.
   - Migraciones Flyway V1, V2 y V3 (cuentas, clientes, documentos y planes).
   - Módulo de autenticación con tokens y protección de integridad del administrador.
2. **Alexander (HU-07, HU-08, HU-10):**
   - Migración Flyway V4 (membresías y pagos).
   - Lógica de cálculo de períodos de 30 días e idempotencia transaccional en cobros presenciales con cabecera `Idempotency-Key`.
   - Flujo de cobro y renovación de membresías en mostrador.
3. **Jorge (HU-02, HU-09, HU-11, HU-12):**
   - Migración Flyway V5 (libro de auditoría de modificaciones de socios).
   - Control de concurrencia optimista con JPA `@Version` y código HTTP 409 Conflict.
   - Cálculo autoritativo de vigencias en zona horaria `America/Lima` (UTC-5) y pantalla de verificación manual de ingreso.

---

## 3. Modificaciones y Mejoras Realizadas en este Ciclo

1. **Diseño y UX Figma Dark & Gold:**
   - Aplicación estricta del diseño centrado para la pantalla de acceso con fondo fotográfico oficial del atleta ([`hero-athlete.jpg`](../src/assets/hero-athlete.jpg)).
   - Eliminación total de accesos rápidos ("Demo ADMIN", "Demo RECEPCIÓN") y credenciales precargadas.
   - Creación de la pantalla de bloqueo por inactividad operativa ([`LockScreenModal.jsx`](../src/components/modals/LockScreenModal.jsx)) con revalidación segura contra el backend.
   - Creación de columna explícita de "Acciones" en la tabla de socios con botones independientes "Ver Ficha" (solo lectura) y "Editar" (concurrencia y auditoría).
   - Limpieza integral de terminología académica ("Sprint 1", "HU-XX") en la interfaz de usuario.
   - Sustitución de términos tributarios incorrectos por "constancia interna de cobro" y "comprobante interno".
2. **Seguridad y Pruebas:**
   - Implementación de la suite [`tests/authSession.test.js`](../tests/authSession.test.js) con 5 nuevas pruebas automatizadas para bloqueo, reautenticación y rechazo seguro (totalizando 16 pruebas aprobadas en frontend).
   - Auditoría honesta en 9 vectores clasificando pruebas ejecutadas, revisiones estáticas y tareas pendientes.
3. **Consolidación Documental Canónica:**
   - Creación de la estructura documental canónica dentro del repositorio en `gymvip-frontend/documentos/` con 7 archivos Markdown temáticos, el archivo fuente de diagramas [`c4.uml`](./c4.uml) y el archivo histórico en [`historico/`](./historico/).

---

## 4. Registro de Brechas y Próximos Pasos

### Brechas Identificadas
- **Suite de Integración Backend con Base de Datos:** Las pruebas unitarias de dominio (`CoveragePolicyTest`, `MembershipDatesTest`, `IsolationGuardTest`) pasan al 100% (9/9). Sin embargo, la suite de integración completa requiere un servicio PostgreSQL local activo con esquema `TEST_DB_SCHEMA`.
- **Rate Limiting:** Falta implementar limitador de tasa de peticiones en el backend para mitigar ataques de fuerza bruta en `/api/v1/auth/login`.

### Próximos Pasos Recomendados
1. Levantar el servicio PostgreSQL local para ejecutar la suite completa de integración en backend con `.\mvnw.cmd test`.
2. Presentar la sesión demostrativa formal ante el Product Owner (Wagner) con los repositorios en sus ramas locales `feature/ajustes-diseno-documentacion-seguridad`.
3. Una vez aprobada la revisión por el equipo, proceder con la apertura de Pull Requests hacia la rama de integración correspondiente.

