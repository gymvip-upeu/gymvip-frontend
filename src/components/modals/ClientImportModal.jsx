// ==============================================================================
// GYM VIP — Modal de Importación Masiva de Clientes (HU-06 / Sprint 1)
// Selección de archivo .xlsx, descarga de plantilla, vista previa y confirmación
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { Badge } from '../common/Badge';
import { Icon } from '../common/Icons';
import { LoadingState } from '../feedback/LoadingState';
import {
  downloadClientTemplate,
  previewClientImport,
  confirmClientImport,
} from '../../services/clientImportService';

export default function ClientImportModal({ token, onClose, onSuccess }) {
  const [step, setStep] = useState('SELECT'); // 'SELECT' | 'PREVIEW' | 'RESULT'
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const fileInputRef = useRef(null);

  // Cierre accesible con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose]);

  const handleDownloadTemplate = async () => {
    setErrorMsg(null);
    try {
      await downloadClientTemplate(token);
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo descargar la plantilla oficial.');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.xlsx')) {
        setErrorMsg('El archivo seleccionado debe tener extensión .xlsx.');
        setFile(null);
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setErrorMsg('El archivo supera el tamaño máximo permitido de 5 MB.');
        setFile(null);
        return;
      }
      setFile(selected);
      setErrorMsg(null);
    }
  };

  const handlePreview = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      setErrorMsg('Seleccione un archivo Excel (.xlsx) antes de continuar.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await previewClientImport(file, token);
      setPreviewData(data);
      setStep('PREVIEW');
    } catch (err) {
      setErrorMsg(err.message || 'Error al validar la vista previa del archivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await confirmClientImport(file, token);
      setResultData(result);
      setStep('RESULT');
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la confirmación de la importación.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onSuccess && resultData) {
      onSuccess(resultData);
    } else {
      onClose();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VALID':
        return <Badge variant="success">Válido</Badge>;
      case 'DUPLICATE_IN_FILE':
        return <Badge variant="warning">Duplicado (Archivo)</Badge>;
      case 'DUPLICATE_IN_DATABASE':
        return <Badge variant="warning">Duplicado (BD)</Badge>;
      case 'INVALID':
        return <Badge variant="danger">Inválido</Badge>;
      case 'CREATED':
        return <Badge variant="success">Creado</Badge>;
      case 'SKIPPED_DUPLICATE':
        return <Badge variant="warning">Omitido (Duplicado)</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rechazado</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
      <div
        className="modal-content"
        style={{
          maxWidth: step === 'SELECT' ? '600px' : '920px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
        }}
      >
        {/* Cabecera del Diálogo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
              IMPORTACIÓN MASIVA (HU-06)
            </span>
            <h2 id="import-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--color-text-primary)' }}>
              {step === 'SELECT' && 'Importar Clientes Existentes (.xlsx)'}
              {step === 'PREVIEW' && 'Vista Previa y Diagnóstico del Archivo'}
              {step === 'RESULT' && 'Informe de Importación Masiva'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              {step === 'SELECT' && 'Cargue una plantilla oficial Excel para registrar miembros por lote sin duplicados.'}
              {step === 'PREVIEW' && 'Revise las filas validadas antes de confirmar la persistencia en la base de datos.'}
              {step === 'RESULT' && 'Resumen por fila del procesamiento ejecutado y códigos de miembro emitidos.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <Icon name="x-circle" size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ marginBottom: '16px' }}>
            <Alert variant="danger" message={errorMsg} onClose={() => setErrorMsg(null)} />
          </div>
        )}

        {/* PASO 1: SELECCIÓN DE ARCHIVO */}
        {step === 'SELECT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Banner de descarga de plantilla */}
            <div
              style={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <strong style={{ color: 'var(--color-text-primary)', fontSize: '13px', display: 'block' }}>
                  ¿Aún no tiene la plantilla oficial?
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Contiene cabeceras oficiales, validaciones de columnas y celdas protegidas para DNI.
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleDownloadTemplate}
                style={{ fontSize: '12px', minHeight: '36px' }}
              >
                <Icon name="copy" size={14} color="var(--color-gold)" />
                <span>Descargar Plantilla .xlsx</span>
              </Button>
            </div>

            {/* Zona de Selección de Archivo */}
            <div
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '32px 20px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div style={{ marginBottom: '12px' }}>
                <Icon name="tag" size={32} color="var(--color-gold)" />
              </div>
              {file ? (
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {file.name}
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: '12px' }}
                  >
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Haga clic para seleccionar el archivo Excel (.xlsx)
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Límite máximo: 5 MB · Hasta 1000 registros por lote
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar Archivo
                  </Button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handlePreview}
                disabled={!file || loading}
              >
                {loading ? 'Inspeccionando archivo...' : 'Analizar Vista Previa'}
              </Button>
            </div>
          </div>
        )}

        {/* PASO 2: VISTA PREVIA Y DIAGNÓSTICO */}
        {step === 'PREVIEW' && previewData && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Píldoras de resumen */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Total Filas</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>{previewData.totalRows}</strong>
              </div>
              <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: 'var(--color-success)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-success)', display: 'block' }}>Válidos a Crear</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-success)' }}>{previewData.validCount}</strong>
              </div>
              <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: 'var(--color-warning)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-warning)', display: 'block' }}>Duplicados (Omitir)</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-warning)' }}>{previewData.duplicateCount}</strong>
              </div>
              <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-danger)', display: 'block' }}>Errores (Rechazar)</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-danger)' }}>{previewData.invalidCount}</strong>
              </div>
            </div>

            {/* Tabla de registros */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Fila</th>
                    <th>Miembro</th>
                    <th>Documento</th>
                    <th>Fecha Nac.</th>
                    <th>Estado</th>
                    <th>Diagnóstico</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td><strong>#{row.rowNumber}</strong></td>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{row.firstName} {row.lastName}</strong>
                        {row.email && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.email}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: '13px' }}>{row.documentType} {row.documentNumber}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {row.birthDate || '—'}
                        </span>
                      </td>
                      <td>{getStatusBadge(row.status)}</td>
                      <td>
                        <span style={{ fontSize: '12px', color: row.status === 'VALID' ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
                          {row.message}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep('SELECT')}
                disabled={loading}
              >
                Volver a seleccionar
              </Button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={previewData.validCount === 0 || loading}
                >
                  {loading
                    ? 'Procesando e importando...'
                    : `Confirmar e Importar ${previewData.validCount} Miembros`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: INFORME FINAL DE RESULTADOS */}
        {step === 'RESULT' && resultData && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ marginBottom: '16px' }}>
              <Alert
                variant="success"
                message={`¡Importación finalizada! Se crearon ${resultData.createdCount} miembros nuevos. Se omitieron ${resultData.skippedCount} duplicados sin sobrescribir.`}
              />
            </div>

            {/* Píldoras de resultado */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: 'var(--color-success)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-success)', display: 'block' }}>Creados con Éxito</span>
                <strong style={{ fontSize: '20px', color: 'var(--color-success)' }}>{resultData.createdCount}</strong>
              </div>
              <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: 'var(--color-warning)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-warning)', display: 'block' }}>Omitidos (Duplicados)</span>
                <strong style={{ fontSize: '20px', color: 'var(--color-warning)' }}>{resultData.skippedCount}</strong>
              </div>
              <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-danger)', display: 'block' }}>Rechazados</span>
                <strong style={{ fontSize: '20px', color: 'var(--color-danger)' }}>{resultData.rejectedCount}</strong>
              </div>
            </div>

            {/* Tabla de informe por fila */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Fila</th>
                    <th>Miembro</th>
                    <th>Documento</th>
                    <th>Código Miembro</th>
                    <th>Estado</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {resultData.results.map((res) => (
                    <tr key={res.rowNumber}>
                      <td><strong>#{res.rowNumber}</strong></td>
                      <td><strong style={{ color: 'var(--color-text-primary)' }}>{res.fullName}</strong></td>
                      <td><span style={{ fontSize: '13px' }}>{res.documentType} {res.documentNumber}</span></td>
                      <td>
                        {res.memberCode ? (
                          <Badge variant="gold" style={{ fontFamily: 'monospace' }}>
                            {res.memberCode}
                          </Badge>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>{getStatusBadge(res.status)}</td>
                      <td><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{res.message}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="button" variant="primary" onClick={handleFinish}>
                Finalizar y Ver Directorio
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

