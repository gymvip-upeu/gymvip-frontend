// ==============================================================================
// GYM VIP — Modal de Importación Masiva de Clientes (HU-06 / Sprint 1 & 2)
// Selección de archivo, vista previa diagnóstica, edición inline, exclusión manual,
// resolución de discrepancias ApiPeruDev y confirmación de registros aprobados
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { Badge } from '../common/Badge';
import { Icon } from '../common/Icons';
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
  const [verifyDni, setVerifyDni] = useState(false);
  const fileInputRef = useRef(null);

  // Estado mutable local para filas en vista previa con soporte de exclusión y edición
  const [rows, setRows] = useState([]);

  // Estados para modal de edición de fila
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    documentType: 'DNI',
    documentNumber: '',
    phone: '',
    email: '',
  });
  const [editFormError, setEditFormError] = useState(null);

  // Estados para modal de resolución de discrepancias
  const [discrepancyRow, setDiscrepancyRow] = useState(null);

  // Cierre accesible con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        if (editingRow) {
          setEditingRow(null);
        } else if (discrepancyRow) {
          setDiscrepancyRow(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose, editingRow, discrepancyRow]);

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
      const data = await previewClientImport(file, token, verifyDni);
      setPreviewData(data);
      // Mapear filas con campos de control reactivos
      const initialRows = (data.rows || []).map((r) => ({
        ...r,
        excluded: false,
        isEdited: false,
        discrepancyResolution: null,
        validationError: null,
      }));
      setRows(initialRows);
      setStep('PREVIEW');
    } catch (err) {
      setErrorMsg(err.message || 'Error al validar la vista previa del archivo.');
    } finally {
      setLoading(false);
    }
  };

  // Alternar exclusión/inclusión de fila
  const handleToggleExclude = (rowNumber) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber === rowNumber) {
          const newExcluded = !r.excluded;
          return {
            ...r,
            excluded: newExcluded,
          };
        }
        return r;
      })
    );
  };

  // Abrir modal de edición
  const handleOpenEdit = (row) => {
    setEditingRow(row);
    setEditFormData({
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      birthDate: row.birthDate || '',
      documentType: row.documentType || 'DNI',
      documentNumber: row.documentNumber || '',
      phone: row.phone || '',
      email: row.email || '',
    });
    setEditFormError(null);
  };

  // Guardar edición de fila
  const handleSaveEdit = (e) => {
    e.preventDefault();
    setEditFormError(null);

    const fName = editFormData.firstName.trim();
    const lName = editFormData.lastName.trim();
    const docNum = editFormData.documentNumber.trim();
    const bDate = editFormData.birthDate;

    if (!fName || !lName) {
      setEditFormError('Los nombres y apellidos son campos obligatorios.');
      return;
    }

    if (!docNum) {
      setEditFormError('El número de documento es obligatorio.');
      return;
    }

    if (editFormData.documentType === 'DNI' && !/^\d{8}$/.test(docNum)) {
      setEditFormError('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    if (bDate) {
      const parsedDate = new Date(bDate);
      const today = new Date();
      if (parsedDate > today) {
        setEditFormError('La fecha de nacimiento no puede ser futura.');
        return;
      }
      let age = today.getFullYear() - parsedDate.getFullYear();
      const m = today.getMonth() - parsedDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < parsedDate.getDate())) {
        age--;
      }
      if (age < 14) {
        setEditFormError('La edad mínima permitida para registrarse en GYM VIP es de 14 años.');
        return;
      }
    }

    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber === editingRow.rowNumber) {
          return {
            ...r,
            firstName: fName,
            lastName: lName,
            documentType: editFormData.documentType,
            documentNumber: docNum,
            birthDate: bDate || null,
            phone: editFormData.phone.trim() || null,
            email: editFormData.email.trim().toLowerCase() || null,
            isEdited: true,
            status: 'VALID',
            validationError: null,
            message: 'Editado manualmente por el operador (Aprobado)',
          };
        }
        return r;
      })
    );

    setEditingRow(null);
  };

  // Abrir modal de discrepancia
  const handleOpenDiscrepancy = (row) => {
    setDiscrepancyRow(row);
  };

  // Resolver discrepancia
  const handleResolveDiscrepancy = (resolution) => {
    if (!discrepancyRow) return;

    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber === discrepancyRow.rowNumber) {
          if (resolution === 'USE_SOURCE') {
            const verified = r.verifiedName || '';
            const parts = verified.trim().split(/\s+/);
            let newFirst = r.firstName;
            let newLast = r.lastName;
            if (parts.length >= 2) {
              newFirst = parts[0];
              newLast = parts.slice(1).join(' ');
            } else if (parts.length === 1) {
              newFirst = parts[0];
            }
            return {
              ...r,
              firstName: newFirst,
              lastName: newLast,
              isEdited: true,
              discrepancyResolution: 'USE_SOURCE',
              status: 'VALID',
              message: `Datos sincronizados con padrón oficial (${verified})`,
            };
          } else if (resolution === 'KEEP_EXCEL') {
            return {
              ...r,
              discrepancyResolution: 'KEEP_EXCEL',
              status: 'VALID',
              message: 'Se conservaron datos del archivo Excel con solicitud de revisión posterior',
            };
          } else if (resolution === 'EXCLUDE') {
            return {
              ...r,
              excluded: true,
              discrepancyResolution: 'EXCLUDE',
              message: 'Fila excluida debido a discrepancia no conciliada',
            };
          }
        }
        return r;
      })
    );

    setDiscrepancyRow(null);
  };

  // Confirmar importación
  const handleConfirm = async () => {
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // Construir decisiones estructuradas para enviar al backend
      const decisions = rows.map((r) => ({
        rowNumber: r.rowNumber,
        excluded: !!r.excluded,
        edited: !!r.isEdited,
        firstName: r.firstName,
        lastName: r.lastName,
        birthDate: r.birthDate,
        countryCode: r.countryCode || 'PE',
        documentType: r.documentType,
        documentNumber: r.documentNumber,
        phone: r.phone,
        email: r.email,
        discrepancyResolution: r.discrepancyResolution || null,
      }));

      const result = await confirmClientImport(file, token, verifyDni, decisions);
      setResultData(result);
      setStep('RESULT');
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la confirmación de la importación.');
    } finally {
      setLoading(false);
    }
  };

  // Exportar diagnóstico en CSV
  const handleExportReport = () => {
    if (!rows || rows.length === 0) return;
    const sanitizeCsvCell = (val) => {
      if (!val) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+@-]/.test(str)) str = "'" + str;
      return `"${str}"`;
    };

    const headers = [
      'Fila',
      'Excluido',
      'Editado',
      'DNI',
      'TipoDoc',
      'Nombre_Final',
      'Nombre_Oficial_ApiPeruDev',
      'Estado',
      'Resolucion_Discrepancia',
      'Diagnostico',
    ];
    const csvRows = [headers.join(',')];

    rows.forEach((r) => {
      csvRows.push(
        [
          r.rowNumber,
          r.excluded ? 'SI' : 'NO',
          r.isEdited ? 'SI' : 'NO',
          sanitizeCsvCell(r.documentNumber),
          sanitizeCsvCell(r.documentType),
          sanitizeCsvCell(`${r.firstName} ${r.lastName}`),
          sanitizeCsvCell(r.verifiedName || ''),
          sanitizeCsvCell(r.status),
          sanitizeCsvCell(r.discrepancyResolution || ''),
          sanitizeCsvCell(r.nameDiscrepancy || r.message || ''),
        ].join(',')
      );
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_importacion_diagnostico_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    if (onSuccess && resultData) {
      onSuccess(resultData);
    } else {
      onClose();
    }
  };

  // Métricas reactivas
  const totalOriginal = previewData ? previewData.totalRows : 0;
  const excludedCount = rows.filter((r) => r.excluded).length;
  const editedCount = rows.filter((r) => !r.excluded && r.isEdited).length;
  const selectedValidCount = rows.filter((r) => !r.excluded && r.status === 'VALID').length;
  const duplicateCount = rows.filter(
    (r) => !r.excluded && (r.status === 'DUPLICATE_IN_FILE' || r.status === 'DUPLICATE_IN_DATABASE')
  ).length;
  const invalidCount = rows.filter((r) => !r.excluded && r.status === 'INVALID').length;
  const unresolvedDiscrepancies = rows.filter(
    (r) => !r.excluded && r.identityStatus === 'DISCREPANCIA_NOMBRES' && !r.discrepancyResolution
  ).length;

  const getStatusBadge = (status, isExcluded, isEdited) => {
    if (isExcluded) {
      return <Badge variant="neutral">Excluido</Badge>;
    }
    if (isEdited) {
      return <Badge variant="gold">Editado / Válido</Badge>;
    }
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
      case 'SKIPPED_EXCLUDED':
        return <Badge variant="neutral">Omitido (Excluido)</Badge>;
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
          maxWidth: step === 'SELECT' ? '600px' : '1080px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          backgroundColor: 'var(--color-bg-surface, #14161D)',
          border: '1px solid var(--color-gold, #D4AF37)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera del Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-gold, #D4AF37)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              IMPORTACIÓN MASIVA (HU-06)
            </span>
            <h2 id="import-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--color-text-primary, #FFFFFF)' }}>
              {step === 'SELECT' && 'Importar Socios Existentes (.xlsx)'}
              {step === 'PREVIEW' && 'Revisión y Ajuste de Importación Masiva'}
              {step === 'RESULT' && 'Informe Final de Importación'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary, #A0AEC0)', margin: '4px 0 0' }}>
              {step === 'SELECT' && 'Cargue una plantilla oficial Excel para registrar socios por lote sin duplicados.'}
              {step === 'PREVIEW' && 'Edite filas, excluya registros no deseados y resuelva discrepancias antes de la confirmación final.'}
              {step === 'RESULT' && 'Resumen oficial de miembros creados y códigos asignados en el sistema.'}
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
              color: 'var(--color-text-muted, #8A92A6)',
              cursor: 'pointer',
              padding: '6px',
              fontSize: '20px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {errorMsg && (
          <div style={{ marginBottom: '14px' }}>
            <Alert variant="danger" message={errorMsg} onClose={() => setErrorMsg(null)} />
          </div>
        )}

        {/* PASO 1: SELECCIÓN DE ARCHIVO */}
        {step === 'SELECT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Banner de plantilla */}
            <div
              style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <strong style={{ color: 'var(--color-gold, #D4AF37)', fontSize: '13px', display: 'block' }}>
                  ¿Aún no tiene la plantilla oficial?
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary, #A0AEC0)' }}>
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

            {/* Zona de Drop/Selección */}
            <div
              style={{
                border: '2px dashed rgba(212, 175, 55, 0.35)',
                borderRadius: '12px',
                padding: '28px 20px',
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div style={{ marginBottom: '10px' }}>
                <Icon name="tag" size={32} color="var(--color-gold, #D4AF37)" />
              </div>
              {file ? (
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF' }}>{file.name}</p>
                  <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
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
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#FFFFFF' }}>
                    Seleccione el archivo Excel (.xlsx) a importar
                  </p>
                  <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Límite máximo: 5 MB · Hasta 1000 registros por lote
                  </p>
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Seleccionar Archivo
                  </Button>
                </div>
              )}
            </div>

            {/* Opción de Verificación con ApiPeruDev */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <input
                id="verify-dni-toggle"
                type="checkbox"
                checked={verifyDni}
                onChange={(e) => setVerifyDni(e.target.checked)}
                disabled={loading}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--color-gold, #D4AF37)', cursor: 'pointer' }}
              />
              <label htmlFor="verify-dni-toggle" style={{ cursor: 'pointer', fontSize: '13px' }}>
                <strong style={{ color: 'var(--color-gold, #D4AF37)', display: 'block', marginBottom: '2px' }}>
                  🔍 Contrastar DNI con ApiPeruDev / RENIEC (Recomendado)
                </strong>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: 1.4, display: 'block' }}>
                  Compara los nombres del archivo con el padrón oficial en tiempo real, permitiendo resolver discrepancias antes de importar.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
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

        {/* PASO 2: VISTA PREVIA Y DIAGNÓSTICO ENRIQUECIDO */}
        {step === 'PREVIEW' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Píldoras KPI sincronizadas en tiempo real */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Total Original</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>{totalOriginal}</strong>
              </div>

              <div className="card" style={{ padding: '10px', textAlign: 'center', borderColor: '#2ECC71' }}>
                <span style={{ fontSize: '11px', color: '#2ECC71', display: 'block' }}>A Importar</span>
                <strong style={{ fontSize: '18px', color: '#2ECC71' }}>{selectedValidCount}</strong>
              </div>

              <div className="card" style={{ padding: '10px', textAlign: 'center', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Excluidos</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-text-muted)' }}>{excludedCount}</strong>
              </div>

              <div className="card" style={{ padding: '10px', textAlign: 'center', borderColor: 'var(--color-gold)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-gold)', display: 'block' }}>Editados</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-gold)' }}>{editedCount}</strong>
              </div>

              <div className="card" style={{ padding: '10px', textAlign: 'center', borderColor: '#F39C12' }}>
                <span style={{ fontSize: '11px', color: '#F39C12', display: 'block' }}>Duplicados</span>
                <strong style={{ fontSize: '18px', color: '#F39C12' }}>{duplicateCount}</strong>
              </div>

              <div className="card" style={{ padding: '10px', textAlign: 'center', borderColor: '#E74C3C' }}>
                <span style={{ fontSize: '11px', color: '#E74C3C', display: 'block' }}>Inválidos</span>
                <strong style={{ fontSize: '18px', color: '#E74C3C' }}>{invalidCount}</strong>
              </div>

              {previewData?.dniVerificationEnabled && (
                <div className="card" style={{ padding: '10px', textAlign: 'center', borderColor: unresolvedDiscrepancies > 0 ? '#F39C12' : '#2ECC71' }}>
                  <span style={{ fontSize: '11px', color: unresolvedDiscrepancies > 0 ? '#F39C12' : '#2ECC71', display: 'block' }}>
                    Discrepancias
                  </span>
                  <strong style={{ fontSize: '18px', color: unresolvedDiscrepancies > 0 ? '#F39C12' : '#2ECC71' }}>
                    {unresolvedDiscrepancies}
                  </strong>
                </div>
              )}
            </div>

            {/* Advertencia de discrepancias no resueltas */}
            {unresolvedDiscrepancies > 0 && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(243, 156, 18, 0.1)',
                  border: '1px solid rgba(243, 156, 18, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="alert-triangle" size={16} color="#F39C12" />
                  <span style={{ fontSize: '12px', color: '#FFFFFF' }}>
                    Hay <strong>{unresolvedDiscrepancies}</strong> discrepancia(s) entre el Excel y el padrón de RENIEC sin resolver. Puede resolverlas mediante el botón «Resolver» o confirmarlas como revisión posterior.
                  </span>
                </div>
              </div>
            )}

            {/* Tabla con scroll y columna de ACCIONES fija */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                borderRadius: '10px',
                marginBottom: '14px',
                maxHeight: '440px',
                position: 'relative',
              }}
            >
              <table
                className="data-table"
                style={{
                  width: '100%',
                  fontSize: '12px',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  margin: 0,
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#1A1D24', color: 'var(--color-text-secondary)' }}>
                    <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1A1D24', width: '50px', padding: '10px' }}>Fila</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1A1D24', padding: '10px' }}>Miembro (Nombre)</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1A1D24', padding: '10px' }}>Documento</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1A1D24', padding: '10px' }}>Nacimiento</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1A1D24', padding: '10px' }}>Estado</th>
                    {previewData?.dniVerificationEnabled && (
                      <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1A1D24', padding: '10px', minWidth: '160px' }}>
                        Padrón RENIEC
                      </th>
                    )}
                    <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1A1D24', padding: '10px' }}>Diagnóstico / Nota</th>
                    <th
                      style={{
                        position: 'sticky',
                        top: 0,
                        right: 0,
                        zIndex: 12,
                        backgroundColor: '#1E222B',
                        padding: '10px',
                        width: '210px',
                        textAlign: 'center',
                        borderLeft: '1px solid rgba(212, 175, 55, 0.25)',
                      }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isDiscrepant = row.identityStatus === 'DISCREPANCIA_NOMBRES' && !row.discrepancyResolution;
                    const rowOpacity = row.excluded ? 0.45 : 1;
                    const rowBg = row.excluded
                      ? 'rgba(0, 0, 0, 0.3)'
                      : row.isEdited
                      ? 'rgba(212, 175, 55, 0.05)'
                      : 'transparent';

                    return (
                      <tr
                        key={row.rowNumber}
                        style={{
                          backgroundColor: rowBg,
                          opacity: rowOpacity,
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <strong>#{row.rowNumber}</strong>
                        </td>

                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ textDecoration: row.excluded ? 'line-through' : 'none' }}>
                            <strong style={{ color: row.isEdited ? 'var(--color-gold)' : 'var(--color-text-primary)' }}>
                              {row.firstName} {row.lastName}
                            </strong>
                            {row.isEdited && (
                              <span style={{ fontSize: '10px', color: 'var(--color-gold)', marginLeft: '6px' }}>
                                (Modificado)
                              </span>
                            )}
                          </div>
                          {row.email && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.email}</div>}
                          {row.phone && <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Tel: {row.phone}</div>}
                        </td>

                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>
                          {row.documentType} {row.documentNumber}
                        </td>

                        <td style={{ padding: '8px 10px', color: 'var(--color-text-secondary)' }}>
                          {row.birthDate || '—'}
                        </td>

                        <td style={{ padding: '8px 10px' }}>
                          {getStatusBadge(row.status, row.excluded, row.isEdited)}
                        </td>

                        {previewData?.dniVerificationEnabled && (
                          <td style={{ padding: '8px 10px' }}>
                            {row.identityStatus === 'ENCONTRADO_EN_FUENTE' && (
                              <Badge variant="success">Padrón OK</Badge>
                            )}
                            {row.identityStatus === 'DISCREPANCIA_NOMBRES' && (
                              <div>
                                <Badge variant={row.discrepancyResolution ? 'success' : 'warning'}>
                                  {row.discrepancyResolution ? `Resuelto: ${row.discrepancyResolution}` : 'Discrepancia'}
                                </Badge>
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--color-gold)',
                                    marginTop: '2px',
                                    fontWeight: 600,
                                  }}
                                  title={row.nameDiscrepancy}
                                >
                                  {row.verifiedName}
                                </div>
                              </div>
                            )}
                            {row.identityStatus === 'NO_ENCONTRADO_EN_FUENTE' && (
                              <Badge variant="neutral">No en padrón</Badge>
                            )}
                            {row.identityStatus === 'FORMATO_INVALIDO' && (
                              <Badge variant="danger">Formato inválido</Badge>
                            )}
                            {row.identityStatus === 'CUOTA_AGOTADA' && (
                              <Badge variant="danger">Cuota agotada</Badge>
                            )}
                            {!row.identityStatus && <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                          </td>
                        )}

                        <td style={{ padding: '8px 10px', maxWidth: '200px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {row.discrepancyResolution === 'USE_SOURCE'
                              ? 'Nombre sincronizado con ApiPeruDev'
                              : row.discrepancyResolution === 'KEEP_EXCEL'
                              ? 'Conservado para revisión posterior'
                              : row.message || row.nameDiscrepancy || '—'}
                          </span>
                        </td>

                        {/* Columna Acciones Fija (Sticky Right) */}
                        <td
                          style={{
                            position: 'sticky',
                            right: 0,
                            backgroundColor: row.excluded ? '#161920' : '#1A1E26',
                            padding: '6px 8px',
                            borderLeft: '1px solid rgba(212, 175, 55, 0.25)',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                            {/* Botón Editar */}
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleOpenEdit(row)}
                              disabled={loading}
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              title="Editar datos de este cliente"
                            >
                              <Icon name="tag" size={12} color="var(--color-gold)" />
                              <span>Editar</span>
                            </Button>

                            {/* Botón Resolver Discrepancia si aplica */}
                            {isDiscrepant && (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleOpenDiscrepancy(row)}
                                disabled={loading}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  borderColor: '#F39C12',
                                  color: '#F39C12',
                                }}
                                title="Comparar y resolver discrepancia con ApiPeruDev"
                              >
                                <span>Resolver</span>
                              </Button>
                            )}

                            {/* Botón Excluir / Restaurar */}
                            <Button
                              type="button"
                              variant={row.excluded ? 'secondary' : 'ghost'}
                              onClick={() => handleToggleExclude(row.rowNumber)}
                              disabled={loading}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                color: row.excluded ? '#2ECC71' : '#E74C3C',
                              }}
                              title={row.excluded ? 'Volver a incluir en la importación' : 'Excluir de la importación'}
                            >
                              <span>{row.excluded ? 'Restaurar' : 'Excluir'}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Acciones del pie */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="button" variant="secondary" onClick={() => setStep('SELECT')} disabled={loading}>
                  Volver a seleccionar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleExportReport}
                  style={{ fontSize: '12px' }}
                  title="Descargar diagnóstico en CSV con trazabilidad"
                >
                  📥 Exportar Diagnóstico (.csv)
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={selectedValidCount === 0 || loading}
                  style={{ fontWeight: 700 }}
                >
                  {loading
                    ? 'Procesando e importando...'
                    : `Confirmar e Importar ${selectedValidCount} Miembros`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: INFORME FINAL DE RESULTADOS */}
        {step === 'RESULT' && resultData && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ marginBottom: '14px' }}>
              <Alert
                variant="success"
                message={`¡Importación masiva finalizada con éxito! Se crearon ${resultData.createdCount} nuevos socios en el gimnasio. Se omitieron ${resultData.skippedCount} registros (duplicados o excluidos manualmente).`}
              />
            </div>

            {/* Píldoras de resumen final */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: '#2ECC71' }}>
                <span style={{ fontSize: '11px', color: '#2ECC71', display: 'block' }}>Socios Creados</span>
                <strong style={{ fontSize: '22px', color: '#2ECC71' }}>{resultData.createdCount}</strong>
              </div>
              <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: '#F39C12' }}>
                <span style={{ fontSize: '11px', color: '#F39C12', display: 'block' }}>Omitidos (Duplicados / Excluidos)</span>
                <strong style={{ fontSize: '22px', color: '#F39C12' }}>{resultData.skippedCount}</strong>
              </div>
              <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: '#E74C3C' }}>
                <span style={{ fontSize: '11px', color: '#E74C3C', display: 'block' }}>Rechazados</span>
                <strong style={{ fontSize: '22px', color: '#E74C3C' }}>{resultData.rejectedCount}</strong>
              </div>
            </div>

            {/* Tabla de informe por fila */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                marginBottom: '16px',
                maxHeight: '380px',
              }}
            >
              <table className="data-table" style={{ margin: 0, width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1A1D24' }}>
                    <th style={{ width: '50px' }}>Fila</th>
                    <th>Socio Registrado</th>
                    <th>Documento</th>
                    <th>Código Generado</th>
                    <th>Estado</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {resultData.results.map((res) => (
                    <tr key={res.rowNumber}>
                      <td><strong>#{res.rowNumber}</strong></td>
                      <td><strong style={{ color: '#FFFFFF' }}>{res.fullName}</strong></td>
                      <td><span style={{ fontFamily: 'monospace' }}>{res.documentType} {res.documentNumber}</span></td>
                      <td>
                        {res.memberCode ? (
                          <Badge variant="gold" style={{ fontFamily: 'monospace' }}>
                            {res.memberCode}
                          </Badge>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>{getStatusBadge(res.status, false, false)}</td>
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

        {/* MODAL SECUNDARIO: EDICIÓN MANUAL DE FILA */}
        {editingRow && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '540px',
                backgroundColor: 'var(--color-bg-surface, #14161D)',
                border: '1px solid var(--color-gold, #D4AF37)',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.9)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                  Editar Fila #{editingRow.rowNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  style={{ background: 'none', border: 'none', color: '#8A92A6', cursor: 'pointer', fontSize: '18px' }}
                >
                  ×
                </button>
              </div>

              {editFormError && (
                <div style={{ marginBottom: '12px' }}>
                  <Alert variant="danger" message={editFormError} />
                </div>
              )}

              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Nombres *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      required
                      style={{ width: '100%', fontSize: '12px', padding: '7px 9px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      required
                      style={{ width: '100%', fontSize: '12px', padding: '7px 9px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Tipo Doc.
                    </label>
                    <select
                      className="input-field"
                      value={editFormData.documentType}
                      onChange={(e) => setEditFormData({ ...editFormData, documentType: e.target.value })}
                      style={{ width: '100%', fontSize: '12px', padding: '7px 9px' }}
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                      <option value="PASAPORTE">PASAPORTE</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Número Documento *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={editFormData.documentNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, documentNumber: e.target.value })}
                      required
                      style={{ width: '100%', fontSize: '12px', padding: '7px 9px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Nacimiento (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={editFormData.birthDate}
                      onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                      style={{ width: '100%', fontSize: '12px', padding: '7px 9px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Teléfono
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      style={{ width: '100%', fontSize: '12px', padding: '7px 9px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    style={{ width: '100%', fontSize: '12px', padding: '7px 9px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <Button type="button" variant="secondary" onClick={() => setEditingRow(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary">
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL SECUNDARIO: RESOLUCIÓN DE DISCREPANCIA (4 OPCIONES) */}
        {discrepancyRow && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              zIndex: 10002,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '600px',
                backgroundColor: 'var(--color-bg-surface, #14161D)',
                border: '1px solid var(--color-gold, #D4AF37)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.95)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--color-gold, #D4AF37)' }}>
                  Resolución de Discrepancia — Fila #{discrepancyRow.rowNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setDiscrepancyRow(null)}
                  style={{ background: 'none', border: 'none', color: '#8A92A6', cursor: 'pointer', fontSize: '20px' }}
                >
                  ×
                </button>
              </div>

              {/* Comparativa */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '14px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Datos del Archivo Excel
                  </span>
                  <div style={{ fontWeight: 700, color: '#FFFFFF', marginTop: '4px', fontSize: '14px' }}>
                    {discrepancyRow.firstName} {discrepancyRow.lastName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    DNI: {discrepancyRow.documentNumber}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-gold)', textTransform: 'uppercase' }}>
                    Padrón Oficial (ApiPeruDev / RENIEC)
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--color-gold)', marginTop: '4px', fontSize: '14px' }}>
                    {discrepancyRow.verifiedName || 'No disponible'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Estado: {discrepancyRow.identityStatus}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                Seleccione la decisión administrativa para este registro antes de proceder con la importación:
              </p>

              {/* 4 Opciones de resolución */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleResolveDiscrepancy('USE_SOURCE')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(46, 204, 113, 0.3)',
                    backgroundColor: 'rgba(46, 204, 113, 0.08)',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <strong style={{ color: '#2ECC71', fontSize: '13px' }}>
                    1. Usar datos de la fuente oficial (ApiPeruDev / RENIEC)
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Actualiza automáticamente los nombres y apellidos de la fila con los obtenidos del padrón.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleResolveDiscrepancy('KEEP_EXCEL')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(243, 156, 18, 0.3)',
                    backgroundColor: 'rgba(243, 156, 18, 0.08)',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <strong style={{ color: '#F39C12', fontSize: '13px' }}>
                    2. Conservar datos del Excel y solicitar revisión manual
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Mantiene los nombres tal como figuran en el archivo Excel e incluye la marca de revisión en auditoría.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = discrepancyRow;
                    setDiscrepancyRow(null);
                    handleOpenEdit(target);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    backgroundColor: 'rgba(212, 175, 55, 0.08)',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <strong style={{ color: 'var(--color-gold)', fontSize: '13px' }}>
                    3. Editar manualmente
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Abre el formulario para ingresar correcciones personalizadas sobre nombres, DNI o fecha.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleResolveDiscrepancy('EXCLUDE')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    backgroundColor: 'rgba(231, 76, 60, 0.08)',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <strong style={{ color: '#E74C3C', fontSize: '13px' }}>
                    4. Excluir de la importación
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Descarta este socio para evitar inconsistencias en el padrón central.
                  </span>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button type="button" variant="secondary" onClick={() => setDiscrepancyRow(null)}>
                  Cerrar sin resolver
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
