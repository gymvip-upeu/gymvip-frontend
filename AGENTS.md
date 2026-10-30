# Instrucciones para Agentes y Desarrolladores — GYM VIP Frontend

> **Repositorio:** `gymvip-frontend`  
> **Documentación Canónica Centralizada:** Carpeta `documentos/` dentro de este repositorio.

---

## 1. Reglas Clave para este Repositorio:
1. **Rama de Trabajo:** Trabajar en la rama local `feature/ajustes-diseno-documentacion-seguridad`. NUNCA modificar directamente `main`, `develop` ni ramas individuales de compañeros.
2. **Stack Real:** React 18.3.1, Vite 6.4.4, JavaScript nativo estructurado por capas (`api`, `components`, `config`, `contexts`, `hooks`, `pages`, `routes`, `services`, `templates`, `themes`, `utils`, `validators`).
3. **Diseño Visual:** Dark & Gold Luxury Fitness Design System en Vanilla CSS (`src/index.css`). Pantalla de acceso centrada con fondo fotográfico oficial del atleta (`hero-athlete.jpg`), tarjeta centrada sin demos y pantalla de bloqueo por inactividad (`LockScreenModal.jsx`).
4. **Cero Dependencias Innecesarias:** **NO utilizar `lucide-react`, `framer-motion` ni librerías externas no instaladas**. Toda la iconografía se implementa mediante componentes SVG nativos en línea en [`src/components/common/Icons.jsx`](./src/components/common/Icons.jsx).
5. **Seguridad Estricta:**
   - NUNCA colocar credenciales de PostgreSQL ni secretos en variables `VITE_*`.
   - NUNCA almacenar contraseñas en React, `localStorage` ni `sessionStorage`.
   - La reautenticación de sesiones bloqueadas valida exclusivamente contra el backend en `/api/v1/auth/login`.
6. **Comandos de Verificación:**
   - Instalación limpia: `npm ci`
   - Servidor local (puerto 5173): `npm run dev`
   - Pruebas unitarias de HTTP y sesión: `npm test`
   - Empaquetado de producción: `npm run build`
---

## 2. Regla de Documentación Viva por Cambio Significativo

Cualquier cambio relevante debe actualizar su documento correspondiente en `documentos/` en el mismo commit:
- Si cambia un endpoint, DTO, header o respuesta: actualizar [`documentos/APIDOCUMENTATION.md`](./documentos/APIDOCUMENTATION.md).
- Si cambia una vista, componente, imagen o flujo visual: actualizar [`documentos/DESIGN.md`](./documentos/DESIGN.md).
- Si cambia stack, dependencias o infraestructura: actualizar [`documentos/FICHA_TECNICA.md`](./documentos/FICHA_TECNICA.md).
- Si cambia arquitectura, ERD o comportamiento dinámico: actualizar [`documentos/ARQUITECTURA_Y_MODELOS.md`](./documentos/ARQUITECTURA_Y_MODELOS.md) y [`documentos/c4.uml`](./documentos/c4.uml).
- Si se ejecutan pruebas o se corrigen hallazgos de seguridad: actualizar [`documentos/EVIDENCIAS_QA_SEGURIDAD.md`](./documentos/EVIDENCIAS_QA_SEGURIDAD.md).
- Si cambia el estado de una HU o la entrega del sprint: actualizar [`documentos/ESTADO_PROYECTO.md`](./documentos/ESTADO_PROYECTO.md).
- Si cambian reglas de negocio, decisiones o DoD: actualizar [`documentos/REGLAS.md`](./documentos/REGLAS.md).
