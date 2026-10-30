# Ficha Técnica y Matriz de Infraestructura — GYM VIP

> **Ubicación Canónica:** `gymvip-frontend/documentos/FICHA_TECNICA.md`  
> **Fecha de Actualización:** 30 de Octubre de 2026  
> **Árbol de Trabajo:** `GYMVIP/` (Contiene `gymvip-backend` y `gymvip-frontend`)

---

## 1. Stack Tecnológico Real Comprobado

| Componente | Tecnología | Versión | Estado | Justificación |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Runtime** | Java LTS | 21 | `IMPLEMENTADO` | Estándar de la plataforma, virtual threads y API segura. |
| **Backend Framework** | Spring Boot | 3.4.3 | `IMPLEMENTADO` | Web, Data JPA, Security, Validation y Actuator. |
| **Gestor de Compilación Backend** | Apache Maven Wrapper | 3.9.10 | `IMPLEMENTADO` | Compilación reproducible con `./mvnw.cmd`. |
| **Base de Datos Principal** | PostgreSQL | 17 | `IMPLEMENTADO` | Tipos relacionales, índices B-Tree y transacciones ACID. |
| **Migrador de Esquema BD** | Flyway Core | 10.x (V1 a V5) | `IMPLEMENTADO` | Migraciones inmutables versionadas en `db/migration`. |
| **Frontend Runtime** | Node.js | v20+ | `IMPLEMENTADO` | Entorno de ejecución para herramientas de frontend. |
| **Frontend Framework** | React | 18.3.1 | `IMPLEMENTADO` | Hooks, Context API y renderizado funcional reactivo. |
| **Empaquetador Frontend** | Vite | 6.4.4 | `IMPLEMENTADO` | Bundler ultrarrápido con `@vitejs/plugin-react`. |
| **Sistema de Estilos** | Vanilla CSS Dark & Gold | — | `IMPLEMENTADO` | Tokens en `index.css` sin dependencias pesadas ni frameworks externos. |
| **Iconografía** | SVG Nativos en Línea | — | `IMPLEMENTADO` | Catálogo propio en [`Icons.jsx`](../src/components/common/Icons.jsx) para evitar añadir librerías. |
| **Servidor Proxy Inverso** | Nginx | — | `PROPUESTO` | Recomendado para despliegue en producción (terminación SSL y rate limiting). |
| **Caché Distribuida** | Redis | — | `NO APLICA` | Descartado para el Sprint 1 por volumen de datos acotado. |
| **Colas de Mensajería** | RabbitMQ / Kafka | — | `NO APLICA` | Descartado: todas las transacciones son atómicas locales en PostgreSQL. |

---

## 2. Variables de Entorno y Configuración Saneada

> [!CAUTION]
> **Seguridad de Secretos:** Los archivos `.env` y las credenciales reales de bases de datos están expresamente excluidos de Git en los archivos `.gitignore`. Ninguna variable `VITE_*` de frontend debe contener contraseñas ni secretos de infraestructura.

### Backend (`gymvip-backend/src/main/resources/application.properties`)
```properties
# Puerto de escucha del servidor
server.port=8081

# Conexión a Base de Datos PostgreSQL
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:gymvip_db}
spring.datasource.username=${DB_USER:gymvip_user}
spring.datasource.password=${DB_PASSWORD:secret_password_here}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA y Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Flyway Database Migration
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration

# Seguridad y Aislamiento de Sesión
gymvip.security.session-ttl-hours=24
gymvip.security.cors.allowed-origins=http://localhost:5173
```

### Frontend (`gymvip-frontend/.env.example`)
```properties
# URL base de la API Spring Boot (con prefijo de versión)
VITE_API_BASE_URL=http://localhost:8081

# Tiempo de inactividad antes del bloqueo de pantalla (milisegundos)
VITE_INACTIVITY_TIMEOUT_MS=900000
```

---

## 3. Matriz de Puertos y Servicios en Desarrollo Local

| Servicio | Host / Origen | Puerto | Protocolo | Uso Operativo |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web** | `localhost` | `5173` | HTTP | Interfaz de usuario React servida por Vite. |
| **Backend REST API** | `localhost` | `8081` | HTTP | API RESTful Spring Boot con prefijo `/api/v1`. |
| **PostgreSQL Database** | `localhost` | `5432` | TCP | Motor de base de datos relacional para persistencia. |

---

## 4. Instrucciones de Despliegue y Construcción Limpia

### Compilación y Empaquetado del Backend
```powershell
Set-Location -Path "gymvip-backend"
# Ejecución de pruebas unitarias
.\mvnw.cmd test "-Dtest=CoveragePolicyTest,MembershipDatesTest,IsolationGuardTest"
# Generación de paquete JAR ejecutable
.\mvnw.cmd clean package -DskipTests
```

### Compilación y Empaquetado del Frontend
```powershell
Set-Location -Path "gymvip-frontend"
# Instalación limpia reproducible
npm ci
# Ejecución de pruebas unitarias de transporte HTTP y sesión
npm test
# Empaquetado de producción
npm run build
```
El build de frontend genera artefactos estáticos optimizados en `gymvip-frontend/dist/`.

