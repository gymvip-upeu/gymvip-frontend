// ==============================================================================
// GYM VIP — Pantalla: SettingsPage (Configuración Operativa del Sistema)
// Parámetros realmente disponibles y configurables para el centro fitness
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Icon } from '../components/common/Icons';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();

  // Umbral de alerta de vencimiento (por defecto 7 días según regla de negocio)
  const [upcomingDays, setUpcomingDays] = useState(() => {
    try {
      const saved = localStorage.getItem('gymvip_upcoming_days');
      return saved ? parseInt(saved, 10) : 7;
    } catch {
      return 7;
    }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveThreshold = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('gymvip_upcoming_days', String(upcomingDays));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {}
  };

  return (
    <div className="settings-page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
          Configuración Operativa
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Parámetros del sistema, políticas de recepción y datos institucionales de VIP Center Fit.
        </p>
      </div>

      {savedSuccess && (
        <Alert variant="success" message="Configuración de umbral guardada exitosamente en el navegador." onClose={() => setSavedSuccess(false)} />
      )}

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Tarjeta 1: Parámetros de Recepción y Vigencias */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="calendar" size={20} />
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Reglas de Cobertura y Alertas (HU-09 / HU-11)
            </h2>
          </div>

          <form onSubmit={handleSaveThreshold}>
            <div className="form-group" style={{ maxWidth: '420px' }}>
              <label className="form-label" htmlFor="upcoming-days-input">
                Días de Anticipación para Alerta "Por Vencer" (1 a 30 días)
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  id="upcoming-days-input"
                  type="number"
                  min="1"
                  max="30"
                  className="form-input"
                  value={upcomingDays}
                  onChange={(e) => setUpcomingDays(Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1)))}
                  style={{ width: '100px', textAlign: 'center' }}
                  required
                />
                <Button type="submit" variant="primary" style={{ minHeight: '44px' }}>
                  Guardar Umbral
                </Button>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px', display: 'block' }}>
                Valor de negocio acordado: <strong>7 días</strong>. Los socios con menos de este plazo figuran en la lista de alertas.
              </span>
            </div>

            <div style={{ marginTop: '16px', padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Zona Horaria Autoritativa:</span>
                <Badge variant="gold">America/Lima (UTC-5)</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Convención de Intervalo de Acceso:</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Inicio Incluido / Fin Excluido</span>
              </div>
            </div>
          </form>
        </div>

        {/* Tarjeta 2: Datos Institucionales de la Empresa */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="crown" size={20} />
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Identidad y Datos Fiscales
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '12px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Razón Social</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>VIP CENTER FIT S.A.C.</strong>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>RUC</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>20601234567</strong>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Moneda Oficial de Caja</span>
              <strong style={{ color: 'var(--color-gold)' }}>Soles Peruanos (PEN)</strong>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Sede Principal</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>Av. Primavera 1234, Santiago de Surco, Lima</strong>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Medios de Cobro Presenciales Habilitados en Caja */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="credit-card" size={20} />
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Medios de Pago Presenciales en Mostrador (HU-08)
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-success)' }} aria-hidden="true"><Icon name="check-circle" size={18} /></span>
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>Efectivo (PEN)</strong>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Cobro directo en caja</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-success)' }} aria-hidden="true"><Icon name="check-circle" size={18} /></span>
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>Yape / Plin</strong>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Exige número de operación</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-success)' }} aria-hidden="true"><Icon name="check-circle" size={18} /></span>
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>Tarjeta (POS Presencial)</strong>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Exige código de autorización</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 4: Seguridad y Perfil Activo */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="shield-check" size={20} />
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Sesión y Nivel de Privilegios
            </h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>Colaborador Activo:</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{user?.email}</strong>
              <div style={{ marginTop: '4px' }}>
                <Badge variant={isAdmin() ? 'gold' : 'neutral'}>
                  {isAdmin() ? 'ROL ADMINISTRADOR (CONTROL TOTAL)' : 'ROL RECEPCIÓN (ATENCIÓN Y COBROS)'}
                </Badge>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Seguridad:</span>
              <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>Sesión Stateless con Token Bearer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

