# COMMIT_LOG_BASE.md — Registro Oficial de Commits Locales

> **Proyecto:** GYM VIP (VIP CENTER FIT)  
> **Alcance:** Base Funcional Sprint 1 — Incremento Acosta (HU-01, HU-04, HU-06)  
> **Autor:** Andre Acosta (`Andre-Acosta2022 <luigui.acosta@upeu.edu.pe>`)  
> **Fecha de Creación:** 13 de Octubre de 2026  
> **Política Aplicada:** Commits locales por funcionalidad coherente en rama `base-acosta`. **Sin push automático, sin merge a main.**

---

## 1. Repositorio Backend: `gymvip-backend`

- **URL Remota:** `https://github.com/gymvip-upeu/gymvip-backend.git`
- **Rama:** `base-acosta`

| Hash Real | Tipo / HU | Mensaje de Commit | Validación Técnica Previa | Estado Git |
| :--- | :--- | :--- | :--- | :--- |
| `4a6147a` | `chore(base)` | `chore(base): configurar Flyway, carga .env, perfiles de base de datos y excepciones globales` | Maven Wrapper instalado, Flyway V1 compilado, sintaxis YAML validada. | **LOCAL (Creado)** |
| `dbc41c0` | `refactor(scope)` | `refactor(scope): retirar MembershipController y delimitar alcance a HU-01, HU-04 y HU-06` | Verificación de referencias huérfanas en dependencias; compilación exitosa. | **LOCAL (Creado)** |
| `7e9c966` | `feat(hu04)` | `feat(hu04): implementar gestion institucional de personal, roles RBAC y revocacion de sesiones` | `AccountManagementIntegrationTest` (6 tests PASSED con códigos 200, 401, 403 y 409). | **LOCAL (Creado)** |
| `1676d5e` | `feat(hu01)` | `feat(hu01): delimitar endpoints de clientes a registro de socio adulto y lectura basica` | `ClientIntegrationTest` (5 tests PASSED con validación ≥18 años y 409 Conflict). | **LOCAL (Creado)** |
| `820b452` | `feat(hu06)` | `feat(hu06): implementar catalogo de planes, versionado inmutable y regla de 30 dias` | `PlanIntegrationTest` (4 tests PASSED con regla estricta de 30 días y versionado). | **LOCAL (Creado)** |
| `2bc1261` | `docs(base)` | `docs(base): documentar arquitectura, alcance, variables y estado del backend` | Markdown linting y consistencia de rutas de enlace y contratos. | **LOCAL (Creado)** |

---

## 2. Repositorio Frontend: `gymvip-frontend`

- **URL Remota:** `https://github.com/gymvip-upeu/gymvip-frontend.git`
- **Rama:** `base-acosta`

| Hash Real | Tipo / HU | Mensaje de Commit | Validación Técnica Previa | Estado Git |
| :--- | :--- | :--- | :--- | :--- |
| `f72e056` | `chore(base)` | `chore(base): centralizar cliente API, variables de entorno y estilos Dark & Gold` | `npm run build` exitoso; tokens CSS verificados con targets ≥44px. | **LOCAL (Creado)** |
| `096c83b` | `feat(hu04)` | `feat(hu04): implementar interfaz de gestion de personal y roles institucionales para ADMIN` | `npm run build` exitoso; validación de renderizado y roles en `Sidebar.jsx`. | **LOCAL (Creado)** |
| `6cf494a` | `feat(hu01)` | `feat(hu01): conectar alta de socios y consentimientos de privacidad al cliente API centralizado` | `npm run build` exitoso; validación de edad y checkboxes de consentimientos. | **LOCAL (Creado)** |
| `df1ea22` | `feat(hu06)` | `feat(hu06): implementar catalogo de planes con versionado inmutable y regla mensual de 30 dias` | `npm run build` exitoso; validación de duración de 30 días para planes mensuales. | **LOCAL (Creado)** |
| `2b83c7b` | `docs(base)` | `docs(base): documentar arquitectura, modulos de interfaz y estado del frontend` | Markdown linting y consistencia con variables `VITE_API_BASE_URL`. | **LOCAL (Creado)** |

---

## 3. Resumen de Pruebas Ejecutadas Ligadas a los Commits

- **Backend (`mvn test`):**
  - Total Pruebas: **16**
  - Fallos: **0**
  - Errores: **0**
  - Cobertura de HU:
    - Base Contexto: `GymVipApplicationTests` (1 test)
    - HU-01: `ClientIntegrationTest` (5 tests)
    - HU-04: `AccountManagementIntegrationTest` (6 tests)
    - HU-06: `PlanIntegrationTest` (4 tests)
- **Frontend (`npm run build`):**
  - Estado: **EXITOSO** (0 errores, 34 módulos transformados en 220ms, bundles listos en `dist/`).

---

## 4. Próximos Pasos de Integración (Preparados, No Automatizados)

1. Publicación de la rama en el remoto cuando sea autorizada:
   ```bash
   git push origin base-acosta
   ```
2. Apertura de Pull Request en GitHub hacia la rama de integración del equipo.
3. Handoff a los dos compañeros de equipo para continuar desde los hashes finales (`2bc1261` en backend y `2b83c7b` en frontend).
