import React from 'react';
import { calculateAge } from '../domain/client';

export default function ClientDetailModal({ client, onClose }) {
  if (!client) return null;

  const age = calculateAge(client.birthDate);
  const formattedDate = client.createdAt
    ? new Date(client.createdAt).toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'No registrado';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="modal-content" style={{ maxWidth: '520px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
              FICHA DE SOCIO VIP
            </span>
            <h2 id="detail-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '2px 0' }}>
              {client.firstName} {client.lastName}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Código Oficial: <strong style={{ color: 'var(--color-gold)' }}>{client.memberCode || 'PENDIENTE'}</strong>
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Cerrar ficha"
            style={{ minHeight: '36px', minWidth: '36px', padding: '6px' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--color-surface-input)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Documento
            </span>
            <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              {client.documentType || 'DNI'} {client.documentNumber}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Edad / Nacimiento
            </span>
            <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              {age !== null ? `${age} años` : '-'} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>({client.birthDate})</span>
            </p>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Teléfono de Contacto
            </span>
            <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              {client.phone || '-'}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Correo Electrónico
            </span>
            <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              {client.email || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No provisto</span>}
            </p>
          </div>

          <div style={{ gridColumn: 'span 2', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fecha y Hora de Registro en Servidor
            </span>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              🕒 {formattedDate}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ minHeight: '40px' }}>
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
