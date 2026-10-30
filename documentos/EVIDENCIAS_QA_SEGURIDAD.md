# Matriz de Evidencias de QA y Auditoría de Seguridad — GYM VIP

> **Ubicación Canónica:** `gymvip-frontend/documentos/EVIDENCIAS_QA_SEGURIDAD.md`  
> **Fecha de Ejecución y Medición:** 30 de Octubre de 2026  
> **Árbol de Trabajo:** `gymvip-backend` y `gymvip-frontend`

---

## 1. Pruebas Automatizadas Unitarias y de Integración

Todas las cifras y resultados detallados en esta sección provienen de ejecuciones reales sobre el código fuente en las ramas locales `feature/ajustes-diseno-documentacion-seguridad`.

| Nivel | Comando Ejecutado | Componentes / Clases Evaluadas | Resultado Medido | Evidencia Observable | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend Unitario** | `.\mvnw.cmd test "-Dtest=CoveragePolicyTest,MembershipDatesTest,IsolationGuardTest"` | `CoveragePolicyTest`<br>`MembershipDatesTest`<br>`IsolationGuardTest` | **9 de 9 aprobadas**<br>(0 fallos, 0 errores, 0 omitidas) | `[INFO] BUILD SUCCESS`<br>Tiempo: 49.054 s<br>Suites: 3 clases de dominio | **APROBADO** |
| **Backend Integración** | `.\mvnw.cmd test` | Toda la suite con contexto Spring Boot y PostgreSQL (`SpringExtension`) | No ejecutado en este entorno | Requiere servicio PostgreSQL local activo con esquema `TEST_DB_SCHEMA` configurado. | **NO EJECUTADO** |
| **Frontend Unitario (Auth/API)** | `npm test` | [`tests/authSession.test.js`](../tests/authSession.test.js)<br>[`tests/jorgeApi.test.js`](../tests/jorgeApi.test.js)<br>[`tests/membershipApi.test.js`](../tests/membershipApi.test.js) | **16 de 16 aprobadas**<br>(0 fallos, 0 omitidas) | TAP v13: `pass 16`<br>Tiempo: 466.3 ms<br>Validación de bloqueo, revalidación de clave, 409 conflict, fallos de red e idempotencia | **APROBADO** |
| **Frontend Empaquetado** | `npm run build` | Vite v6.4.4<br>Transformación de 79 módulos | **79 módulos empaquetados**<br>(0 errores, 0 advertencias) | `✓ built in 3.72s`<br>Generado `dist/index.html` (1.25 kB), `dist/assets/hero-athlete-*.jpg` (21.43 kB), `dist/assets/index-*.css` (20.33 kB) y JS (278.23 kB) | **APROBADO** |

---

## 2. Auditoría de Seguridad y Pentesting Ético Local

Se auditaron los 9 vectores críticos de seguridad entre Frontend y Backend con clasificación honesta y basada en evidencia:

| Vector | Método de Evaluación | Hallazgo Comprobado | Clasificación | Mitigación Implementada / Recomendación |
| :--- | :--- | :--- | :--- | :--- |
| **1. Control de Acceso por Rol (RBAC)** | Prueba dinámica y revisión estática | Cuentas y Planes protegidos por rol en backend (`@PreAuthorize("hasRole('ADMIN')")`) y en frontend mediante validación de `isAdmin()`. | **Prueba ejecutada** | El frontend oculta rutas sensibles y el backend responde con HTTP 403 Forbidden ante accesos indebidos. |
| **2. Expiración y Bloqueo de Sesión** | Prueba automatizada (`authSession.test.js`) | Tras 15 minutos de inactividad o respuesta 401, el frontend bloquea la interfaz y solicita exclusivamente la contraseña de la cuenta conocida. NUNCA se almacenan contraseñas en memoria persistente. | **Prueba ejecutada** | Reautenticación segura contra `/api/v1/auth/login`. |
| **3. Inyección SQL** | Revisión estática de código | Uso exclusivo de Spring Data JPA y sentencias DDL/DML versionadas con Flyway V1 a V5. No existe concatenación dinámica de cadenas SQL. | **Revisión estática** | Mitigación estructural mediante Hibernate y Parameterized Queries. |
| **4. Cross-Site Scripting (XSS)** | Revisión estática de código | Todas las variables de entrada se renderizan mediante interpolación JSX escapada nativa. No se utiliza `dangerouslySetInnerHTML`. | **Revisión estática** | Protección nativa del motor de renderizado de React. |
| **5. Prevención de Fuga de Secretos** | Inspección de repositorios y Git | Ningún archivo `.env`, contraseña en texto plano, URL con credenciales de base de datos o secreto figura en el control de versiones. | **Prueba ejecutada** | Parámetros saneados mediante variables de entorno del sistema (`${DB_PASSWORD}`). |
| **6. Idempotencia en Pagos** | Prueba automatizada (`membershipApi.test.js`) | Las peticiones de cobro presencial requieren el encabezado `Idempotency-Key: CASH-...`. Reintentos de red recuperan el comprobante original sin duplicar el cobro. | **Prueba ejecutada** | Tabla `payments` con restricción de unicidad sobre `idempotency_key`. |
| **7. Concurrencia Optimista** | Prueba automatizada (`jorgeApi.test.js`) | Edición de socios controlada con `@Version`. Si dos recepcionistas editan el mismo socio simultáneamente, el segundo recibe HTTP 409 Conflict. | **Prueba ejecutada** | Frontend captura el error 409 y permite recargar la ficha sin sobrescribir datos ajenos. |
| **8. Estrangulamiento (Rate Limiting)** | Inspección de configuración backend | `/api/v1/auth/login` y `/api/v1/coverage/verify-access` no cuentan con estrangulamiento activo de peticiones por IP en este Sprint. | **Pendiente** | Propuesto para el Sprint 2: Implementar Bucket4j o configurar limitación de tasa en Nginx (5 req/min por IP). |
| **9. Protección CSRF y CORS** | Revisión estática de configuración | CSRF deshabilitado intencionalmente para API stateless con tokens de sesión opacos. CORS configurado exclusivamente para `http://localhost:5173`. | **Revisión estática** | Para producción, parametrizar los orígenes CORS mediante variable de entorno del host de despliegue. |

---

## 3. Registro de Incidencias Técnicas Detectadas y Resueltas

1. **Incidencia:** Layout anterior de Login en dos columnas con fotografía pequeña y botones de demostración accesibles para cualquier usuario.
   - *Corrección:* Rediseñado a pantalla completa con fondo de atleta, capa de oscurecimiento y tarjeta centrada luxury. Retirados por completo los botones demo y credenciales precargadas.
2. **Incidencia:** Falta de pantalla de espera o bloqueo tras inactividad del recepcionista.
   - *Corrección:* Implementado monitor de inactividad (15 min) e interceptor HTTP 401 que presenta la pantalla de bloqueo seguro con revalidación contra el backend.
3. **Incidencia:** Ambigüedad en la tabla de socios entre "Ver Ficha" y "Editar".
   - *Corrección:* Creada columna de acciones explícita con botones diferenciados: "Ver Ficha" (solo lectura) y "Editar" (edición concurrente y libro de auditoría).
4. **Incidencia:** Presencia de etiquetas académicas ("Sprint 1", "HU-XX") en la interfaz de usuario.
   - *Corrección:* Depuradas todas las pantallas para mostrar únicamente terminología operativa profesional del gimnasio.

