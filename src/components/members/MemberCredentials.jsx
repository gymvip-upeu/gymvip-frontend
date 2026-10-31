import React, { useState } from 'react';
import MemberDialog from './MemberDialog';
import { Button } from '../common/Button';
export default function MemberCredentials({ credentials, onClose }) {
  const [copied, setCopied] = useState(false);
  return <MemberDialog title="Acceso del miembro creado" subtitle="Comparte estos datos de forma privada con el miembro." onClose={onClose}><div className="member-credentials"><label>Usuario de acceso</label><code>{credentials.username}</code><label>Contraseña temporal</label><code>{credentials.temporaryPassword}</code><p>Se muestra una sola vez. El miembro deberá cambiarla antes de consultar su información.</p></div><div className="member-actions"><Button variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(`Usuario: ${credentials.username}\nContraseña temporal: ${credentials.temporaryPassword}`); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Copiado' : 'Copiar datos'}</Button><Button onClick={onClose}>Aceptar</Button></div></MemberDialog>;
}
