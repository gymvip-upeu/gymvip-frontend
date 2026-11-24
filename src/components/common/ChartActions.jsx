// ==============================================================================
// GYM VIP — Componente: ChartActions (Menú de Acciones para Gráficos)
// Descarga PNG, Copia al Portapapeles, Tabla de Datos y Exportación CSV
// ==============================================================================

import React, { useState } from 'react';
import { downloadChartAsPng, copyChartToClipboard, exportDataToCsv } from '../../utils/chartExportUtils';
import { Icon } from './Icons';

export function ChartActions({
  targetRef,
  title = 'Gráfico Analítico',
  filename = 'grafico_gymvip',
  tableData = null, // { headers: ['Etiqueta', 'Valor'], rows: [['Enero', 10], ['Febrero', 20]] }
  onExpand = null,
}) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const notify = (msg, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDownloadPng = async (theme = 'dark') => {
    if (!targetRef?.current) return;
    setLoadingAction('download');
    setShowMenu(false);
    try {
      await downloadChartAsPng(targetRef.current, filename, title, theme);
      notify('Gráfico descargado en PNG');
    } catch (err) {
      console.error('Error al exportar PNG:', err);
      notify('Error al generar la imagen PNG', true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopyClipboard = async () => {
    if (!targetRef?.current) return;
    setLoadingAction('copy');
    setShowMenu(false);
    try {
      const res = await copyChartToClipboard(targetRef.current, title, 'dark');
      if (res.method === 'clipboard') {
        notify('¡Imagen copiada al portapapeles!');
      } else {
        notify('Portapapeles no admitido. Imagen descargada.');
      }
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      notify('No se pudo copiar la imagen', true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportCsv = () => {
    if (!tableData || !tableData.headers || !tableData.rows) {
      notify('Sin datos tabulares para exportar', true);
      return;
    }
    setShowMenu(false);
    try {
      exportDataToCsv(filename, tableData.headers, tableData.rows);
      notify('Datos exportados en CSV');
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      notify('Error al generar archivo CSV', true);
    }
  };

  return (
    <div className="chart-actions-container" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      {/* Feedback Toast */}
      {feedback && (
        <span
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: feedback.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: feedback.isError ? '#EF4444' : '#10B981',
            border: `1px solid ${feedback.isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            whiteSpace: 'nowrap',
          }}
        >
          {feedback.msg}
        </span>
      )}

      {/* Botón rápido Copiar */}
      <button
        type="button"
        className="btn-icon-action"
        onClick={handleCopyClipboard}
        disabled={!!loadingAction}
        title="Copiar imagen al portapapeles"
        aria-label="Copiar imagen"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          padding: '4px 6px',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'all 0.2s',
        }}
      >
        <Icon name="copy" size={13} />
      </button>

      {/* Botón rápido Descargar */}
      <button
        type="button"
        className="btn-icon-action"
        onClick={() => handleDownloadPng('dark')}
        disabled={!!loadingAction}
        title="Descargar PNG fondo oscuro"
        aria-label="Descargar imagen"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          padding: '4px 6px',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'all 0.2s',
        }}
      >
        <Icon name="download" size={13} />
      </button>

      {/* Botón Más opciones (menú contextual) */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          title="Opciones de exportación y datos"
          aria-label="Más opciones"
          style={{
            background: showMenu ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${showMenu ? 'var(--color-gold)' : 'var(--color-border)'}`,
            borderRadius: '4px',
            padding: '4px 6px',
            cursor: 'pointer',
            color: showMenu ? 'var(--color-gold)' : 'var(--color-text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '11px',
            gap: '2px',
          }}
        >
          <span>•••</span>
        </button>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              backgroundColor: '#11141B',
              border: '1px solid var(--color-gold-border, rgba(212, 175, 55, 0.3))',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              padding: '6px',
              minWidth: '170px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => handleDownloadPng('dark')}
              style={menuItemStyle}
            >
              <Icon name="download" size={13} />
              <span>PNG (Fondo Oscuro)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPng('light')}
              style={menuItemStyle}
            >
              <Icon name="download" size={13} />
              <span>PNG (Fondo Blanco)</span>
            </button>
            {tableData && (
              <>
                <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
                <button
                  type="button"
                  onClick={() => { setShowTableModal(true); setShowMenu(false); }}
                  style={menuItemStyle}
                >
                  <Icon name="file-text" size={13} />
                  <span>Ver Tabla de Datos</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={menuItemStyle}
                >
                  <Icon name="download" size={13} />
                  <span>Descargar CSV</span>
                </button>
              </>
            )}
            {onExpand && (
              <button
                type="button"
                onClick={() => { onExpand(); setShowMenu(false); }}
                style={menuItemStyle}
              >
                <Icon name="eye" size={13} />
                <span>Ampliar Gráfico</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Tabla de Datos */}
      {showTableModal && tableData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowTableModal(false)}
        >
          <div
            style={{
              backgroundColor: '#11141B',
              border: '1px solid var(--color-gold-border, rgba(212, 175, 55, 0.3))',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#D4AF37' }}>{title} — Datos Subyacentes</h3>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.3)', color: '#D4AF37', textAlign: 'left' }}>
                    {tableData.headers.map((h, i) => (
                      <th key={i} style={{ padding: '8px 12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#F1F5F9' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '8px 12px' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportCsv}
                style={{ fontSize: '12px' }}
              >
                Descargar CSV
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowTableModal(false)}
                style={{ fontSize: '12px' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '6px 8px',
  background: 'transparent',
  border: 'none',
  borderRadius: '4px',
  color: '#F1F5F9',
  fontSize: '12px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.15s',
};
