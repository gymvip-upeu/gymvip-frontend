# GYM VIP — Entorno compartido y trabajo por developer

Fecha de referencia: 18 de octubre de 2026, America/Lima.

## 1. Requisitos básicos y versiones del entorno

### 1.1 Estado real de la verificación

**La coincidencia exacta con el equipo de André todavía no está verificada.** En esta revisión no se pudo acceder a `pom.xml`, `package.json` ni a los repositorios mediante GitHub: respondieron 404 con el acceso disponible. Esto no demuestra que estén eliminados; pueden ser privados o no estar disponibles para esta conexión. Tampoco se dispone de una captura actual de `java -version`, `node --version` o del servidor PostgreSQL de André.

Esta guía no inventa números de parche ni presenta versiones propuestas como instaladas. El primer trabajo del agente de André es obtener la matriz efectiva de su base funcional; Alexander y Jorge deben reproducir esa misma matriz. No se debe actualizar todo a `latest` para intentar igualar entornos.

| Componente | Base compatible / regla del equipo | Fuente que fija la versión exacta | Estado |
|---|---|---|---|
| Sistema operativo | Windows 11 de 64 bits como referencia de comandos. Linux/macOS pueden trabajar con los equivalentes. | Sistema del developer | No exige SO idéntico |
| Java JDK | **Java 21 LTS**, como línea propuesta para estabilizar el backend. Comparar con el proyecto de André antes de instalar/cambiar. **Java 24 no es LTS**. | `java -version`, `javac -version`, toolchain y propiedad `java.version`/`maven.compiler.release` del POM | Parche y distribución de André por verificar |
| Maven | Usar **Maven Wrapper del repositorio**; no imponer el Maven global de cada PC. | `.mvn/wrapper/maven-wrapper.properties` y `mvnw.cmd -v` | Versión exacta por leer del repositorio |
| Spring Boot | Conservar la versión estable compatible fijada en el POM de la base. La mención histórica a 3.4 no demuestra la versión actual ni su soporte vigente. | Parent/BOM de `pom.xml`, POM efectivo y política oficial de soporte | No verificado |
| Node.js | Misma versión LTS completa que André y compatible con `engines`. Si aún no existe una base fijada, **24 LTS es propuesta**; 22 LTS también puede mantenerse si ya es la base compatible del equipo. | `.nvmrc`, `.node-version`, `engines` y `node --version` | Elección/parche de André por verificar |
| npm | Misma versión completa usada para generar y validar el lockfile. No instalar globalmente otra por iniciativa del agente. | `npm --version`, `packageManager` si existe y CI | No verificado |
| React / React DOM | Exactas versiones resueltas del lockfile de André; no instalar React global. | `package-lock.json` y `npm ls --depth=0` | No verificado |
| Vite / TypeScript / librerías UI | Conservar las versiones bloqueadas. TypeScript o Framer Motion solo si pertenecen a la base; no introducir una migración incidental. | `package.json`, `package-lock.json`, configuración existente | No verificado |
| PostgreSQL | Mismo motor y versión mayor que el entorno compartido de desarrollo/Render, dentro de una línea soportada. Es **PostgreSQL**, no PostgREST. | `SHOW server_version;` del servidor real; imagen fijada si usan contenedor | Versión de Render por verificar |
| Git | Git estable disponible. No requiere el mismo parche para compilar, pero registrar la versión y usar los mismos repositorios/base de integración. | `git --version` | Versión de cada PC por verificar |
| IDE / Antigravity | Editor a elección; apuntar al JDK y Node fijados. Las versiones del compilador no las decide el editor. | Configuración del workspace y terminal integrada | Verificar al abrir el proyecto |
| Docker | Opcional si el entorno del equipo ya lo usa. No es requisito para quien conecte a una PostgreSQL de desarrollo autorizada. | Compose/Dockerfile, si existen | No exigir instalación sin revisar recursos |

La documentación vigente de Vite exige Node 20.19+ o 22.12+; esto describe compatibilidad, no recomienda usar una línea que ya no tenga soporte. Mantener la LTS acordada. No usar versiones `alpha`, `beta`, `RC`, `SNAPSHOT` o imágenes `latest` como base compartida. Si la versión real de André está fuera de soporte o no es estable, reportarlo y coordinar una actualización probada; no declararla válida solo por coincidir.

Para empezar Sprint 1 se necesitan: acceso a ambos repositorios, JDK, Node/npm, Git, navegador y PostgreSQL de desarrollo. No se necesitan emuladores móviles, Android Studio, Xcode ni servicios WhatsApp/correo para este sprint. Comprobar RAM y espacio antes de exigir Docker u otros procesos pesados; usar datos ficticios en desarrollo.

### 1.2 Captura de versiones: primero André, después Alexander y Jorge

Herramienta: **PowerShell**. Carpeta inicial: la raíz local `gymvip` que contiene los dos repositorios. Sustituir la ruta por la que realmente exista; no crear otro proyecto encima del actual.

```powershell
Set-Location 'C:\ruta-real\gymvip'

# Identificar la base sin modificar Git.
git -C .\gymvip-backend status --short
git -C .\gymvip-backend branch --show-current
git -C .\gymvip-backend rev-parse HEAD
git -C .\gymvip-frontend status --short
git -C .\gymvip-frontend branch --show-current
git -C .\gymvip-frontend rev-parse HEAD

# Versiones efectivas: también ejecutar en la terminal integrada del IDE.
java -version
javac -version
node --version
npm --version
git --version
Get-Command java, javac, node, npm, git | Select-Object Name, Source

Set-Location .\gymvip-backend
if (Test-Path .\mvnw.cmd) { .\mvnw.cmd -v }
if (Test-Path .\.mvn\wrapper\maven-wrapper.properties) {
    Select-String -Path .\.mvn\wrapper\maven-wrapper.properties -Pattern '^distributionUrl='
}
Select-String -Path .\pom.xml -Pattern 'spring-boot|java.version|maven.compiler.release'

Set-Location ..\gymvip-frontend
node -e "const p=require('./package.json'); console.log(JSON.stringify({engines:p.engines,packageManager:p.packageManager,scripts:p.scripts,dependencies:p.dependencies,devDependencies:p.devDependencies},null,2))"
if (Test-Path .\.nvmrc) { Get-Content .\.nvmrc }
if (Test-Path .\.node-version) { Get-Content .\.node-version }
if (Test-Path .\package-lock.json) {
    node -e "const l=require('./package-lock.json'); for (const n of ['react','react-dom','vite','typescript','framer-motion']) console.log(n+': '+(l.packages?.['node_modules/'+n]?.version ?? l.dependencies?.[n]?.version ?? 'no incluido'))"
}
```

En el cliente SQL conectado a la **base de desarrollo real**, ejecutar:

```sql
SHOW server_version;
SELECT current_database(), current_user;
```

`psql --version` identifica el cliente, no la versión del servidor. No mostrar contraseñas, tokens, `.env` completo, URLs con credenciales ni datos de socios en el informe.

**Resultado esperado:** versiones completas, distribución JDK, versiones declaradas/resueltas y los dos commits base. El agente debe completar esta matriz dentro de esta guía con valores reales; la marca actual indica ausencia de evidencia, no un valor para instalar:

| Dato común | Valor de referencia de André | Evidencia requerida |
|---|---|---|
| JDK: distribución + versión completa | Oracle Corporation Java SE 24.0.1 (`javac 24.0.1`) | Salida `java -version`, `javac -version` y JVM utilizada por Maven (HotSpot 64-Bit 24.0.1) |
| Maven Wrapper | Apache Maven 3.9.10 | URL distribución en `.mvn/wrapper/maven-wrapper.properties` + `.\mvnw.cmd -v` |
| Spring Boot | Spring Boot 3.4.3 (Java 21 bytecode target) | Parent/BOM efectivo en `pom.xml` (`<java.version>21</java.version>`) |
| Node.js y npm | Node.js v22.16.0 / npm 11.5.2 | Salida `node -v` y `npm -v`; fijación por `package.json` y lockfile |
| React, React DOM y Vite | React 18.3.1 / React DOM 18.3.1 / Vite 6.4.4 | Versiones exactas resueltas en `package-lock.json` |
| PostgreSQL servidor | PostgreSQL 17.11 (Debian 17.11-1.pgdg12+2) en Render | Conexión JDBC TLS externa verificada, Flyway V1/V2 en public y test, 23/23 tests PASS en gymvip_test |
| Commit base backend | `279d2fc` (Tag de seguridad: `backup/pre-audit-sprint1`) | `git rev-parse HEAD` del backend compartido (commit inicial `54eb2bb4`) |
| Commit base frontend | `a3a9449` (Tag de seguridad: `backup/pre-audit-sprint1`) | `git rev-parse HEAD` del frontend compartido (commit inicial `cb352599`) |

Los repositorios tienen historiales independientes: sus hashes no serán iguales entre sí. Cada compañero debe partir del commit acordado de **cada** repositorio. André debe fijar Node y el gestor en los mecanismos ya usados por el proyecto, conservar el wrapper y versionar el lockfile. No modificar esos archivos desde tres ramas en paralelo sin coordinación.

### 1.3 Preparar y ejecutar la base

1. Si ya existen los repositorios, inspeccionar Git y conservar cambios locales. No volver a clonarlos encima, no ejecutar `reset --hard`, `clean -fd` ni actualizaciones forzadas.
2. Si no existen, clonar las URL entregadas por el equipo, con la cuenta autorizada:

```powershell
# Ejecutar desde la carpeta raíz gymvip y solo si todavía no existen estas carpetas.
git clone https://github.com/gymvip-upeu/gymvip-backend.git
git clone https://github.com/gymvip-upeu/gymvip-frontend.git
```

3. Leer `README.md`, instrucciones del repositorio y archivos de configuración de la base. No asumir una rama `main`/`develop` ni endpoints concretos sin comprobarlos.
4. Comparar las versiones con la matriz de André y usar el gestor fijado. Los comandos siguientes presuponen npm y un `package-lock.json` existente. Si el proyecto usa otro gestor, conservar su lockfile y su instalación reproducible; no crear un segundo lockfile.
5. Crear `.env` desde el ejemplo solo si no existe:

```powershell
Set-Location 'C:\ruta-real\gymvip\gymvip-backend'
if (!(Test-Path .\.env) -and (Test-Path .\.env.example)) {
    Copy-Item .\.env.example .\.env
}
git check-ignore .env
git ls-files .env

Set-Location ..\gymvip-frontend
if (!(Test-Path .\.env) -and (Test-Path .\.env.example)) {
    Copy-Item .\.env.example .\.env
}
git check-ignore .env
git ls-files .env
```

`git check-ignore .env` debe identificar la regla aplicable cuando el archivo no está versionado. `git ls-files .env` debe quedar sin salida. Añadir `.env` al `.gitignore` no retira automáticamente un secreto previamente versionado; si aparece uno, reportarlo y gestionar su retiro/rotación sin publicarlo en el informe.

6. Configurar conexión de **desarrollo** y URL de API con los nombres que realmente lee el código. Contrato propuesto si la base aún no los define:

| Capa | Variables propuestas | Regla |
|---|---|---|
| Backend | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `PORT`, `FRONTEND_ORIGIN` | Deben estar mapeadas explícitamente en Spring; los nombres son propuesta, no prueba de implementación. |
| Frontend | `VITE_API_BASE_URL` | URL pública del backend. Jamás credenciales PostgreSQL ni secretos JWT. |

Ejemplo de forma de URL JDBC, sin credenciales: `jdbc:postgresql://HOST:5432/BASE?sslmode=require`. Usar host, puerto, base y opciones TLS entregados por el proveedor. No pegar directamente una URI `postgresql://usuario:clave@...` en una propiedad que espera JDBC. No conectar cada entorno de pruebas a la base productiva.

**Un `.env` no basta por existir:** Vite carga archivos de entorno según su modo; los valores `VITE_*` llegan al cliente y son públicos. Spring Boot necesita un mecanismo real de lectura/importación o variables del proceso. El agente de André debe verificar y documentar ese mecanismo en la base; si falta, implementarlo como parte del arranque común, manteniendo los secretos fuera de Git. No afirmar “solo cambiar `.env`” hasta probar ese arranque. Cambiar variables de Vite requiere reiniciar el servidor y, en una distribución compilada, reconstruirla.

7. Backend, desde `gymvip-backend` y con el entorno cargado por el mecanismo documentado:

```powershell
.\mvnw.cmd -v
.\mvnw.cmd clean verify
.\mvnw.cmd spring-boot:run
```

8. Frontend, en otra terminal desde `gymvip-frontend`:

```powershell
npm ci
npm run
npm run build
npm run dev
```

`npm ci` necesita un lockfile coherente y reinstala dependencias sin regenerarlo. No sustituirlo por `npm update` ni borrar el lockfile si falla. `npm run` muestra qué scripts existen: ejecutar pruebas/lint con los nombres reales. Un build correcto no demuestra que la UI funcione ni que las pruebas se hayan ejecutado.

**Resultado esperado:** ambos procesos arrancan, el frontend consume la API real, las migraciones se aplican a PostgreSQL y un registro persiste después de reiniciar el backend. Comprobar los puertos efectivos en la configuración; no asumir que 8080/5173 siempre están libres. Un test que necesita base o contenedor no ejecutado se informa como `NO EJECUTADO` o `BLOQUEADO`, nunca como aprobado.

## 2. Alcance y acuerdos que todos los agentes deben respetar

- Product Owner: **Wagner**. Duración: **2 semanas por sprint**. La presentación de S1 fue reportada para la semana del 19 al 25/10/2026; no hay día exacto confirmado.
- Objetivo exacto S1: **Centralizar la información de las personas inscritas en el gimnasio y mejorar el control de los planes contratados.**
- S1: HU-01, HU-02, HU-04, HU-06, HU-07, HU-08, HU-09, HU-10, HU-11 y el corte manual de HU-12. Los 44 PE son estimaciones propuestas, no horas ni capacidad demostrada.
- HU-03 permanece en S2; adelanto opcional si hay capacidad. La autenticación mínima que permite comprobar permisos y auditar actores es requisito técnico S1, no permiso para dejar endpoints abiertos.
- HU-05 y la app móvil no son parte de S1. El rol CLIENTE se prepara a nivel de seguridad sin construir la app administrativa móvil; la app futura es exclusiva del socio/cliente.
- Registro de socios solo para adultos; correo opcional. No inventar una cuenta móvil al crear una ficha. El flujo de visitantes menores sin ficha y su autorización corresponde a una definición posterior de HU-35; sus cobros no pueden quedar invisibles.
- Roles operativos: ADMIN, RECEPCION y CLIENTE. Recepción puede corregir clientes; ADMIN debe consultar autor, cliente, campos cambiados, antes/después y fecha.
- Plan mensual: **30 días**, no `plusMonths(1)`. Sin tolerancia al vencer. Renovación anticipada conserva días restantes y añade 30; renovación vencida inicia desde la fecha de pago según convención acordada.
- Fecha local propuesta: `America/Lima`; instante técnico/auditoría UTC. El intervalo inicio incluido/fin excluido y el umbral de “próxima” de 7 días siguen documentados como propuesta a ratificar, no se reinterpretan por agente.
- Pagos presenciales. Registrar una transferencia no demuestra conciliación bancaria automática. No introducir pasarela, tarjetas almacenadas, cuotas o deuda por iniciativa propia.
- Cancelación, ajustes, pase diario, reportes consolidados: S2. Distinguir anulación de registro erróneo de cancelación sin devolución; no borrar cobros originales ni simular salida de dinero que permanece en caja.
- Cancelación solicitada solo en recepción; afecta renovaciones futuras pagadas. Su efecto económico y permisos finales deben resolverse con el PO antes de implementar el ajuste.
- Diseño web oscuro/dorado, jerarquía clara, formularios de alta/edición en modales y lectura en ficha/listado. Sidebar colapsable mediante icono, texto accesible, teclado y movimiento reducido. Respetar tokens reales del proyecto; no volver al tema verde ni imponer neón.
- Catálogo con carga por ADMIN y vista previa. Servicios, inventario y ventas no se convierten en alcance confirmado por la expresión “creería”.
- Comunicaciones en sprint separado; recordatorio 3 días antes confirmado. S5/S6 y sus repartos siguen tentativos.
- No implementar entrenadores ni rutinas. Mantener HU-18, HU-19, HU-20 y HU-31 como retiradas; no reutilizar sus IDs.

### 2.1 Arquitectura compartida

La instrucción posterior del equipo reemplazó la organización modular inicial: utilizar **capas generales, sin módulos/carpetas por épica o feature**, y conservar las carpetas ya implementadas si respetan esas dependencias.

| Capa | Backend: contenido esperado | Frontend: contenido esperado |
|---|---|---|
| Domain | Entidades de negocio, reglas puras, objetos de valor y contratos necesarios | Modelos de negocio y contratos de repositorio |
| Application | Casos de uso, coordinación y puertos de persistencia/servicios | Casos de uso y coordinación independiente de componentes visuales |
| Infrastructure | Entidades JPA, repositorios Spring Data, adaptadores, mappers técnicos y configuración | Cliente HTTP, DTO de API, mappers, repositorios concretos y persistencia técnica |
| API / Presentation | Controllers, request/response DTO, validación de entrada y traducción de errores | Pages, components, hooks/viewmodels de presentación, rutas, estilos y estados |

Dependencias hacia el núcleo. El dominio no importa Spring/JPA/React. Los controllers y componentes visuales no calculan vigencia, precio ni permisos como autoridad. Un directorio plano `controller/service/repository` por sí solo no demuestra Clean Architecture. No duplicar DTO ni repositorios para cumplir artificialmente un árbol; separar contratos de sus implementaciones cuando haya una frontera real.

El agente de frontend no debe reorganizar backend si solo se le asignó UI. Cambios de contrato y BD se coordinan con André/Alexander. Documentación general en `documentos/` de la raíz; conservar los README de cada repo y el único documento de estado en su `docs/`, actualizando el existente. No ignorar todos los `.md`: README, instrucciones y documentación necesaria sí forman parte del proyecto. No borrar documentos o migraciones para “limpiar” sin revisar sus dependencias.

## 3. Reparto y orden de integración de Sprint 1

| Developer | HU coordinadas | PE propuestos | Entrega para el resto |
|---|---|---:|---|
| André | HU-01, HU-04, HU-06 | 15 | Base funcional backend/frontend, PostgreSQL, configuración, clientes, roles, planes y contratos compartidos |
| Alexander | HU-07, HU-08, HU-10 | 15 | Contratación con cobro atómico y renovación, integradas sobre la base |
| Jorge | HU-02, HU-09, HU-11, HU-12 manual | 14 | Consulta/edición, auditoría visible al ADMIN, vigencias, vencimientos y verificación manual |

Cada responsable coordina su HU completa, incluyendo UI, API, persistencia y pruebas. El apoyo de otra persona no convierte la HU en una tarea exclusivamente frontend o backend ni duplica sus puntos.

1. **André entrega una base ejecutable:** configuración reproducible, migraciones de clientes/roles/planes, DTO y errores documentados, cuentas de prueba sin secretos en Git, cliente HTTP frontend, navegación y tokens visuales. Entrega los dos commits reales de la base y comandos probados.
2. **Alexander y Jorge acuerdan primero las fronteras compartidas:** contrato de contratación/cobro, cálculo único de vigencia, forma de errores, paginación y auditoría. HU-07/HU-08 son una única transacción; HU-09 proporciona la regla consumida por HU-10/HU-12. No duplicar el cálculo mientras esperan la integración.
3. **Trabajo en paralelo sobre archivos acordados:** Alexander desarrolla los flujos de cobro/renovación; Jorge edición/listados/verificación y ajustes UI. Los esquemas o interfaces compartidos se revisan antes de cambiarlos.
4. **Integración incremental:** cliente → plan → contratar/cobrar → consultar → renovar → verificar. Probar con PostgreSQL y API real; un mock no acredita el DoD.
5. **Revisión durante el sprint y al cierre:** Wagner revisa Figma y web; Jorge subsana diseño/frontend; André y Alexander subsanan backend. Las correcciones que impiden cumplir CA/DoD se verifican antes de declarar terminada la HU. Las mejoras nuevas se priorizan con Wagner.

DoR = condiciones comprobables para empezar. CA = comportamiento observable de esa HU. DoD = calidad y evidencia para considerarla terminada. Las casillas vacías de esta guía no significan incumplimiento comprobado: todavía no hay evidencia registrada aquí.

Las fichas siguientes conservan los CA/DoD/DoR del backlog versión 3. Las tareas se precisan para ejecución por agentes; siguen siendo propuesta técnica y no prueba de código existente. Donde una nota identifique una decisión pendiente, el agente debe reportarla y avanzar con trabajo independiente, sin aprobarla por su cuenta.



## 4. HU de Sprint 1, separadas por developer


### André — Sprint 1


#### HU-01 — Registrar clientes

**Sprint:** 1 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero registrar los datos de los clientes para mantener un control organizado de las personas inscritas en el gimnasio.

**Coordina:** André. **Apoyo:** Alexander: revisión backend; Jorge: UI.

**Dependencias:** HU-04; autenticación mínima protegida requerida

**Acuerdos, propuestas y límites:** Acuerdo reportado 18/10: el registro de socios es solo para adultos. Se reporta que menores pagan acceso diario sin ficha de socio; ese flujo y su autorización deben definirse en HU-35. Propuesta: verificar mayoría de edad presencialmente, sin guardar copia del documento. Correo/celular opcionales; aviso de privacidad accesible.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Revisar la base y definir contrato de alta, campos mínimos, validación adulta y documento por país/tipo/número; conservar correo opcional.
2. Crear o revisar migración PostgreSQL, normalización del documento sin perder ceros e índice único compuesto. Resolver duplicados concurrentes con conflicto controlado.
3. Implementar el caso de uso por capas, validación semántica, transacción y auditoría. No crear cuenta móvil ni guardar consentimientos ficticios.
4. Aplicar ADMIN/RECEPCION en API y comprobar que el actor proviene de la sesión, no de un ID libre enviado por el formulario.
5. Conectar el modal de datos personales a la API; manejar carga, error, vacío/resultado y éxito; conservar lo escrito al fallar.
6. Comprobar alta válida, documento inválido, duplicado, falta de permiso y doble envío. No usar registros de menores para sortear la regla adulta.
7. Reiniciar el backend conectado a la misma BD de desarrollo y releer el registro. Documentar el contrato real y entregar la base a Jorge.

**Criterios de aceptación:**

- [ ] HU-01-CA-01: ADMIN y RECEPCION registran solo clientes adultos con nombres, apellidos y documento.
- [ ] HU-01-CA-02: Documento único por país, tipo y número. DNI peruano: 8 dígitos.
- [ ] HU-01-CA-03: Correo y celular son opcionales; se valida su formato si se ingresan.
- [ ] HU-01-CA-04: El modal de alta contiene datos personales y no crea acceso móvil.
- [ ] HU-01-CA-05: Un alta válida se guarda y aparece en el listado; un error no confirma éxito.
- [ ] HU-01-CA-06: El backend rechaza el registro sin permiso y los documentos duplicados.

**Definición de hecho:**

- [ ] HU-01-DoD-01: Alta releída después de reiniciar el backend.
- [ ] HU-01-DoD-02: Pruebas de duplicados y acceso indebido satisfactorias.
- [ ] HU-01-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-01-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-01-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-01-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-01-DoR-01: Campos mínimos y regla de documento entendidos.
- [ ] HU-01-DoR-02: HU-04 y autenticación mínima disponibles para probar permisos.
- [ ] HU-01-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-01-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-01-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-01-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Crear adulto válido y releer tras reinicio.
- Intentar documento duplicado, inválido y alta sin permiso.
- Verificar correo vacío permitido y formato inválido rechazado cuando se informa.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-04 — Roles y permisos

**Sprint:** 1 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero gestionar los roles y permisos del personal para controlar el acceso a las funcionalidades de la plataforma.

**Coordina:** André. **Apoyo:** Alexander: revisión backend; Jorge: UI.

**Dependencias:** Autenticación mínima protegida requerida

**Acuerdos, propuestas y límites:** Roles operativos: ADMIN, RECEPCION y CLIENTE. Recepción puede corregir clientes; ADMIN consulta su auditoría. Propuesta: cancelación/ajustes económicos autorizados por ADMIN y mantener un administrador activo. Autenticación mínima necesaria en S1; HU-03 completa planificada en S2.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Inspeccionar la autenticación mínima y el contexto del actor; si no existen, implementarlos dentro de la base técnica y documentar el alcance sin dar por cerrada HU-03 completa.
2. Preparar matriz ADMIN/RECEPCION/CLIENTE; comprobar qué endpoints existen en S1 y cuáles son futuros. No añadir SUPERADMIN como rol de negocio.
3. Migrar roles/cuentas de forma compatible y preparar alta, cambio de rol e inactivación de trabajadores; impedir quedarse sin administrador.
4. Aplicar autorización backend por operación y recurso, rechazando elevación de privilegios. Hash seguro para contraseñas; secretos por entorno.
5. Registrar actor y cambio de rol e invalidar o actualizar sesiones afectadas. Probar un cambio de rol mientras la sesión permanece abierta.
6. Conectar controles administrativos y navegación permitida. Ocultar botones es apoyo visual, no sustituto de 401/403.
7. Probar todas las combinaciones relevantes de la matriz con solicitudes directas, cuentas inactivas y acceso ajeno; documentar el mecanismo mínimo de acceso.

**Criterios de aceptación:**

- [ ] HU-04-CA-01: Existen los roles ADMIN, RECEPCION y CLIENTE.
- [ ] HU-04-CA-02: ADMIN administra trabajadores, roles y planes.
- [ ] HU-04-CA-03: RECEPCION opera clientes, asignaciones, cobros y consultas autorizadas.
- [ ] HU-04-CA-04: CLIENTE accede exclusivamente a sus recursos personales.
- [ ] HU-04-CA-05: La API devuelve 401 sin sesión y 403 sin permiso.
- [ ] HU-04-CA-06: Los cambios de rol quedan auditados y actualizan o revocan sesiones.

**Definición de hecho:**

- [ ] HU-04-DoD-01: Pruebas directas a endpoints validan 401/403.
- [ ] HU-04-DoD-02: No quedan operaciones protegidas por controles solo visuales.
- [ ] HU-04-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-04-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-04-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-04-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-04-DoR-01: Matriz ADMIN/RECEPCION/CLIENTE comprendida.
- [ ] HU-04-DoR-02: Autenticación base verificada o dependencia resuelta antes de cerrar.
- [ ] HU-04-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-04-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-04-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-04-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Acceso sin sesión → 401; sesión sin permiso → 403.
- Cambiar rol e intentar reutilizar acceso anterior.
- Comprobar imposibilidad de elevar privilegios o dejar cero administradores.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-06 — Configurar planes

**Sprint:** 1 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero registrar y configurar los planes de membresía con sus precios, duración, condiciones y beneficios para informar correctamente los servicios que ofrece el gimnasio.

**Coordina:** André. **Apoyo:** Alexander: revisión backend; Jorge: UI.

**Dependencias:** HU-04; autenticación mínima protegida requerida

**Acuerdos, propuestas y límites:** Propuesta: catálogo inicialmente vacío; ADMIN configura las tarifas reales antes de vender. No se inventan precios del gimnasio. El flujo de pase diario pertenece a HU-35/S2. Sin planes de rutinas ni entrenador.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Acordar campos: nombre, precio PEN, duración, beneficios y estado. Mensual de 30 días; tipo diario preparado, sin implementar su venta hasta HU-35.
2. Revisar migraciones de planes y versiones: precio positivo, nombre normalizado único y versión única dentro de cada plan.
3. Implementar creación, cambio versionado e inactivación como casos de uso; conservar precio y condiciones históricos de contratos existentes.
4. Permitir edición solo a ADMIN y consulta autorizada a recepción. No dejar editar una versión histórica inmutable.
5. Conectar catálogo y modales al backend, con filtros y estados de UI. Mostrar claramente 30 días y moneda PEN.
6. Probar nombre equivalente, precio inválido, duración no permitida, rol insuficiente y plan inactivo no vendible.
7. Entregar a Alexander el contrato de lectura de versiones y comprobar juntos que cambiar un plan no modifica una contratación anterior.

**Criterios de aceptación:**

- [ ] HU-06-CA-01: ADMIN crea planes con nombre, precio PEN, duración y beneficios.
- [ ] HU-06-CA-02: Mensual dura 30 días exactos; diario dura 1 día.
- [ ] HU-06-CA-03: Precio positivo y nombre único se validan en el backend.
- [ ] HU-06-CA-04: Editar precio o condiciones crea versión sin alterar contratos previos.
- [ ] HU-06-CA-05: Un plan inactivo no se ofrece en nuevas asignaciones.
- [ ] HU-06-CA-06: RECEPCION consulta planes; ADMIN crea, edita e inactiva mediante modal.

**Definición de hecho:**

- [ ] HU-06-DoD-01: Contrato previo conserva su precio al editar el plan.
- [ ] HU-06-DoD-02: Crear, editar e inactivar funcionan con API y datos reales.
- [ ] HU-06-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-06-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-06-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-06-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-06-DoR-01: Campos, duración y versionado del plan comprendidos.
- [ ] HU-06-DoR-02: ADMIN y base PostgreSQL disponibles.
- [ ] HU-06-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-06-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-06-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-06-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Crear/editar/inactivar como ADMIN y rechazar escritura de RECEPCION.
- Contratar una versión y cambiar el precio: el contrato anterior conserva su precio.
- Rechazar precio inválido y nombre normalizado repetido.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


### Alexander — Sprint 1


#### HU-07 — Asignar membresías

**Sprint:** 1 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como personal de recepción, quiero asignar una membresía a un cliente para registrar el servicio que ha contratado.

**Coordina:** Alexander. **Apoyo:** André: revisión backend; Jorge: UI.

**Dependencias:** HU-01, HU-06, HU-04; integración conjunta HU-08

**Acuerdos, propuestas y límites:** Propuesta: inicia el día del pago en America/Lima; fechas futuras deshabilitadas en S1. Fin exclusivo al inicio del día 31. Un periodo vigente por servicio; las renovaciones acumulan duración. Política comercial visible antes de pagar.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Revisar DTO y casos de uso entregados por André. Coordinar con Jorge el único cálculo de vigencia; ratificar con Wagner los ejemplos de corte antes de cerrar.
2. Diseñar selección de cliente existente → plan activo → calendario de inicio/último día → cobro/condiciones → confirmación.
3. Migrar contrato y periodos según el modelo real; guardar la versión/precio pactados y las referencias necesarias, evitando tablas duplicadas por agente.
4. Definir la operación conjunta HU-07/HU-08 con clave de idempotencia vinculada al actor/ámbito y huella de solicitud.
5. Validar solapamiento y concurrencia; persistir periodo, cobro y auditoría en una única transacción. Misma clave/cuerpo devuelve el resultado previo; cuerpo distinto produce conflicto.
6. Mapear errores de validación, permiso, recurso inexistente y conflicto; conectar la UI sin crear primero una membresía suelta y después un pago independiente.
7. Probar plan inactivo, cliente inexistente, caída antes del commit, reintento después del commit y dos solicitudes simultáneas. Entregar a Jorge las consultas de cobertura.

**Criterios de aceptación:**

- [ ] HU-07-CA-01: Recepción selecciona cliente existente y versión activa de un plan.
- [ ] HU-07-CA-02: El calendario muestra inicio y último día incluido antes de confirmar.
- [ ] HU-07-CA-03: La membresía mensual cubre 30 fechas locales consecutivas.
- [ ] HU-07-CA-04: Asignación y cobro se confirman juntos o no se guarda ninguno.
- [ ] HU-07-CA-05: La operación repetida con la misma clave no duplica contrato ni cobro.
- [ ] HU-07-CA-06: La ficha conserva plan, precio y condiciones contratados.

**Definición de hecho:**

- [ ] HU-07-DoD-01: Fallo de transacción no deja contrato ni pago parcial.
- [ ] HU-07-DoD-02: Reintento de la misma venta conserva un único resultado.
- [ ] HU-07-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-07-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-07-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-07-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-07-DoR-01: Inicio, vencimiento y resumen de contratación definidos.
- [ ] HU-07-DoR-02: Clientes, planes activos y contrato conjunto de HU-08 disponibles.
- [ ] HU-07-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-07-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-07-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-07-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Forzar fallo antes de confirmar: no queda periodo ni cobro parcial.
- Reintentar la misma clave/cuerpo: un solo resultado y pago.
- Usar misma clave/cuerpo diferente y probar concurrencia/plan inactivo.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-08 — Registrar pagos

**Sprint:** 1 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como personal de recepción, quiero registrar los pagos de las membresías para mantener actualizado el historial de las operaciones realizadas.

**Coordina:** Alexander. **Apoyo:** André: revisión backend; Jorge: UI.

**Dependencias:** HU-07, HU-04

**Acuerdos, propuestas y límites:** Propuesta: pago completo, sin deuda ni cuotas. Referencia requerida en medios no efectivos. POS deshabilitado hasta que el gimnasio lo configure. Sin pasarela online. Constancia interna diferenciada del comprobante tributario.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Concretar con Wagner los medios realmente habilitados; pago completo y referencia en medios no efectivos siguen como propuesta en las observaciones.
2. Modelar registro económico inmutable con BigDecimal/NUMERIC, moneda PEN, método, referencia, fecha, actor y periodo. No utilizar float/double para dinero.
3. Integrar el registro del pago en la transacción de contratación/renovación. No duplicar la operación financiera entre HU-07 y HU-08.
4. Implementar consulta autorizada del historial y folio interno; dejar las correcciones compensatorias para HU-37 sin habilitar edición/borrado de pagos cerrados.
5. Conectar importe, medio, referencia, confirmación y constancia interna. Distinguir registro presencial de confirmación automática de un proveedor.
6. Probar monto inválido, referencia exigida según regla acordada, rol insuficiente y reintento. Confirmar que fallo del pago no activa acceso.
7. Releer pagos tras reinicio y conciliar con un conjunto pequeño de datos ficticios. Documentar contrato para reportes futuros, sin implementar pasarela.

**Criterios de aceptación:**

- [ ] HU-08-CA-01: Registra cobro completo en PEN vinculado al periodo contratado.
- [ ] HU-08-CA-02: Admite efectivo, Yape, Plin, transferencia y POS presencial configurado.
- [ ] HU-08-CA-03: Guarda fecha de cobro, método, importe, referencia y trabajador.
- [ ] HU-08-CA-04: Activa el periodo solo tras confirmar la transacción.
- [ ] HU-08-CA-05: El historial conserva pagos originales sin edición ni borrado físico.
- [ ] HU-08-CA-06: Un fallo informa error; un reintento no registra otro cobro.

**Definición de hecho:**

- [ ] HU-08-DoD-01: Cobro e importe persisten y coinciden con su periodo.
- [ ] HU-08-DoD-02: Se prueba doble envío y caída antes del commit.
- [ ] HU-08-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-08-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-08-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-08-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-08-DoR-01: Métodos habilitados y campos de cobro acordados.
- [ ] HU-08-DoR-02: HU-07 y permisos disponibles para la integración.
- [ ] HU-08-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-08-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-08-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-08-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Probar medios habilitados y referencias según regla ratificada.
- Conciliar importes con periodos y releer después de reinicio.
- Pago fallido no concede vigencia; original no se edita ni se borra.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-10 — Renovar membresías

**Sprint:** 1 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como personal de recepción, quiero renovar la membresía de un cliente para registrar correctamente su nuevo periodo de vigencia.

**Coordina:** Alexander. **Apoyo:** André: revisión backend; Jorge: UI.

**Dependencias:** HU-06, HU-07, HU-08, HU-09

**Acuerdos, propuestas y límites:** Propuesta: cambiar plan en renovación afecta solo el siguiente periodo. La cancelación es HU-36 y la corrección económica HU-37. No descontar días pagados restantes ni editar silenciosamente el pago anterior.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Reutilizar el cálculo de HU-09 y la transacción de HU-07/HU-08. No copiar la regla de fechas en el componente React.
2. Mostrar resumen del periodo actual, periodo añadido, nuevo último día e importe; confirmar la regla de cambio de plan al periodo siguiente.
3. Resolver casos de vigente, vencida, último día, renovación futura y contrato cancelado; documentar la acción permitida en cada caso.
4. Bloquear concurrencia al calcular el último fin y añadir periodo, snapshot y cobro en una transacción. Misma operación reintentada no genera otra renovación.
5. Actualizar ficha, lista y verificación después de confirmar, conservando filtros y datos ante error.
6. Probar renovación anticipada y tardía, límites de fecha, dos solicitudes simultáneas y pago fallido.
7. Demostrar que dos operaciones válidas diferentes pueden acumular periodos, mientras un reintento de la misma operación conserva un único cobro.

**Criterios de aceptación:**

- [ ] HU-10-CA-01: La renovación muestra plan, precio y nuevas fechas antes de confirmar.
- [ ] HU-10-CA-02: Si renueva vigente, añade 30 días al final actual.
- [ ] HU-10-CA-03: Si renueva vencida, inicia 30 días desde el día del pago.
- [ ] HU-10-CA-04: Solo confirma el nuevo periodo con el cobro completo.
- [ ] HU-10-CA-05: Conserva el historial de periodos y pagos anteriores.
- [ ] HU-10-CA-06: Evita una segunda renovación por doble clic o reintento.

**Definición de hecho:**

- [ ] HU-10-DoD-01: Pruebas anticipada/vencida confirman 30 días correctos.
- [ ] HU-10-DoD-02: Pago y periodo renovado son atómicos e idempotentes.
- [ ] HU-10-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-10-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-10-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-10-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-10-DoR-01: Ejemplos de renovación anticipada y tardía entendidos.
- [ ] HU-10-DoR-02: Plan activo, vigencia y registro de pago disponibles.
- [ ] HU-10-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-10-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-10-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-10-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Renovar vigente: añadir 30 días al final; vencida: desde el pago.
- Pago fallido no amplía fechas.
- Reintento idéntico no duplica; operaciones diferentes se distinguen.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


### Jorge — Sprint 1


#### HU-02 — Actualizar clientes

**Sprint:** 1 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como personal autorizado, quiero actualizar los datos de los clientes para mantener su información vigente.

**Coordina:** Jorge. **Apoyo:** André y Alexander: apoyo backend.

**Dependencias:** HU-01, HU-04; autenticación mínima requerida; HU-03 completa S2

**Acuerdos, propuestas y límites:** Acuerdo reportado: RECEPCION puede corregir datos y ADMIN debe consultar la trazabilidad: actor, cliente afectado, campos modificados, antes/después y fecha. Propuesta de UI: historial dentro de la ficha, sin crear módulo aparte. Documento único, correo opcional y edición modal. Baja no incluida.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Revisar contratos de clientes/seguridad de André. Mantener nombres, apellidos, documento, celular y correo como campos editables según el backlog actual.
2. Definir consulta paginada y filtros por nombre/documento; fecha de registro visible y acciones de consulta/edición. No añadir borrado de clientes a esta HU.
3. Implementar consulta y actualización con validación de obligatorios, formatos, documento único y control de versión para evitar sobrescribir cambios concurrentes.
4. Auditar actor autenticado, cliente afectado, campos, valor anterior/nuevo y fecha; excluir contraseñas/tokens y limitar el acceso a datos de auditoría.
5. Habilitar al ADMIN una consulta de ese historial. Propuesta: dentro de la ficha, sin crear un módulo adicional. La nota antigua de no mostrar historial queda reemplazada por el último acuerdo.
6. Conectar tabla, ficha y modal de edición. Conservar filtros y lo escrito cuando ocurra un error, sin mostrar éxito prematuro.
7. Probar consulta autorizada, edición válida, documento duplicado, dato inválido, concurrencia y acceso sin permiso; comprobar que ADMIN ve quién cambió qué.
8. Reiniciar y releer los cambios; actualizar el documento de estado del frontend y contrato de auditoría junto con André/Alexander.

**Criterios de aceptación:**

- [ ] HU-02-CA-01: El personal autorizado consulta clientes y visualiza sus datos.
- [ ] HU-02-CA-02: RECEPCION y ADMIN corrigen nombres, apellidos, documento, celular y correo.
- [ ] HU-02-CA-03: Valida obligatorios, formatos y documento no duplicado antes de guardar.
- [ ] HU-02-CA-04: Guarda cambios válidos y confirma la actualización en ficha y listado.
- [ ] HU-02-CA-05: Informa errores sin confirmar cambios fallidos y conserva lo escrito.
- [ ] HU-02-CA-06: Restringe consulta/edición; ADMIN consulta quién cambió qué cliente, campos y fecha.

**Definición de hecho:**

- [ ] HU-02-DoD-01: Cambio releído tras reiniciar; sin modificación parcial.
- [ ] HU-02-DoD-02: ADMIN verifica el cambio y su autor; datos inválidos y accesos indebidos se rechazan.
- [ ] HU-02-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-02-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-02-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-02-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-02-DoR-01: Campos editables y validaciones acordados.
- [ ] HU-02-DoR-02: Clientes de HU-01 y permisos de HU-04 disponibles.
- [ ] HU-02-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-02-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-02-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-02-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Recepción modifica; ADMIN consulta autor, cliente, antes/después y fecha.
- Duplicado/dato inválido conserva datos previos y muestra error.
- Dos ediciones concurrentes no se pisan silenciosamente.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-09 — Controlar vigencias

**Sprint:** 1 · **Plataforma:** WEB / API · **Prioridad:** Must Have · **PE propuestos:** 3 · **Alcance:** Base

**Historia:** Como administrador, quiero consultar las fechas de inicio, vencimiento y estado de las membresías para identificar cuáles se encuentran vigentes, próximas a vencer o vencidas.

**Coordina:** Jorge. **Apoyo:** André y Alexander: apoyo backend.

**Dependencias:** HU-06, HU-07, HU-08

**Acuerdos, propuestas y límites:** Propuesta: zona America/Lima e intervalo inicio inclusivo/fin exclusivo. El backend verifica las fechas en cada consulta; una tarea programada no decide por sí sola el ingreso. Cuenta activa y membresía vigente son estados distintos.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Acordar con Wagner convención de inicio incluido/fin excluido, corte local y umbral de próxima a vencer. Mantener 30 días y ausencia de tolerancia como acuerdos.
2. Definir cálculo de dominio único, con reloj y zona inyectables, compartido con Alexander para asignación y renovación.
3. Separar estado de cuenta, estado de contrato y vigencia derivada. Una cuenta activa no concede ingreso sin cobertura pagada.
4. Exponer estados y fechas desde el backend; comprobar cobertura en cada verificación sin depender exclusivamente de un cron.
5. Conectar badges, ficha y filtros a esa respuesta real; la UI no decide por su reloj local si el ingreso está autorizado.
6. Probar meses de 28/29/30/31 días, año bisiesto, instante anterior/igual/posterior al fin y servidor UTC con negocio en Lima.
7. Integrar renovación, vencimientos y verificación; dejar historial accesible después del vencimiento. Usar contratos cancelados de prueba sin construir el flujo S2 de cancelación.

**Criterios de aceptación:**

- [ ] HU-09-CA-01: Muestra inicio, último día válido y estado de cada membresía.
- [ ] HU-09-CA-02: Permite ingreso solo dentro de una vigencia pagada y no cancelada.
- [ ] HU-09-CA-03: Al alcanzar el fin de vigencia queda vencida, sin tolerancia.
- [ ] HU-09-CA-04: Próxima a vencer indica los últimos 7 días vigentes.
- [ ] HU-09-CA-05: La consulta refleja renovación y cancelación ya confirmadas.
- [ ] HU-09-CA-06: Los filtros distinguen vigentes, próximas, vencidas y canceladas.

**Definición de hecho:**

- [ ] HU-09-DoD-01: Pruebas del límite exacto de vencimiento pasan.
- [ ] HU-09-DoD-02: La vigencia sigue siendo correcta sin ejecutar el scheduler.
- [ ] HU-09-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-09-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-09-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-09-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-09-DoR-01: Reglas de 30 días, corte y estados comprendidas.
- [ ] HU-09-DoR-02: Membresías pagadas de prueba disponibles.
- [ ] HU-09-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-09-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-09-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-09-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Probar instante exacto de vencimiento con reloj controlado.
- Calcular 30 días en febrero y al pasar de mes/año.
- Mismo resultado en ficha, lista, renovación y verificación.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-11 — Listado de vencimientos

**Sprint:** 1 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 3 · **Alcance:** Base

**Historia:** Como administrador, quiero visualizar un listado de membresías próximas a vencer y vencidas para realizar un seguimiento oportuno de los clientes.

**Coordina:** Jorge. **Apoyo:** André y Alexander: apoyo backend.

**Dependencias:** HU-09, HU-10, HU-04

**Acuerdos, propuestas y límites:** Propuesta: umbral 7 días y atajos de 3/5/7 días. ADMIN y RECEPCION consultan. La lista no envía mensajes ni marca contacto realizado en S1; automatización en S4.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Usar el cálculo único de HU-09 y confirmar umbral/rangos visibles; no inventar otro criterio de próxima a vencer.
2. Diseñar tabla con cliente, plan, fecha final y estado, más filtros y paginación.
3. Consultar cobertura final real cuando existan renovaciones contiguas, evitando multiplicar clientes por cada pago o periodo.
4. Implementar endpoint de lectura autorizado y conectar filtros, orden y estados de UI.
5. Actualizar o retirar la fila correspondiente después de una renovación confirmada.
6. Probar límites del rango, varias renovaciones, lista vacía, filtros combinados y permisos.
7. Documentar datos que servirán a comunicaciones; en S1 no enviar mensajes ni marcar avisos ficticios como enviados.

**Criterios de aceptación:**

- [ ] HU-11-CA-01: Lista membresías próximas a vencer y vencidas.
- [ ] HU-11-CA-02: Muestra cliente, plan, último día válido y estado.
- [ ] HU-11-CA-03: Filtra por cliente, plan, rango de fechas y estado.
- [ ] HU-11-CA-04: Ordena por vencimiento con las más urgentes primero.
- [ ] HU-11-CA-05: La renovación actualiza el listado sin perder filtros.
- [ ] HU-11-CA-06: Distingue carga, lista vacía y error de consulta.

**Definición de hecho:**

- [ ] HU-11-DoD-01: Filtros y totales coinciden con las membresías consultadas.
- [ ] HU-11-DoD-02: La lista cambia correctamente después de renovar.
- [ ] HU-11-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-11-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-11-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-11-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-11-DoR-01: Filtros, orden y umbral de aviso definidos.
- [ ] HU-11-DoR-02: HU-09 expone estados y fechas confiables.
- [ ] HU-11-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-11-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-11-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-11-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Varias renovaciones no duplican socio ni muestran fin antiguo.
- Filtros y límites producen el conjunto esperado.
- Lista vacía y actualización después de renovar se muestran correctamente.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-12 — Verificar membresía

**Sprint:** 1 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 3 · **Alcance:** Base

**Historia:** Como personal de recepción o administrador, quiero identificar a un cliente mediante su nombre, DNI o código QR y verificar el estado de su membresía para controlar su ingreso al gimnasio y registrar su asistencia cuando corresponda.

**Coordina:** Jorge. **Apoyo:** André y Alexander: apoyo backend.

**Dependencias:** HU-01, HU-04, HU-08, HU-09

**Acuerdos, propuestas y límites:** S1 conserva verificación manual de vigencia; QR es ampliación opcional. Pase diario: propuesta de un solo ingreso, válido hasta registrar salida o finalizar la fecha; reingreso por confirmar. No considerar esta regla acordada ni inventar registro de salida. Su integración corresponde a HU-35/S2.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Mantener el corte manual aprobado para planificar S1: buscar al socio y consultar elegibilidad. QR y asistencia son ampliación opcional futura.
2. Diseñar búsqueda rápida, selección de coincidencias y resultado permitido/no permitido/error técnico con identidad y fechas legibles.
3. Reutilizar consulta de cobertura de HU-09 y permisos ADMIN/RECEPCION; no calcular autorización solamente en JavaScript.
4. Integrar respuesta posterior a contratación y renovación confirmadas; sin plan/vencido implica acceso no autorizado sin gracia.
5. Probar socio vigente, vencido, sin plan, varias coincidencias y solicitud sin permiso. Un error de red no debe convertirse en permiso de ingreso.
6. Evidenciar verificación manual desde UI contra API y PostgreSQL. No exigir cámara, QR ni registro de asistencia para cerrar este corte manual.
7. Registrar por separado las futuras reglas de pase diario/salida y QR; no contarlas como implementadas o probadas en S1.

**Criterios de aceptación:**

- [ ] HU-12-CA-01: ADMIN y RECEPCION buscan un socio por nombre o documento.
- [ ] HU-12-CA-02: Muestra identidad, plan, fechas y estado confirmado por el servidor.
- [ ] HU-12-CA-03: Indica permitido solo con vigencia pagada y no cancelada.
- [ ] HU-12-CA-04: Vencido o sin membresía exige renovación; no hay excepción de gracia.
- [ ] HU-12-CA-05: La respuesta refleja pagos y renovaciones confirmados.
- [ ] HU-12-CA-06: En S1 la verificación es manual; QR y asistencia son ampliación opcional S5.

**Definición de hecho:**

- [ ] HU-12-DoD-01: Pruebas vigente/vencida/cancelada/sin plan pasan.
- [ ] HU-12-DoD-02: El resultado no depende de cambiar el reloj del navegador.
- [ ] HU-12-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-12-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-12-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-12-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-12-DoR-01: Corte manual S1 comprendido y aceptado por el PO.
- [ ] HU-12-DoR-02: Datos de cliente, pago y vigencia consultables.
- [ ] HU-12-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-12-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-12-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-12-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Comprobaciones concretas; todavía no ejecutadas:**

- Vigente permite; vencido/sin plan rechaza.
- Error de API muestra indisponibilidad, no autorización.
- Renovación confirmada cambia elegibilidad sin crear un QR ficticio.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


## 5. Continuidad posterior, separada por developer

Estas fichas dan contexto al agente; no autorizan desarrollar todos los sprints ahora. Conservar la prioridad S1 y aplicar únicamente el sprint solicitado. Repartos y PE posteriores son propuesta; S5/S6, tentativos. Las tareas heredadas se interpretan según los CA y acuerdos más recientes: si chocan con ellos, registrar el conflicto y corregir el plan técnico, sin ejecutar la regla antigua.


### André — HU posteriores


#### HU-03 — Inicio de sesión

**Sprint:** 2 · **Plataforma:** AMBOS · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como usuario autorizado, quiero iniciar sesión mediante mis credenciales para acceder de forma segura al sistema según mi rol.

**Coordina:** André. **Apoyo:** Alexander: revisión backend; Jorge: UI.

**Dependencias:** HU-04; base de identidad existente

**Acuerdos, propuestas y límites:** Plan base: HU-03 en Sprint 2. El equipo puede adelantarla a S1 solo con capacidad y sin poner en riesgo su objetivo; no se cuenta dos veces. S1 necesita autenticación mínima para permisos/auditoría aunque la experiencia completa de login se entregue después. Propuesta vigente: usuario y contraseña, límite de intentos y recuperación presencial.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Auditar login reportado y sesiones, cookies/CSRF/CORS o tokens.
2. Confirmar identificador: personal con usuario/correo único y contraseña; socio con código único de socio + contraseña como propuesta a validar.
3. Completar activación/restablecimiento, bloqueo por intentos y cambio obligado de secreto temporal si se utiliza.
4. Conectar UI web de login/logout/sesión vencida y proteger rutas.
5. Probar contraseña incorrecta, usuario desactivado, expiración, revocación y filtración de identidad.
6. Verificar hash de contraseña y sesión real tras reinicio; no guardar token permanente en localStorage.

**Criterios de aceptación:**

- [ ] HU-03-CA-01: El personal inicia sesión con usuario único y contraseña.
- [ ] HU-03-CA-02: Solo una cuenta habilitada obtiene una sesión válida.
- [ ] HU-03-CA-03: Los errores de acceso son genéricos y se limita el abuso de intentos.
- [ ] HU-03-CA-04: La navegación y API aplican el rol de la cuenta.
- [ ] HU-03-CA-05: Cerrar sesión o desactivar la cuenta invalida el acceso.
- [ ] HU-03-CA-06: El restablecimiento presencial obliga a cambiar el secreto temporal.

**Definición de hecho:**

- [ ] HU-03-DoD-01: Logout, expiración y cuenta inactiva rechazan la API.
- [ ] HU-03-DoD-02: Hash seguro y pruebas de acceso incorrecto verificados.
- [ ] HU-03-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-03-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-03-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-03-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-03-DoR-01: Usuarios, roles y flujo de recuperación entendidos.
- [ ] HU-03-DoR-02: Contrato de sesión y datos ficticios disponibles.
- [ ] HU-03-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-03-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-03-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-03-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-05 — Habilitar acceso móvil

**Sprint:** 5 · **Plataforma:** AMBOS · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero habilitar el acceso móvil de un cliente registrado para que pueda utilizar los servicios digitales de GYM VIP.

**Coordina:** André. **Apoyo:** Wagner: flujo móvil; Alexander: API; Jorge: pruebas.

**Dependencias:** HU-01, HU-03, HU-04

**Acuerdos, propuestas y límites:** Propuesta: formato de usuario nombre abreviado + sufijo aleatorio. No es contraseña. Restablecimiento presencial tras verificar identidad, sin dependencia del microservicio. Correo opcional. Acuerdo 18/10: app exclusiva para socio/cliente, sin administración ni cancelación móvil. Alcance, PE y reparto S5 son tentativos; contacto editable, push y opciones adicionales no aprobados.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Acordar método con cliente: código de socio único + contraseña; confirmar si desea DNI como alias de login.
2. Crear cuenta CLIENTE y vínculo único; no crear otra ficha de cliente.
3. Emitir token de activación aleatorio, de un uso, limitado a activar contraseña, con caducidad propuesta de 10 minutos; guardar su hash.
4. Entregar QR o código largo directamente al titular en recepción, sin enviarlo por canales aún no verificados; socio elige contraseña en su teléfono.
5. Crear panel de acceso habilitado/revocado y restablecimiento presencial con evidencia mínima.
6. Probar token usado/expirado, vínculo existente, activación por otra persona y revocación. No usar DNI/fecha de nacimiento/PIN corto como contraseña permanente.

**Criterios de aceptación:**

- [ ] HU-05-CA-01: ADMIN habilita acceso sobre un cliente existente sin duplicarlo.
- [ ] HU-05-CA-02: Se genera código de socio único y activación presencial de un solo uso.
- [ ] HU-05-CA-03: El código de activación vence en 15 min y no se guarda en texto plano.
- [ ] HU-05-CA-04: El socio elige contraseña y activa la cuenta desde la app.
- [ ] HU-05-CA-05: La membresía vencida no impide consultar la información personal.
- [ ] HU-05-CA-06: Revocar la cuenta impide nuevos accesos y renovaciones de sesión.

**Definición de hecho:**

- [ ] HU-05-DoD-01: Token usado o vencido no reactiva la cuenta.
- [ ] HU-05-DoD-02: Prueba con dos socios demuestra aislamiento.
- [ ] HU-05-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-05-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-05-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-05-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-05-DoR-01: Identidad, activación y recuperación presencial definidas.
- [ ] HU-05-DoR-02: Cliente registrado y API de identidad disponibles.
- [ ] HU-05-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-05-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-05-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-05-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-13 — Configurar recordatorios

**Sprint:** 4 · **Plataforma:** WEB / MICRO · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero configurar recordatorios automáticos de vencimiento de membresías para reducir la dependencia del seguimiento manual.

**Coordina:** André. **Apoyo:** Alexander: revisión backend; Jorge: UI.

**Dependencias:** HU-09, HU-04; adaptadores HU-16/HU-39

**Acuerdos, propuestas y límites:** Acuerdo reportado: recordatorio 3 días antes del vencimiento. Propuesta: envío a las 09:00 America/Lima, sin duplicados y cancelando avisos obsoletos tras renovar. Administrador/dueño como titular de proveedores es una propuesta; presupuesto y aprobación de textos requieren confirmación.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Confirmar 7/3/1 días u otro calendario; no imponer tres envíos sin presupuesto.
2. Diseñar configuración e inactivación del recordatorio.
3. Crear programación persistente y búsqueda de socios elegibles.
4. Escribir evento/outbox en backend; worker del microservicio acepta comando autenticado.
5. Deduplicar por cliente/período/regla/canal y cancelar trabajo pendiente tras renovación.
6. Probar cambio de fecha, renovación antes de envío, reintento y horario local.

**Criterios de aceptación:**

- [ ] HU-13-CA-01: ADMIN configura anticipación, horario y canal de recordatorios.
- [ ] HU-13-CA-02: Solo se programan socios con destino y permiso adecuados.
- [ ] HU-13-CA-03: La programación usa fechas de vigencia y zona del gimnasio.
- [ ] HU-13-CA-04: Renovar o cancelar retira recordatorios que ya no corresponden.
- [ ] HU-13-CA-05: Reintentar no genera dos avisos del mismo periodo, regla y canal.
- [ ] HU-13-CA-06: La configuración puede inactivarse sin borrar el historial.

**Definición de hecho:**

- [ ] HU-13-DoD-01: Renovar antes del despacho evita aviso obsoleto.
- [ ] HU-13-DoD-02: Cola sobrevive reinicio y deduplica el reintento.
- [ ] HU-13-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-13-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-13-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-13-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-13-DoR-01: Horario, destinatarios y contenido del aviso definidos.
- [ ] HU-13-DoR-02: HU-09 y contrato con microservicio disponibles.
- [ ] HU-13-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-13-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-13-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-13-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-14 — Recibir avisos

**Sprint:** 4 · **Plataforma:** APP / MICRO · **Prioridad:** Must Have · **PE propuestos:** 3 · **Alcance:** Base

**Historia:** Como cliente, quiero recibir avisos relacionados con el estado de mi membresía para mantenerme informado sobre su próxima renovación.

**Coordina:** André. **Apoyo:** Alexander: revisión backend; Jorge: UI.

**Dependencias:** HU-13; canales HU-16/HU-39

**Acuerdos, propuestas y límites:** Propuesta: avisos de contratación, renovación y próximo vencimiento. Guardar buzón en backend para HU-33. Estados de proveedor no se presentan como lectura del socio.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Acordar mensajes de confirmación/vencimiento y datos mínimos del socio.
2. Definir Notification con destinatario, referencia, texto/plantilla y propósito.
3. Generar aviso desde evento de negocio confirmado, no antes del commit.
4. Enviar por adaptador real y conservar resultado; fallar el envío no revierte el cobro.
5. Publicar consulta de buzón propio; pantalla se integra en S5/HU-33.
6. Probar destinatario, fecha, revocación de marketing y fallos del proveedor.

**Criterios de aceptación:**

- [ ] HU-14-CA-01: El socio recibe aviso de servicio en el canal habilitado.
- [ ] HU-14-CA-02: El texto muestra gimnasio, motivo y fecha pertinente.
- [ ] HU-14-CA-03: El aviso se genera después de confirmar la operación de negocio.
- [ ] HU-14-CA-04: Un fallo de envío no revierte un pago ni una renovación.
- [ ] HU-14-CA-05: El aviso queda consultable en el buzón personal.
- [ ] HU-14-CA-06: Las promociones se envían solo con autorización comercial.

**Definición de hecho:**

- [ ] HU-14-DoD-01: Pruebas confirman destinatario y fechas correctos.
- [ ] HU-14-DoD-02: Una falla del proveedor conserva la operación y registra el fallo.
- [ ] HU-14-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-14-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-14-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-14-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-14-DoR-01: Tipos de aviso y destinatarios entendidos.
- [ ] HU-14-DoR-02: Eventos de negocio y canal de prueba configurados.
- [ ] HU-14-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-14-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-14-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-14-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-22 — Registrar suplementos

**Sprint:** 3 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero registrar los suplementos deportivos con sus características, imágenes y precios para disponer de un catálogo digital de productos.

**Coordina:** André. **Apoyo:** Alexander: revisión backend; Jorge: UI.

**Dependencias:** HU-03, HU-04

**Acuerdos, propuestas y límites:** Acuerdo reportado: ADMIN rellena imágenes, precios, descripciones y condiciones. Se requiere vista previa; plantillas reutilizables propuestas. La intención de incorporar inventario y ventas sigue por confirmar y no está incluida en estos PE. No convertir el catálogo en checkout automáticamente.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Recoger catálogo real y formatos de imagen permitidos.
2. Modelar productos, categorías y almacenamiento de imagen externo; no usar filesystem efímero de Render para originales.
3. Diseñar editor y lista web con estados.
4. Implementar API autorizada y validación de precio/archivo; minimizar dimensiones/peso.
5. Conectar carga/listado y probar inválidos, producto duplicado y persistencia.
6. Mostrar solo características documentadas, no generar promesas de salud.

**Criterios de aceptación:**

- [ ] HU-22-CA-01: ADMIN registra suplemento con nombre, descripción y precio PEN.
- [ ] HU-22-CA-02: Permite imagen opcional y categoría del catálogo.
- [ ] HU-22-CA-03: Valida nombre, precio positivo y archivo de imagen permitido.
- [ ] HU-22-CA-04: El producto guardado aparece en el catálogo.
- [ ] HU-22-CA-05: ADMIN previsualiza el producto; una carga fallida no confirma un registro incompleto.
- [ ] HU-22-CA-06: Registra autor y fecha sin ofrecer cobro online.

**Definición de hecho:**

- [ ] HU-22-DoD-01: Producto e imagen siguen disponibles tras reiniciar.
- [ ] HU-22-DoD-02: Precio y archivo inválidos son rechazados.
- [ ] HU-22-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-22-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-22-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-22-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-22-DoR-01: Campos, publicación y restricciones de imagen definidos.
- [ ] HU-22-DoR-02: ADMIN y almacenamiento de imágenes configurados.
- [ ] HU-22-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-22-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-22-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-22-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-35 — Registrar pase diario

**Sprint:** 2 · **Plataforma:** WEB / API · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como recepcionista, quiero registrar un pase de un día y su cobro para permitir el ingreso solamente en la jornada pagada.

**Coordina:** André. **Apoyo:** Alexander: revisión backend; Jorge: UI.

**Dependencias:** HU-06, HU-07, HU-08, HU-09, HU-12; flujo sin ficha por validar

**Acuerdos, propuestas y límites:** Acuerdo reportado: menores no tendrán ficha de socio y se cobrarán por visita. Propuesta por validar: ticket diario con folio y datos mínimos autorizados, sin crear identidad adulta falsa y sin omitir el ingreso económico. Se propone un ingreso sin reingreso, hasta salida o fin de fecha; definir cómo se registra salida y quién autoriza la atención de menores.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Confirmar precio diario, identidad mínima y si todo visitante debe tener ficha.
2. Crear variante DAILY de plan/versiones; inicio = fecha del pase, fin exclusivo = día siguiente.
3. Diseñar “Pase diario” en recepción con aviso “válido solo el DD/MM”.
4. Reutilizar contratación transaccional sin crear un sistema paralelo de clientes/pagos.
5. Integrar verificación de ingreso y listado/filtros por DAILY.
6. Probar compra 23:50, vencimiento 00:00, reintento y visitante ya inscrito.
7. Conectar clasificación de ingresos al reporte HU-38; demo con dos ventas diarias y mensual.

**Criterios de aceptación:**

- [ ] HU-35-CA-01: Recepción registra un pase diario y su cobro; ficha de socio solo para adultos.
- [ ] HU-35-CA-02: El pase aplica a la fecha pagada; se propone un ingreso hasta registrar salida.
- [ ] HU-35-CA-03: No supera el inicio del día siguiente; regla de salida/reingreso aún por validar.
- [ ] HU-35-CA-04: Pase y cobro se confirman juntos, sin duplicados; el ingreso aparece en caja/reportes.
- [ ] HU-35-CA-05: La verificación distingue diario de mensual.
- [ ] HU-35-CA-06: El reporte separa cantidad e ingresos por pases diarios.

**Definición de hecho:**

- [ ] HU-35-DoD-01: Se prueba salida/fin de fecha según la regla finalmente acordada.
- [ ] HU-35-DoD-02: Cobros con y sin ficha autorizada concilian en caja y reportes.
- [ ] HU-35-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-35-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-35-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-35-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-35-DoR-01: Confirmar reingreso, registro de salida y tarifa diaria.
- [ ] HU-35-DoR-02: Definir flujo de visitantes sin ficha y autorización para menores.
- [ ] HU-35-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-35-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-35-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-35-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


### Alexander — HU posteriores


#### HU-16 — Comunicaciones WhatsApp

**Sprint:** 4 · **Plataforma:** MICRO · **Prioridad:** Must Have · **PE propuestos:** 8 · **Alcance:** Base

**Historia:** Como administrador, quiero utilizar la integración de comunicaciones con WhatsApp para automatizar los mensajes contemplados por el gimnasio.

**Coordina:** Alexander. **Apoyo:** André: revisión backend; Jorge: UI.

**Dependencias:** HU-13, HU-14; cuenta Meta del gimnasio

**Acuerdos, propuestas y límites:** Propuesta: Meta Cloud API directa, sin automatizar WhatsApp Web. Tres reintentos con espera creciente y reconciliación ante resultado incierto. Credenciales y número reales requeridos para acreditar envío; pruebas ficticias claramente identificadas. Aclaración 18/10: ADMIN o dueño como titular de cuenta/remitente es PROPUESTA; presupuesto mensual de operación y responsable de aprobar textos aún sin confirmar.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Crear entorno de ensayo con cuenta/número de prueba y destinatarios autorizados; obtener aprobación del número real y presupuesto.
2. Definir plantillas utility para avisos de servicio sin promociones; el proveedor decide su clasificación final.
3. Implementar WhatsAppSender oficial Meta Cloud API, con versión soportada elegida al implementar.
4. Guardar secreto en entorno, verificar webhook y deduplicar callbacks.
5. Enviar desde worker; reintentar errores temporales, detener errores permanentes y bajas.
6. Probar envío real autorizado y estados, más rate limit y duplicación. No automatizar WhatsApp Web con sesión personal.

**Criterios de aceptación:**

- [ ] HU-16-CA-01: El servicio envía WhatsApp mediante API oficial de Meta.
- [ ] HU-16-CA-02: Usa número del gimnasio y plantillas permitidas por el proveedor.
- [ ] HU-16-CA-03: Solo contacta destinos habilitados para el propósito del aviso.
- [ ] HU-16-CA-04: Valida callbacks y registra resultado sin exponer secretos.
- [ ] HU-16-CA-05: Deduplica y reintenta fallos temporales con límite.
- [ ] HU-16-CA-06: Los errores permanentes quedan visibles y no se reintentan indefinidamente.

**Definición de hecho:**

- [ ] HU-16-DoD-01: Envío real a destinatario autorizado tiene evidencia.
- [ ] HU-16-DoD-02: Webhook inválido y duplicado se rechazan o deduplican.
- [ ] HU-16-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-16-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-16-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-16-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-16-DoR-01: Número, acceso de prueba y plantilla autorizada disponibles.
- [ ] HU-16-DoR-02: Contrato de eventos y presupuesto del canal comprendidos.
- [ ] HU-16-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-16-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-16-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-16-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-23 — Actualizar catálogo

**Sprint:** 3 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 3 · **Alcance:** Base

**Historia:** Como administrador, quiero actualizar la información y disponibilidad de los suplementos para mantener vigente el catálogo ofrecido a los clientes.

**Coordina:** Alexander. **Apoyo:** André: revisión backend; Jorge: UI.

**Dependencias:** HU-22, HU-04

**Acuerdos, propuestas y límites:** ADMIN mantiene los datos del catálogo y revisa la vista previa. Baja lógica conserva referencias históricas. Propuesta de ampliación pendiente: inventario y ventas requerirán HU y estimación propias, sin asumir pasarela online.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Confirmar si disponibilidad es “a la venta/no disponible” o inventario; stock detallado sería cambio adicional.
2. Crear UpdateProduct/DeactivateProduct con versión y auditoría.
3. Diseñar edición y confirmación de baja.
4. Conectar web y API pública/autenticada según publicación.
5. Probar conflictos de edición y producto inactivo en promociones.

**Criterios de aceptación:**

- [ ] HU-23-CA-01: ADMIN edita nombre, descripción, precio, categoría e imagen.
- [ ] HU-23-CA-02: Puede marcar disponible/no disponible e inactivar el producto.
- [ ] HU-23-CA-03: Cambios válidos se reflejan en la consulta del catálogo.
- [ ] HU-23-CA-04: Previsualiza la edición; cambios inválidos no sustituyen datos guardados.
- [ ] HU-23-CA-05: Una edición concurrente se informa antes de sobrescribir.
- [ ] HU-23-CA-06: Inactivar conserva historia y no borra favoritos de forma silenciosa.

**Definición de hecho:**

- [ ] HU-23-DoD-01: Cambio se relee desde API y persiste.
- [ ] HU-23-DoD-02: Se prueban conflicto de edición y producto inactivo.
- [ ] HU-23-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-23-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-23-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-23-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-23-DoR-01: Campos editables y baja lógica comprendidos.
- [ ] HU-23-DoR-02: Productos de HU-22 disponibles para pruebas.
- [ ] HU-23-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-23-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-23-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-23-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-36 — Cancelar membresía

**Sprint:** 2 · **Plataforma:** WEB / API · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero finalizar el acceso de una membresía con motivo para mantener actualizado el servicio conservando el historial.

**Coordina:** Alexander. **Apoyo:** André: revisión backend; Jorge: UI.

**Dependencias:** HU-04, HU-07, HU-09, HU-10

**Acuerdos, propuestas y límites:** Acuerdo reportado: cancelar afecta también renovaciones futuras pagadas y se solicita solo en recepción, nunca desde la app. Se solicita vínculo entre anulación de membresía y pago. Propuesta: diferenciar baja sin devolución de anulación por error, conservar originales y registrar ajuste atómico. Antes de implementar el descuento, confirmar si hubo dinero recibido y si habrá salida real de caja.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Acordar quién cancela, qué ocurre con períodos futuros y si es inmediata o al fin del período.
2. Diseñar resumen de períodos afectados y mensaje de política antes de confirmar.
3. Crear MembershipAction de CANCEL con fecha efectiva; el estado operativo es una proyección del evento.
4. Implementar caso de uso autorizado con bloqueo para no cancelar y renovar simultáneamente.
5. Refrescar verificación/tabla/contadores activos y conservar historial de pagos.
6. Probar cancelación repetida, cancelación con renovación futura y rol recepción indebido.
7. Demostrar con S/100 ficticios: la membresía cancelada deja de contar como activa, pero caja sigue S/100 si no hay devolución real.

**Criterios de aceptación:**

- [ ] HU-36-CA-01: ADMIN cancela una membresía con motivo obligatorio.
- [ ] HU-36-CA-02: Recepción solicita la cancelación; el resumen incluye periodo actual y futuros pagados.
- [ ] HU-36-CA-03: La cancelación confirmada termina el acceso de inmediato.
- [ ] HU-36-CA-04: Conserva todos los contratos y cobros históricos.
- [ ] HU-36-CA-05: Distingue cancelación sin devolución de anulación por error con ajuste del cobro.
- [ ] HU-36-CA-06: La cancelación repetida no genera acciones duplicadas.

**Definición de hecho:**

- [ ] HU-36-DoD-01: Periodos afectados pierden acceso y caja refleja el dinero realmente recibido/devuelto.
- [ ] HU-36-DoD-02: Se prueba cancelar y renovar al mismo tiempo.
- [ ] HU-36-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-36-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-36-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-36-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-36-DoR-01: Acordar efecto económico según motivo y quién autoriza.
- [ ] HU-36-DoR-02: Membresías vigentes y renovadas disponibles para pruebas.
- [ ] HU-36-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-36-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-36-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-36-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-37 — Corregir registro económico

**Sprint:** 2 · **Plataforma:** WEB / API · **Prioridad:** Must Have · **PE propuestos:** 8 · **Alcance:** Base

**Historia:** Como administrador, quiero corregir un cobro registrado por error mediante operaciones auditables para que los totales reflejen el dinero realmente recibido.

**Coordina:** Alexander. **Apoyo:** André: revisión backend; Jorge: UI.

**Dependencias:** HU-04, HU-08

**Acuerdos, propuestas y límites:** Solicitud reportada: anular membresía debe repercutir en su pago y viceversa, recalculando totales. PROPUESTA: ajuste compensatorio sin borrar originales y resolución conjunta del acceso. Bloqueo de regla: definir tratamiento del dinero realmente cobrado que no se devuelve; separar caja, ajustes y contratos activos. Probar tanto anulación desde pago como desde membresía.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Clasificar tres casos: cobro ficticio/duplicado, importe mal digitado, plan equivocado con dinero real recibido.
2. Confirmar política y permiso; propuesta ADMIN con reautenticación para corrección sensible.
3. Modelar PAYMENT_ADJUSTMENTS vinculados al pago y MembershipAction; anulación de registro completo por importe original, una sola vez.
4. Implementar reversión + nuevo registro correcto en transacción; impedir saldo inconsistente. Si solo cambia la asignación, mover la imputación con evento, sin inventar devolución.
5. Diseñar comparativa original/ajuste/reemplazo y totales antes/después; mostrar operación económica claramente.
6. Reporte neto = recibos originales + ajustes; no excluir el original y restar ajuste simultáneamente.
7. Probar duplicado de S/100 ficticios → ajuste -S/100 → nuevo registro correcto si procede; total no resta dos veces.
8. Probar quién/cómo/cuándo, concurrencia y que corrección documental no modifica caja. La regla de no devolución admite revisión de obligaciones legales; no bloquear un reclamo procedente.

**Criterios de aceptación:**

- [ ] HU-37-CA-01: ADMIN corrige un registro económico con motivo y referencia al original.
- [ ] HU-37-CA-02: El pago original permanece intacto y auditable.
- [ ] HU-37-CA-03: La anulación por error ajusta pago y resuelve la membresía asociada en una transacción.
- [ ] HU-37-CA-04: Una anulación no puede aplicarse dos veces al mismo importe.
- [ ] HU-37-CA-05: Cancelar sin devolución no simula una salida de dinero; el ajuste indica su motivo.
- [ ] HU-37-CA-06: El reporte neto suma originales y ajustes una sola vez.

**Definición de hecho:**

- [ ] HU-37-DoD-01: Pruebas de duplicación y concurrencia preservan el neto.
- [ ] HU-37-DoD-02: Original, motivo, actor y reemplazo permanecen consultables.
- [ ] HU-37-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-37-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-37-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-37-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-37-DoR-01: Distinguir error de registro, cancelación y movimiento real de dinero.
- [ ] HU-37-DoR-02: Pagos originales y contrato de reporte disponibles.
- [ ] HU-37-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-37-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-37-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-37-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-39 — Comunicaciones por correo

**Sprint:** 4 · **Plataforma:** WEB / MICRO · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero enviar avisos transaccionales por correo y conocer su resultado para informar al socio mediante un canal adicional.

**Coordina:** Alexander. **Apoyo:** André: revisión backend; Jorge: UI.

**Dependencias:** HU-13, HU-14, HU-17; dominio del gimnasio

**Acuerdos, propuestas y límites:** Propuesta: proveedor Resend mediante adaptador reemplazable, con SPF/DKIM/DMARC y límite de envío configurado. Correo de contacto opcional; omitir canal si no hay destino autorizado. No registrar secretos ni contenido completo innecesario. Aclaración 18/10: ADMIN o dueño como titular de cuenta/remitente es PROPUESTA; presupuesto mensual de operación y responsable de aprobar textos aún sin confirmar.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Confirmar dominio/remitente, textos y finalidades permitidas; separar recibo/recordatorio de promoción.
2. Implementar EmailSender por API HTTPS de Resend o proveedor aprobado; secretos solo en servicio.
3. Configurar DNS de verificación, SPF/DKIM y política DMARC adecuada; verificar una cuenta de ensayo autorizada.
4. Integrar solicitudes/outbox, deduplicación, reintentos y topes diarios; no enviar 120 juntos si el plan limita 100/día.
5. Guardar ID proveedor y procesar webhook autenticado de entrega/rebote.
6. Mostrar estados en HU-17 y ofrecer revocación de marketing. No guardar OTP/token completo en logs.
7. Probar proveedor sandbox/local y una entrega real autorizada antes de declarar canal terminado; prueba mock no acredita envío real.

**Criterios de aceptación:**

- [ ] HU-39-CA-01: El microservicio envía correo transaccional con proveedor HTTPS.
- [ ] HU-39-CA-02: Usa dominio/remitente verificados y plantillas versionadas.
- [ ] HU-39-CA-03: Guarda cola durable e intentos sin duplicar mensajes.
- [ ] HU-39-CA-04: Procesa entrega, rebote y fallo mediante callback autenticado.
- [ ] HU-39-CA-05: Promociones respetan consentimiento independiente y baja.
- [ ] HU-39-CA-06: La activación presencial del móvil funciona sin correo.

**Definición de hecho:**

- [ ] HU-39-DoD-01: Entrega real autorizada y manejo de rebote verificados.
- [ ] HU-39-DoD-02: Reintentos y callbacks duplicados no duplican avisos.
- [ ] HU-39-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-39-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-39-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-39-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-39-DoR-01: Dominio, remitente y destinatario de ensayo disponibles.
- [ ] HU-39-DoR-02: Contrato de cola y presupuesto del proveedor definidos.
- [ ] HU-39-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-39-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-39-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-39-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


### Jorge — HU posteriores


#### HU-15 — Gestionar respuestas frecuentes

**Sprint:** 4 · **Plataforma:** WEB / MICRO · **Prioridad:** Should Have · **PE propuestos:** 3 · **Alcance:** Base

**Historia:** Como administrador, quiero gestionar mensajes de respuesta a consultas frecuentes para agilizar la atención de los clientes.

**Coordina:** Jorge. **Apoyo:** André y Alexander: apoyo backend.

**Dependencias:** HU-03, HU-04

**Acuerdos, propuestas y límites:** Propuesta: categorías membresías, pagos, horarios y suplementos. Respuestas aprobadas por responsable del gimnasio antes de publicar. Sin chatbot generativo ni recomendaciones médicas.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Recoger preguntas reales y respuesta aprobada del gimnasio.
2. Crear FAQ y categorías; relacionar preguntas de suplementos con producto cuando corresponda.
3. Diseñar editor web y consulta publicada.
4. Implementar API lectura/escritura y permisos; sanitizar contenido.
5. Reutilizar FAQ en WhatsApp mediante selección/respuesta predefinida y en móvil S5.
6. Probar publicación/inactivación, enlace roto y contenido no autorizado.

**Criterios de aceptación:**

- [ ] HU-15-CA-01: ADMIN crea, edita y publica respuestas frecuentes.
- [ ] HU-15-CA-02: Cada respuesta tiene pregunta, categoría, contenido y estado.
- [ ] HU-15-CA-03: Solo el contenido publicado aparece en los canales de consulta.
- [ ] HU-15-CA-04: Editar conserva autor y fecha; inactivar retira la respuesta publicada.
- [ ] HU-15-CA-05: La web valida campos y muestra confirmación o error.
- [ ] HU-15-CA-06: La misma respuesta se reutiliza en móvil y comunicaciones.

**Definición de hecho:**

- [ ] HU-15-DoD-01: Contenido inactivo no aparece en consultas públicas.
- [ ] HU-15-DoD-02: Pruebas de publicación, permisos y entrada inválida pasan.
- [ ] HU-15-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-15-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-15-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-15-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-15-DoR-01: Categorías y flujo de publicación definidos.
- [ ] HU-15-DoR-02: ADMIN y contenido ficticio de ensayo disponibles.
- [ ] HU-15-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-15-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-15-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-15-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-17 — Estado de comunicaciones

**Sprint:** 4 · **Plataforma:** WEB / MICRO · **Prioridad:** Should Have · **PE propuestos:** 3 · **Alcance:** Base

**Historia:** Como personal autorizado, quiero consultar el estado de los envíos de comunicaciones para identificar mensajes enviados correctamente o intentos fallidos.

**Coordina:** Jorge. **Apoyo:** André y Alexander: apoyo backend.

**Dependencias:** HU-13, HU-16, HU-39

**Acuerdos, propuestas y límites:** Propuesta: ADMIN reintenta; RECEPCION consulta. Filtros por canal, destinatario, estado y fecha. Se ocultan tokens y contenido sensible en logs y errores.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Definir estados y transiciones según cada proveedor; lectura puede no estar disponible.
2. Persistir solicitud e intentos en el esquema del microservicio.
3. Exponer consulta interna autorizada y datos minimizados.
4. Diseñar panel web con reintento autorizado sin duplicar mensaje ya entregado.
5. Verificar firma/secretos de webhooks, eventos repetidos y fuera de orden.
6. Probar timeout tras aceptación y reconciliación; mostrar “resultado desconocido” si no se puede confirmar.

**Criterios de aceptación:**

- [ ] HU-17-CA-01: El panel lista comunicaciones por fecha, canal y resultado.
- [ ] HU-17-CA-02: Distingue en cola, aceptado, entregado, fallido y resultado incierto.
- [ ] HU-17-CA-03: Muestra intentos y causa segura del fallo.
- [ ] HU-17-CA-04: Permite reintentar solo operaciones elegibles y autorizadas.
- [ ] HU-17-CA-05: Callback repetido o tardío no duplica ni degrada un estado confirmado.
- [ ] HU-17-CA-06: No confunde entrega por proveedor con lectura en la app.

**Definición de hecho:**

- [ ] HU-17-DoD-01: Panel y servicio muestran estados consistentes.
- [ ] HU-17-DoD-02: Un reintento no duplica una comunicación ya entregada.
- [ ] HU-17-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-17-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-17-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-17-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-17-DoR-01: Estados y permisos del panel definidos.
- [ ] HU-17-DoR-02: Servicio expone intentos y callbacks de ensayo.
- [ ] HU-17-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-17-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-17-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-17-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-21 — Registrar servicios

**Sprint:** 3 · **Plataforma:** WEB · **Prioridad:** Should Have · **PE propuestos:** 3 · **Alcance:** Opcional

**Historia:** Como administrador, quiero registrar la información de los servicios de entrenamiento disponibles para mantener organizado el catálogo de servicios del gimnasio.

**Coordina:** Jorge. **Apoyo:** André y Alexander: apoyo backend.

**Dependencias:** HU-03, HU-04

**Acuerdos, propuestas y límites:** Servicios siguen opcionales y sin compromiso de implementación. ADMIN proporcionará contenido, precios e imágenes si se incluyen. Se propone vista previa antes de publicar. Inventario/ventas es una ampliación distinta todavía por validar.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Consultar si existe información de servicios distinta de planes; si no, no duplicar catálogo.
2. Definir título/descripción/horario/condiciones y estado.
3. Modelar ServiceOffer sin relación de rutina/entrenador.
4. Implementar API ADMIN y editor web, lectura móvil futura.
5. Probar campos/estado/visibilidad y aclarar que no reserva servicios ni cobra online.

**Criterios de aceptación:**

- [ ] HU-21-CA-01: ADMIN registra nombre, descripción, horario y condiciones de servicio.
- [ ] HU-21-CA-02: Permite editar e inactivar el servicio informativo.
- [ ] HU-21-CA-03: Solo los servicios activos se muestran al socio.
- [ ] HU-21-CA-04: No asigna entrenadores, rutinas ni reservas.
- [ ] HU-21-CA-05: Valida obligatorios y conserva auditoría de cambios.
- [ ] HU-21-CA-06: La publicación se consulta desde la API usada por HU-32.

**Definición de hecho:**

- [ ] HU-21-DoD-01: Alta, edición y baja lógica persisten.
- [ ] HU-21-DoD-02: El móvil no recibe servicios inactivos.
- [ ] HU-21-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-21-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-21-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-21-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-21-DoR-01: El equipo decide incluir el catálogo opcional de servicios.
- [ ] HU-21-DoR-02: ADMIN y datos de servicio disponibles para pruebas.
- [ ] HU-21-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-21-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-21-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-21-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-24 — Registrar promociones

**Sprint:** 3 · **Plataforma:** WEB · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero registrar promociones de suplementos deportivos para comunicar las ofertas disponibles.

**Coordina:** Jorge. **Apoyo:** André y Alexander: apoyo backend.

**Dependencias:** HU-22, HU-23, HU-04

**Acuerdos, propuestas y límites:** Acuerdo reportado: ADMIN ingresa imágenes, precios, condiciones y fechas de vigencia. Vista previa incluida; plantillas son propuesta. Confirmar contenido comercial real al cargarlo, sin inventar promociones. Servicios aún por decidir.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Acordar tipos, fechas y acumulación o exclusiones.
2. Modelar Promotion con productos relacionados y reloj local.
3. Diseñar editor/lista y vista previa.
4. Implementar validación de intervalos y publicación.
5. Integrar consulta futura móvil y datos para comunicaciones consentidas.
6. Probar promoción futura/vencida, producto retirado y mensaje incoherente con precio.

**Criterios de aceptación:**

- [ ] HU-24-CA-01: ADMIN crea promoción con título, productos, condiciones e intervalo.
- [ ] HU-24-CA-02: La fecha final no precede a la inicial.
- [ ] HU-24-CA-03: Permite editar e inactivar promociones.
- [ ] HU-24-CA-04: Solo se publican promociones activas dentro de su vigencia.
- [ ] HU-24-CA-05: ADMIN previsualiza la promoción; el socio consulta todas sus condiciones.
- [ ] HU-24-CA-06: La promoción no genera cobro ni cambia pagos ya registrados.

**Definición de hecho:**

- [ ] HU-24-DoD-01: Pruebas de promoción futura, vigente y vencida pasan.
- [ ] HU-24-DoD-02: La app recibe la misma promoción publicada en web.
- [ ] HU-24-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-24-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-24-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-24-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-24-DoR-01: Campos e intervalo de publicación definidos.
- [ ] HU-24-DoR-02: Productos y permisos de administración disponibles.
- [ ] HU-24-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-24-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-24-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-24-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-27 — Consultar preguntas frecuentes

**Sprint:** 5 · **Plataforma:** APP / MICRO · **Prioridad:** Should Have · **PE propuestos:** 2 · **Alcance:** Base

**Historia:** Como cliente, quiero acceder a información y respuestas frecuentes sobre suplementos para resolver consultas generales sin depender siempre de recepción.

**Coordina:** Jorge. **Apoyo:** Wagner: integración móvil; André: apoyo técnico.

**Dependencias:** HU-15, HU-28, HU-34

**Acuerdos, propuestas y límites:** Propuesta: FAQ compartida con HU-15; ayuda informativa sin chatbot. El contacto con recepción se muestra como información configurada del gimnasio. Acuerdo 18/10: app exclusiva para socio/cliente, sin administración ni cancelación móvil. Alcance, PE y reparto S5 son tentativos; contacto editable, push y opciones adicionales no aprobados.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Reutilizar contenido y endpoint de HU-15.
2. Diseñar FAQ con expansión accesible y enlaces válidos.
3. Integrar KMP y respuesta sin conexión explícita.
4. Probar pregunta retirada y búsqueda vacía.
5. Contactar al gimnasio mediante enlace iniciado por el socio solo si se acuerda; esto no sustituye mensajes automáticos oficiales.

**Criterios de aceptación:**

- [ ] HU-27-CA-01: El socio consulta preguntas y respuestas publicadas.
- [ ] HU-27-CA-02: Permite buscar y filtrar por categoría.
- [ ] HU-27-CA-03: Cada pregunta expande su respuesta accesiblemente.
- [ ] HU-27-CA-04: La consulta vacía y el error se distinguen.
- [ ] HU-27-CA-05: Sin red muestra contenido cacheado con fecha.
- [ ] HU-27-CA-06: No publica respuestas retiradas después de sincronizar.

**Definición de hecho:**

- [ ] HU-27-DoD-01: Búsqueda, accesibilidad y caché verificadas.
- [ ] HU-27-DoD-02: No se muestran respuestas inactivas tras sincronizar.
- [ ] HU-27-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-27-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-27-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-27-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-27-DoR-01: FAQ publicada de prueba y categorías disponibles.
- [ ] HU-27-DoR-02: Base móvil y contrato de consulta accesibles.
- [ ] HU-27-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-27-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-27-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-27-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-32 — Consultar servicios móvil

**Sprint:** 5 · **Plataforma:** APP · **Prioridad:** Should Have · **PE propuestos:** 2 · **Alcance:** Opcional

**Historia:** Como cliente, quiero consultar los servicios ofrecidos por el gimnasio para conocer las alternativas disponibles.

**Coordina:** Jorge. **Apoyo:** Wagner: integración móvil; André: apoyo técnico.

**Dependencias:** HU-21, HU-28, HU-34

**Acuerdos, propuestas y límites:** Propuesta opcional dependiente de HU-21. Se excluye del compromiso base S5 hasta aceptar el catálogo de servicios; no se reutiliza el antiguo alcance de entrenamiento. Acuerdo 18/10: app exclusiva para socio/cliente, sin administración ni cancelación móvil. Alcance, PE y reparto S5 son tentativos; contacto editable, push y opciones adicionales no aprobados.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Confirmar permanencia de HU-21/32; si no aporta, marcar fuera de alcance con decisión.
2. Reutilizar API de catálogo informativo.
3. Diseñar lista/detalle y condiciones.
4. Conectar KMP y probar baja de oferta/estado vacío.
5. No incorporar seguimiento de entrenamiento por arrastre de documentos antiguos.

**Criterios de aceptación:**

- [ ] HU-32-CA-01: El socio consulta servicios informativos activos.
- [ ] HU-32-CA-02: Cada servicio muestra descripción, horario y condiciones.
- [ ] HU-32-CA-03: Permite abrir detalle y regresar al listado.
- [ ] HU-32-CA-04: Un servicio inactivo se retira al sincronizar.
- [ ] HU-32-CA-05: Distingue vacío, error y contenido cacheado.
- [ ] HU-32-CA-06: No permite reservas, rutinas ni asignación de entrenador.

**Definición de hecho:**

- [ ] HU-32-DoD-01: Consulta muestra solo servicios publicados.
- [ ] HU-32-DoD-02: Listado y detalle se prueban con y sin conexión.
- [ ] HU-32-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-32-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-32-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-32-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-32-DoR-01: El equipo incluye HU-21 y HU-32 en el alcance opcional.
- [ ] HU-32-DoR-02: API de servicios y diseño móvil disponibles.
- [ ] HU-32-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-32-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-32-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-32-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


#### HU-38 — Reportes consolidados

**Sprint:** 2 · **Plataforma:** WEB / API · **Prioridad:** Must Have · **PE propuestos:** 5 · **Alcance:** Base

**Historia:** Como administrador, quiero ver ingresos y membresías consolidados por período, plan y tipo de pase para supervisar la operación sin sumar registros manualmente.

**Coordina:** Jorge. **Apoyo:** André y Alexander: apoyo backend.

**Dependencias:** HU-08, HU-09, HU-35, HU-36, HU-37

**Acuerdos, propuestas y límites:** Reportes separan cobros reales, ajustes/anulaciones y contratos activos. La anulación debe reflejarse en todos los filtros sin doble descuento. No restar dinero de caja por una baja sin devolución. Confirmar el tratamiento económico de HU-36/37. Propuesta: fechas America/Lima, CSV autorizado y consolidado ADMIN.

**Tareas técnicas para el agente — propuesta de ejecución:**

1. Acordar cuáles métricas: cobros por fecha de pago, ajustes por fecha de ajuste, clientes activos por instante y pases vendidos, no mezclar ventas con conteos de contratos.
2. Definir rango visible inclusivo y traducirlo a [inicio día, inicio día siguiente) en Lima/UTC.
3. Diseñar dashboard oscuro/dorado, tarjetas enlazadas al detalle, tabla y filtros persistentes.
4. Crear proyecciones/queries agregadas sin multiplicar cobros al unir períodos o asistencias.
5. Implementar servicio de reportes y endpoint autorizado; total/tabla/gráfico usan el mismo conjunto filtrado.
6. Conectar gráfico útil mensual vs diario, detalle paginado y CSV si aceptado; escapar celdas para evitar inyección de fórmulas.
7. Conciliar ejemplos: S/100 + S/10 + duplicado S/100 - ajuste S/100 = neto S/110; cancelar contrato no altera ese total sin operación económica real.
8. Probar rango sin datos, corte UTC/Lima, filtros combinados y permisos. Reporte operativo no es contabilidad/facturación oficial.

**Criterios de aceptación:**

- [ ] HU-38-CA-01: ADMIN consulta ingresos brutos, ajustes y netos.
- [ ] HU-38-CA-02: Filtra por fechas, plan, mensual/diario y método de pago.
- [ ] HU-38-CA-03: Membresías activas/canceladas se cuentan aparte del dinero.
- [ ] HU-38-CA-04: Detalle, tarjetas y gráficos usan los mismos filtros.
- [ ] HU-38-CA-05: Los totales coinciden con pagos y ajustes sin multiplicar importes.
- [ ] HU-38-CA-06: Permite exportar CSV autorizado con celdas de texto protegidas.

**Definición de hecho:**

- [ ] HU-38-DoD-01: Ejemplo controlado concilia brutos, ajustes y netos.
- [ ] HU-38-DoD-02: Cancelación sin devolución no resta ingresos.
- [ ] HU-38-DoD-03: Criterios de aceptación y permisos probados con API real.
- [ ] HU-38-DoD-04: Pruebas y compilación pasan; código revisado e integrado.
- [ ] HU-38-DoD-05: Arquitectura y documentación afectada actualizadas.
- [ ] HU-38-DoD-06: Revisión visual aplicable sin observaciones impeditivas.

**Definición de listo:**

- [ ] HU-38-DoR-01: Métricas, filtros y permisos definidos.
- [ ] HU-38-DoR-02: Pagos, ajustes y pases diarios de prueba disponibles.
- [ ] HU-38-DoR-03: Criterios claros y ejemplos de prueba disponibles.
- [ ] HU-38-DoR-04: Diseño o contrato de API comprendido por el equipo.
- [ ] HU-38-DoR-05: Entorno y accesos necesarios disponibles.
- [ ] HU-38-DoR-06: Developers revisan PE y capacidad para cumplir el DoD.

**Resultado del agente:** NO EVALUADO. Para cambiarlo, adjuntar evidencia por identificador de criterio según el protocolo del apartado final.


## 6. Wagner, apoyo móvil y cierre técnico

Wagner es Product Owner y responsable principal propuesto del móvil. Estas HU permanecen bajo su coordinación; no se reasignan a André, Alexander o Jorge por incluirlas como contexto. André apoya KMP/integración; Alexander contratos, seguridad y API; Jorge Figma/UI y pruebas. La app es solo del cliente. Los puntos no representan carga individual exacta.

| HU | Funcionalidad | Sprint tentativo | PE propuestos | Alcance |
|---|---|---:|---:|---|

| HU-25 | Consultar suplementos | 5 | 5 | Base |

| HU-26 | Consultar promociones | 5 | 3 | Base |

| HU-28 | Inicio de sesión móvil | 5 | 8 | Base |

| HU-29 | Consultar membresía móvil | 5 | 5 | Base |

| HU-30 | Consultar pagos móvil | 5 | 3 | Base |

| HU-33 | Consultar notificaciones móvil | 5 | 5 | Base |

| HU-34 | Catálogo y promociones móvil | 5 | 8 | Base |

| HU-40 | Gestionar favoritos del catálogo | 5 | 8 | Opcional |



Antes de trabajo móvil, acordar matriz propia a partir del proyecto real: Kotlin, Compose Multiplatform, Gradle Wrapper, JDK compatible, Ktor, SQLDelight, Android SDK/AGP y Xcode. No trasladar automáticamente el JDK del backend al build móvil ni inventar ejecución iOS sin macOS/Xcode. No exigir esas herramientas a los tres developers para entregar S1.

El cierre S6 es tentativo y no posterga las pruebas, seguridad o integración que cada HU debe cumplir en su propio sprint:

| Trabajo técnico | Coordinación propuesta | Resultado |
|---|---|---|
| T6-01 Integración y seguridad | André | Flujos completos y matriz de permisos comprobados |
| T6-02 Despliegue/recuperación | Alexander | Migraciones, respaldo y restauración demostrados |
| T6-03 Regresión web y UI | Jorge | Observaciones subsanadas en Figma y frontend |
| T6-04 Builds y validación móvil | Wagner, con André | Evidencia Android/iOS y builds según acceso a plataformas |
| T6-05 Documentación/transferencia | André, con todo el equipo | Contratos, diagramas, manual y entrega coherentes |

## 7. Cómo debe verificar cada agente

1. Identificar developer y sprint solicitado. Leer sus fichas, dependencias, acuerdos y el estado real del código. Empezar por `git status` y registrar commits base; no borrar trabajo ajeno.
2. Revisar DoR antes de implementar: criterio claro, dependencias utilizables, entorno coincidente y decisiones de negocio resueltas. Si falta algo, marcarlo `BLOQUEADO` con causa concreta y continuar tareas independientes.
3. Para cada CA, preparar dato de entrada, acción y resultado esperado. Luego ejecutar y registrar el resultado observado. Separar API, persistencia y UI; “se ve bien” no prueba una transacción.
4. Usar PostgreSQL de desarrollo y datos ficticios. Probar errores de permisos/datos/concurrencia según la HU, sin tocar producción ni disparar mensajes reales sin autorización específica.
5. Ejecutar wrapper backend y scripts reales del frontend. Inspeccionar que los tests existen y fueron ejecutados: cero tests o pruebas saltadas no equivalen a validación. Si se usan tests con contenedores, informar si ese requisito no pudo ejecutarse.
6. Verificar persistencia después de reinicio. Revisar cambios de esquema mediante migraciones; no usar `ddl-auto=create` como mecanismo de entrega ni borrar datos para que una prueba parezca pasar.
7. Revisar DoD: todos los CA aplicables comprobados, integración real, pruebas pertinentes, seguridad, revisión de código, documentación y observaciones visuales impeditivas resueltas.
8. Preparar commits por funcionalidad solo con archivos propios y comprobados; revisar `git diff`, `git diff --check` y el contenido staged antes de confirmar. Evitar `git add .` indiscriminado. No inventar hashes, ramas publicadas ni CI verde; no hacer force-push.
9. Documentar en `docs/` el estado real ya previsto por cada repositorio y actualizar README/contratos afectados. Registrar observaciones de Wagner y evidencia de la corrección. No crear docenas de informes duplicados ni borrar instrucciones útiles.
10. Emitir el informe breve siguiente. No marcar una HU “terminada” si quedan CA/DoD fallidos, bloqueados o sin ejecutar. Un criterio `NO APLICA` necesita justificación de alcance aceptada, no sirve para omitir una prueba difícil.

Estados admitidos: **CUMPLE**, **NO CUMPLE**, **BLOQUEADO**, **NO EJECUTADO** y **NO APLICA justificado**. El diseño propuesto o la lectura del código sin ejecución se describe como revisión, no como prueba ejecutada.

Plantilla de evidencia que el agente debe completar con hechos reales:

| HU / criterio | Estado | Entrada y acción | Esperado | Observado | Evidencia real |
|---|---|---|---|---|---|
| ID exacto de esta guía | NO EJECUTADO inicialmente | Caso y datos ficticios | Regla del criterio | Resultado tras ejecutar | Test, salida saneada, captura real o consulta |

Resumen final requerido:

- Developer, sprint y HU trabajadas.
- Versiones comprobadas y diferencias respecto de André.
- Qué cambió y archivos afectados en cada repositorio.
- Comandos realmente ejecutados, resultado y cantidad de pruebas relevantes.
- Matriz de CA/DoD/DoR con evidencia y pendientes.
- Contratos que entrega al siguiente developer y conflictos de integración.
- Observaciones de Wagner: abiertas/corregidas/verificadas, sin inventar su OK.
- Rama y commits reales de cada repositorio, si se crearon; estado de push separado de commit local.

## 8. Prompt listo para el agente de cada developer

Copiar este bloque y reemplazar únicamente DEVELOPER y SPRINT por el integrante y sprint que se desea trabajar:

```text
Actúa sobre GYM VIP para DEVELOPER, en SPRINT. Lee íntegramente esta guía y las instrucciones locales. Usa el backlog actualizado como fuente; distingue acuerdos reportados, propuestas y evidencia real.

Primero comprueba git status de frontend/backend y la matriz de versiones contra la base funcional de André. No asumas versiones instaladas, hashes, ramas ni endpoints. Si eres el agente de André, registra primero sus versiones completas y fija la base reproducible; si eres el de Alexander/Jorge, verifica coincidencia con esa base. No actualices dependencias a latest ni regeneres el lockfile por comodidad.

Identifica las HU asignadas a DEVELOPER para SPRINT. Revisa sus DoR, dependencias y decisiones pendientes. Implementa o corrige las tareas necesarias sobre el código existente con Clean Architecture por capas generales; respeta qué repo requiere cambios. No reconstruyas el proyecto, no elimines trabajo de otros ni agregues funcionalidades de sprints futuros.

Para cada HU, verifica individualmente todos sus CA, DoD y DoR usando los IDs de esta guía. Usa API real y PostgreSQL de desarrollo; comprueba persistencia tras reinicio, permisos backend y los errores relevantes. Documenta resultado esperado, observado y evidencia real. Build correcto, mock o análisis estático no equivalen a funcionalidad probada.

Coordina contratos compartidos antes de modificarlos. En S1, André entrega HU-01/04/06; Alexander integra HU-07/08/10; Jorge HU-02/09/11/12 manual. HU-03 sigue S2 salvo acuerdo explícito para adelantarla; la seguridad mínima sí es necesaria en S1. QR, móvil, comunicaciones y pase diario no se incorporan por iniciativa del agente.

Actualiza la documentación de estado existente y prepara commits coherentes por funcionalidad, comprobando el diff y los secretos antes. Reporta solo commits y pruebas reales. Si una decisión de negocio bloquea parte de la HU, no la inventes: identifica exactamente el criterio bloqueado y termina lo independiente.

Finaliza con la plantilla de evidencia de esta guía, fallos/pendientes, contratos entregados y qué necesita el siguiente developer. No marques un criterio CUMPLE ni una HU terminada sin evidencia.
```

## 9. Fuentes, alcance de esta entrega y mantenimiento

- Fuente principal: `PRODUCT_BACKLOG_GYM_VIP_ACTUALIZADO.xlsx`, **versión 3**, hojas Product Backlog, Fichas HU y Sprint, leído para esta guía. El Excel no se modificó en esta entrega. Los CA/DoD/DoR de las 28 HU coordinadas por los tres developers se conservaron; las tareas S1 se ajustaron al acuerdo más reciente sobre auditoría y corte manual.
- Acuerdos de André en este chat: PO Wagner, sprints de dos semanas, registro adulto, edición por recepción con auditoría, cancelación presencial, catálogo administrado y app solo para clientes.
- Repositorios indicados por el equipo: [backend](https://github.com/gymvip-upeu/gymvip-backend) y [frontend](https://github.com/gymvip-upeu/gymvip-frontend). **No se verificó su contenido**: acceso 404 durante esta revisión. No hay pruebas de compilación/ejecución del proyecto realizadas por la elaboración de este documento.
- [Oracle: versiones Java LTS y no LTS](https://www.oracle.com/java/technologies/java-se-support-roadmap.html).
- [Node.js: estado de las líneas LTS](https://nodejs.org/en/about/previous-releases).
- [Vite: compatibilidad del entorno](https://vite.dev/guide/) y [variables de entorno públicas](https://vite.dev/guide/env-and-mode).
- [Maven Wrapper](https://maven.apache.org/tools/wrapper/) y [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/).
- [Spring Boot: configuración externa](https://docs.spring.io/spring-boot/reference/features/external-config.html).
- [PostgreSQL: política de versiones soportadas](https://www.postgresql.org/support/versioning/).

Ubicación sugerida en el workspace del equipo: `gymvip/documentos/GUIA_DESARROLLADORES_GYM_VIP.md`. La carpeta raíz puede no ser un repositorio: acordar cómo se comparte sin duplicar archivos contradictorios. Actualizar la matriz de versiones y estado al cambiar la base de integración; conservar las propuestas y las pruebas no ejecutadas claramente identificadas.

---

## 10. Revisión de la Base Funcional de André (Sprint 1) y Estado Real en Render

### 10.1 Estado Comprobado de la Base (19 de octubre de 2026)
- **Persistencia Exclusiva PostgreSQL 17.11:** El backend se conecta exclusivamente a PostgreSQL 17.11 en Render mediante TLS (`sslmode=require`). Se eliminó totalmente la dependencia `com.h2database:h2`, URLs `jdbc:h2`, perfiles y dialectos de motores embebidos.
- **Esquema Compartido (`public`):** Aloja las tablas de desarrollo (`accounts`, `audit_events`, `clients`, `documents`, `flyway_schema_history`, `plan_versions`, `plans`, `sessions`). Flyway aplicó exitosamente las migraciones `V1` y `V2`. Hibernate valida el esquema con `ddl-auto: validate`.
- **Esquema Aislado de Pruebas (`gymvip_test`):** Configurado mediante `TEST_DB_SCHEMA=gymvip_test`. Flyway y Hibernate operan en este esquema durante la ejecución de `.\mvnw.cmd test`, aislando las pruebas automatizadas del esquema compartido.
- **Suite de Pruebas Automatizadas:** **23/23 tests PASS (0 fallos, 0 errores, 0 omitidos)** ejecutados directamente contra PostgreSQL 17.11 en Render:
  - `DatabaseConnectivityCheckTest`: 1 prueba (Verificación del motor PostgreSQL 17.11 y esquemas Flyway).
  - `GymVipApplicationTests`: 1 prueba (Arranque de contexto Spring Boot).
  - `AccountManagementIntegrationTest`: 7 pruebas (HU-04: RBAC, listado seguro, alta colaborador, protección último admin).
  - `ClientIntegrationTest`: 6 pruebas (HU-01: Registro socio adulto, unicidad compuesta 409, bloqueo menor 400, contacto opcional, DNI 8 dígitos).
  - `PlanIntegrationTest`: 8 pruebas (HU-06: Catálogo, regla de 30 días, pase diario de 1 día, versionado inmutable v1->v2, inactivación).
- **Persistencia tras Reinicio Comprobada:** Registros de socio (`Valeria Mendoza Quiroz`, `VAL-35N4BW`) y plan (`Plan Funcional Render 7520` con versiones v1 y v2) verificados y leídos por API tras apagar y reiniciar el backend sobre la misma base física.
- **Prueba End-to-End en Navegador (`browser_subagent`):** Frontend levantado en puerto 5173 con proxy a backend en puerto 8081. Registro en vivo de socio `Joaquin Vega Silva` (`JOA-W38DM6`, DNI `78901234`), visualización de notificación dorada y confirmación física en Render con UUID `dc82a49b-07f8-44a4-a5a7-578fd2784b1a`.
- **Revisión de Wagner:** **PENDIENTE**. No se ha llevado a cabo la sesión formal de evaluación y firma de criterios de aceptación con el evaluador.

---

## 11. Protocolo de Branching, Publicación y Relevo para los Agentes de Alexander y Jorge

### 11.1 Estrategia de Ramas en los Repositorios
Tanto en [gymvip-backend](https://github.com/gymvip-upeu/gymvip-backend.git) como en [gymvip-frontend](https://github.com/gymvip-upeu/gymvip-frontend.git):
1. **`main`**: Inicializada con un **commit raíz de árbol vacío** (`git ls-tree` vacío). No contiene código funcional en esta etapa.
2. **`develop`**: Apunta al mismo commit inicial vacío de `main`. Queda reservada para la futura integración unificada de todos los compañeros.
3. **`feature/s1-andre-hu01-hu04-hu06`**: Rama oficial donde reside la base funcional completa entregada por André. Desciende del commit raíz vacío de `main`.

### 11.2 Instrucciones Obligatorias para los Agentes de Alexander y Jorge
Los agentes de Alexander (Parte 2: HU-07, HU-08, HU-10) y Jorge (Parte 3: HU-02, HU-09, HU-11, HU-12 manual) deben seguir los siguientes pasos:

a) **Verificar publicación y commits base:** Verificar que `origin/feature/s1-andre-hu01-hu04-hu06` está disponible en GitHub y comprobar la pareja de commits entregada por André.  
b) **Crear su rama individual exclusivamente desde:**
   ```bash
   git fetch origin
   git checkout -b feature/s1-alexander-hu07-hu08-hu10 origin/feature/s1-andre-hu01-hu04-hu06
   # o para Jorge:
   git checkout -b feature/s1-jorge-hu02-hu09-hu11-hu12 origin/feature/s1-andre-hu01-hu04-hu06
   ```
   **NUNCA crear su rama desde `develop` ni `main` mientras estén vacías.**  
c) **Conservar el código base heredado:** Respetar la arquitectura por capas en backend (`com.gymvip.*`) y frontend (`src/*`), DTOs, entidades, mappers y componentes reutilizables sin crear carpetas paralelas (`features/`, etc.).  
d) **Implementar únicamente su alcance autorizado:** Desarrollar exclusivamente las HU asignadas para el Sprint 1.  
e) **Validar criterios y ejecutar pruebas:** Probar individualmente cada CA, DoD y DoR con PostgreSQL en Render (`public` para manuales, `gymvip_test` para suites de Maven) y comprobar la persistencia tras reinicio.  
f) **Actualizar documentación y crear commits coherentes:** Registrar avances en `docs/` de cada repo y crear commits atómicos por funcionalidad usando rutas explícitas tras revisar `git diff`.  
g) **Hacer push con upstream de su propia rama:**
   ```bash
   git push --set-upstream origin feature/s1-alexander-hu07-hu08-hu10
   # o para Jorge:
   git push --set-upstream origin feature/s1-jorge-hu02-hu09-hu11-hu12
   ```  
h) **Comprobar coincidencia remota:** Verificar que el hash remoto en GitHub coincide exactamente con su entrega local (`git ls-remote --heads origin`).  
i) **Entregar enlaces reales:** Registrar en su informe final los enlaces exactos a sus ramas y commits en GitHub.  
j) **NO fusionar todavía a `develop` ni `main`:** Dejar la unificación de ramas para la sesión de integración formal del equipo.

