// ==============================================================================
// GYM VIP — Pantalla: AttendanceAgendaPage (Agenda y Calendario de Asistencias)
// Consulta administrativa, filtros combinados, auditoría de terminales y exportación CSV
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getAttendanceAgendaApi, exportAttendanceCsvApi } from '../api/attendanceApi.js';
import ReceptionTerminalModal from '../components/modals/ReceptionTerminalModal.jsx';
import OperationsNav from '../components/common/OperationsNav.jsx';
import { Button } from '../components/common/Button.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { Icon } from '../components/common/Icons.jsx';

function formatLimaTime(utcString) {
  if (!utcString) return '-';
  try {
    const iso = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
    const d = new Date(iso);
    return d.toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return utcString;
  }
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AttendanceAgendaPage({ onNavigate }) {
  const { token, user } = useAuth();

  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');
  const [method, setMethod] = useState('TODOS');
  const [status, setStatus] = useState('TODOS');
  const [page, setPage] = useState(0);

  const [agendaData, setAgendaData] = useState({
    items: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
  });

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [terminalModalOpen, setTerminalModalOpen] = useState(false);

  useEffect(() => {
    loadAgenda(0);
  }, [startDate, endDate, method, status]);

  async function loadAgenda(targetPage = 0) {
    setLoading(true);
    setError('');
    try {
      const data = await getAttendanceAgendaApi(
        {
          startDate,
          endDate,
          query: searchQuery,
          method,
          status,
          page: targetPage,
          size: 20,
        },
        token
      );
      setAgendaData(data);
      setPage(targetPage);
    } catch (err) {
      setError(err.message || 'Error al consultar la agenda de asistencias.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadAgenda(0);
  }

  async function handleExportCsv() {
    setExporting(true);
    setError('');
    try {
      const blob = await exportAttendanceCsvApi(
        {
          startDate,
          endDate,
          query: searchQuery,
          status,
        },
        token
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asistencias_gymvip_${startDate}_a_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Error al exportar el archivo CSV.');
    } finally {
      setExporting(false);
    }
  }

  // Métricas rápidas de los ítems en pantalla
  const items = agendaData.items || [];
  const totalRecorded = items.filter((i) => i.status === 'ATTENDANCE_RECORDED').length;
  const qrInvertedCount = items.filter((i) => i.checkInMethod === 'QR_INVERTIDO').length;

  return (
    <section className="page-section" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <OperationsNav currentPath="/asistencias" onNavigate={onNavigate} />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '20px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
            Agenda y Control de Asistencias
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Registro histórico, trazabilidad de accesos por terminal y flujo QR invertido.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={handleExportCsv}
            disabled={exporting || loading}
            title="Descargar reporte en formato CSV sanitizado"
          >
            <Icon name="download" size={15} />
            <span>{exporting ? 'Generando CSV...' : 'Exportar CSV'}</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setTerminalModalOpen(true)}
            title="Abrir pantalla de recepción con código QR giratorio"
          >
            <Icon name="qr-code" size={15} />
            <span>Terminal Mostrador (QR)</span>
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <Alert type="danger" message={error} />
        </div>
      )}

      {/* Tarjetas KPI */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Total Registros (Página)
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            {items.length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            {agendaData.totalElements} total en periodo
          </span>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '12px', color: '#2ECC71', textTransform: 'uppercase' }}>
            Ingresos Aprobados
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2ECC71', marginTop: '4px' }}>
            {totalRecorded}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Asistencias efectivas
          </span>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-gold)', textTransform: 'uppercase' }}>
            Vía QR Invertido
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-gold)', marginTop: '4px' }}>
            {qrInvertedCount}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Escaneados desde App Móvil
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: '18px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                DESDE (FECHA)
              </label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                HASTA (FECHA)
              </label>
              <input
                type="date"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                MÉTODO DE INGRESO
              </label>
              <select
                className="input-field"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
              >
                <option value="TODOS">Todos los métodos</option>
                <option value="QR_INVERTIDO">QR Invertido (App Móvil)</option>
                <option value="QR_SOCIO">QR de Socio (Lector USB)</option>
                <option value="MANUAL_MOSTRADOR">Manual en Mostrador</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                ESTADO
              </label>
              <select
                className="input-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ATTENDANCE_RECORDED">Ingreso Aprobado</option>
                <option value="ALREADY_REGISTERED">Ya asistió hoy</option>
                <option value="COVERAGE_EXPIRED">Membresía Vencida</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por nombre, DNI o código de socio (MAR-...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '9px 12px', fontSize: '13px' }}
            />
            <Button variant="primary" type="submit" disabled={loading}>
              <Icon name="search" size={15} />
              <span>Buscar</span>
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setStartDate(getTodayString());
                setEndDate(getTodayString());
                setSearchQuery('');
                setMethod('TODOS');
                setStatus('TODOS');
              }}
            >
              <span>Limpiar</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Tabla de Asistencias */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Registros Encontrados
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Página {agendaData.currentPage + 1} de {agendaData.totalPages || 1}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Consultando agenda de asistencias...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No se encontraron asistencias para el periodo y filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>Fecha</th>
                  <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>Hora (Lima)</th>
                  <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>Socio</th>
                  <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>DNI / Doc</th>
                  <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>Método</th>
                  <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>Terminal / Operador</th>
                  <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.attendanceDate}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-text-secondary)' }}>
                      {formatLimaTime(item.checkedAtUtc)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.memberName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-gold)', fontFamily: 'monospace' }}>{item.memberCode}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                      {item.documentNumber || '-'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          backgroundColor:
                            item.checkInMethod === 'QR_INVERTIDO'
                              ? 'rgba(212, 175, 55, 0.15)'
                              : 'rgba(255, 255, 255, 0.08)',
                          color:
                            item.checkInMethod === 'QR_INVERTIDO'
                              ? 'var(--color-gold)'
                              : 'var(--color-text-secondary)',
                        }}
                      >
                        {item.checkInMethod === 'QR_INVERTIDO'
                          ? 'QR Pantalla (Móvil)'
                          : item.checkInMethod === 'QR_SOCIO'
                          ? 'QR Socio'
                          : 'Manual'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                      <div style={{ color: 'var(--color-text-primary)' }}>{item.terminalName || 'Recepción'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Op: {item.recordedBy || 'Sistema'}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          backgroundColor:
                            item.status === 'ATTENDANCE_RECORDED'
                              ? 'rgba(46, 204, 113, 0.2)'
                              : item.status === 'ALREADY_REGISTERED'
                              ? 'rgba(212, 175, 55, 0.2)'
                              : 'rgba(231, 76, 60, 0.2)',
                          color:
                            item.status === 'ATTENDANCE_RECORDED'
                              ? '#2ECC71'
                              : item.status === 'ALREADY_REGISTERED'
                              ? '#D4AF37'
                              : '#E74C3C',
                        }}
                      >
                        {item.status === 'ATTENDANCE_RECORDED'
                          ? 'APROBADO'
                          : item.status === 'ALREADY_REGISTERED'
                          ? 'YA ASISTIÓ'
                          : 'RECHAZADO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {agendaData.totalPages > 1 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <Button
              variant="secondary"
              disabled={page <= 0 || loading}
              onClick={() => loadAgenda(page - 1)}
            >
              <span>Anterior</span>
            </Button>
            <Button
              variant="secondary"
              disabled={page >= agendaData.totalPages - 1 || loading}
              onClick={() => loadAgenda(page + 1)}
            >
              <span>Siguiente</span>
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Terminal Mostrador */}
      <ReceptionTerminalModal
        isOpen={terminalModalOpen}
        onClose={() => setTerminalModalOpen(false)}
        token={token}
        user={user}
        onNavigateAgenda={() => setTerminalModalOpen(false)}
      />
    </section>
  );
}
