# Integración E03 MA/RM

Rama de integración compartida con backend y móvil. Se incorporaron las mejoras de Acosta conservando el recorrido de FAQ y recordatorios E03.

Se conserva la configuración multicanal de recordatorios, selección exacta de días y seguimiento APP/WHATSAPP/EMAIL. FAQ mantiene publicación por administrador y propuestas pendientes. La web usa su proxy al backend local; ningún secreto de BD o token interno se añadió a VITE_*. npm run check: 92 pruebas y build correctos.

Para configuración y compatibilidad de base consultar docs/INTEGRACION_E03.md del backend. Firebase Android requiere google-services.json del equipo; no se incluyó ningún archivo privado ni credenciales en estos repositorios.
