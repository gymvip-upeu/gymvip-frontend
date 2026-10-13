import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gymvip_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gymvip_token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al iniciar sesión');
      }

      const data = await response.json();
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
      try {
        await apiFetch('/api/v1/auth/logout', { method: 'POST' }, token);
      } catch (e) {
        // ignore logout errors
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('gymvip_token');
    localStorage.removeItem('gymvip_user');
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const isAdmin = () => hasRole('ADMIN') || hasRole('SUPERADMIN');
  const isRecepcion = () => hasRole('RECEPCION');

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, isAdmin, isRecepcion, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
