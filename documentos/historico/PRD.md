# PRD — GYM VIP, épicas E01 y E02

**Versión de propuesta:** 11/10/2026. **Estado:** insumo para revisión del equipo y VIP CENTER FIT; ninguna regla marcada «por validar» equivale a aceptación del cliente. **Fuentes:** Product Backlog V1.0 (HU-01–HU-34), levantamiento, Project Charter y precisiones compartidas en la conversación. Las fechas antiguas de Sprints del Charter no se usan para planificar.

## 1. Problema, objetivo y alcance

El gimnasio ya usa una solución parcial. Sus controles de membresías, vencimientos, renovaciones y comunicación producen trabajo manual y casos de asistencia con membresía vencida. La meta del producto es centralizar la gestión de clientes y contratos, hacer visible la vigencia en recepción y ofrecer consulta al socio, con historial confiable. La línea base declarada en el Charter es aproximadamente 120 clientes activos, 30–35 renovaciones semanales, 10 consultas diarias y 3–5 casos de asistencia con membresía vencida al mes; son datos del proyecto que deben confirmarse, no cargas medidas en producción.

| Problema verificable | Objetivo específico de producto | Épica que aporta | Primera evidencia |
|---|---|---|---|
| Identidad y ficha dispersas o duplicadas | Una ficha localizable y protegida por permisos | E01 | Alta, búsqueda, duplicado rechazado, auditoría |
| Condiciones de planes y cobros difíciles de reconstruir | Plan, contrato, cobro presencial e historial consistentes | E02 | Crear/listar plan; después contratar con pago registrado |
| Vencimientos y asistencia no controlados | Estado de vigencia calculado y visible para recepción | E02 | Consulta de membresía con ejemplos de fechas aprobados |
| Socio necesita información sin fila | Consulta propia, incluso tras vencer, sin nueva identidad | E01-HU05 + E06-HU28/29/30 | Activación y pantalla móvil de consulta |
| Recordatorios manuales | Avisos por canal aprobado | E03 | Pendiente después de estabilizar los estados de E02 |

El Charter sí incluye React, Spring Boot, Kotlin Multiplatform y un único microservicio de comunicaciones. Excluye pasarela de pago en línea; **registrar un pago presencial** en E02 no es cobrar por internet. No implementar tarjetas, comprobantes fiscales automáticos, torniquetes, huellas, captura fotográfica, sincronización offline completa ni emisión de facturas: requieren alcance y validación propios. Una comprobación visual del documento en recepción puede especificarse sin almacenar fotografía. Las rutinas en E04 deben revisarse: el Charter menciona entrenadores, pero la propuesta actual no tendrá rol entrenador.

## 2. Decisiones propuestas para validar

| Tema | Propuesta operable para prototipo y código | Validación necesaria |
|---|---|---|
| Identificación | Selector configurable de tipos aprobados por el gimnasio: DNI, carné de extranjería, pasaporte y otro solo si lo autoriza. Unicidad por país emisor + tipo + número normalizado; DNI peruano duplicado se rechaza en BD y API. No usar DNI como contraseña. | Lista exacta de documentos y formatos; caso de menor sin documento. |
| Persona adulta | Nombre y apellidos, tipo/número de documento, fecha de nacimiento, correo y celular obligatorios según la propuesta del equipo. Estado de verificación del correo separado del teléfono. Correo/teléfono no son claves únicas de cliente: pueden compartirse en familia. | Confirmar si ambos canales son realmente exigibles para todo socio. |
| Menor | Modelar socio y representante como personas relacionadas, sin sobrescribir la identidad del menor. Prototipo muestra datos del menor y del representante con sus teléfonos separados; bloquear alta real de menor hasta fijar requisitos y consentimiento del responsable. | Edad mínima, documento de cada uno, contactos requeridos, vínculo y quién consiente. |
| Consentimiento | Una casilla requerida y desmarcada para los **términos del servicio**; otra acción separada para acusar recibo del **aviso de privacidad**, sin presentarla como permiso general para cualquier uso de datos. Enlaces y versiones de ambos textos. Casillas **opcionales y desmarcadas** para promociones por correo y por WhatsApp, separadas. Guardar versión, elección, actor/titular, instante UTC, canal y evidencia de cada acción. En pantalla permitir rechazo y salir sin crear cuenta; las finalidades legales exactas deben revisarse con el cliente. | Textos, responsables y política de conservación/revocación; representante de menor. |
| Contactos | Recepción puede corregir contacto y se registra quién/cuándo/antes-después de forma protegida. Nuevo correo o celular queda pendiente de verificación para recuperación; avisar al canal anterior si estaba validado. Solo identidad/documento, roles, anulación económica y excepciones van a una bandeja de aprobación. | Qué cambios concretos exigen aprobación y quién los aprueba. |
| Anulación | Operación compensatoria con motivo, autor, fecha y notificación al socio por canal verificado si aplica. No borrar cliente, pago, contrato ni log como modo normal de corrección. | Rol, causas, ventanas y reglas de notificación. |
| Acceso web | Personal: correo institucional + contraseña robusta, MFA para SUPERADMIN y operaciones sensibles; sesión de recepción con bloqueo tras 15–30 min de inactividad como parámetro a probar. Reautenticación para cambios críticos. | Política de equipos compartidos y tiempos de sesión. |
| Acceso socio | Una Cuenta vinculada a un Cliente existente. Primer acceso mediante enlace de un solo uso al correo verificado; canal WhatsApp OTP de 6 dígitos como opción posterior si hay proveedor y consentimiento/costos aprobados. No crear segunda ficha; sin clave basada en fecha de nacimiento. En móvil, sesión renovable con revocación y vencimiento absoluto configurable (propuesta inicial: 30 días), nunca indefinida. | Proceso de verificación de titular, fallback para quien perdió correo. |
| Vencimiento | La cuenta permanece disponible para consultar membresía e historial; recepción ve la vigencia. No afirmar bloqueo automático de puerta porque no hay integración física. | Si hay tolerancia, si afecta ingreso manual y cómo registrarlo. |
| Fechas E02 | Primer contrato tras pago completo; una membresía vigente por socio; anticipada inicia después de acabar la anterior; tardía fuera de tolerancia inicia al pago. | Fin de mes 29–31, inclusividad exacta, tolerancia, cobro/renovación durante tolerancia y precio histórico. |

**Regla de producto:** `PENDIENTE` es un estado explícito de decisión, no un valor configurable implementado a ciegas. Los prototipos etiquetan los ejemplos de fechas como ilustrativos.

## 3. Roles, fricción y auditoría

Implementar cuatro conjuntos internos de permisos, aunque la interfaz agrupe «Administración / Recepción»: `SUPERADMIN`, `ADMIN`, `RECEPCION`, `CLIENTE`. No hay `ENTRENADOR`. La matriz final la firma el gimnasio.

| Acción | Superadmin | Admin | Recepción | Cliente |
|---|---|---|---|---|
| Ver/crear/editar ficha de cliente | Sí | Sí | Sí, campos ordinarios | Ver la propia; autocorrección, por validar |
| Plan: alta/edición/inactivación | Sí | Sí | Ver | Ver oferta si se publica |
| Registrar cobro presencial y asignar/renovar | Sí | Sí | Sí | Consultar propios |
| Corregir documento, anular cobro o membresía | Sí, con motivo | Por validar | Solicita excepción | No |
| Gestionar cuentas del personal y consultar auditoría completa | Sí | Según matriz | No | No |

`AuditEvent` debe registrar ID del actor, entidad y referencia, acción, fecha UTC y presentación local con zona `America/Lima`, valores alterados permitidos, resultado, motivo si es excepción, origen web/móvil, IP y tipo de dispositivo cuando estén disponibles. No registrar contraseñas, tokens ni documentos completos en logs. El historial se consulta según permiso, se protege contra modificación ordinaria y respeta una retención por definir. Para recepción, el flujo ordinario se completa sin una cola de aprobaciones; solo excepciones crean solicitud.

## 4. Historias y criterios: E01

Orden de implementación para conseguir código demostrable: `HU-03 mínimo → HU-04 permisos mínimos → HU-01 alta → HU-02 búsqueda → HU-06 plan`. Diseño y contratos avanzan en paralelo. Las tareas de una HU no implican que toda la HU esté terminada.

| HU / prioridad | Criterios de aceptación que se pueden mostrar | Tareas en orden / evidencia |
|---|---|---|
| **HU-03 Inicio de sesión — P0** | Personal entra con cuenta propia; error genérico y límite de intentos; logout y sesión caducada; API privada exige sesión. Recuperación únicamente a canal verificado, token aleatorio de un uso con expiración; sin contraseña en texto claro. | `03-01` decidir identificador/flujo [negocio]; `03-02` prototipo+secuencia [UX]; `03-03` Cuenta/credencial/sesión [backend]; `03-04` login/logout+protección [backend]; `03-05` pantalla/estados [web]; `03-06` pruebas de abuso y revocación [QA]. La parte de socio se completa con HU-28. |
| **HU-04 Roles y permisos — P0 mínimo, P1 completo** | `RECEPCION` no modifica planes; `CLIENTE` no accede a fichas ajenas; `ADMIN` administra planes; `SUPERADMIN` autoriza excepción. Se deniega también por API, con trazabilidad. | `04-01` acordar matriz [negocio]; `04-02` middleware/políticas [backend]; `04-03` seed seguro de roles sin credenciales hardcoded [backend]; `04-04` audit log mínimo [backend]; `04-05` UI gestión de cuentas y excepciones [web]; `04-06` pruebas por rol [QA]. No marcar HU cerrada solo por tres endpoints protegidos. |
| **HU-01 Registrar clientes — P0** | Campos adultos de sección 2, validación; el documento repetido devuelve conflicto sin crear ficha; se muestran avisos y casillas independientes; se conserva evidencia versionada de la selección; la ficha queda disponible para asignar plan. Menor bloqueado o flujo marcado pendiente hasta decisión. | `01-01` revisar lista documental y textos [negocio]; `01-02` formulario y variante menor [Figma]; `01-03` Cliente/Documento/Consentimiento e índice único [BD]; `01-04` POST + errores [backend]; `01-05` formulario web [web]; `01-06` pruebas de duplicados/concurrencia/casillas [QA]; `01-07` ejemplo anonimizado [documentación]. |
| **HU-02 Consultar y actualizar — P0 búsqueda, P1 edición** | Buscar por nombre o documento según rol; paginación; editar contacto con evento de auditoría y nuevo canal pendiente de verificar; documento/identidad requieren excepción; historial económico inalterable desde la ficha. | `02-01` campos por rol [negocio]; `02-02` lista/detalle API [backend]; `02-03` vista lista/ficha [web]; `02-04` PATCH contactos + verificación + log [backend]; `02-05` bandeja de excepción para identidad [web/backend, P1]; `02-06` pruebas de autorizaciones y cambios [QA]. |
| **HU-05 Habilitar acceso móvil — P1** | Se vincula una única cuenta al cliente; activación por correo verificado; solo datos propios; se revoca acceso por decisión autorizada; la consulta no depende del estado de la membresía. | `05-01` flujo de titularidad [negocio]; `05-02` enlace Cliente–Cuenta [BD/backend]; `05-03` invitación/activación y revocación [backend/comunicaciones]; `05-04` pantalla web de estado [web]; `05-05` pruebas de titularidad, expiración y recuperación [QA]. HU-28 contiene UI de login móvil. |

## 5. Historias y criterios: E02

Mantener el texto completo, plataforma y prioridad originales de cada HU del Excel al crear Issues; este refinamiento añade criterios y subtareas. **P0** = primer avance de código, **P1** = siguiente incremento, **P2** = depende de reglas del cliente.

| HU / corte | Criterios verificables y subtareas prioritarias |
|---|---|
| **HU-06 Configurar planes — P0** | Admin crea con nombre, precio en PEN, duración, condiciones/beneficios definidos y estado; ve lista y reabre lo guardado; valores inválidos se rechazan; recepción no crea. `06-01` campos y ejemplo real [negocio]; `06-02` frame lista/formulario [UX]; `06-03` Plan y migración [BD]; `06-04` POST/GET [backend]; `06-05` UI conectada + prueba API/BD/web [web/QA]. `06-06` editar/inactivar sin alterar la foto contractual de membresías existentes [P1]. Precio y duración exactos por validar. **Primer avance de extremo a extremo aquí.** |
| **HU-07 Asignar membresías — P1** | Recepción elige cliente y plan activo, ve resumen de condiciones, confirma el pago completo presencial y obtiene período único sin duplicación. No se guarda una membresía pagada si falla el registro del cobro, y viceversa. `07-01` casos fechados y condiciones [negocio]; `07-02` prototipo [UX]; `07-03` modelo con snapshot e invariantes [BD]; `07-04` transacción e idempotencia [backend]; `07-05` formulario integrado [web]; `07-06` pruebas de duplicado/concurrencia [QA]. Pendiente fin de mes. |
| **HU-08 Registrar pagos — P1** | Registrar pago **presencial** con monto, moneda, medio, referencia opcional/obligatoria según medio, actor y momento; mostrar historial; reintento no duplica. Corrección/anulación = operación nueva con motivo y permiso; nunca delete. `08-01` medios y excepción [negocio]; `08-02` modelo y contrato [BD/API]; `08-03` UI/historial [web]; `08-04` evento auditable/reversión [backend]; `08-05` pruebas de doble clic y fallo parcial [QA]. No pasarela ni tarjeta almacenada. |
| **HU-09 Controlar vigencias — P1 condicionado** | Backend determina estado con una regla única y fecha de Lima, y web muestra texto + color; último día se presenta vigente solo si se aprueba regla inclusiva. `09-01` tabla de ejemplos 28/29/30/31 + tolerancia [negocio]; `09-02` diagrama [análisis]; `09-03` servicio de dominio con reloj inyectado [backend]; `09-04` UI [web]; `09-05` pruebas de bordes [QA]. No codificar política incompleta. |
| **HU-12 Verificar membresía — P1** | Recepción busca socio, ve estado/fechas devueltos por HU-09, distingue inexistente/sin contrato/error técnico. `12-01` prototipo de consulta rápida; `12-02` GET autorizado; `12-03` pantalla; `12-04` pruebas. No integrar puerta ni presumir que la consulta es registro de asistencia. |
| **HU-11 Listado de vencimientos — P1** | Filtro de períodos actuales próximos/vencidos, una fila por socio, acceso autorizado, estados vacíos. `11-01` filtro/umbral [negocio]; `11-02` consulta [backend]; `11-03` tabla [web]; `11-04` pruebas. Umbral y destinatarios pendientes. |
| **HU-10 Renovar membresías — P2 condicionado** | Mostrar período anterior/nuevo, precio y cobro presencial, confirmar y preservar historia; no solapar ni duplicar. `10-01` validar tres escenarios fechados [negocio]; `10-02` prototipo+secuencia; `10-03` transacción; `10-04` web; `10-05` pruebas. Bloquea la implementación final el caso de tolerancia y fin de mes. |

## 6. Entregas, diseño y coordinación

| Orden candidato | Incremento de código | Figma / análisis en paralelo | Demostración objetiva |
|---|---|---|---|
| **Antes del lunes** | Repos auditados, app y API levantan, migración inicial; stub de correo; contrato Plan/Cliente aprobado internamente. | PRD, tokens, C4, ERD, flujo login/alta/lista de planes; dudas anotadas. | Arranque reproducible y capturas reales, sin declarar HU cerradas. |
| **Primer Sprint a acordar** | HU-03/04 mínimos, HU-01 alta adulta, HU-02 búsqueda, HU-06 crear/listar. | Prototipo clickable, estados de validación y duplicado. | Personal autorizado crea cliente y plan y los recupera de BD tras reiniciar. |
| **Segundo corte** | HU-06 editar seguro, HU-07 + HU-08 transacción, historial. | Flujo de asignación, resumen, pago presencial, confirmación. | Contrato y pago consistentes con evidencia de reintento. |
| **Tercero condicionado** | HU-09, HU-12, HU-11; luego HU-10 y HU-05 según decisiones. | Tabla de fechas, estados, renovación y primeros frames móvil. | Estados concordantes con ejemplos firmados por cliente. |

Reunión de planificación: Product Owner valida criterio y orden; diseño y backend acuerdan contrato y ejemplo; frontend y móvil hacen prototipo con datos ficticios; integración diaria en ramas pequeñas; revisión de PR por otra persona; demo de incremento y registro de preguntas. Cada Issue: HU original, criterio, checklist técnico, dependencia, responsable, estado, enlace Figma, PR y evidencia de prueba. «Hecho» exige API+UI integradas donde aplica, autorización backend, migración, caso feliz y fallos clave probados, documentación y demostración; mock visual por sí solo no cierra una HU.

## 7. Preguntas para VIP CENTER FIT el lunes

1. ¿Aceptan menores? ¿Qué documento y datos tiene cada persona, quién firma y cuál es edad mínima?
2. ¿Lista exacta de tipos de documento? ¿Correo **y** celular obligatorios para todos, incluidos menores y clientes sin correo propio?
3. ¿Quién modifica documento, anula pago/contrato o inactiva ficha, y qué notificación corresponde? ¿Qué ediciones de contacto pueden ser inmediatas?
4. ¿Quién carga rutinas si no existe rol entrenador? ¿Se reescriben HU-18–HU-20 y apartado de stakeholders del Charter?
5. ¿Texto y responsable del aviso de privacidad, términos, consentimientos comerciales y revocación? ¿Se usará WhatsApp para autenticación, avisos transaccionales, promociones o todos?
6. ¿Casos con fecha real: contrato 29/30/31, día final inclusivo, renovación durante tolerancia, acceso durante tolerancia, precio de renovación y plan mixto?
7. ¿Medios de pago presenciales, referencia requerida, comprobante existente e historial de correcciones? ¿Quién verifica entrada cuando hay caída de internet?
8. ¿Prioridad de móvil y publicación Android/iOS; canal institucional de correo y presupuesto mensual real de WhatsApp/hosting?

Registrar respuestas con fecha, persona del gimnasio, ejemplo concreto y HU/diagrama impactados. Actualizar Excel y Charter donde corresponda, conservando las versiones anteriores.
