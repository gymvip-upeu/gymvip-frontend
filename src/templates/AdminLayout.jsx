// ==============================================================================
// GYM VIP — Plantilla: AdminLayout (Shell Principal)
// Navegación por Dominios Funcionales y Control RBAC Estricto
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasAnyPermission, hasPermission } from '../services/permissionsService';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AdminLayout({ currentView, onNavigate, children }) {
  const { user, logout, isAdmin, isGerente, isRecepcion } = useAuth();
  const isSuperAdmin = Boolean(user?.roles?.some((r) => String(r).toUpperCase().replace(/^ROLE_/, '') === 'SUPER_ADMIN'));
  const isExecutive = isSuperAdmin || isAdmin() || (isGerente && isGerente());
  const auditorOnly = (user?.roles?.includes('AUDITOR') || user?.roles?.includes('AUDITOR_EMPRESA')) && !isExecutive && !isRecepcion();

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

  useEffect(() => {
    try {
      localStorage.setItem('gymvip_sidebar_collapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  // Cierre accesible del drawer en móviles con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  // Elementos directos en la raíz de navegación (COR-01: Inicio)
  const directItems = [
    { id: 'home', label: 'Inicio', iconName: 'home', title: 'Inicio y Resumen Operativo' },
  ];

  // Grupos funcionales generados según permisos efectivos (COR-02 & COR-05)
  const rawGroups = [
    {
      id: 'members',
      label: 'MIEMBROS',
      iconName: 'users',
      items: [
        ...(hasPermission(user, 'members.read') ? [{ id: 'clients', label: 'Directorio', iconName: 'users', title: 'Directorio y Registro de Miembros' }] : []),
        ...(hasPermission(user, 'memberships.read') ? [{ id: 'memberships', label: 'Membresías y Cobros', iconName: 'credit-card', title: 'Afiliación, Renovación y Cobros' }] : []),
        ...(hasPermission(user, 'memberships.read') ? [{ id: 'coverage', label: 'Vigencias y Alertas', iconName: 'calendar', title: 'Control de Vigencias y Renovaciones' }] : []),
      ],
    },
    {
      id: 'operations',
      label: 'OPERACIÓN DIARIA',
      iconName: 'check-circle',
      items: [
        ...(hasPermission(user, 'attendance.read') ? [{ id: 'attendance', label: 'Asistencia y Agenda', iconName: 'calendar', title: 'Calendario y Registro de Asistencias' }] : []),
        ...(hasPermission(user, 'attendance.manage') ? [{ id: 'verification', label: 'Verificar Acceso QR', iconName: 'shield-check', title: 'Control de Torniquete y Acceso QR' }] : []),
        ...(['training.classes.roster', 'training.classes.manage', 'training.exercises.edit'].some((permission) => hasPermission(user, permission)) ? [{ id: 'classes', label: 'Clases y Entrenamiento', iconName: 'check-circle', title: 'Clases Grupales y Rutinas de Entrenadores' }] : []),
        ...((isExecutive || hasPermission(user, 'facilities.update_status')) ? [{ id: 'facilities', label: 'Áreas del Gimnasio', iconName: 'tool', title: 'Zonas, Horarios y Disponibilidad' }] : []),
        ...(hasPermission(user, 'incidents.read') ? [{ id: 'incidents', label: 'Incidencias', iconName: 'alert-triangle', title: 'Incidencias Operativas y Seguimiento' }] : []),
      ],
    },
    {
      id: 'sales',
      label: 'CATÁLOGO Y VENTAS',
      iconName: 'tag',
      items: [
        ...(hasPermission(user, 'plans.read') ? [{ id: 'plans', label: 'Planes y Tarifas', iconName: 'tag', title: 'Catálogo Tarifario Oficial' }] : []),
        ...((hasPermission(user, 'inventory.read') || hasPermission(user, 'supplements.stock.read')) ? [{ id: 'supplements', label: 'Suplementos y Stock', iconName: 'package', title: 'Catálogo de Suplementos y Stock' }] : []),
        ...(hasPermission(user, 'orders.dispatch') ? [{ id: 'supplementOrders', label: 'Pedidos y Despacho QR', iconName: 'package', title: 'Verificación de Pagos y Retiro QR' }] : []),
        ...(hasPermission(user, 'inventory.adjust') || user?.roles?.includes('COMPRAS') ? [
          { id: 'promotions', label: 'Promociones', iconName: 'percent', title: 'Descuentos y Campañas Activas' },
          { id: 'inventory', label: 'Inventario y Equipos', iconName: 'package', title: 'Stock por Sede, Kardex y Activos' },
          { id: 'purchasing', label: 'Proveedores y Compras', iconName: 'credit-card', title: 'Proveedores y Órdenes de Compra' },
        ] : []),
        ...(hasPermission(user, 'payments.read') ? [{ id: 'cash', label: 'Cajas y Finanzas', iconName: 'credit-card', title: 'Arqueo de Cajas y Movimientos PEN' }] : []),
        ...(hasPermission(user, 'members.read') ? [{ id: 'loyalty', label: 'Fidelización Opt-in', iconName: 'crown', title: 'Programa Voluntario de Puntos' }] : []),
      ],
    },
    {
      id: 'communications',
      label: 'COMUNICACIONES',
      iconName: 'message-circle',
      items: [
        ...(hasPermission(user, 'communications.configure') ? [{ id: 'reminders', label: 'Recordatorios', iconName: 'bell', title: 'Reglas de Corte y Avisos Automáticos' }] : []),
        ...(hasPermission(user, 'communications.read') ? [
          { id: 'faq', label: 'Respuestas Frecuentes', iconName: 'message-circle', title: 'Catálogo de FAQs Institucionales' },
          { id: 'communications', label: 'Historial de Envíos', iconName: 'send', title: 'Trazabilidad de WhatsApp y Email' },
        ] : []),
      ],
    },
    {
      id: 'administration',
      label: 'ANÁLISIS Y PLATAFORMA',
      iconName: 'settings',
      items: [
        ...(hasPermission(user, 'reports.read') ? [{ id: 'reports', label: 'Reportes', iconName: 'bar-chart', title: 'Constructor de Reportes y Exportación' }] : []),
        ...(hasPermission(user, 'employees.read') && !auditorOnly ? [
          { id: 'staff', label: 'Personal y Roles', iconName: 'shield-check', title: 'Equipo, Turnos y Matriz RBAC' },
          { id: 'hr', label: 'RRHH y Turnos', iconName: 'users', title: 'Fichas Laborales y Turnos por Sede' },
        ] : []),
        ...(hasPermission(user, 'branches.read') && !auditorOnly ? [
          { id: 'branches', label: 'Empresas y Sedes', iconName: 'monitor', title: 'Organizaciones y Sucursales' },
          ...(isExecutive ? [{ id: 'commercialProfile', label: 'Perfil Comercial Público', iconName: 'globe', title: 'Vitrina Pública y Reseñas Verificadas' }] : []),
        ] : []),
        ...(isSuperAdmin ? [
          { id: 'platformDashboard', label: 'SaaS · Consola Global', iconName: 'shield-check', title: 'Dashboard SaaS Exclusivo SUPER_ADMIN' },
          { id: 'platformRequests', label: 'SaaS · Solicitudes B2B', iconName: 'users', title: 'Afiliación de Gimnasios' },
          { id: 'platformLicenses', label: 'SaaS · Licencias y Comisiones', iconName: 'credit-card', title: 'Licencias SaaS y Ledger Calculado' },
          { id: 'platformSimulator', label: 'SaaS · Simulador Financiero', iconName: 'bar-chart', title: 'Punto de Equilibrio y Sostenibilidad' },
        ] : []),
        ...(hasPermission(user, 'members.import') ? [{ id: 'dataImport', label: 'Importación Masiva', iconName: 'file-text', title: 'Centro de Migración Excel Multientidad' }] : []),
        ...(hasPermission(user, 'integrations.read') ? [{ id: 'integrations', label: 'Integraciones y APIs', iconName: 'send', title: 'Conectividad Meta, Resend, Culqi y Firebase' }] : []),
        ...(hasPermission(user, 'platform.manage') || hasPermission(user, 'integrations.read') ? [{ id: 'monitoring', label: 'Observabilidad', iconName: 'bar-chart', title: 'Salud JVM, PostgreSQL y Auditoría' }] : []),
        ...(hasAnyPermission(user, ['communications.configure', 'orders.dispatch']) ? [{ id: 'settings', label: 'Configuración General', iconName: 'settings', title: 'Parámetros Operativos del Sistema' }] : []),
      ],
    },
  ];
  const navigationGroups = rawGroups.filter((group) => group.items.length > 0);

  const viewTitles = {
    home: 'Inicio · Resumen Operativo',
    clients: 'Directorio de Miembros',
    operations: 'Membresías y Cobros',
    memberships: 'Membresías y Cobros',
    coverage: 'Vigencias y Alertas de Vencimiento',
    verification: 'Control de Acceso y QR',
    attendance: 'Agenda y Calendario de Asistencias',
    plans: 'Catálogo de Planes y Tarifas',
    supplements: 'Suplementos y Control de Stock',
    supplementOrders: 'Pedidos y Despacho QR',
    promotions: 'Promociones y Campañas',
    facilities: 'Áreas del Gimnasio',
    branches: 'Empresas y Sedes',
    hr: 'Recursos Humanos y Turnos',
    inventory: 'Inventario por Sede y Activos',
    purchasing: 'Proveedores y Órdenes de Compra',
    cash: 'Control de Cajas y Movimientos PEN',
    classes: 'Clases Grupales y Entrenamiento',
    loyalty: 'Programa de Fidelización Opt-in',
    integrations: 'Centro de Integraciones y APIs',
    monitoring: 'Observabilidad y Telemetría',
    reminders: 'Recordatorios Automáticos',
    faq: 'Respuestas Frecuentes',
    communications: 'Historial de Comunicaciones',
    staff: 'Personal, Roles y Permisos RBAC',
    settings: 'Configuración Operativa',
    dataImport: 'Centro de Importación Masiva',
    profile: 'Mi Perfil Personal y Seguridad',
    reports: 'Reportes y Analítica Exportable',
    incidents: 'Incidencias Operativas',
    platformDashboard: 'Consola Global SaaS · SUPER_ADMIN',
    platformRequests: 'Solicitudes de Afiliación B2B',
    platformLicenses: 'Licencias SaaS y Comisiones',
    platformSimulator: 'Simulador Financiero B2B2C',
    commercialProfile: 'Perfil Comercial Público B2C',
  };

  const currentItem = {
    id: currentView,
    title: viewTitles[currentView] || 'VIP Center Fit',
  };

  const handleNavigate = (viewId, classId) => {
    onNavigate(viewId, classId);
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
        onOpenProfile={() => handleNavigate('profile')}
        onLogout={logout}
      />

      <div className="app-main-wrapper">
        <Header
          title={currentItem.title}
          subtitle={isSuperAdmin ? 'GYM VIP 2.0 · CONSOLA SAAS GLOBAL' : 'GYM VIP · GESTIÓN DE GIMNASIO'}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onNavigate={handleNavigate}
        />

        <main className="app-content-body" tabIndex="-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;