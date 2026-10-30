# GUIA_JORGE_GYM_VIP.md — Guía de Implementación para Jorge (Sprint 1)

> **Proyecto:** GYM VIP (VIP CENTER FIT S.A.C.)  
> **Developer:** Jorge  
> **Alcance Asignado (Sprint 1):** Parte 3 — HU-02 (Buscar y editar socios), HU-09 (Cálculo de vigencia), HU-11 (Reporte por vencer), HU-12 (Control manual de acceso en recepción)  
> **Rama Base de Partida:** `origin/feature/s1-andre-hu01-hu04-hu06`  
> **Rama Individual de Trabajo:** `feature/s1-jorge-hu02-hu09-hu11-hu12`  
> **Fecha de Emisión:** 19 de octubre de 2026  

---

## 1. Instrucciones de Inicio para el Agente de Jorge

1. **Verificar publicación de la base de André:**
   ```bash
   git fetch origin
   git log -n 1 origin/feature/s1-andre-hu01-hu04-hu06
   ```
2. **Crear tu rama de trabajo individual (NUNCA desde `develop` ni `main` mientras estén vacías):**
   ```bash
   # En gymvip-backend:
   git checkout -b feature/s1-jorge-hu02-hu09-hu11-hu12 origin/feature/s1-andre-hu01-hu04-hu06
   
   # En gymvip-frontend:
   git checkout -b feature/s1-jorge-hu02-hu09-hu11-hu12 origin/feature/s1-andre-hu01-hu04-hu06
   ```
3. **Conservar la arquitectura base recibida:**
   - Backend: Arquitectura por capas bajo `com.gymvip.*` (`controller`, `dto`, `entity`, `enums`, `exception`, `mapper`, `repository`, `security`, `service`, `util`).
   - Frontend: Capas generales bajo `src/*` (`api`, `components`, `hooks`, `pages`, `services`, `templates`, `themes`, `utils`). **No introducir carpetas `features/` ni duplicar el shell `AdminLayout`**.
4. **Respetar el aislamiento de persistencia:**
   - Desarrollo manual: Esquema compartido `public` en PostgreSQL 17.11 Render.
   - Pruebas automatizadas de Maven: Esquema aislado `gymvip_test` (`TEST_DB_SCHEMA=gymvip_test`).

---

## 2. Historias de Usuario a Implementar

### HU-02 — Buscar y Editar Socios
- **Historia:** Como recepcionista o administrador, quiero buscar socios por nombre, código o documento y actualizar sus datos de contacto para mantener la ficha actualizada.
- **Alcance y Reglas:**
  - Extender `ClientService` y `ClientController`: `PUT /api/v1/clients/{id}`.
  - Se permite actualizar datos de contacto (`phone`, `email`).
  - **Prohibido alterar arbitrariamente el número de documento de identidad** sin procedimiento formal de rectificación.
  - Filtros avanzados en búsqueda (`ClientRepository.searchClients(...)`): por coincidencia parcial de nombres, código de socio y número de documento.
- **Criterios de Aceptación (CA):**
  - HU-02-CA-01: Búsqueda rápida por DNI, código de socio o nombre completo.
  - HU-02-CA-02: Edición segura de teléfono y correo con validación de formato si se informan.
  - HU-02-CA-03: Auditoría del recepcionista que actualizó la ficha en `AuditService`.
- **Definición de Hecho (DoD):**
  - Pruebas de integración en `gymvip_test` verificando actualización y persistencia tras reinicio.

### HU-09 — Cálculo y Consulta de Vigencia
- **Historia:** Como sistema y usuario de recepción, quiero determinar el estado de vigencia de una membresía con precisión matemática para conocer si el socio está habilitado.
- **Regla Estricta de Cálculo de Fechas:**
  - **No usar `plusMonths(1)`** debido a la variación de días de calendario.
  - 1 mes = **exactamente 30 días**.
  - Inicio inclusivo a las 00:00:00 (hora local `America/Lima`).
  - Fin inclusivo a las 23:59:59 del trigésimo día.
  - **Estados autoritativos calculados por backend:**
    - `VIGENTE`: Fecha actual dentro del rango [inicio, fin].
    - `PROXIMO_A_VENCER`: Quedan 5 días o menos para la expiración.
    - `VENCIDO`: Fecha actual posterior a la fecha de fin.
  - Proveer este servicio de cálculo como componente limpio para que Alexander lo consuma en contratación y renovación.
- **Criterios de Aceptación (CA):**
  - HU-09-CA-01: Duración mensual calculada a exactamente 30 días naturales.
  - HU-09-CA-02: Estado `PROXIMO_A_VENCER` activado cuando faltan ≤ 5 días.
  - HU-09-CA-03: Estado `VENCIDO` calculado automáticamente al expirar el plazo sin intervención manual.

### HU-11 — Reporte Operativo de Vencimientos
- **Historia:** Como recepcionista, quiero consultar la lista de socios con membresías próximas a vencer en los siguientes 7 días para realizar gestiones preventivas de renovación.
- **Endpoints y Frontend:**
  - Endpoint: `GET /api/v1/reports/expiring?days=7`.
  - Vista o pestaña en el frontend con tabla paginada y badge visual de advertencia (`PROXIMO_A_VENCER` en ámbar).
- **Criterios de Aceptación (CA):**
  - HU-11-CA-01: Listado ordenado cronológicamente por fecha de vencimiento más próxima.
  - HU-11-CA-02: Filtro configurable por rango de días (por defecto 7 días).

### HU-12 — Verificación Manual de Acceso en Recepción
- **Historia:** Como personal de recepción, quiero verificar de forma rápida y visual si un socio que se presenta en la entrada tiene acceso permitido según su membresía.
- **Alcance Operativo (Corte Manual Acordado):**
  - Pantalla ágil en el frontend (`AccessControlPage.jsx`): el recepcionista digita o busca el código de socio / DNI.
  - **Semáforo Visual en Tiempo Real:**
    - 🟢 **ACCESO PERMITIDO (VERDE):** Socio con membresía activa y en estado `VIGENTE`.
    - 🔴 **ACCESO DENEGADO (ROJO):** Socio con membresía en estado `VENCIDO`, inactiva o sin plan contratado.
  - **Límites:** Este alcance es puramente manual para recepción web; **no incluye integración con hardware biométrico, torniquetes electrónicos ni lectores QR móviles** en esta etapa.

---

## 3. Protocolo de Entrega y Push

a) Desarrollar y verificar con pruebas automatizadas (`.\mvnw.cmd test` y `npm run build`).  
b) Revisar `git diff` y `git diff --check` asegurando que no existan credenciales ni `.env` en commits.  
c) Crear commits atómicos por funcionalidad con mensajes descriptivos.  
d) Publicar la rama con upstream:
   ```bash
   git push --set-upstream origin feature/s1-jorge-hu02-hu09-hu11-hu12
   ```
e) Verificar con `git ls-remote --heads origin` que el hash remoto coincide con el local.  
f) **NO fusionar todavía a `develop` ni `main`**. La unificación se realizará coordinadamente.
