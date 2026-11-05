// ==============================================================================
// GYM VIP — Componente: OperationsNav (Subnavegación de Operaciones de Mostrador)
// Unifica el acceso a Membresías/Cobros, Vigencias y Verificación sin romper URLs
// ==============================================================================

import React from 'react';
import { Icon } from './Icons';

export function OperationsNav({ activeTab, onNavigate }) {
  if (!onNavigate) return null;

  const tabs = [
    { id: 'memberships', label: 'Membresías y cobros', icon: 'credit-card' },
    { id: 'coverage', label: 'Vigencias y alertas', icon: 'calendar' },
    { id: 'verification', label: 'Verificar ingreso', icon: 'check-circle' },
  ];

  return (
    <div
      className="operations-subnav"
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '12px',
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onNavigate(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '38px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: isActive ? 700 : 500,
            }}
          >
            <Icon name={tab.icon} size={15} color={isActive ? '#0B0D12' : 'var(--color-gold)'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default OperationsNav;
