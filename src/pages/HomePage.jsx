// ==============================================================================
// GYM VIP — Pantalla: HomePage (Panel Principal)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchClients } from '../services/clientService';
import { fetchPlans } from '../services/planService';
import { fetchStaffAccounts } from '../services/staffService';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export default function HomePage({ onNavigate }) {
  const { token, user, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState({
    totalClients: null,
    activePlans: null,
    totalStaff: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchMetrics() {
      setLoading(true);
      try {
        const [clientsData, plansData] = await Promise.all([
          fetchClients('', 0, 1, token).catch(() => ({ totalElements: 0 })),
          fetchPlans('ACTIVO', token).catch(() => []),
        ]);

        let staffCount = null;
        if (isAdmin()) {
          const staffData = await fetchStaffAccounts(token).catch(() => []);
          staffCount = staffData.length;
        }

        if (isMounted) {
          setMetrics({
            totalClients: clientsData.totalElements ?? 0,
            activePlans: plansData.length,
            totalStaff: staffCount,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, token]);

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          padding: '32px',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(21, 25, 34, 0.95) 100%)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Badge variant="gold">BASE FUNCIONAL SPRINT 1</Badge>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>VIP CENTER FIT S.A.C.</span>
        </div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, margin: '6px 0 10px 0', color: 'var(--color-text-primary)' }}>
          Bienvenido, {user?.email}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', maxWidth: '680px', lineHeight: 1.6 }}>
          Plataforma modular por capas desacopladas para la gestión de socios (HU-01), personal y roles (HU-04) y catálogo tarifario (HU-06).
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Socios Registrados (HU-01)
            </span>
            <span style={{ fontSize: '20px' }}>👥</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-gold)', margin: '12px 0 6px 0' }}>
            {loading ? '...' : metrics.totalClients}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Emisión de código único MAR-XXXXXX
          </p>
          <Button
            variant="secondary"
            onClick={() => onNavigate('clients')}
            style={{ width: '100%', marginTop: '16px', fontSize: '12px', minHeight: '34px' }}
          >
            Ver Socios →
          </Button>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Planes Activos (HU-06)
            </span>
            <span style={{ fontSize: '20px' }}>📋</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-gold)', margin: '12px 0 6px 0' }}>
            {loading ? '...' : metrics.activePlans}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Tarifario estándar en PEN y versionado
          </p>
          <Button
            variant="secondary"
            onClick={() => onNavigate('plans')}
            style={{ width: '100%', marginTop: '16px', fontSize: '12px', minHeight: '34px' }}
          >
            Ver Catálogo →
          </Button>
        </div>

        {isAdmin() && (
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Colaboradores Activos (HU-04)
              </span>
              <span style={{ fontSize: '20px' }}>🛡️</span>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-gold)', margin: '12px 0 6px 0' }}>
              {loading ? '...' : metrics.totalStaff}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Cuentas ADMIN / RECEPCION protegidas
            </p>
            <Button
              variant="secondary"
              onClick={() => onNavigate('staff')}
              style={{ width: '100%', marginTop: '16px', fontSize: '12px', minHeight: '34px' }}
            >
              Gestionar Nómina →
            </Button>
          </div>
        )}
      </div>

      {/* Delimitación del Sprint y Arquitectura */}
      <div className="card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: '16px' }}>
          Delimitación de la Base Acosta (Sprint 1)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '16px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Badge variant="gold" style={{ fontSize: '10px' }}>HU-01</Badge>
              <strong style={{ fontSize: '14px' }}>Registro de Clientes</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Alta con unicidad documental (409 Conflict), generación de código <code>MAR-XXXXXX</code>, filtro de mayoría de edad (18+) y ficha del socio.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Badge variant="gold" style={{ fontSize: '10px' }}>HU-04</Badge>
              <strong style={{ fontSize: '14px' }}>Personal y Roles</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Control de acceso RBAC estricto (401/403), hash BCrypt, revocación de sesión en tiempo real y salvaguarda del último administrador.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Badge variant="gold" style={{ fontSize: '10px' }}>HU-06</Badge>
              <strong style={{ fontSize: '14px' }}>Catálogo de Planes</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Tarifas en PEN, duración mensual obligatoria de 30 días, instantáneas inmutables con versión incremental y control de concurrencia optimista.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
