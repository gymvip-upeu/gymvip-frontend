# Evidencia de validación: HU-23, HU-24 y HU-25

Corte: 19 de noviembre de 2026, hora de Lima. Alcance: catálogo, edición de suplementos y promociones.

## Código y ramas

- Frontend: `JorgeQuispe/historias-de-usuario-s2`.
- Backend: `JorgeQuispe/historias-de-usuario-s2`.
- Los cambios están en ramas personales. Este registro no afirma que estén fusionados en `S2-REVISION-QA` ni desplegados juntos.

## Evidencia comprobada

### Frontend

Se ejecutó la suite de pruebas con:

```text
node --experimental-vm-modules --test tests/*.test.js
```

Resultado: 88 pruebas aprobadas, 0 fallidas. Se compararon los archivos de catálogo `src/api/catalogApi.js`, `src/components/catalog/catalogUtils.js`, `tests/catalogApi.test.js` y `tests/catalogValidation.test.js` con la rama personal de GitHub; su contenido coincide. No se ejecutó build ni lint en este entorno.

### Interfaz web desplegada

El recorrido manual del 19/11 se hizo en Vercel como ADMIN con datos identificados como QA. El SHA desplegado no fue identificado.

- Se creó y consultó un suplemento de prueba a S/150, incluyendo su imagen.
- Se creó una promoción con oferta S/135 y ahorro S/15.
- Al cambiar el precio del producto a S/180, la oferta consultada pasó a S/165 y conservó el ahorro de S/15.
- Se desactivó la promoción y el historial conservó los estados anteriores.
- El producto se cambió a Agotado y Oculto; el historial mostró las tres versiones registradas.

Estas verificaciones cubren el recorrido administrativo observado. No equivalen a pruebas móviles, PostgreSQL inspeccionado directamente ni aceptación comercial del gimnasio.

### Backend

Se subió una prueba parametrizada de `GET /api/v1/catalog/products` para ADMIN, RECEPCIÓN y CLIENTE, y se incluyó `/products` en la comprobación de rechazo anónimo. El commit está en la rama personal del backend.

El registro local disponible indica 13/13 pruebas de seguridad aprobadas, pero la copia usada para esa corrida difiere de la rama actual en `SecurityConfig.java`, `CatalogController.java` y `CatalogService.java`. Por ello, ese resultado no se atribuye al HEAD remoto. La prueba del backend debe repetirse sobre el checkout exacto de la rama antes de reportarla como verificación remota.

## Pendientes para cerrar las historias

- **HU-23:** probar con sesión CLIENTE en teléfono el listado, detalle e imagen del catálogo; comprobar producto publicado, agotado y oculto; ejecutar integración con el backend compartido y PostgreSQL; validar rotulado e imágenes reales con el gimnasio.
- **HU-24:** comprobar que la edición administrativa se refleja en la consulta móvil y que los permisos e historial funcionan en el backend compartido.
- **HU-25:** ejecutar creación, edición, desactivación, fechas de vigencia, límites de fecha, promociones superpuestas y concurrencia contra PostgreSQL de pruebas; confirmar la regla comercial del ahorro con el Product Owner.
- **Integración:** revisar y fusionar las ramas personales mediante el flujo acordado por el equipo; registrar los SHAs integrados y el resultado de QA.
- **Backlog Scrum:** DoR documenta acuerdos previos al Sprint, por lo que el equipo debe confirmar cualquier casilla sin marcar usando los acuerdos reales. Marcar DoD únicamente por criterio con evidencia verificable y adjuntar su enlace o resultado.

## Estado de presentación

El trabajo de catálogo tiene implementación y evidencia parcial. Las 88 pruebas frontend y el recorrido web administrativo están comprobados. La integración móvil, la validación PostgreSQL y la aprobación de negocio permanecen abiertas; no se presentan como completadas.
