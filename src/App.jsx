import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import PlansView from './components/PlansView';
import ClientsView from './components/ClientsView';
import LoginModal from './components/LoginModal';

function MainApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('plans');

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="app-container">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-ink-600)' }}>
              Ambiente Local · <strong>VIP CENTER FIT S.A.C.</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-ink-600)' }}>
              Sesión activa: <strong>{user.email}</strong>
            </span>
            <span className="badge badge-brand">
              {user.roles && user.roles[0]}
            </span>
          </div>
        </header>

        <div className="page-body">
          {currentView === 'plans' && <PlansView />}
          {currentView === 'clients' && <ClientsView />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
