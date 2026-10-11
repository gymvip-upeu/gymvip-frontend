# Especificaciones de Pantallas y Guía Figma — GYM VIP

**Propósito:** Define los frames, layouts, componentes y flujos interactivos para los equipos de diseño y desarrollo en Figma y React.  
**Estado:** Especificación oficial. Como no se dispone de una herramienta directa de escritura de API en Figma en este entorno local, se proporciona la especificación pixel-exacta de tokens, layouts y componentes para su construcción en Figma, junto con el prototipo local interactivo en React.

---

## 1. Nomenclatura Estándar de Frames en Figma

Todos los frames en Figma deben nombrarse siguiendo la convención:
`[ÉPICA]/[HISTORIA]/[PANTALLA]/[ESTADO]`

Ejemplos:
- `E01/HU-03/Login/Default`
- `E01/HU-03/Login/Error-Credenciales`
- `E01/HU-01/Alta-Cliente/Formulario-Vacio`
- `E01/HU-01/Alta-Cliente/Validacion-Menor-Bloqueado`
- `E01/HU-01/Alta-Cliente/Error-DNI-Duplicado`
- `E01/HU-02/Clientes/Lista-Vacia`
- `E01/HU-02/Clientes/Lista-Resultados`
- `E02/HU-06/Planes/Catalogo-Lista`
- `E02/HU-06/Planes/Modal-Crear-Plan`

---

## 2. Especificación Detallada de Frames Clave

### Frame 1: `E01/HU-01/Alta-Cliente/Formulario`
- **Dimensiones:** Escritorio (1440 x 900 px) o contenedor de formulario (720 px de ancho centrado).
- **Encabezado:** Título `Nuevo Registro de Socio`, subtítulo `Ingrese los datos de la persona adulta y registre su consentimiento informado.`
- **Sección Identidad:**
  - Selector `Tipo de Documento`: Opciones `DNI (Perú)`, `Carné de Extranjería`, `Pasaporte`.
  - Input `Número de Documento`: 8 dígitos para DNI, validación numérica.
  - Inputs `Nombres` y `Apellidos`: Requeridos.
  - Input `Fecha de Nacimiento`: Si edad < 18 años, mostrar badge de advertencia: `⚠️ La inscripción de menores requiere representante legal validado (bloqueado temporalmente)`.
- **Sección Contacto:**
  - Input `Celular`: Prefijo `+51`, 9 dígitos.
  - Input `Correo Electrónico`: Validación de formato.
- **Sección Consentimiento Legal:**
  - Casilla 1 (Checked=False, Required): `[ ] He leído y acepto los Términos del Servicio (v1.0)` con enlace.
  - Casilla 2 (Checked=False, Required): `[ ] Declaro haber recibido y leído el Aviso de Privacidad y Tratamiento de Datos (v1.0)` con enlace.
  - Casilla 3 (Checked=False, Opcional): `[ ] Acepto recibir promociones y novedades por correo electrónico.`
  - Casilla 4 (Checked=False, Opcional): `[ ] Acepto recibir promociones y avisos por WhatsApp.`
- **Acciones:**
  - Botón Secundario: `Cancelar / Limpiar`.
  - Botón Primario: `Registrar Socio` (habilitado solo cuando las casillas requeridas están marcadas y los campos válidos).
- **Estado Error Duplicado:**
  - Toast / Banner en rojo: `El documento DNI 72819201 ya se encuentra registrado a nombre de otro socio. [Ver Ficha]`.

### Frame 2: `E02/HU-06/Planes/Catalogo-Lista`
- **Dimensiones:** Escritorio (1440 x 900 px), Sidebar izquierda (260 px), Contenido (1180 px).
- **Barra de Herramientas:**
  - Título `Planes de Membresía`.
  - Botón `+ Nuevo Plan` (solo visible/activo para administradores).
  - Selector de filtro: `Todos`, `Activos`, `Inactivos`.
- **Grid de Tarjetas de Planes:**
  - Tarjeta: Fondo `#FFFFFF`, borde `1px solid #D9E3DE`, radio `12px`, padding `24px`.
  - Badge superior: `ACTIVO` (verde) o `INACTIVO` (gris).
  - Nombre: `Plan VIP Mensual` (20px, `#14201D`, semibold).
  - Precio grande: `S/ 120.00` (28px, `#114E46`, bold).
  - Duración: `30 días calendario`.
  - Lista de beneficios con check icons.
  - Botón `Editar` y botón de alternar estado `Inactivar`.

---

## 3. Instrucciones para Importar / Crear en Figma

1. **Configurar Estilos Locales (Local Styles):**
   - Crear la paleta de colores usando los códigos hexadecimales del `DESIGN_SYSTEM.md` (`Brand/700: #114E46`, `Brand/500: #1C806C`, `Accent/500: #D9F36A`, `Ink/900: #14201D`, etc.).
   - Crear estilos de texto con la fuente **Inter** (Regular 400, Medium 500, SemiBold 600, Bold 700).
2. **Crear Componentes Base:**
   - Botones con variantes: Primary, Secondary, Outline, Danger, con estados Default, Hover, Focused, Disabled.
   - Inputs con etiquetas flotantes o persistentes, texto de ayuda y variante de Error con mensaje rojo.
   - Badges de estado con layout automático (Auto Layout), icono a la izquierda y texto a la derecha.
3. **Construir los Recorridos:**
   - Recorrido 1: Recepción inicia sesión → Visualiza inicio → Accede a alta de cliente → Rellena formulario adulto → Confirma consentimiento → Guarda exitosamente.
   - Recorrido 2: Administrador inicia sesión → Entra a Configuración de Planes → Hace clic en Nuevo Plan → Ingresa nombre, precio en PEN, duración y beneficios → Guarda y ve la tarjeta creada en el listado.
