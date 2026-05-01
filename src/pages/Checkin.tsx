import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

interface Prenotazione {
  id: string
  data_arrivo: string
  data_partenza: string
  camera_id: string
  cliente_id: string
  num_ospiti: number | null
  prezzo_totale: number | null
  camere: { nome: string }[] | null
  clienti: { nome: string; cognome: string }[] | null
}

const STEP = ['Prenotazione', 'Documenti', 'Pagamento', 'Conferma']

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatData(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function nomeCliente(p: Prenotazione): string {
  const c = Array.isArray(p.clienti) ? p.clienti[0] : p.clienti
  if (!c) return '—'
  return `${c.cognome} ${c.nome}`.trim()
}

function nomeCamera(p: Prenotazione): string {
  const cam = Array.isArray(p.camere) ? p.camere[0] : p.camere
  return cam?.nome ?? '—'
}

function ospiti(p: Prenotazione): string {
  const n = p.num_ospiti ?? 0
  if (n === 0) return '—'
  return `${n} ospite${n === 1 ? '' : 'i'}`
}

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px',
  borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px',
  fontFamily: 'sans-serif', boxSizing: 'border-box',
}

export default function Checkin() {
  const [strutturaId, setStrutturaId] = useState<string | null>(null)
  const [checkins, setCheckins] = useState<Prenotazione[]>([])
  const [checkouts, setCheckouts] = useState<Prenotazione[]>([])
  const [loading, setLoading] = useState(true)
  const [completati, setCompletati] = useState<Set<string>>(new Set())
  const [selezionato, setSelezionato] = useState<Prenotazione | null>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    nome: '', documento: "Carta d'identità", numero: '',
    nazionalita: 'Italiana', privacy: false, pagamento: 'Carta di credito', prezzo: 0,
  })
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    async function caricaDati() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: utenteData, error: errUtente } = await supabase
          .from('utenti')
          .select('struttura_id')
          .eq('id', user.id)
          .single()

        if (errUtente || !utenteData?.struttura_id) return
        const sid = utenteData.struttura_id
        setStrutturaId(sid)

        const oggi = localDateStr(new Date())
        console.log('[Checkin] data filtro:', oggi)

        const campi = 'id, data_arrivo, data_partenza, camera_id, cliente_id, num_ospiti, prezzo_totale, camere(nome), clienti(nome, cognome)'

        const [ciRes, coRes] = await Promise.all([
          supabase.from('prenotazioni').select(campi).eq('struttura_id', sid).neq('stato', 'cancellata').eq('data_arrivo', oggi),
          supabase.from('prenotazioni').select(campi).eq('struttura_id', sid).neq('stato', 'cancellata').eq('data_partenza', oggi),
        ])

        console.log('[Checkin] ciRes:', ciRes.data, ciRes.error)
        console.log('[Checkin] coRes:', coRes.data, coRes.error)

        if (ciRes.error) throw ciRes.error
        if (coRes.error) throw coRes.error

        setCheckins((ciRes.data ?? []) as Prenotazione[])
        setCheckouts((coRes.data ?? []) as Prenotazione[])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    caricaDati()
  }, [])

  function apriProcedura(p: Prenotazione) {
    setSelezionato(p)
    setStep(1)
    setErrore(null)
    setForm({
      nome: nomeCliente(p),
      documento: "Carta d'identità",
      numero: '',
      nazionalita: 'Italiana',
      privacy: false,
      pagamento: 'Carta di credito',
      prezzo: p.prezzo_totale ?? 0,
    })
  }

  function chiudi() {
    setSelezionato(null)
    setStep(0)
    setErrore(null)
  }

  async function completaCheckin() {
    if (!selezionato || !strutturaId) return
    setSalvando(true)
    setErrore(null)
    try {
      const payload = {
        prenotazione_id: selezionato.id,
        struttura_id: strutturaId,
        camera_id: selezionato.camera_id,
        cliente_id: selezionato.cliente_id,
        nome_intestatario: form.nome,
        tipo_documento: form.documento,
        numero_documento: form.numero,
        nazionalita: form.nazionalita,
        consenso_privacy: form.privacy,
        metodo_pagamento: form.pagamento,
        data_checkin: localDateStr(new Date()),
      }
      console.log('[Checkin] insert payload:', payload)
      const { error } = await supabase.from('checkin').insert(payload)
      console.log('[Checkin] insert error:', error)
      if (error) throw error

      if (form.prezzo !== (selezionato.prezzo_totale ?? 0)) {
        const { error: errPrezzo } = await supabase
          .from('prenotazioni')
          .update({ prezzo_totale: form.prezzo })
          .eq('id', selezionato.id)
        if (errPrezzo) throw errPrezzo
      }
      setCompletati(prev => new Set(prev).add(selezionato.id))
      setStep(3)
    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : 'Errore durante il salvataggio')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif', marginBottom: '1.5rem' }}>Check-in / Check-out</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Check-in oggi</div>
            {loading ? (
              <div style={{ fontSize: '13px', color: '#aaa' }}>Caricamento…</div>
            ) : checkins.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#aaa' }}>Nessun check-in previsto.</div>
            ) : checkins.map((p, i) => {
              const fatto = completati.has(p.id)
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < checkins.length - 1 ? '0.5px solid #f0ede6' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{nomeCliente(p)}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{nomeCamera(p)} · {formatData(p.data_arrivo)}–{formatData(p.data_partenza)} · {ospiti(p)}</div>
                  </div>
                  {fatto ? (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#E1F5EE', color: '#0F6E56', fontWeight: 500 }}>Completato</span>
                  ) : (
                    <button onClick={() => apriProcedura(p)} style={{ padding: '6px 12px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}>
                      Inizia →
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Check-out oggi</div>
            {loading ? (
              <div style={{ fontSize: '13px', color: '#aaa' }}>Caricamento…</div>
            ) : checkouts.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#aaa' }}>Nessun check-out previsto.</div>
            ) : checkouts.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < checkouts.length - 1 ? '0.5px solid #f0ede6' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{nomeCliente(p)}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{nomeCamera(p)} · {formatData(p.data_arrivo)}–{formatData(p.data_partenza)}</div>
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#E6F1FB', color: '#185FA5', fontWeight: 500 }}>Pronto</span>
              </div>
            ))}
          </div>
        </div>

        {selezionato && (
          <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Check-in — {nomeCliente(selezionato)}</div>
              <button onClick={chiudi} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>×</button>
            </div>

            <div style={{ display: 'flex', marginBottom: '1.25rem' }}>
              {STEP.map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 500,
                  background: i < step ? '#E1F5EE' : i === step ? '#FAEEDA' : '#f5f4f0',
                  color: i < step ? '#0F6E56' : i === step ? '#854F0B' : '#888',
                  borderRadius: i === 0 ? '8px 0 0 8px' : i === STEP.length - 1 ? '0 8px 8px 0' : '0',
                  border: '0.5px solid #e0ddd6',
                }}>{s}</div>
              ))}
            </div>

            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Nome intestatario</label>
                  <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Tipo documento</label>
                  <select value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} style={inputStyle}>
                    <option>Carta d'identità</option>
                    <option>Passaporto</option>
                    <option>Patente</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>N° documento</label>
                  <input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="Es. AY4521836" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Nazionalità</label>
                  <input value={form.nazionalita} onChange={e => setForm({ ...form, nazionalita: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="privacy" checked={form.privacy} onChange={e => setForm({ ...form, privacy: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                  <label htmlFor="privacy" style={{ fontSize: '12px', color: '#888' }}>Consenso privacy firmato e acquisito</label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Camera</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{nomeCamera(selezionato)}</div>
                </div>
                <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Periodo</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{formatData(selezionato.data_arrivo)} – {formatData(selezionato.data_partenza)}</div>
                </div>
                <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Importo (€)</div>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.prezzo}
                    onChange={e => setForm({ ...form, prezzo: Number(e.target.value) })}
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 500, fontFamily: 'sans-serif', padding: 0, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Metodo pagamento</div>
                  <select value={form.pagamento} onChange={e => setForm({ ...form, pagamento: e.target.value })}
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 500, fontFamily: 'sans-serif' }}>
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
                <div style={{ fontSize: '13px', color: '#888' }}>{nomeCliente(selezionato)} è stato registrato in {nomeCamera(selezionato)}</div>
              </div>
            )}

            {errore && (
              <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: '#FDECEA', color: '#B71C1C', fontSize: '12px' }}>
                {errore}
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {step > 1 && step < 3 && (
                <button onClick={() => setStep(step - 1)} style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}>
                  ← Indietro
                </button>
              )}
              {step === 1 && (
                <button onClick={() => setStep(2)} style={{ padding: '7px 14px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                  Avanti →
                </button>
              )}
              {step === 2 && (
                <button onClick={completaCheckin} disabled={salvando} style={{ padding: '7px 14px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? 'Salvataggio…' : 'Completa check-in'}
                </button>
              )}
              {step === 3 && (
                <button onClick={chiudi} style={{ padding: '7px 14px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                  Chiudi
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
