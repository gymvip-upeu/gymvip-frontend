// ==============================================================================
// GYM VIP — Componente Command Palette (Ctrl + K)
// Búsqueda rápida, navegación instantánea por atajos de teclado y acciones VIP
// ==============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Icon } from './Icons';
import { useAuth } from '../../contexts/AuthContext';

export function CommandPalette({ isOpen, onClose, onNavigate }) {
  const { isAdmin, isRecepcion, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Lista de destinos y accesos rápidos según permisos
  const allCommands = useMemo(() => {
    const list = [
      { id: 'home', title: 'Dashboard Principal', category: 'Navegación', icon: 'home', shortcut: 'G + H' },
      { id: 'clients', title: 'Directorio de Miembros', category: 'Miembros', icon: 'users', shortcut: 'G + C' },
      { id: 'memberships', title: 'Membresías y Cobros', category: 'Finanzas', icon: 'credit-card', shortcut: 'G + M' },
      { id: 'coverage', title: 'Vigencias y Alertas de Vencimiento', category: 'Operaciones', icon: 'calendar', shortcut: 'G + V' },
      { id: 'verification', title: 'Control de Acceso (Torniquete)', category: 'Operaciones', icon: 'shield-check', shortcut: 'G + A' },
      { id: 'attendance', title: 'Asistencia y Agenda', category: 'Operaciones', icon: 'calendar', shortcut: '' },
      { id: 'plans', title: 'Planes y Tarifas Oficiales', category: 'Catálogo', icon: 'tag', shortcut: 'G + P' },
      { id: 'supplements', title: 'Suplementos y Stock', category: 'Catálogo', icon: 'package', shortcut: '' },
      { id: 'promotions', title: 'Promociones y Descuentos', category: 'Ventas', icon: 'percent', shortcut: '' },
      { id: 'reports', title: 'Constructor de Reportes Analíticos', category: 'Análisis', icon: 'bar-chart', shortcut: 'G + R' },
      { id: 'incidents', title: 'Auditoría e Incidencias', category: 'Análisis', icon: 'alert-triangle', shortcut: '' },
      { id: 'faq', title: 'Catálogo de Preguntas Frecuentes', category: 'Comunicaciones', icon: 'message-circle', shortcut: '' },
    ];

    if (isAdmin() || isRecepcion()) {
      list.push(
        { id: 'supplementOrders', title: 'Pedidos y Despacho QR', category: 'Ventas', icon: 'package', shortcut: '' },
        { id: 'facilities', title: 'Instalaciones VIP y Aforos', category: 'Operaciones', icon: 'tool', shortcut: '' }
      );
    }

    if (isAdmin()) {
      list.push(
        { id: 'dataImport', title: 'Asistente de Importación Masiva Excel', category: 'Administración', icon: 'file-text', shortcut: 'G + I' },
        { id: 'staff', title: 'Gestión de Personal y Empleados', category: 'Administración', icon: 'user-check', shortcut: '' },
        { id: 'reminders', title: 'Recordatorios Multicanal', category: 'Comunicaciones', icon: 'bell', shortcut: '' },
        { id: 'settings', title: 'Configuración del Sistema', category: 'Administración', icon: 'settings', shortcut: 'G + S' }
      );
    }

    return list;
  }, [isAdmin, isRecepcion]);

  // Filtrado reactivo en tiempo real
  const filteredCommands = useMemo(() => {
    if (!searchTerm.trim()) return allCommands;
    const lower = searchTerm.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower) ||
        cmd.id.toLowerCase().includes(lower)
    );
  }, [allCommands, searchTerm]);

  // Reset del índice seleccionado al cambiar el término
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Foco en el input al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Manejo de teclado (Flechas, Enter, Escape)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        onNavigate(selected.id);
        onClose();
      }
    }
  };

  const handleSelect = (id) => {
    onNavigate(id);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #0E0F12 0%, #17181C 100%)',
          color: '#F8FAFC',
          borderRadius: '14px',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 25px rgba(212, 175, 55, 0.2)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Barra de Entrada Superior */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box sx={{ color: '#D4AF37', display: 'flex', alignItems: 'center' }}>
            <Icon name="search" size={20} />
          </Box>
          <InputBase
            inputRef={inputRef}
            placeholder="Escribe un comando o busca un módulo... (ej. reportes, membresías, excel)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            sx={{
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 500,
              '& input::placeholder': {
                color: '#64748B',
                opacity: 1,
              },
            }}
          />
          <Chip
            label="ESC para salir"
            size="small"
            sx={{
              height: '22px',
              fontSize: '11px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#94A3B8',
              borderRadius: '4px',
            }}
          />
        </Box>

        {/* Lista de Resultados */}
        <List sx={{ maxHeight: '360px', overflowY: 'auto', p: 1 }}>
          {filteredCommands.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#64748B' }}>
              <Icon name="alert-circle" size={32} />
              <Typography sx={{ mt: 1, fontSize: '13px' }}>
                No se encontraron módulos coincidentes con "{searchTerm}".
              </Typography>
            </Box>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <ListItemButton
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    px: 2,
                    py: 1.2,
                    background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(212, 175, 55, 0.35)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '38px', color: isSelected ? '#D4AF37' : '#94A3B8' }}>
                    <Icon name={cmd.icon} size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={cmd.title}
                    primaryTypographyProps={{
                      fontSize: '13.5px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#FFFFFF' : '#CBD5E1',
                    }}
                    secondary={cmd.category}
                    secondaryTypographyProps={{
                      fontSize: '11px',
                      color: isSelected ? '#D4AF37' : '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}
                  />
                  {cmd.shortcut && (
                    <Chip
                      label={cmd.shortcut}
                      size="small"
                      sx={{
                        height: '20px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: 'rgba(212, 175, 55, 0.1)',
                        color: '#D4AF37',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                </ListItemButton>
              );
            })
          )}
        </List>

        {/* Pie Informativo */}
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
        <Box
          sx={{
            px: 2.5,
            py: 1.2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#64748B',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <span>Navega con <b style={{ color: '#94A3B8' }}>↑</b> <b style={{ color: '#94A3B8' }}>↓</b> y selecciona con <b style={{ color: '#94A3B8' }}>ENTER</b></span>
          <span style={{ color: '#D4AF37' }}>VIP CENTER FIT · Command Palette</span>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
