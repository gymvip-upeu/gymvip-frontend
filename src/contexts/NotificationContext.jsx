// ==============================================================================
// GYM VIP — Contexto de Notificaciones y Toasts Globales (Dark & Gold)
// ==============================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle, Slide } from '@mui/material';

const NotificationContext = createContext(null);

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({
    open: false,
    title: '',
    message: '',
    severity: 'success', // 'success' | 'error' | 'warning' | 'info'
    duration: 4500,
  });

  const showNotification = useCallback(({ message, title = '', severity = 'success', duration = 4500 }) => {
    setNotification({
      open: true,
      title,
      message,
      severity,
      duration,
    });
  }, []);

  const showSuccess = useCallback((message, title = 'Operación Exitosa') => {
    showNotification({ message, title, severity: 'success' });
  }, [showNotification]);

  const showError = useCallback((message, title = 'Error') => {
    showNotification({ message, title, severity: 'error', duration: 6000 });
  }, [showNotification]);

  const showWarning = useCallback((message, title = 'Atención Requerida') => {
    showNotification({ message, title, severity: 'warning', duration: 5000 });
  }, [showNotification]);

  const showInfo = useCallback((message, title = 'Información del Sistema') => {
    showNotification({ message, title, severity: 'info', duration: 4000 });
  }, [showNotification]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const getBorderColor = () => {
    switch (notification.severity) {
      case 'success': return 'rgba(212, 175, 55, 0.6)'; // Gold VIP
      case 'error': return 'rgba(239, 68, 68, 0.6)';
      case 'warning': return 'rgba(245, 158, 11, 0.6)';
      default: return 'rgba(59, 130, 246, 0.6)';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.duration}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ zIndex: 99999 }}
      >
        <Alert
          onClose={handleClose}
          severity={notification.severity}
          variant="filled"
          sx={{
            width: '100%',
            minWidth: '320px',
            maxWidth: '460px',
            background: 'linear-gradient(135deg, #111113 0%, #1A1A1E 100%)',
            color: '#F8FAFC',
            border: `1px solid ${getBorderColor()}`,
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.8), 0 0 15px rgba(212, 175, 55, 0.15)',
            borderRadius: '10px',
            '& .MuiAlert-icon': {
              color: notification.severity === 'success' ? '#D4AF37' : undefined,
              fontSize: '22px',
            },
            '& .MuiAlert-message': {
              fontSize: '13px',
              lineHeight: 1.45,
            },
            '& .MuiAlertTitle-root': {
              color: notification.severity === 'success' ? '#D4AF37' : '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              marginBottom: '2px',
              letterSpacing: '0.3px',
            },
            '& .MuiAlert-action': {
              color: '#94A3B8',
              '&:hover': { color: '#F8FAFC' },
            },
          }}
        >
          {notification.title && <AlertTitle>{notification.title}</AlertTitle>}
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      showNotification: console.log,
      showSuccess: console.log,
      showError: console.error,
      showWarning: console.warn,
      showInfo: console.info,
    };
  }
  return context;
}
