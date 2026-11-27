import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authenticate, signOut, verifyMfaChallenge, isAdminUser, isGerenteUser, isRecepcionUser, isAuditorUser, isBusinessExecutive } from '../services/authService';
import { registerUnauthorizedHandler } from '../api/httpClient';
import { setSentryUser, clearSentryUser } from '../config/sentry';
import { SESSION_KEY, readSession, sessionHasEnded } from '../services/browserSession';

const AuthContext = createContext(null);
const USER_ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
const ACTIVITY_WRITE_INTERVAL_MS = 5000;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = readSession(localStorage);
    return sessionHasEnded(saved) ? null : saved;
  });
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const authAttempt = useRef(0);

  const applyAuthenticatedSession = (data) => {
    const { token, ...user } = data;
    if (!token) throw new Error('El servidor no devolvió una sesión válida.');
    const next = { token, user, lastActivity: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setMfaChallenge(null);
    setSession(next);
  };

  const logout = useCallback((token) => {
    // Ignore delayed 401s and queued timers that belong to another session.
    if (!token || readSession(localStorage)?.token !== token) return;
    localStorage.removeItem(SESSION_KEY);
    setSession((active) => active?.token === token ? null : active);
    authAttempt.current += 1;
    setMfaChallenge(null);
    setLoading(false);
    void signOut(token);
  }, []);

  useEffect(() => {
    const legacyToken = localStorage.getItem('gymvip_token');
    localStorage.removeItem('gymvip_token');
    localStorage.removeItem('gymvip_user');
    localStorage.removeItem('gymvip_locked_account');
    sessionStorage.removeItem('gymvip_locked');
    const saved = readSession(localStorage);
    if (legacyToken && legacyToken !== saved?.token) void signOut(legacyToken);
    if (saved && sessionHasEnded(saved)) logout(saved.token);
  }, [logout]);

  useEffect(() => {
    if (session) setSentryUser(session.user);
    else clearSentryUser();
    return clearSentryUser;
  }, [session]);

  useEffect(() => {
    return registerUnauthorizedHandler(logout);
  }, [logout]);

  const activeToken = session?.token;

  useEffect(() => {
    if (!activeToken) return undefined;

    const checkSession = () => {
      const saved = readSession(localStorage);
      if (saved?.token !== activeToken) {
        setSession((current) => current?.token === activeToken ? null : current);
        return null;
      }
      if (sessionHasEnded(saved)) {
        logout(activeToken);
        return null;
      }
      return saved;
    };

    const recordActivity = () => {
      const saved = checkSession();
      const now = Date.now();
      if (saved && now - saved.lastActivity >= ACTIVITY_WRITE_INTERVAL_MS) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ...saved, lastActivity: now }));
      }
    };

    const onStorage = (event) => {
      if (event.key === SESSION_KEY || event.key === null) checkSession();
    };

    checkSession();
    const timer = window.setInterval(checkSession, 1000);
    for (const event of USER_ACTIVITY_EVENTS) {
      window.addEventListener(event, recordActivity, { passive: true });
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', checkSession);
    document.addEventListener('visibilitychange', checkSession);
    return () => {
      window.clearInterval(timer);
      for (const event of USER_ACTIVITY_EVENTS) window.removeEventListener(event, recordActivity);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', checkSession);
      document.removeEventListener('visibilitychange', checkSession);
    };
  }, [activeToken, logout]);

  const login = async (email, password) => {
    const attempt = ++authAttempt.current;
    setLoading(true);
    try {
      const data = await authenticate(email, password);
      if (authAttempt.current !== attempt) {
        if (data?.token) void signOut(data.token);
        return;
      }
      if (data?.mfaRequired && data?.challengeToken) {
        setMfaChallenge({
          challengeToken: data.challengeToken,
          email: data.email || email,
          message: data.message || 'Ingrese su código TOTP o código de recuperación.',
        });
      } else {
        applyAuthenticatedSession(data);
      }
      return data;
    } finally {
      if (authAttempt.current === attempt) setLoading(false);
    }
  };

  const verifyMfaLogin = async (code) => {
    if (!mfaChallenge?.challengeToken) throw new Error('No hay desafío MFA activo.');
    const attempt = ++authAttempt.current;
    setLoading(true);
    try {
      const data = await verifyMfaChallenge(mfaChallenge.challengeToken, code);
      if (authAttempt.current !== attempt) {
        if (data?.token) void signOut(data.token);
        return;
      }
      applyAuthenticatedSession(data);
      return data;
    } finally {
      if (authAttempt.current === attempt) setLoading(false);
    }
  };

  const cancelMfaChallenge = () => {
    authAttempt.current += 1;
    setMfaChallenge(null);
    setLoading(false);
  };

  const user = session?.user ?? null;
  const value = {
    user,
    token: activeToken ?? null,
    mfaChallenge,
    loading,
    login,
    verifyMfaLogin,
    cancelMfaChallenge,
    logout: () => logout(activeToken),
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
  if (!ctx) throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  return ctx;
}

export default AuthContext;
