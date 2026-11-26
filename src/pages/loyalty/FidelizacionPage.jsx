// ==============================================================================
// GYM VIP — Pantalla: FidelizacionPage (Puntos y Beneficios Opt-in EMP-13)
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { searchClientsApi } from '../../api/clientApi';
import { getLoyaltyBalanceApi, toggleLoyaltyOptInApi, recordLoyaltyPointsApi } from '../../api/enterpriseOpsApi';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export default function FidelizacionPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [pointsDelta, setPointsDelta] = useState(50);
  const [reason, setReason] = useState('Bono por renovación puntual');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await searchClientsApi(query, 0, 10, token);
      setClients(Array.isArray(res?.content) ? res.content : []);
    } catch (err) {
      setError(err.message);
    }
  };

  const selectClient = async (client) => {
    setSelected(client);
    setError('');
    try {
      setLoyalty(await getLoyaltyBalanceApi(client.id, token));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gap: '18px' }}>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        Programa voluntario (opt-in) de puntos por asistencias, renovaciones y compras sin cobros ni afectación a socios no inscritos.
      </p>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}

      <form className="card" onSubmit={handleSearch} style={{ padding: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ flex: 1, minWidth: '220px' }} placeholder="Buscar socio por nombre o DNI…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button type="submit" variant="primary">Buscar Socio</Button>
      </form>

      {clients.length > 0 && (
        <div className="card" style={{ padding: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {clients.map((c) => (
            <Button key={c.id} variant={selected?.id === c.id ? 'primary' : 'secondary'} onClick={() => selectClient(c)}>
              {c.firstName} {c.lastName} ({c.documentNumber})
            </Button>
          ))}
        </div>
      )}

      {selected && loyalty && (
        <div className="card" style={{ padding: '20px', display: 'grid', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>{selected.firstName} {selected.lastName}</h2>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Saldo actual: <strong style={{ color: 'var(--color-gold)' }}>{loyalty.pointsBalance ?? loyalty.points_balance ?? 0} pts</strong> · Nivel <Badge variant="gold">{loyalty.tierLevel ?? loyalty.tier_level ?? 'BRONCE'}</Badge>
              </span>
            </div>
            <Button
              variant={loyalty.enrolled ? 'secondary' : 'primary'}
              onClick={async () => {
                try {
                  const next = await toggleLoyaltyOptInApi(selected.id, !loyalty.enrolled, token);
                  setLoyalty({ ...loyalty, enrolled: next.enrolled });
                  setNotice(next.enrolled ? 'Socio inscrito voluntariamente al programa.' : 'Programa desactivado para este socio.');
                } catch (err) {
                  setError(err.message);
                }
              }}
            >
              {loyalty.enrolled ? 'Desactivar Opt-in' : 'Activar Programa Opt-in'}
            </Button>
          </div>

          {loyalty.enrolled && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="number" className="form-input" style={{ width: '130px' }} value={pointsDelta} onChange={(e) => setPointsDelta(Number(e.target.value) || 0)} />
              <input className="form-input" style={{ flex: 1, minWidth: '220px' }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo" />
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    const updated = await recordLoyaltyPointsApi(selected.id, pointsDelta, reason, token);
                    setLoyalty({ ...loyalty, pointsBalance: updated.pointsBalance, tierLevel: updated.tierLevel });
                    setNotice('Puntos registrados correctamente.');
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                Aplicar Puntos
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
