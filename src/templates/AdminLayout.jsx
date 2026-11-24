// ==============================================================================
// GYM VIP — Plantilla: AdminLayout (Shell Principal)
// Navegación por Dominios Funcionales y Control RBAC Estricto
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../components/common/CommandPalette';

export function AdminLayout({ currentView, onNavigate, children }) {
  const { user, logout, isAdmin, isGerente, isRecepcion } = useAuth();
  const isExecutive = isAdmin() || (isGerente && isGerente());
  const auditorOnly = user?.roles?.includes('AUDITOR') && !isExecutive && !isRecepcion();

  // Preferencia de plegado persistida en localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('gymvip_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Estado drawer en móviles
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Estado del Command Palette (Ctrl + K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('gymvip_sidebar_collapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  // Atajo global Ctrl + K y Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isMobileOpen) setIsMobileOpen(false);
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, isCommandPaletteOpen]);

  // Elementos directos en la raíz de navegación
  const directItems = [
    { id: 'home', label: 'Dashboard', iconName: 'home', title: 'Dashboard Analítico Principal' },
  ];

  // Grupos funcionales organizados por dominios de negocio según roles
  const navigationGroups = auditorOnly ? [
    {
      id: 'analytics',
      label: 'ANÁLISIS Y CONTROL',
      iconName: 'bar-chart',
      items: [
        { id: 'reports', label: 'Reportes Personalizables', iconName: 'bar-chart', title: 'Constructor de Reportes y Métricas' },
        { id: 'incidents', label: 'Incidencias Operativas', iconName: 'alert-triangle', title: 'Auditoría e Incidencias' },
      ],
    },
  ] : [
    {
      id: 'members',
      label: 'MIEMBROS',
      iconName: 'users',
      items: [
        { id: 'clients', label: 'Directorio', iconName: 'users', title: 'Directorio y Registro de Miembros' },
        { id: 'memberships', label: 'Membresías', iconName: 'credit-card', title: 'Membresías y Cobros' },
        { id: 'coverage', label: 'Vigencias y Alertas', iconName: 'calendar', title: 'Seguimiento de Vigencias y Vencimientos' },
      ],
    },
    {
      id: 'operations',
      label: 'OPERACIONES',
      iconName: 'check-circle',
      items: [
        { id: 'verification', label: 'Control de Acceso', iconName: 'shield-check', title: 'Verificación Manual de Ingreso' },
        { id: 'attendance', label: 'Asistencia y Agenda', iconName: 'calendar', title: 'Marcaciones de Torniquete y Agenda' },
        { id: 'facilities', label: 'Instalaciones VIP', iconName: 'tool', title: 'Áreas del Gimnasio y Canales' },
      ],
    },
    {
      id: 'sales',
      label: 'CATÁLOGO Y VENTAS',
      iconName: 'tag',
      items: [
        { id: 'plans', label: 'Planes y Tarifas', iconName: 'tag', title: 'Catálogo Tarifario Oficial' },
        { id: 'supplements', label: 'Suplementos y Stock', iconName: 'package', title: 'Kardex y Catálogo de Suplementos' },
        { id: 'promotions', label: 'Promociones', iconName: 'percent', title: 'Descuentos y Promociones Activas' },
        ...(isExecutive || isRecepcion() ? [
          { id: 'supplementOrders', label: 'Pedidos y Despacho QR', iconName: 'package', title: 'Bandeja de Pedidos y Retiro QR' },
        ] : []),
      ],
    },
    {
      id: 'communications',
      label: 'COMUNICACIONES',
      iconName: 'message-circle',
      items: [
        ...(isExecutive ? [{ id: 'reminders', label: 'Recordatorios', iconName: 'bell', title: 'Reglas de Corte y Avisos Automáticos' }] : []),
        { id: 'faq', label: 'Respuestas Frecuentes', iconName: 'message-circle', title: 'Catálogo de FAQs Institucionales' },
        { id: 'communications', label: 'Historial de Envíos', iconName: 'send', title: 'Trazabilidad de WhatsApp y Email' },
      ],
    },
    ...(isExecutive ? [
      {
        id: 'analytics',
        label: 'ANÁLISIS Y CONTROL',
        iconName: 'bar-chart',
        items: [
          { id: 'reports', label: 'Reportes', iconName: 'bar-chart', title: 'Constructor de Reportes Dinámicos' },
          { id: 'incidents', label: 'Incidencias', iconName: 'alert-triangle', title: 'Libro de Incidencias y Auditoría' },
        ],
      },
    ] : []),
    ...(isExecutive || isRecepcion() ? [
      {
        id: 'administration',
        label: 'ADMINISTRACIÓN',
        iconName: 'settings',
        items: [
          ...(isExecutive ? [{ id: 'staff', label: 'Usuarios y Personal', iconName: 'user', title: 'Gestión de Personal y Roles' }] : []),
          { id: 'settings', label: 'Configuración General', iconName: 'settings', title: 'Ajustes Operativos del Sistema' },
          ...(isAdmin() ? [{ id: 'dataImport', label: 'Importación Masiva (TI)', iconName: 'download', title: 'Centro de Importación y Migración (TI)' }] : []),
        ],
      },
    ] : []),
  ];

  const viewTitles = {
    home: 'Dashboard Analítico Principal',
    clients: 'Directorio y Gestión de Miembros',
    operations: 'Operaciones: Cobros, Vigencias y Acceso',
    memberships: 'Membresías y Cobros en Mostrador',
    coverage: 'Seguimiento y Alertas de Vigencias',
    verification: 'Control Manual de Acceso en Recepción',
    attendance: 'Agenda y Control de Asistencia',
    plans: 'Catálogo de Planes y Tarifas',
    supplements: 'Catálogo de Suplementos y Kardex',
    supplementOrders: 'Bandeja de Pedidos de Suplementos y Retiro QR',
    promotions: 'Gestión de Promociones y Descuentos',
    facilities: 'Áreas e Instalaciones del Gimnasio',
    reminders: 'Configuración de Recordatorios y Cortes',
    faq: 'Catálogo de Respuestas Frecuentes',
    communications: 'Monitoreo y Trazabilidad de Comunicaciones',
    staff: 'Gestión de Personal y Roles',
    settings: 'Configuración Operativa del Sistema',
    dataImport: 'Centro de Importación y Migración Masiva de Datos',
    reports: 'Reportes Personalizables y Métricas',
    incidents: 'Incidencias Operativas y Auditoría',
  };

  const currentItem = {
    id: currentView,
    title: viewTitles[currentView] || 'VIP Center Fit',
  };

  const handleNavigate = (viewId) => {
    onNavigate(viewId);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'mobile-drawer-open' : ''}`}>
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        currentView={currentView}
        onNavigate={handleNavigate}
        navigationGroups={navigationGroups}
        directItems={directItems}
        user={user}
        onLogout={logout}
      />

      <div className="app-main-wrapper">
        <Header
          title={currentItem.title}
          subtitle="VIP CENTER FIT · LUXURY FITNESS"
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onNavigate={handleNavigate}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="app-content-body" tabIndex="-1">
          {children}
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default AdminLayout;