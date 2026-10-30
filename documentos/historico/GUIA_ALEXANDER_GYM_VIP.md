# GUIA_ALEXANDER_GYM_VIP.md — Guía de Implementación para Alexander (Sprint 1)

> **Proyecto:** GYM VIP (VIP CENTER FIT S.A.C.)  
> **Developer:** Alexander  
> **Alcance Asignado (Sprint 1):** Parte 2 — HU-07 (Asignar membresía), HU-08 (Registro de pagos presenciales), HU-10 (Renovación de membresías)  
> **Rama Base de Partida:** `origin/feature/s1-andre-hu01-hu04-hu06`  
> **Rama Individual de Trabajo:** `feature/s1-alexander-hu07-hu08-hu10`  
> **Fecha de Emisión:** 19 de octubre de 2026  

---

## 1. Instrucciones de Inicio para el Agente de Alexander

1. **Verificar publicación de la base de André:**
   ```bash
   git fetch origin
   git log -n 1 origin/feature/s1-andre-hu01-hu04-hu06
   ```
2. **Crear tu rama de trabajo individual (NUNCA desde `develop` ni `main` mientras estén vacías):**
   ```bash
   # En gymvip-backend:
   git checkout -b feature/s1-alexander-hu07-hu08-hu10 origin/feature/s1-andre-hu01-hu04-hu06
   
   # En gymvip-frontend:
   git checkout -b feature/s1-alexander-hu07-hu08-hu10 origin/feature/s1-andre-hu01-hu04-hu06
   ```
3. **Conservar la arquitectura base recibida:**
   - Backend: Arquitectura por capas bajo `com.gymvip.*` (`controller`, `dto`, `entity`, `enums`, `exception`, `mapper`, `repository`, `security`, `service`, `util`).
   - Frontend: Capas generales bajo `src/*` (`api`, `components`, `hooks`, `pages`, `services`, `templates`, `themes`, `utils`). **No introducir carpetas `features/` ni duplicar el shell `AdminLayout`**.
4. **Respetar el aislamiento de persistencia:**
   - Desarrollo manual: Esquema compartido `public` en PostgreSQL 17.11 Render.
   - Pruebas automatizadas de Maven: Esquema aislado `gymvip_test` (`TEST_DB_SCHEMA=gymvip_test`).

---

## 2. Historias de Usuario a Implementar

### HU-07 — Asignar y Contratar Membresías
- **Historia:** Como recepcionista o administrador, quiero asignar y formalizar la contratación de un plan de membresía a un socio registrado para habilitar su acceso a las instalaciones.
- **Entidades y Contratos:**
  - Crear entidad `Membership` en `com.gymvip.entity`.
  - Relacionar al socio (`Client`) con la instantánea inmutable del plan (`PlanVersion`).
  - La contratación y el cobro inicial deben ocurrir dentro de una **misma transacción atómica** (`@Transactional`) con reversión completa ante fallos.
  - Soportar clave de idempotencia (`Idempotency-Key` en cabecera HTTP) para evitar cobros o contrataciones duplicadas ante reintentos de red.
- **Criterios de Aceptación (CA):**
  - HU-07-CA-01: El socio debe estar activo y no registrar una membresía vigente solapada del mismo tipo.
  - HU-07-CA-02: La membresía se asocia a la versión inmutable activa del plan (`PlanVersion`).
  - HU-07-CA-03: La contratación registra fecha de inicio, fecha de fin calculada, tarifa pactada y usuario responsable.
- **Definición de Hecho (DoD):**
  - Transacción atómica demostrada; rollback verificado si el pago falla.
  - Pruebas de integración con PostgreSQL real en esquema `gymvip_test`.

### HU-08 — Registro de Pagos Presenciales
- **Historia:** Como recepcionista, quiero registrar los cobros presenciales de membresías en efectivo o tarjeta para liquidar la contratación y emitir comprobante de pago.
- **Entidades y Contratos:**
  - Crear entidad `PaymentRecord` en `com.gymvip.entity`, vinculada a `Membership` y `Account` (recepcionista que cobra).
  - Métodos de pago permitidos: `EFECTIVO`, `TARJETA`, `YAPE_PLIN`.
  - Guardar comprobante / código de referencia externa opcional.
  - Registrar evento de auditoría en `AuditService.recordEvent(...)`.
- **Criterios de Aceptación (CA):**
  - HU-08-CA-01: El monto cobrado debe coincidir exactamente con el precio pactado en la versión del plan.
  - HU-08-CA-02: Se registra método de pago, fecha/hora exacta y cuenta del recepcionista.
  - HU-08-CA-03: Peticiones concurrentes con misma `Idempotency-Key` devuelven el mismo resultado sin duplicar asientos de caja.
- **Definición de Hecho (DoD):**
  - Pagos registrados en PostgreSQL Render comprobados tras reinicio.
  - Evento de auditoría generado en tabla `audit_events`.

### HU-10 — Renovación de Membresías
- **Historia:** Como recepcionista, quiero renovar una membresía por vencer o vencida aplicando la política de fechas acordada para mantener la continuidad del socio.
- **Regla de Negocio de Renovación:**
  - Consumir el componente de cálculo de fechas provisto por Jorge (HU-09).
  - Duración de exactamente 30 días.
  - Si el socio renueva **antes de vencer**: el nuevo período de 30 días inicia inmediatamente después del fin de la membresía previa.
  - Si el socio renueva **después de vencer**: el nuevo período inicia desde la fecha del pago.
- **Criterios de Aceptación (CA):**
  - HU-10-CA-01: Renovación acumulativa sin pérdida de días si la membresía previa aún está vigente.
  - HU-10-CA-02: Renovación desde hoy si la membresía previa ya expiró.
  - HU-10-CA-03: Se congela la versión tarifaria activa al momento de la renovación.

---

## 3. Coordinación de Migraciones Flyway

- Las migraciones `V1__init_schema.sql` y `V2__add_member_code_to_clients.sql` son inmutables.
- Alexander debe coordinar y crear la migración: **`V3__create_memberships_and_payments.sql`**.

---

## 4. Protocolo de Entrega y Push

a) Desarrollar y verificar con pruebas automatizadas (`.\mvnw.cmd test`).  
b) Revisar `git diff` y `git diff --check` asegurando que no existan credenciales ni `.env` en commits.  
c) Crear commits atómicos por funcionalidad con mensajes descriptivos.  
d) Publicar la rama con upstream:
   ```bash
   git push --set-upstream origin feature/s1-alexander-hu07-hu08-hu10
   ```
e) Verificar con `git ls-remote --heads origin` que el hash remoto coincide con el local.  
f) **NO fusionar todavía a `develop` ni `main`**. La unificación se realizará coordinadamente.
