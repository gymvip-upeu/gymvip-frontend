# Reglas de Negocio, Alcance y Directivas Operativas — GYM VIP

> **Ubicación Canónica:** `gymvip-frontend/documentos/REGLAS.md`  
> **Versión:** 2.1 — Consolidada para Sprint 1 y Auditoría de Diseño  
> **Fecha de Actualización:** 30 de Octubre de 2026  
> **Referencias Históricas:** [`historico/PRD.md`](./historico/PRD.md), [`historico/DECISIONES.md`](./historico/DECISIONES.md), [`historico/DEFINICION_DE_TERMINADO.md`](./historico/DEFINICION_DE_TERMINADO.md)

---

## 1. Visión y Alcance del Producto

**GYM VIP** es una plataforma integral de gestión para gimnasios y centros de entrenamiento premium, orientada a optimizar la administración de socios, planes, membresías, cobros presenciales, control de vigencias y verificación autoritativa de acceso en mostrador.

### Delimitación Estricta del Sprint 1
El presente incremento se circunscribe exclusivamente al núcleo operativo administrativo (Frontend Web y Backend API). No forman parte del alcance de este Sprint:
- Aplicaciones móviles nativas (Android/iOS para socios).
- Integración fiscal o tributaria con SUNAT (se emiten constancias internas de cobro; no son facturas electrónicas).
- Módulos de inventario, cafetería, reservas de clases o torniquetes biométricos físicos.
- Pasarelas de pago electrónico online (el cobro habilitado es estrictamente presencial en caja/mostrador).

---

## 2. Historias de Usuario del Sprint 1 y Criterios de Aceptación

| HU | Nombre | Responsable Original | Criterios de Aceptación Clave |
| :--- | :--- | :--- | :--- |
| **HU-01** | Registro de Socios | André | Registro con nombres, apellidos, tipo y número de documento, fecha de nacimiento, teléfono y correo. Generación determinista de código de socio único `MAR-XXXXXX`. |
| **HU-02** | Edición y Auditoría de Socios | Jorge | Edición de datos del socio con control de concurrencia optimista (`@Version` en BD; HTTP 409 Conflict ante colisión). Registro inmutable en tabla de auditoría con fecha, usuario y valores anterior/nuevo. |
| **HU-04** | Personal y Control de Roles | André | Alta de colaboradores administrativos con roles `ADMIN` y `RECEPCION`. Contraseñas con hash BCrypt. Protección de integridad que impide inactivar o revocar al último administrador del sistema. |
| **HU-06** | Catálogo de Planes | André | Definición de tarifas estándar de 30 días de cobertura expresadas en Soles Peruanos (`PEN`). Control de versionado inmutable: toda modificación de tarifa crea una nueva versión de plan. |
| **HU-07** | Contratación de Membresías | Alexander | Cálculo automático de fechas de cobertura (inicio incluido / fin excluido a las 23:59:59 del día 30). Asociación atómica socio-plan. |
| **HU-08** | Cobro Presencial en Caja | Alexander | Registro de pago presencial en Soles (`PEN`) con efectivo o tarjeta en mostrador. Cabecera `Idempotency-Key` obligatoria para prevenir cobros duplicados. Emisión de constancia interna con identificador fiscal ficticio `VIP-YYYYMMDD-...`. |
| **HU-10** | Renovación de Membresías | Alexander | Renovación continua: si el socio tiene una membresía vigente, la nueva cobertura inicia el día inmediatamente posterior al fin de la actual; si está vencida, inicia el día del pago. |
| **HU-09** | Evaluación de Vigencias | Jorge | Cálculo centralizado de estado: `VIGENTE`, `POR_VENCER` (dentro del umbral configurado) o `VENCIDO`. Intervalo autoritativo en zona horaria `America/Lima` (UTC-5). |
| **HU-11** | Monitoreo de Vencimientos | Jorge | Filtros operativos ordenados por urgencia de vencimiento para gestión de cobranza y fidelización de socios en mostrador. |
| **HU-12** | Verificación Manual en Recepción | Jorge | Consulta instantánea por DNI o código de socio. Veredicto autoritativo unívoco: `ACCESO PERMITIDO` o `ACCESO DENEGADO`, detallando el motivo exacto sin ambigüedades. |

---

## 3. Matriz de Decisiones Técnicas y de Negocio

### A. Decisiones Confirmadas
1. **Identificadores de Cobro Interno:** Las ventas presenciales generan un comprobante interno con código `VIP-...`. Se aclara expresamente al usuario que este documento acredita la activación en el sistema y no constituye comprobante de pago tributario.
2. **Duración de Membresías:** El período estándar de membresía es de 30 días calendario exactos calculados a partir de la fecha de inicio.
3. **Idempotencia Transaccional:** El cliente envía una clave única en el encabezado `Idempotency-Key` (`CASH-...`). El backend rechaza peticiones repetidas con el mismo identificador si ya fueron procesadas satisfactoriamente.
4. **Política de Bloqueo por Inactividad:** Tras 15 minutos sin interacción del usuario, el frontend bloquea la interfaz operativa, oculta los datos de clientes y solicita revalidar la contraseña de la cuenta conocida contra el backend para reanudar la sesión.
5. **No Eliminación Física:** Queda estrictamente prohibido el borrado físico (`DELETE`) de socios, pagos, membresías o registros de auditoría. Cualquier baja operativa se gestiona mediante estados lógicos (`ACTIVO` / `INACTIVO`).

### B. Decisiones Propuestas
1. **Configuración Dinámica de Umbrales:** El umbral de alerta "Por Vencer" (por defecto 7 días) se parametriza en el panel de configuraciones operativas con persistencia en `localStorage` o variable del entorno.
2. **Rate Limiting:** Implementación de filtro Bucket4j en el backend para limitar intentos fallidos de login a 5 por minuto por IP.

### C. Decisiones Pendientes de Validación con el Product Owner
1. **Mecanismo de Desafiliación Formal:** Regla de negocio para determinar si un socio puede ser marcado como "Inactivo" si aún mantiene una membresía pagada con días de cobertura restantes.
2. **Políticas de Congelamiento (Freeze):** Posibilidad de pausar membresías por motivos médicos o viajes. Queda para evaluación en el Sprint 2.

---

## 4. Definición de Terminado (Definition of Done - DoD)

Un ítem se considera formalmente terminado cuando:
1. Cumple con los criterios de aceptación funcionales especificados en su Historia de Usuario.
2. Posee pruebas automatizadas unitarias ejecutadas con éxito (cobertura de lógica de negocio e invariantes).
3. No introduce secretos, contraseñas, URLs de base de datos ni archivos `.env` en el control de versiones.
4. El frontend compila sin errores ni advertencias (`npm run build`).
5. La interfaz cumple con los estándares visuales de Figma Dark & Gold y accesibilidad WCAG 2.1 AA.
6. La documentación viva en `gymvip-frontend/documentos/` ha sido sincronizada en el mismo commit o ciclo de trabajo.

---

## 5. Directiva de Documentación Viva por Cambio Significativo

Todo cambio técnico o funcional relevante en el código debe actualizar inmediatamente el documento canónico correspondiente:

| Tipo de Cambio | Documento Canónico a Actualizar | Contenido Requerido |
| :--- | :--- | :--- |
| Endpoint, DTO, header, código HTTP o rol | [`APIDOCUMENTATION.md`](./APIDOCUMENTATION.md) | Contrato formal, ejemplo JSON, roles y estado |
| Vista, imagen, componente, token o flujo visual | [`DESIGN.md`](./DESIGN.md) | Captura/descripción, componente React, responsive |
| Versión de dependencia, stack o variable de entorno | [`FICHA_TECNICA.md`](./FICHA_TECNICA.md) | Versión, compatibilidad y configuración saneada |
| Entidad, relación JPA, C4 o flujo de secuencia | [`ARQUITECTURA_Y_MODELOS.md`](./ARQUITECTURA_Y_MODELOS.md) | Diagrama Mermaid/PlantUML y justificación |
| Prueba ejecutada, incidencia o hallazgo de seguridad | [`EVIDENCIAS_QA_SEGURIDAD.md`](./EVIDENCIAS_QA_SEGURIDAD.md) | Comando, resultado real medido y vector de seguridad |
| Estado de HU, entrega o asignación de responsable | [`ESTADO_PROYECTO.md`](./ESTADO_PROYECTO.md) | Tabla de HU, estado (Aprobado/Pendiente) y commits |

