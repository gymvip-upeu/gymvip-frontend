// ==============================================================================
// GYM VIP — Validador e Intérprete de Códigos QR (HU-13 / Sprint 1 & Sprint 3 Mobile)
// Interpreta credenciales estáticas y tokens dinámicos emitidos por KMP Mobile
// ==============================================================================

const MEMBER_CODE_REGEX = /^MAR-[A-Z0-9]{6}$/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URI_PREFIX = 'gymvip://member/';
const ACCESS_V1_PREFIX = 'gymvip://access/v1';

/**
 * Analiza e interpreta de forma segura el contenido escaneado de un código QR.
 * Previene exposición de credenciales y rechaza formatos ajenos al gimnasio.
 *
 * @param {string} raw - Contenido bruto leído por el lector óptico o cámara
 * @returns {{ valid: boolean, identifier?: string, type?: 'MEMBER_CODE'|'CLIENT_ID', token?: string, error?: string }}
 */
export function parseQrPayload(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, error: 'Código QR vacío o ilegible.' };
  }

  const trimmed = raw.trim();

  // Caso 1: Código directo de miembro (ej. MAR-2B7A89)
  if (MEMBER_CODE_REGEX.test(trimmed)) {
    return { valid: true, identifier: trimmed.toUpperCase(), type: 'MEMBER_CODE' };
  }

  // Caso 2: Identificador UUID directo
  if (UUID_REGEX.test(trimmed)) {
    return { valid: true, identifier: trimmed.toLowerCase(), type: 'CLIENT_ID' };
  }

  // Caso 3: Token dinámico de acceso móvil (HU-13 KMP: gymvip://access/v1?cid=...&code=...&nonce=...&exp=...)
  if (trimmed.toLowerCase().startsWith(ACCESS_V1_PREFIX)) {
    try {
      const url = new URL(trimmed);
      const cid = url.searchParams.get('cid');
      const code = url.searchParams.get('code');

      if (cid && UUID_REGEX.test(cid.trim())) {
        return { valid: true, identifier: cid.trim().toLowerCase(), type: 'CLIENT_ID', token: trimmed };
      }
      if (code && MEMBER_CODE_REGEX.test(code.trim())) {
        return { valid: true, identifier: code.trim().toUpperCase(), type: 'MEMBER_CODE', token: trimmed };
      }
      return { valid: false, error: 'Token QR dinámico de acceso sin identificador válido.' };
    } catch {
      return { valid: false, error: 'Token QR dinámico de acceso con formato inválido.' };
    }
  }

  // Caso 4: Esquema URI del gimnasio (ej. gymvip://member/MAR-2B7A89)
  if (trimmed.toLowerCase().startsWith(URI_PREFIX)) {
    const payload = trimmed.slice(URI_PREFIX.length).trim();
    if (MEMBER_CODE_REGEX.test(payload)) {
      return { valid: true, identifier: payload.toUpperCase(), type: 'MEMBER_CODE' };
    }
    if (UUID_REGEX.test(payload)) {
      return { valid: true, identifier: payload.toLowerCase(), type: 'CLIENT_ID' };
    }
    return { valid: false, error: 'URI de QR con identificador de miembro inválido.' };
  }

  // Caso 5: Objeto JSON estructurado
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const codeCandidate = parsed.memberCode || parsed.code;
      if (codeCandidate && MEMBER_CODE_REGEX.test(String(codeCandidate).trim())) {
        return { valid: true, identifier: String(codeCandidate).trim().toUpperCase(), type: 'MEMBER_CODE' };
      }
      const idCandidate = parsed.memberId || parsed.clientId || parsed.id;
      if (idCandidate && UUID_REGEX.test(String(idCandidate).trim())) {
        return { valid: true, identifier: String(idCandidate).trim().toLowerCase(), type: 'CLIENT_ID' };
      }
    } catch {
      // Ignorar fallo de parseo JSON
    }
  }

  return {
    valid: false,
    error: 'Formato de código QR no reconocido. No corresponde a un miembro registrado en GYM VIP.',
  };
}

export default parseQrPayload;
