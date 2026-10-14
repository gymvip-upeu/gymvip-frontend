import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, logoutApi } from '../../features/auth/infrastructure/authApi';
import { isAdminUser, isRecepcionUser } from '../../features/auth/domain/user';
import { registerUnauthorizedHandler } from '../../shared/http/httpClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gymvip_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('gymvip_token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout();
    });
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginApi(email, password);
      setToken(data.token);
      setUser(data);
      localStorage.setItem('gymvip_token', data.token);
      localStorage.setItem('gymvip_user', JSON.stringify(data));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (token) {
      await logoutApi(token);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('gymvip_token');
    localStorage.removeItem('gymvip_user');
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAdmin: () => isAdminUser(user),
    isRecepcion: () => isRecepcionUser(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return ctx;
}
