import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentView, setCurrentView }) {
  const { user, logout, isAdmin, isRecepcion } = useAuth();

  const navItems = [
    { id: 'plans', label: 'Planes de Membresía', icon: '📋' },
    { id: 'clients', label: 'Socios y Clientes', icon: '👥' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-title">
          <span>GYM VIP</span>
          <span className="brand-badge">PRO</span>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
          VIP CENTER FIT S.A.C.
        </p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
            {user?.roles?.map((r) => (
              <span key={r} className="badge badge-brand" style={{ fontSize: '10px' }}>
                {r}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ width: '100%', minHeight: '36px', fontSize: '12px' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
