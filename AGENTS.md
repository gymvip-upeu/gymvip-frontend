# Instrucciones para Agentes — GYM VIP Frontend

> **Repositorio:** `gymvip-frontend`  
> **Documentación General:** Consulte `../AGENTS.md` y la carpeta `../documentos/` en la raíz de GYMVIP.

## Reglas Clave para este Repositorio:
1. **Rama de Trabajo:** Trabajar en `feature/post-revision-diseno-qa`. Base histórica: `feature/s1-jorge-hu02-hu09-hu11-hu12`.
2. **Stack Real:** React 18.3.1, Vite 6.4.4, JavaScript nativo con arquitectura por capas (`api`, `components`, `config`, `contexts`, `hooks`, `pages`, `routes`, `services`, `templates`, `themes`, `utils`, `validators`).
3. **Diseño Visual:** Dark & Gold Luxury Design System en Vanilla CSS (`src/index.css`, `src/themes/tokens.js`).
4. **Sin Dependencias Innecesarias:** **NO utilizar `lucide-react`, `framer-motion` ni librerías de UI externas**. Toda iconografía es SVG nativo en línea y emojis.
5. **Seguridad Estricta:** NUNCA colocar credenciales de PostgreSQL ni secretos en variables `VITE_*`. La variable pública es `VITE_API_BASE_URL` (vacía en desarrollo local para usar proxy Vite en puerto 5173 hacia backend en puerto 8081).
6. **Comandos:**
   - Dependencias: `npm ci`
   - Servidor desarrollo: `npm run dev`
   - Pruebas: `npm test` y `npm test:membership`
   - Compilación: `npm run build`
7. **Sincronización:** Si modificas vistas, flujos o tokens, actualiza en el mismo ciclo `../documentos/DESIGN.md`, `../documentos/REGLAS.md` y `../documentos/EVIDENCIAS_QA_SEGURIDAD.md`.

