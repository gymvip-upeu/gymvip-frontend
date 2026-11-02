// ==============================================================================
// GYM VIP — Contexto Global de Preferencias Visuales (Apariencia y Accesibilidad)
// Persistencia en localStorage por cuenta de usuario (ADMIN, RECEPCION)
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

const DEFAULT_PREFERENCES = {
  theme: 'dark', // 'dark' | 'light' | 'system'
  fontSize: 'normal', // 'normal' | 'large'
  reducedMotion: 'system', // 'system' | 'reduce' | 'normal'
};

function getStorageKey(email) {
  if (email && typeof email === 'string') {
    return `gymvip_ui_preferences_${email.trim().toLowerCase()}`;
  }
  return 'gymvip_ui_preferences_default';
}

function loadPreferences(email) {
  try {
    const key = getStorageKey(email);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        theme: ['dark', 'light', 'system'].includes(parsed.theme) ? parsed.theme : DEFAULT_PREFERENCES.theme,
        fontSize: ['normal', 'large'].includes(parsed.fontSize) ? parsed.fontSize : DEFAULT_PREFERENCES.fontSize,
        reducedMotion: ['system', 'reduce', 'normal'].includes(parsed.reducedMotion) ? parsed.reducedMotion : DEFAULT_PREFERENCES.reducedMotion,
      };
    }
  } catch (err) {
    // Si falla el parseo o acceso a localStorage, usar valores por defecto
  }
  return { ...DEFAULT_PREFERENCES };
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(() => loadPreferences(user?.email));

  // Recargar preferencias al cambiar de usuario
  useEffect(() => {
    setPreferences(loadPreferences(user?.email));
  }, [user?.email]);

  // Actualizar una o varias preferencias y persistir por cuenta
  const updatePreferences = useCallback((newPartial) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPartial };
      try {
        const key = getStorageKey(user?.email);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (err) {
        // Ignorar fallos de cuota de localStorage
      }
      return updated;
    });
  }, [user?.email]);

  // Aplicar preferencias al DOM (data-theme, data-font-size, data-reduced-motion)
  useEffect(() => {
    const root = document.documentElement;

    // 1. Tema (dark | light | system)
    const resolveEffectiveTheme = () => {
      if (preferences.theme === 'system') {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return preferences.theme;
    };

    const applyTheme = () => {
      const effective = resolveEffectiveTheme();
      root.setAttribute('data-theme', effective);
      root.setAttribute('data-color-mode', preferences.theme);
    };

    applyTheme();

    let mediaQuery = null;
    let listener = null;
    if (preferences.theme === 'system' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      listener = () => applyTheme();
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(listener);
      }
    }

    // 2. Tamaño de texto
    root.setAttribute('data-font-size', preferences.fontSize);

    // 3. Reducción de animaciones
    root.setAttribute('data-reduced-motion', preferences.reducedMotion);

    return () => {
      if (mediaQuery && listener) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', listener);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(listener);
        }
      }
    };
  }, [preferences]);

  return (
    <ThemeContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreferences() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemePreferences debe ser utilizado dentro de un ThemeProvider');
  }
  return context;
}

export default ThemeContext;

