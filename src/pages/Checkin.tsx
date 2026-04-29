import { useState } from 'react'
import Layout from '../components/Layout'

interface Ospite {
  id: number
  nome: string
  camera: string
  dal: string
  al: string
  ospiti: string
  tipo: 'checkin' | 'checkout'
  stato: 'atteso' | 'completato'
}

const MOVIMENTI: Ospite[] = [
  { id: 1, nome: 'Famiglia Rossi', camera: 'Camera Marina', dal: '16 apr', al: '21 apr', ospiti: '2 adulti, 1 bambino', tipo: 'checkin', stato: 'atteso' },
  { id: 2, nome: 'Klaus Müller', camera: 'Camera Levante', dal: '16 apr', al: '20 apr', ospiti: '1 adulto', tipo: 'checkin', stato: 'atteso' },
  { id: 3, nome: 'Sarah Lee', camera: 'Camera Tramonto', dal: '13 apr', al: '16 apr', ospiti: '1 adulto', tipo: 'checkout', stato: 'atteso' },
]

const STEP = ['Prenotazione', 'Documenti', 'Pagamento', 'Conferma']

export default function Checkin() {
  const [selezionato, setSelezionato] = useState<Ospite | null>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ nome: '', documento: 'Carta d\'identità', numero: '', nazionalita: '', privacy: false })

  function apriProcedura(ospite: Ospite) {
    setSelezionato(ospite)
    setStep(1)
    setForm({ nome: ospite.nome, documento: 'Carta d\'identità', numero: '', nazionalita: 'Italiana', privacy: false })
  }

  function chiudi() {
    setSelezionato(null)
    setStep(0)
  }

  const checkins = MOVIMENTI.filter(m => m.tipo === 'checkin')
  const checkouts = MOVIMENTI.filter(m => m.tipo === 'checkout')

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif', marginBottom: '1.5rem' }}>Check-in / Check-out</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Check-in oggi</div>
            {checkins.map(o => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '0.5px solid #f0ede6' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{o.nome}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{o.camera} · {o.dal}–{o.al} · {o.ospiti}</div>
                </div>
                <button
                  onClick={() => apriProcedura(o)}
                  style={{ padding: '6px 12px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                >Inizia →</button>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Check-out oggi</div>
            {checkouts.map(o => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{o.nome}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{o.camera} · {o.dal}–{o.al}</div>
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#E6F1FB', color: '#185FA5', fontWeight: 500 }}>Pronto</span>
              </div>
            ))}
          </div>
        </div>

        {selezionato && (
          <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Check-in — {selezionato.nome}</div>
              <button onClick={chiudi} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>×</button>
            </div>

            <div style={{ display: 'flex', marginBottom: '1.25rem' }}>
              {STEP.map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 500,
                  background: i < step ? '#E1F5EE' : i === step ? '#FAEEDA' : '#f5f4f0',
                  color: i < step ? '#0F6E56' : i === step ? '#854F0B' : '#888',
                  borderRadius: i === 0 ? '8px 0 0 8px' : i === STEP.length - 1 ? '0 8px 8px 0' : '0',
                  border: '0.5px solid #e0ddd6'
                }}>{s}</div>
              ))}
            </div>

            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Nome intestatario</label>
                  <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                    style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Tipo documento</label>
                  <select value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })}
                    style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif' }}>
                    <option>Carta d'identità</option>
                    <option>Passaporto</option>
                    <option>Patente</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>N° documento</label>
                  <input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })}
                    placeholder="Es. AY4521836"
                    style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Nazionalità</label>
                  <input value={form.nazionalita} onChange={e => setForm({ ...form, nazionalita: e.target.value })}
                    style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif' }} />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="privacy" checked={form.privacy} onChange={e => setForm({ ...form, privacy: e.target.checked })}
                    style={{ width: '16px', height: '16px' }} />
                  <label htmlFor="privacy" style={{ fontSize: '12px', color: '#888' }}>Consenso privacy firmato e acquisito</label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Camera</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selezionato.camera}</div>
                </div>
                <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Periodo</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selezionato.dal} – {selezionato.al}</div>
                </div>
                <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Importo</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>€ 600,00</div>
                </div>
                <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Metodo pagamento</div>
                  <select style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 500, fontFamily: 'sans-serif' }}>
                    <option>Carta di credito</option>
                    <option>Contanti</option>
                    <option>Bonifico</option>
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
                <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>Check-in completato!</div>
                <div style={{ fontSize: '13px', color: '#888' }}>{selezionato.nome} è stato registrato in {selezionato.camera}</div>
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {step > 1 && step < 3 && (
                <button onClick={() => setStep(step - 1)} style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}>← Indietro</button>
              )}
              {step < 3 && (
                <button onClick={() => setStep(step + 1)} style={{ padding: '7px 14px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                  {step === 2 ? 'Completa check-in' : 'Avanti →'}
                </button>
              )}
              {step === 3 && (
                <button onClick={chiudi} style={{ padding: '7px 14px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}>Chiudi</button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}