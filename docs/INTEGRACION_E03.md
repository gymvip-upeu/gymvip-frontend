# Integración E03 MA/RM

Rama de integración compartida con backend y móvil. Se incorporaron las mejoras de Acosta conservando el recorrido de FAQ y recordatorios E03.

Se conserva la configuración multicanal de recordatorios, selección exacta de días y seguimiento APP/WHATSAPP/EMAIL. FAQ mantiene publicación por administrador y propuestas pendientes. La web usa su proxy al backend local; ningún secreto de BD o token interno se añadió a VITE_*. npm run check: 92 pruebas y build correctos.

Para configuración y compatibilidad de base consultar docs/INTEGRACION_E03.md del backend. Firebase Android requiere google-services.json del equipo; no se incluyó ningún archivo privado ni credenciales en estos repositorios.

## Simplificación de Seguimiento — 20/11/2026

Seguimiento reemplaza WhatsApp y envíos en navegación y usa /seguimiento; /comunicaciones sigue resolviendo la misma vista. Un único historial de recordatorios muestra APP, WHATSAPP y EMAIL. Se retira su duplicación de Recordatorios, conservando allí configuración, vista previa y auditoría de evaluaciones. Edición local de plantillas y reintentos incompletos no aparecen en la operación habitual. Las plantillas son de referencia, de solo lectura.

CommunicationsPrototypePage conserva escenarios/fixtures previos para pruebas. Solo puede abrirse desde el botón de desarrollo cuando VITE_ENABLE_COMMUNICATIONS_PROTOTYPE=true y Vite está en DEV; por defecto false y excluido del build de producción. Reiniciar Vite tras cambiar la variable. No usar sus datos de muestra como evidencia de envío real.

GET /api/v1/reminders/schedule informa enabled, dailyTime y timeZone desde la configuración existente del servidor. La interfaz distingue reglas guardadas de programación diaria. Si la consulta falla, informa estado sin verificar. No cambia horarios, reglas, proveedores, permisos, política de reintentos ni /api/v1/channels/status.


## Panel de plantillas restaurado — 20/11/2026

Se recupera únicamente selector de cinco mensajes/panel de plantilla encima de Resultados por canal en Seguimiento. Administración puede guardar un borrador, revisar y aprobar para vista previa local. El borrador no cambia la vista previa hasta aprobarse. Recordatorios consulta el mismo catálogo local aprobado. No se modifica el servidor, reporte de canales, política de envíos, tabla de seguimiento ni configuración. La aprobación se identifica expresamente como local al navegador, sin efecto sobre Meta o envíos reales. QA visual: editar, guardar, aprobar y comprobar texto en Recordatorios; texto original restaurado al terminar. npm run check: 92 pruebas/build; 3 pruebas nuevas de aprobación, validación y fallo de almacenamiento pasadas por separado. Evidencia outputs/57-plantillas-seguimiento.jpg.


## Reporte de canales y alcance — 20/11/2026

Los canales de esta entrega son WHATSAPP y APP. EMAIL sale de configuración, evaluaciones futuras y seguimiento de recordatorios; sus registros existentes permanecen en base sin borrado. La configuración heredada filtra EMAIL al consultar/evaluar; guardar acepta solo APP/WHATSAPP y no habilita otro canal si antes solo había EMAIL. No se modifica la recuperación de cuentas ni sus mecanismos de correo.

GET /api/v1/channels/status del backend devuelve channels.whatsapp y channels.app. WhatsApp se consulta al microservicio con X-Service-Key y un timeout de lectura de 3s. Se permiten DISABLED, SIMULATION, UNCONFIGURED, CONFIGURED_REAL; una respuesta incompleta, inconsistente o un error da UNVERIFIED (No se pudo verificar). No se exponen secretos, URLs privadas ni excepciones del proveedor. CONFIGURED_REAL requiere modo production, proveedor meta, canal habilitado, phoneNumberId numérico, accessToken no vacío/placeholder y versión API válida; no verifica credenciales contra Meta, plantillas aprobadas ni entrega. connectionVerified siempre false. WHATSAPP_ENABLED=false desactiva el adaptador; no intenta envío real. Producción incompleta conserva el fallback simulado anterior y se reporta UNCONFIGURED.

APP informa inbox.status=AVAILABLE y requiresFirebase=false. push.enabled solo refleja habilitación; su status es UNCONFIGURED hasta integrar y validar el emisor real del servidor, o DISABLED si está desactivado. Un google-services.json del cliente no certifica el servidor FCM. Seguimiento y Configuración comparten el reporte correcto; no usan health del backend como verificación de WhatsApp. El resultado histórico se consulta por separado en PostgreSQL y no se reescribe al consultar estados de canales. Las plantillas y su aprobación local se conservan.

QA: 96 pruebas web/build, 60 backend seleccionadas y 27 comunicaciones sin fallos. Verificación real local con microservicio detenido: UNVERIFIED en WhatsApp, bandeja disponible y lectura/fallos históricos visibles; recuperación a SIMULATION después del arranque. Baseline de IDs/estados/lecturas WhatsApp/APP idéntico tras actualizar. Base conserva 3 registros EMAIL históricos; endpoint de seguimiento solo muestra APP/WHATSAPP. Solicitud EMAIL en configuración rechazada400; reevaluación con cero nuevos. Backend/comunicaciones/PostgreSQL saludables. Evidencias outputs/canales-antes.json, canales-reporte.json y capturas58–59. No se enviaron mensajes reales ni se activó Firebase.
