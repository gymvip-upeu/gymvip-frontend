// ==============================================================================
// GYM VIP — Contexto Global de Preferencias de Experiencia y Guías (Frontend)
// Soporta Modo Guiado vs Modo Compacto ("Mostrar guías y consejos").
// ==============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getPreferencesApi, updatePreferencesApi } from '../api/staffApi';

const PreferencesContext = createContext(null);

function storageKeyFor(user) {
  const email = user?.email ? String(user.email).trim().toLowerCase() : 'guest';
  return `gymvip_show_guides_${email}`;
}

export function PreferencesProvider({ children }) {
  const { user, token } = useAuth();
  const canSync = Boolean(token && user && !user.mfaEnrollmentRequired
    && !user.firstAccessPasswordRequired && !user.directoryOnly);
  const [showGuides, setShowGuidesState] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKeyFor(user));
      if (saved === 'false' || saved === 'true') {
        setShowGuidesState(saved === 'true');
      } else {
        setShowGuidesState(true);
      }
    } catch {
      setShowGuidesState(true);
    }

    if (canSync) {
      let active = true;
      getPreferencesApi(token)
        .then((remote) => {
          if (!active || !remote) return;
          if (typeof remote.showGuides === 'boolean') {
            setShowGuidesState(remote.showGuides);
            try {
              localStorage.setItem(storageKeyFor(user), String(remote.showGuides));
            } catch {}
          }
        })
        .catch(() => {});
      return () => { active = false; };
    }
  }, [user, token, canSync]);

  const setShowGuides = useCallback(async (nextValue) => {
    const val = Boolean(nextValue);
    setShowGuidesState(val);
    try {
      localStorage.setItem(storageKeyFor(user), String(val));
    } catch {}
    if (canSync) {
      setSyncing(true);
      try {
        await updatePreferencesApi({
          showGuides: val,
          experienceMode: val ? 'GUIDED' : 'COMPACT',
        }, token);
      } catch {
        // Conserva preferencia local aun sin conexión momentánea
      } finally {
        setSyncing(false);
      }
    }
  }, [user, token, canSync]);

  const resetGuides = useCallback(async () => {
    await setShowGuides(true);
  }, [setShowGuides]);

  const value = {
    showGuides,
    experienceMode: showGuides ? 'GUIDED' : 'COMPACT',
    syncing,
    setShowGuides,
    toggleGuides: () => setShowGuides(!showGuides),
    resetGuides,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    return {
      showGuides: true,
      experienceMode: 'GUIDED',
      syncing: false,
      setShowGuides: async () => {},
      toggleGuides: () => {},
      resetGuides: async () => {},
    };
  }
  return ctx;
}
