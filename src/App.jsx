import React from 'react';
import { AuthProvider, useAuth } from './app/providers/AuthProvider';
import AppLayout from './app/layout/AppLayout';
import LoginModal from './features/auth/presentation/LoginModal';

function AppRoot() {
  const { user } = useAuth();

  if (!user) {
    return <LoginModal />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}
