// ==============================================================================
// GYM VIP — Pantalla: HomePage (Panel de Control Principal Luxury)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchClients } from '../services/clientService';
import { fetchPlans } from '../services/planService';
import { fetchStaffAccounts } from '../services/staffService';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icons';
import athleteImg from '../assets/hero-athlete.jpg';

export default function HomePage({ onNavigate }) {
  const { token, user, isAdmin, isRecepcion } = useAuth();
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
    <div className="home-dashboard">
      {/* Welcome Hero Banner con textura fotográfica del atleta */}
      <div
        className="card home-hero-banner"
        style={{
          padding: '36px',
          marginBottom: '28px',
          backgroundImage: `linear-gradient(135deg, rgba(11, 13, 18, 0.88) 0%, rgba(21, 25, 34, 0.94) 60%, rgba(212, 175, 55, 0.15) 100%), url(${athleteImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          border: '1px solid var(--color-gold-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Badge variant="gold">VIP CENTER FIT · SPRINT 1</Badge>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>CENTRO FITNESS LUXURY</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, margin: '4px 0 10px 0', color: 'var(--color-text-primary)' }}>
            Bienvenido, {user?.email}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', maxWidth: '720px', lineHeight: 1.6 }}>
            Plataforma operativa para el control de socios, cotización y cobro de membresías, evaluación de vigencias en tiempo real y verificación de acceso en recepción.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => onNavigate('clients')}>
              <Icon name="users" size={16} />
              <span>Directorio de Socios</span>
            </Button>
            {(isAdmin() || isRecepcion()) && (
              <Button variant="secondary" onClick={() => onNavigate('verification')}>
                <Icon name="check-circle" size={16} color="var(--color-gold)" />
                <span>Verificar Ingreso</span>
              </Button>
            )}
            {(isAdmin() || isRecepcion()) && (
              <Button variant="secondary" onClick={() => onNavigate('memberships')}>
                <Icon name="credit-card" size={16} color="var(--color-gold)" />
                <span>Cobro y Afiliación</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards con iconografía SVG vectorial */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* KPI 1: Socios */}
        <div className="card kpi-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Socios Registrados (HU-01)
            </span>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="users" size={22} />
            </span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-gold)', margin: '12px 0 6px 0' }}>
            {loading ? '...' : metrics.totalClients}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Emisión con código único MAR-XXXXXX
          </p>
          <Button
            variant="secondary"
            onClick={() => onNavigate('clients')}
            style={{ width: '100%', marginTop: '16px', fontSize: '12px', minHeight: '36px' }}
          >
            <span>Ver Directorio</span>
            <Icon name="chevron-right" size={14} />
          </Button>
        </div>

        {/* KPI 2: Planes */}
        <div className="card kpi-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Planes Activos (HU-06)
            </span>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="tag" size={22} />
            </span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-gold)', margin: '12px 0 6px 0' }}>
            {loading ? '...' : metrics.activePlans}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Duración estricta de 30 días en Soles PEN
          </p>
          <Button
            variant="secondary"
            onClick={() => onNavigate('plans')}
            style={{ width: '100%', marginTop: '16px', fontSize: '12px', minHeight: '36px' }}
          >
            <span>Ver Tarifario</span>
            <Icon name="chevron-right" size={14} />
          </Button>
        </div>

        {/* KPI 3: Personal */}
        <div className="card kpi-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Equipo Operativo (HU-04)
            </span>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="shield-check" size={22} />
            </span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-gold)', margin: '12px 0 6px 0' }}>
            {loading ? '...' : (isAdmin() ? metrics.totalStaff : 'Operativo')}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {isAdmin() ? 'Colaboradores con roles ADMIN / RECEPCIÓN' : 'Sesión con rol RECEPCIÓN activa'}
          </p>
          {isAdmin() ? (
            <Button
              variant="secondary"
              onClick={() => onNavigate('staff')}
              style={{ width: '100%', marginTop: '16px', fontSize: '12px', minHeight: '36px' }}
            >
              <span>Ver Nómina</span>
              <Icon name="chevron-right" size={14} />
            </Button>
          ) : (
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Gestión exclusiva para Administradores
            </div>
          )}
        </div>
      </div>

      {/* Accesos Rápidos de Mostrador */}
      <div className="card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
          Operaciones de Mostrador y Recepción
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Acceso rápido a las tareas críticas de atención al público:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div
            className="action-card"
            onClick={() => onNavigate('verification')}
            style={{
              padding: '18px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-input)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-success)' }}><Icon name="check-circle" size={20} /></span>
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>Control de Acceso</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Verificar ingreso manual de socio en recepción mediante DNI o código (HU-12).
            </p>
          </div>

          <div
            className="action-card"
            onClick={() => onNavigate('coverage')}
            style={{
              padding: '18px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-input)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-warning)' }}><Icon name="calendar" size={20} /></span>
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>Vigencias y Alertas</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Supervisar membresías por vencer y vencidas con filtros ordenados por urgencia (HU-11).
            </p>
          </div>

          <div
            className="action-card"
            onClick={() => onNavigate('memberships')}
            style={{
              padding: '18px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-input)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-gold)' }}><Icon name="credit-card" size={20} /></span>
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>Cobro y Renovación</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Contratar plan, registrar cobro presencial en PEN y emitir constancia VIP (HU-07, 08, 10).
            </p>
          </div>

          <div
            className="action-card"
            onClick={() => onNavigate('settings')}
            style={{
              padding: '18px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-input)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}><Icon name="settings" size={20} /></span>
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>Configuración</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Consultar y ajustar parámetros operativos, umbrales de alerta y datos del gimnasio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
