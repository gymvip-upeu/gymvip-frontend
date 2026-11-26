// ==============================================================================
// GYM VIP — Contexto Global de Autenticación, Sesión y Bloqueo por Inactividad
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authenticate, signOut, verifyMfaChallenge, isAdminUser, isGerenteUser, isRecepcionUser, isAuditorUser, isBusinessExecutive } from '../services/authService';
import { registerUnauthorizedHandler } from '../api/httpClient';
import { setSentryUser, clearSentryUser, addSentryBreadcrumb } from '../config/sentry';

const AuthContext = createContext(null);

// 15 minutos de inactividad por defecto (en milisegundos)
const DEFAULT_INACTIVITY_MS = 15 * 60 * 1000;

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
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado de bloqueo de sesión (por inactividad o expiración de token)
  const [isLocked, setIsLocked] = useState(() => {
    return sessionStorage.getItem('gymvip_locked') === 'true';
  });

  const [lockedAccount, setLockedAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('gymvip_locked_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [lockReason, setLockReason] = useState('inactivity');

  const lastActivityRef = useRef(Date.now());

  // Sincronizar usuario con Sentry cuando cambia la sesión
  useEffect(() => {
    if (user && !isLocked) {
      setSentryUser(user);
    }
  }, [user, isLocked]);

  // Bloquear la sesión (oculta la interfaz operativa sin comparar contraseñas en frontend)
  const lockSession = useCallback((reason = 'inactivity') => {
    setIsLocked(true);
    setLockReason(reason);
    sessionStorage.setItem('gymvip_locked', 'true');
    addSentryBreadcrumb('auth', 'Sesión bloqueada', { reason });

    if (user) {
      const accountSummary = { email: user.email, roles: user.roles };
      setLockedAccount(accountSummary);
      localStorage.setItem('gymvip_locked_account', JSON.stringify(accountSummary));
    }
  }, [user]);

  // Desbloquear sesión: revalida SOLO la contraseña contra el backend para la cuenta conocida
  const unlockSession = async (password) => {
    const targetEmail = lockedAccount?.email || user?.email;
    if (!targetEmail) {
      throw new Error('No se identificó la cuenta previa para desbloqueo.');
    }

    setLoading(true);
    setError(null);
    try {
      const data = await authenticate(targetEmail, password);
      setToken(data.token);
      setUser(data);
      setIsLocked(false);
      setLockReason('inactivity');
      sessionStorage.removeItem('gymvip_locked');
      localStorage.setItem('gymvip_token', data.token);
      localStorage.setItem('gymvip_user', JSON.stringify(data));
      setSentryUser(data);
      addSentryBreadcrumb('auth', 'Sesión desbloqueada');
      lastActivityRef.current = Date.now();
      return data;
    } catch (err) {
      setError(err.message || 'Contraseña incorrecta o cuenta inactiva.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const applyAuthenticatedSession = (data) => {
    setToken(data.token);
    setUser(data);
    setMfaChallenge(null);
    setIsLocked(false);
    setLockedAccount({ email: data.email, roles: data.roles });
    sessionStorage.removeItem('gymvip_locked');
    localStorage.setItem('gymvip_token', data.token);
    localStorage.setItem('gymvip_user', JSON.stringify(data));
    localStorage.setItem('gymvip_locked_account', JSON.stringify({ email: data.email, roles: data.roles }));
    setSentryUser(data);
    lastActivityRef.current = Date.now();
  };

  // Iniciar sesión desde cero (soporta desafío MFA TOTP obligatorio en 2 pasos TEC-09)
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authenticate(email, password);
      if (data?.mfaRequired && data?.challengeToken) {
        setMfaChallenge({
          challengeToken: data.challengeToken,
          email: data.email || email,
          message: data.message || 'Ingrese su código TOTP de 6 dígitos o código de recuperación.',
        });
        addSentryBreadcrumb('auth', 'Desafío MFA TOTP requerido');
        return data;
      }
      applyAuthenticatedSession(data);
      addSentryBreadcrumb('auth', 'Inicio de sesión exitoso');
      return data;
    } catch (err) {
      setError(err.message || 'Credenciales de acceso incorrectas');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyMfaLogin = async (code) => {
    if (!mfaChallenge?.challengeToken) {
      throw new Error('No hay desafío MFA activo.');
    }
    setLoading(true);
    setError(null);
    try {
      const data = await verifyMfaChallenge(mfaChallenge.challengeToken, code);
      applyAuthenticatedSession(data);
      addSentryBreadcrumb('auth', 'Verificación MFA TOTP completada');
      return data;
    } catch (err) {
      setError(err.message || 'Código MFA inválido o expirado.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelMfaChallenge = () => {
    setMfaChallenge(null);
    setError(null);
  };

  // Cierre de sesión total
  const logout = async () => {
    if (token) {
      await signOut(token);
    }
    clearSentryUser();
    addSentryBreadcrumb('auth', 'Cierre de sesión');
    setToken(null);
    setUser(null);
    setIsLocked(false);
    setLockedAccount(null);
    sessionStorage.removeItem('gymvip_locked');
    localStorage.removeItem('gymvip_token');
    localStorage.removeItem('gymvip_user');
    localStorage.removeItem('gymvip_locked_account');
  };

  // Cambiar de cuenta desde la pantalla de bloqueo
  const switchAccount = () => {
    logout();
  };

  // Manejador centralizado para HTTP 401: bloquea la sesión por expiración
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      lockSession('expired');
    });
  }, [lockSession]);

  // Monitor de inactividad
  useEffect(() => {
    if (!user || isLocked) return;

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Verificación cada 15 segundos
    const timer = setInterval(() => {
      const timeoutLimit = Number(localStorage.getItem('gymvip_inactivity_ms')) || DEFAULT_INACTIVITY_MS;
      if (Date.now() - lastActivityRef.current >= timeoutLimit) {
        lockSession('inactivity');
      }
    }, 15000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(timer);
    };
  }, [user, isLocked, lockSession]);

  const value = {
    user,
    token,
    mfaChallenge,
    loading,
    error,
    isLocked,
    lockedAccount,
    lockReason,
    login,
    verifyMfaLogin,
    cancelMfaChallenge,
    logout,
    lockSession,
    unlockSession,
    switchAccount,
    isAdmin: () => isAdminUser(user),
    isGerente: () => isGerenteUser(user),
    isRecepcion: () => isRecepcionUser(user),
    isAuditor: () => isAuditorUser(user),
    isBusinessExecutive: () => isBusinessExecutive(user),
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

export default AuthContext;
