// ==============================================================================
// GYM VIP — Plantilla: Sidebar Reorganizado por Dominios Funcionales
// Estilo Luxury Dark & Gold con Secciones Colapsables, Modo Compacto y Drawer Móvil
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icons';

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  currentView,
  onNavigate,
  navigationGroups = [],
  directItems = [],
  user,
  onOpenProfile,
  onLogout,
}) {
  const [menuQuery, setMenuQuery] = useState('');

  // Estado de grupos expandidos persistido en localStorage
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('gymvip_sidebar_expanded_groups');
      return saved ? JSON.parse(saved) : { members: true, operations: true, sales: true };
    } catch {
      return { members: true, operations: true, sales: true };
    }
  });

  const normalizedQuery = menuQuery.trim().toLowerCase();
  const visibleGroups = normalizedQuery
    ? navigationGroups
        .map((group) => ({
          ...group,
          items: (group.items || []).filter(
            (it) =>
              it.label.toLowerCase().includes(normalizedQuery) ||
              group.label.toLowerCase().includes(normalizedQuery)
          ),
        }))
        .filter((group) => group.items.length > 0)
    : navigationGroups;

  // Expansión automática del grupo que contiene la vista activa
  useEffect(() => {
    if (!currentView) return;
    for (const group of navigationGroups) {
      if (group.items && group.items.some((it) => it.id === currentView)) {
        setExpandedGroups((prev) => {
          if (prev[group.id]) return prev;
          const next = { ...prev, [group.id]: true };
          try {
            localStorage.setItem('gymvip_sidebar_expanded_groups', JSON.stringify(next));
          } catch {}
          return next;
        });
        break;
      }
    }
  }, [currentView, navigationGroups]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('gymvip_sidebar_expanded_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const renderSingleItem = (item, isSubItem = false) => {
    const isOpGroup = item.id === 'operations' && ['operations', 'memberships', 'coverage', 'verification'].includes(currentView);
    const isActive = currentView === item.id || isOpGroup;
    const itemClass = isSubItem ? 'sidebar-sub-item' : 'sidebar-nav-item';

    return (
      <button
        key={item.id}
        type="button"
        className={`${itemClass} ${isActive ? 'active' : ''}`}
        onClick={() => onNavigate(item.id)}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.unavailable ? `${item.label} (próximamente)` : item.label}
        disabled={item.unavailable}
        title={item.unavailable ? 'Próximamente' : isCollapsed ? (item.title || item.label) : undefined}
      >
        <span className="nav-icon">
          <Icon
            name={item.iconName || 'home'}
            size={isSubItem ? 16 : 18}
            color={isActive ? 'var(--color-gold)' : 'var(--color-text-secondary)'}
          />
        </span>
        {!isCollapsed && <span className="nav-label">{item.label}</span>}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop para drawer móvil */}
      {isMobileOpen && (
        <div
          className="drawer-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Principal */}
      <aside
        id="app-sidebar"
        className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Menú principal de navegación por dominios"
      >
        {/* Cabecera / Marca */}
        <div className="sidebar-top">
          <div className="sidebar-brand">
            {!isCollapsed && (
              <div className="brand-text">
                <span className="brand-title">GYM <b>VIP</b></span>
                <span className="brand-sub">VIP CENTER FIT · LUXURY FITNESS</span>
              </div>
            )}
          </div>

          {/* Botón para alternar plegado */}
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            title={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Lista de Navegación por Grupos */}
        <nav className="sidebar-nav">
          {!isCollapsed && (
            <div style={{ padding: '4px 10px 10px 10px' }}>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <span className="input-icon" aria-hidden="true" style={{ left: '10px' }}>
                  <Icon name="search" size={14} color="var(--color-text-muted)" />
                </span>
                <input
                  type="search"
                  className="form-input with-left-icon"
                  value={menuQuery}
                  onChange={(e) => setMenuQuery(e.target.value)}
                  placeholder="Filtrar módulo..."
                  aria-label="Filtrar módulos de navegación"
                  style={{ minHeight: '34px', fontSize: '12px', paddingRight: '10px' }}
                />
              </div>
            </div>
          )}

          {/* Elementos Directos (Inicio) */}
          {directItems.map((item) => renderSingleItem(item, false))}

          {/* Grupos Funcionales Colapsables */}
          {visibleGroups.map((group) => {
            const isExpanded = normalizedQuery ? true : !!expandedGroups[group.id];
            const hasActiveChild = group.items.some((it) => it.id === currentView);

            return (
              <div key={group.id} className="sidebar-nav-group-container">
                {/* Cabecera del Grupo */}
                {!isCollapsed ? (
                  <button
                    type="button"
                    className={`sidebar-group-btn ${hasActiveChild ? 'has-active' : ''}`}
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    aria-label={`Grupo ${group.label}`}
                  >
                    <span className="sidebar-group-left">
                      <Icon name={group.iconName || 'tag'} size={14} color={hasActiveChild ? 'var(--color-gold)' : 'currentColor'} />
                      <span>{group.label}</span>
                    </span>
                    <span className={`sidebar-group-chevron ${isExpanded ? '' : 'collapsed'}`}>
                      <Icon name="chevron-down" size={13} />
                    </span>
                  </button>
                ) : (
                  <div className="sidebar-group-btn" title={group.label} style={{ cursor: 'default' }}>
                    <Icon name={group.iconName || 'tag'} size={15} color={hasActiveChild ? 'var(--color-gold)' : 'var(--color-text-muted)'} />
                  </div>
                )}

                {/* Sub-elementos del Grupo */}
                {(isExpanded || isCollapsed) && (
                  <div className="sidebar-group-items" role="group" aria-label={group.label}>
                    {group.items.map((subItem) => renderSingleItem(subItem, !isCollapsed))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Zona Inferior: Información del Usuario y Logout */}
        <div className="sidebar-bottom">
          {!isCollapsed && (
            <button
              type="button"
              className="user-info-box user-profile-trigger"
              onClick={onOpenProfile}
              aria-label="Abrir mi perfil personal"
              title="Ver y editar mi perfil"
            >
              <span className="session-label">MI SESIÓN · VER PERFIL</span>
              <span className="user-email" title={user?.email}>
                {user?.email}
              </span>
              <div style={{ marginTop: '4px' }}>
                <Badge variant={['ADMIN', 'GERENTE'].includes(user?.roles?.[0]) ? 'gold' : 'neutral'} style={{ fontSize: '10px' }}>
                  {user?.roles?.[0] || 'COLABORADOR'}
                </Badge>
              </div>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm sidebar-logout-btn"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <Icon name="log-out" size={16} color="var(--color-danger)" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;