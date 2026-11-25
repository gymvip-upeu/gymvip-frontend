# Publicación de suplementos y consulta móvil

## Alcance guardado el 25/11/2026

La rama `feature/catalogo-publicacion-movil-qquerar` conserva la integración del diseño de suplementos del commit `00548cc` y añade el alta inicialmente oculta por defecto. Administración revisa la ficha y confirma sus datos antes de guardar; después puede publicarla con Mostrar en el catálogo. Editar conserva la publicación previa del producto.

La interfaz distingue publicación, disponibilidad manual y existencias: publicar permite consultar, Disponible/Agotado controla la disponibilidad indicada y el stock se comprueba al confirmar el pedido. Ocultar conserva la información y el historial.

Cambios coordinados en las ramas del mismo nombre de backend y móvil: sincronización general del catálogo, reemplazo sin duplicados, datos anteriores identificados ante fallos y reintento; rechazo de altas al carrito para agotados u ocultos; corrección JDBC del carrito y normalización de roles del móvil.

Verificación: 102 pruebas web y empaquetado correctos; 283 pruebas backend y 76 móviles. Se comprobó el precio web → móvil, agotado con detalle accesible y acción deshabilitada, ocultación y recuperación tras caída del servidor. El producto usado temporalmente quedó restaurado. El registro oculto y ciclo completo también tienen cobertura en PostgreSQL aislado con un socio registrado sin membresía.

La demostración manual con un producto nuevo y fotografía real sigue pendiente. La rama contiene código, pruebas y documentación; no incluye la base de datos local, fotografías pendientes, archivos .env ni credenciales.
