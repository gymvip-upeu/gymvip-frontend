// ==============================================================================
// GYM VIP — Componente: OperationsNav (Subnavegación de Operaciones de Mostrador)
// Unifica el acceso a Membresías/Cobros, Vigencias y Verificación sin romper URLs
// ==============================================================================

import React from 'react';
import { VipTabBar } from './VipTabBar';

export function OperationsNav({ activeTab, onNavigate }) {
  if (!onNavigate) return null;

  const tabs = [
    { id: 'memberships', label: 'Membresías y cobros', icon: 'credit-card', ariaCurrent: true },
    { id: 'coverage', label: 'Vigencias y alertas', icon: 'calendar', ariaCurrent: true },
    { id: 'verification', label: 'Verificar ingreso', icon: 'check-circle', ariaCurrent: true },
  ];

  return (
    <VipTabBar
      tabs={tabs}
      activeTab={activeTab}
      onChange={onNavigate}
      ariaLabel="Operaciones de mostrador"
    />
  );
}

export default OperationsNav;

