// ==============================================================================
// GYM VIP — Pantalla: DataImportPage (Centro de Importación y Migración Masiva Integral)
// Wizard de 9 pasos: Selección, Lectura, Mapeo, Validación, Previsualización,
// Resolución de discrepancias, Confirmación, Ejecución transaccional y Resultados (Fase 5)
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  downloadDataImportTemplate,
  previewDataImportApi,
  confirmDataImportApi,
  getDataImportHistoryApi,
} from '../../api/dataImportApi';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Icon } from '../../components/common/Icons';

export default function DataImportPage({ onNavigate }) {
  const { token } = useAuth();

  // Vista activa: 'wizard' | 'history'
  const [activeTab, setActiveTab] = useState('wizard');

  // Estado del Wizard de 9 pasos (1 a 9)
  const [currentStep, setCurrentStep] = useState(1);

  // Archivo y carga
  const [selectedFile, setSelectedFile] = useState(null);
  const [importMode, setImportMode] = useState('CREATE_UPDATE'); // 'CREATE_UPDATE' | 'CREATE_ONLY' | 'DRY_RUN'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Datos analizados de vista previa
  const [previewData, setPreviewData] = useState(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');

  // Decisiones de exclusión de filas (Paso 6: Resolución)
  // Formato: [{ sheetName, rowNumber, action: 'EXCLUDE' }]
  const [rowDecisions, setRowDecisions] = useState([]);

  // Resultado de confirmación
  const [importResult, setImportResult] = useState(null);

  // Historial
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Descargar plantilla
  const handleDownloadTemplate = async (type) => {
    try {
      setError('');
      const blob = await downloadDataImportTemplate(type, token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GYMVIP_Plantilla_${type.toUpperCase()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccessMsg(`Plantilla ${type.toUpperCase()} descargada correctamente.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (e) {
      setError(e.message || 'Error al descargar plantilla');
    }
  };

  // Manejo de archivo seleccionado
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setPreviewData(null);
      setRowDecisions([]);
      setCurrentStep(2); // Avanzar a Lectura
    }
  };

  // Ejecutar Análisis y Previsualización (Pasos 2, 3, 4, 5)
  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    try {
      const data = await previewDataImportApi(selectedFile, token);
      setPreviewData(data);
      if (data.sheetSummaries && data.sheetSummaries.length > 0) {
        setSelectedSheetName(data.sheetSummaries[0].sheetName);
      }
      setCurrentStep(5); // Ir a Previsualización
    } catch (err) {
      setError(err.message || 'Error al analizar el archivo Excel.');
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && selectedFile) {
      handleAnalyzeFile();
    }
  }, [currentStep, selectedFile]);

  // Excluir / Incluir una fila en la resolución
  const toggleRowExclusion = (sheetName, rowNumber) => {
    setRowDecisions((prev) => {
      const exists = prev.find((d) => d.sheetName === sheetName && d.rowNumber === rowNumber);
      if (exists) {
        return prev.filter((d) => !(d.sheetName === sheetName && d.rowNumber === rowNumber));
      } else {
        return [...prev, { sheetName, rowNumber, action: 'EXCLUDE' }];
      }
    });
  };

  const isRowExcluded = (sheetName, rowNumber) => {
    return rowDecisions.some((d) => d.sheetName === sheetName && d.rowNumber === rowNumber && d.action === 'EXCLUDE');
  };

  // Ejecución transaccional (Paso 7 & 8)
  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setCurrentStep(8); // Modo Ejecución
    try {
      const res = await confirmDataImportApi(selectedFile, importMode, rowDecisions, token);
      setImportResult(res);
      setCurrentStep(9); // Modo Resultados
      setSuccessMsg('¡Migración masiva de datos completada exitosamente!');
    } catch (err) {
      setError(err.message || 'Fallo durante la persistencia en base de datos.');
      setCurrentStep(6); // Regresar a resolución
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial
  const loadHistory = useCallback(async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const items = await getDataImportHistoryApi(token);
      setHistoryItems(items || []);
    } catch {
      setHistoryItems([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const resetWizard = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setRowDecisions([]);
    setImportResult(null);
    setError('');
    setCurrentStep(1);
  };

  return (
    <div className="data-import-page" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Cabecera Principal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-gold)' }}>
              CONFIGURACIÓN · MIGRACIÓN Y CARGA
            </span>
            <Badge variant="gold" style={{ fontSize: '10px' }}>
              EXCLUSIVO ADMIN
            </Badge>
          </div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              margin: '0 0 6px 0',
              color: 'var(--color-text-primary)',
            }}
          >
            Centro de Importación y Migración Masiva de Datos
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            Carga y sincronización integral de socios, membresías, catálogo, pagos y asistencias desde plantillas Excel oficiales.
          </p>
        </div>

        {/* Pestañas de modo */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'wizard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('wizard')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="download" size={15} />
            <span>Asistente de Carga</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="calendar" size={15} />
            <span>Historial y Auditoría</span>
          </button>
        </div>
      </div>

      {successMsg && <Alert variant="success" message={successMsg} autoClose onClose={() => setSuccessMsg('')} />}
      {error && <Alert variant="danger" title="Error en el Asistente de Importación" message={error} onClose={() => setError('')} />}

      {activeTab === 'wizard' && (
        <>
          {/* Barra de Progreso del Wizard (9 Pasos) */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-panel)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                overflowX: 'auto',
                gap: '8px',
                paddingBottom: '4px',
              }}
            >
              {[
                { step: 1, title: '1. Selección' },
                { step: 2, title: '2. Lectura' },
                { step: 3, title: '3. Mapeo' },
                { step: 4, title: '4. Validación' },
                { step: 5, title: '5. Previa' },
                { step: 6, title: '6. Resolución' },
                { step: 7, title: '7. Confirmación' },
                { step: 8, title: '8. Ejecución' },
                { step: 9, title: '9. Resultados' },
              ].map((s) => {
                const isCurrent = currentStep === s.step;
                const isCompleted = currentStep > s.step;
                return (
                  <div
                    key={s.step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: isCurrent || isCompleted ? 1 : 0.45,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isCurrent ? 'var(--color-gold)' : isCompleted ? '#10B981' : 'var(--color-surface)',
                        color: isCurrent ? '#000' : '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isCompleted ? '✓' : s.step}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PASO 1: SELECCIÓN Y DESCARGA DE PLANTILLAS */}
          {currentStep === 1 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '20px',
              }}
            >
              {/* Tarjeta 1: Descargar Plantillas Oficiales */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-panel)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Icon name="download" size={20} color="var(--color-gold)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Descarga de Plantillas Oficiales</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
                  Selecciona la variante requerida. Todas las plantillas incluyen hojas de instrucciones, catálogos válidos y diccionario de campos:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>Plantilla Vacía Oficial</strong>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Para importación limpia de nuevos clientes reales</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadTemplate('empty')}
                    >
                      Descargar .xlsx
                    </button>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>Datos Demo Sintéticos</strong>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Entorno de prueba con socios, planes y suplementos ficticios</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadTemplate('demo')}
                    >
                      Descargar .xlsx
                    </button>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>Ejemplo Integral Guiado</strong>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Explicación paso a paso de relaciones y claves foráneas</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadTemplate('example')}
                    >
                      Descargar .xlsx
                    </button>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Cargar Archivo Excel */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-panel)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <Icon name="package" size={20} color="var(--color-gold)" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Cargar Archivo de Migración</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
                    Sube el archivo Excel (.xlsx) o CSV completado. El asistente validará formatos, duplicados y claves foráneas de forma segura (Dry Run):
                  </p>

                  <div
                    style={{
                      border: '2px dashed var(--color-border)',
                      borderRadius: '8px',
                      padding: '30px 20px',
                      textAlign: 'center',
                      backgroundColor: 'var(--color-surface)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <Icon name="download" size={32} color="var(--color-gold)" />
                    <p style={{ margin: '10px 0 4px 0', fontSize: '14px', fontWeight: 600 }}>
                      Arrastra tu archivo aquí o haz clic para examinar
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Formatos compatibles: .xlsx (multientidad) o .csv · Máx 15 MB
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={handleFileChange}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '20px',
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <strong style={{ color: 'var(--color-gold)' }}>Garantía de Seguridad Operativa:</strong> Las contraseñas no se importan en texto plano, las pasarelas de pago no emiten cobros reales y no se envían mensajes masivos no autorizados.
                </div>
              </div>
            </div>
          )}

          {/* PASO 2 a 4: LECTURA Y VALIDACIÓN EN PROCESO */}
          {loading && currentStep < 7 && (
            <div
              style={{
                backgroundColor: 'var(--color-surface-panel)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'inline-block', marginBottom: '14px' }}>
                <Icon name="activity" size={32} color="var(--color-gold)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>
                Analizando Estructura y Dependencias...
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Comprobando tipos de datos, unicidad de documentos y relaciones cruzadas entre hojas.
              </p>
            </div>
          )}

          {/* PASO 5 & 6: PREVISUALIZACIÓN Y RESOLUCIÓN DE DISCREPANCIAS */}
          {!loading && previewData && (currentStep === 5 || currentStep === 6) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Resumen Global del Archivo */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-panel)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '14px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Archivo Analizado</span>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--color-text-primary)' }}>
                    {previewData.filename}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Total Registros</span>
                  <strong style={{ fontSize: '20px', display: 'block', color: 'var(--color-gold)' }}>
                    {previewData.totalRecords}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Filas Válidas</span>
                  <strong style={{ fontSize: '20px', display: 'block', color: '#10B981' }}>
                    {previewData.validRecords}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Filas con Observaciones</span>
                  <strong style={{ fontSize: '20px', display: 'block', color: previewData.invalidRecords > 0 ? '#EF4444' : '#64748B' }}>
                    {previewData.invalidRecords}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Estado Dry Run</span>
                  <div style={{ marginTop: '4px' }}>
                    <Badge variant={previewData.invalidRecords === 0 ? 'success' : 'warning'}>
                      {previewData.invalidRecords === 0 ? 'LISTO PARA IMPORTAR' : 'REQUIERE REVISIÓN'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Alertas de Dependencias si existen */}
              {previewData.dependencyIssues && previewData.dependencyIssues.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                  }}
                >
                  <strong style={{ color: '#EF4444', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                    Advertencias de Integridad Referencial ({previewData.dependencyIssues.length}):
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {previewData.dependencyIssues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Selector de Hojas Detectadas */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '10px',
                }}
              >
                {previewData.sheetSummaries.map((s) => {
                  const isSelected = selectedSheetName === s.sheetName;
                  return (
                    <button
                      key={s.sheetName}
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSelectedSheetName(s.sheetName)}
                      style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                    >
                      <span>{s.sheetName}</span>
                      <span
                        style={{
                          marginLeft: '6px',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(0,0,0,0.3)' : 'rgba(212,175,55,0.2)',
                          fontSize: '10px',
                        }}
                      >
                        {s.totalRows}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tabla de Muestra de Filas y Acciones de Resolución */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-panel)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                    Muestra de Registros: {selectedSheetName}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {currentStep === 6 ? 'Paso 6: Puedes excluir filas que presenten errores' : 'Paso 5: Previsualización de datos'}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Identificador</th>
                        <th>Estado</th>
                        <th>Observaciones</th>
                        <th style={{ textAlign: 'center' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(previewData.sampleRowsBySheet?.[selectedSheetName] || []).map((row) => {
                        const excluded = isRowExcluded(selectedSheetName, row.rowNumber);
                        return (
                          <tr
                            key={row.rowNumber}
                            style={{
                              opacity: excluded ? 0.45 : 1,
                              backgroundColor: excluded ? 'rgba(239,68,68,0.05)' : 'transparent',
                            }}
                          >
                            <td style={{ fontWeight: 700 }}>#{row.rowNumber}</td>
                            <td style={{ fontFamily: 'monospace' }}>{row.entityCode || '—'}</td>
                            <td>
                              <Badge
                                variant={
                                  row.status === 'VALID'
                                    ? 'success'
                                    : row.status === 'DUPLICATE'
                                    ? 'neutral'
                                    : 'danger'
                                }
                              >
                                {row.status}
                              </Badge>
                            </td>
                            <td>
                              {row.issues && row.issues.length > 0 ? (
                                <span style={{ color: '#EF4444' }}>{row.issues.join('; ')}</span>
                              ) : (
                                <span style={{ color: '#10B981' }}>Datos conformes</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className={`btn btn-sm ${excluded ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => toggleRowExclusion(selectedSheetName, row.rowNumber)}
                                style={{ fontSize: '11px', padding: '2px 8px' }}
                              >
                                {excluded ? 'Restaurar Fila' : 'Excluir Fila'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Barra de Navegación del Asistente */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={resetWizard}>
                    Cancelar y Cambiar Archivo
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {currentStep === 5 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setCurrentStep(6)}
                      >
                        Revisar y Resolver Discrepancias
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setCurrentStep(7)}
                    >
                      Proceder a Confirmación Final →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 7: CONFIRMACIÓN FINAL ANTES DE ESCRIBIR */}
          {currentStep === 7 && (
            <div
              style={{
                backgroundColor: 'var(--color-surface-panel)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                maxWidth: '680px',
                margin: '0 auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Icon name="shield-check" size={24} color="var(--color-gold)" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  Paso 7: Confirmación de Migración Transaccional
                </h3>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
                Estás a punto de escribir los datos validados en la base de datos de GYM VIP. Por favor verifica las siguientes opciones de ejecución:
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Modalidad de Importación:
                </label>
                <select
                  className="form-control"
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value)}
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  <option value="CREATE_UPDATE">Crear registros nuevos y omitir duplicados existentes (Recomendado)</option>
                  <option value="CREATE_ONLY">Solo crear nuevos registros (detener ante duplicados)</option>
                  <option value="DRY_RUN">Simulación completa sin persistir datos (Prueba técnica)</option>
                </select>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '20px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Total registros a procesar:</span>
                  <strong style={{ color: 'var(--color-gold)' }}>{previewData?.totalRecords || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Filas excluidas voluntariamente:</span>
                  <strong>{rowDecisions.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Política transaccional:</span>
                  <strong style={{ color: '#10B981' }}>ATÓMICA CON REGISTRO DE AUDITORÍA</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(5)}>
                  ← Regresar a Previa
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleConfirmImport}
                  disabled={loading}
                >
                  Confirmar y Ejecutar Migración
                </button>
              </div>
            </div>
          )}

          {/* PASO 8: EJECUCIÓN EN PROCESO */}
          {currentStep === 8 && (
            <div
              style={{
                backgroundColor: 'var(--color-surface-panel)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <Icon name="activity" size={36} color="var(--color-gold)" />
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '14px 0 8px 0' }}>
                Persistiendo Datos en PostgreSQL...
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Insertando entidades en orden estricto de dependencias y registrando evento de auditoría.
              </p>
            </div>
          )}

          {/* PASO 9: RESULTADOS Y TRAZABILIDAD */}
          {currentStep === 9 && importResult && (
            <div
              style={{
                backgroundColor: 'var(--color-surface-panel)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 800,
                  }}
                >
                  ✓
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    Migración Masiva Ejecutada con Éxito
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    Identificador de Proceso: {importResult.importId} · Duración: {importResult.durationMs} ms
                  </span>
                </div>
              </div>

              {/* Contadores por Entidad */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                {Object.entries(importResult.insertedByEntity || {}).map(([entity, count]) => (
                  <div
                    key={entity}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{entity}</span>
                    <strong style={{ fontSize: '20px', display: 'block', color: 'var(--color-gold)' }}>
                      +{count}
                    </strong>
                  </div>
                ))}
              </div>

              {/* Logs de Ejecución */}
              <div
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#10B981',
                  marginBottom: '20px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                {(importResult.executionLogs || []).map((log, idx) => (
                  <div key={idx}>[LOG] {log}</div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={resetWizard}>
                  Realizar Otra Importación
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate && onNavigate('clients')}
                  >
                    Ver Directorio de Miembros →
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onNavigate && onNavigate('home')}
                  >
                    Ir al Dashboard Principal →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* PESTAÑA HISTORIAL Y AUDITORÍA */}
      {activeTab === 'history' && (
        <div
          style={{
            backgroundColor: 'var(--color-surface-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Registro de Auditoría de Cargas Masivas
            </h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadHistory}
              disabled={loadingHistory}
            >
              Refrescar Auditoría
            </button>
          </div>

          {loadingHistory && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Cargando eventos de auditoría...</p>}

          {!loadingHistory && historyItems.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              No se registran eventos de importación masiva en el historial reciente.
            </p>
          )}

          {!loadingHistory && historyItems.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Fecha / Hora (America/Lima)</th>
                    <th>Responsable</th>
                    <th>Archivo</th>
                    <th>Estado</th>
                    <th>Detalle de Operación</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.timestamp}</td>
                      <td>{item.actor}</td>
                      <td style={{ fontFamily: 'monospace' }}>{item.filename}</td>
                      <td>
                        <Badge variant="success">{item.status}</Badge>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{item.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
