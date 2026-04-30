import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

interface Camera {
  id: string
  nome: string
  prezzo_notte: number
}

interface Cliente {
  id: string
  nome: string
  cognome: string
}

interface Prenotazione {
  id: string
  struttura_id: string
  camera_id: string
  cliente_id: string
  data_arrivo: string
  data_partenza: string
  num_ospiti: number
  prezzo_totale: number
  stato: string
  note: string | null
  canale: string | null
  camere: { nome: string } | null
  clienti: { nome: string; cognome: string } | null
}

const STATI = ['confermata', 'in_corso', 'in_arrivo', 'check_out', 'cancellata']
const CANALI = ['Diretto', 'Booking.com', 'Airbnb', 'Expedia', 'Telefono', 'Email', 'Altro']
const FORM_VUOTO = {
  camera_id: '', cliente_id: '', data_arrivo: '', data_partenza: '',
  num_ospiti: 1, prezzo_totale: 0, stato: 'confermata', note: '', canale: 'Diretto',
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getGiorni(start: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return localDateStr(d)
  })
}

function formatData(dateStr: string): string {
  if (!dateStr) return '—'
  const [y, m, day] = dateStr.split('-')
  const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
  return `${Number(day)} ${mesi[Number(m) - 1]} ${y}`
}

function statoColori(stato: string): { bg: string; text: string } {
  if (stato === 'in_corso') return { bg: '#E1F5EE', text: '#0F6E56' }
  if (stato === 'in_arrivo') return { bg: '#E6F1FB', text: '#185FA5' }
  if (stato === 'cancellata') return { bg: '#FEE2E2', text: '#991B1B' }
  return { bg: '#FAEEDA', text: '#854F0B' }
}

function RigaCamera({ camera, giorni, prenotazioni, selezionata, onSeleziona }: {
  camera: Camera
  giorni: string[]
  prenotazioni: Prenotazione[]
  selezionata: string | null
  onSeleziona: (id: string | null) => void
}) {
  return (
    <>
      <div style={{ fontSize: '12px', fontWeight: 500, color: '#666', display: 'flex', alignItems: 'center', padding: '4px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {camera.nome}
      </div>
      {giorni.map(giorno => {
        const pren = prenotazioni.find(p =>
          p.camera_id === camera.id &&
          giorno >= p.data_arrivo &&
          giorno < p.data_partenza
        )
        const inizio = pren ? giorno === pren.data_arrivo : false
        const colors = pren ? statoColori(pren.stato) : null

        if (pren && inizio) {
          return (
            <div
              key={giorno}
              onClick={() => onSeleziona(pren.id === selezionata ? null : pren.id)}
              style={{
                height: '36px', background: colors!.bg, borderRadius: '4px 0 0 4px',
                display: 'flex', alignItems: 'center', paddingLeft: '8px',
                fontSize: '11px', fontWeight: 500, color: colors!.text,
                cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
                outline: pren.id === selezionata ? `2px solid ${colors!.text}` : 'none',
                outlineOffset: '-1px',
              }}
            >
              {pren.clienti ? pren.clienti.cognome : '—'}
            </div>
          )
        }
        if (pren && !inizio) {
          return <div key={giorno} style={{ height: '36px', background: colors!.bg }} />
        }
        return <div key={giorno} style={{ height: '36px', borderRadius: '3px', background: '#f5f4f0' }} />
      })}
    </>
  )
}


export default function Prenotazioni() {
  const [camere, setCamere] = useState<Camera[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([])
  const [struttura_id, setStrutturaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)
  const [selezionata, setSelezionata] = useState<string | null>(null)

  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  const [mostraForm, setMostraForm] = useState(false)
  const [idInModifica, setIdInModifica] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VUOTO)
  const [salvando, setSalvando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [erroreForm, setErroreForm] = useState<string | null>(null)
  const skipPriceCalc = useRef(false)

  useEffect(() => { caricaDati() }, [])

  useEffect(() => {
    if (skipPriceCalc.current) { skipPriceCalc.current = false; return }
    if (!form.camera_id || !form.data_arrivo || !form.data_partenza) return
    const camera = camere.find(c => c.id === form.camera_id)
    if (!camera) return
    const notti = Math.round((new Date(form.data_partenza).getTime() - new Date(form.data_arrivo).getTime()) / 86400000)
    if (notti > 0) setForm(prev => ({ ...prev, prezzo_totale: camera.prezzo_notte * notti }))
  }, [form.camera_id, form.data_arrivo, form.data_partenza, camere])

  async function caricaDati() {
    setLoading(true)
    setErrore(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: utenteData, error: errUtente } = await supabase
        .from('utenti')
        .select('struttura_id')
        .eq('id', user.id)
        .single()

      if (errUtente) throw errUtente
      if (!utenteData?.struttura_id) return

      const sid = utenteData.struttura_id
      setStrutturaId(sid)

      const [camereRes, clientiRes, prenotazioniRes] = await Promise.all([
        supabase.from('camere').select('id, nome, prezzo_notte').eq('struttura_id', sid).eq('attiva', true).order('nome'),
        supabase.from('clienti').select('id, nome, cognome').eq('struttura_id', sid).order('cognome'),
        supabase.from('prenotazioni').select('*, camere(nome), clienti(nome, cognome)').eq('struttura_id', sid).order('data_arrivo'),
      ])

      if (camereRes.error) throw camereRes.error
      if (clientiRes.error) throw clientiRes.error
      if (prenotazioniRes.error) throw prenotazioniRes.error

      setCamere(camereRes.data ?? [])
      setClienti(clientiRes.data ?? [])
      setPrenotazioni(prenotazioniRes.data ?? [])
    } catch (e: unknown) {
      setErrore((e as Error).message ?? 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }

  async function salvaPrenotazione() {
    if (!struttura_id) return
    setSalvando(true)
    setErroreForm(null)
    try {
      const payload = {
        ...form,
        num_ospiti: Number(form.num_ospiti),
        prezzo_totale: Number(form.prezzo_totale),
      }

      if (idInModifica) {
        const { data, error } = await supabase
          .from('prenotazioni')
          .update(payload)
          .eq('id', idInModifica)
          .select('*, camere(nome), clienti(nome, cognome)')
          .single()
        if (error) throw error
        setPrenotazioni(prev => prev.map(p => p.id === idInModifica ? data as Prenotazione : p))
        setSelezionata(idInModifica)
      } else {
        const { data, error } = await supabase
          .from('prenotazioni')
          .insert({ ...payload, struttura_id })
          .select('*, camere(nome), clienti(nome, cognome)')
          .single()
        if (error) throw error
        setPrenotazioni(prev =>
          [...prev, data as Prenotazione].sort((a, b) => a.data_arrivo.localeCompare(b.data_arrivo))
        )
      }

      setMostraForm(false)
      setIdInModifica(null)
      setForm(FORM_VUOTO)
    } catch (e: unknown) {
      setErroreForm((e as Error).message ?? 'Errore nel salvataggio')
    } finally {
      setSalvando(false)
    }
  }

  function apriModifica(p: Prenotazione) {
    skipPriceCalc.current = true
    setIdInModifica(p.id)
    setForm({
      camera_id: p.camera_id,
      cliente_id: p.cliente_id,
      data_arrivo: p.data_arrivo,
      data_partenza: p.data_partenza,
      num_ospiti: p.num_ospiti,
      prezzo_totale: p.prezzo_totale,
      stato: p.stato,
      note: p.note ?? '',
      canale: p.canale ?? 'Diretto',
    })
    setErroreForm(null)
    setMostraForm(true)
  }

  async function eliminaPrenotazione(id: string) {
    if (!window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) return
    setEliminando(true)
    const { error } = await supabase.from('prenotazioni').delete().eq('id', id)
    setEliminando(false)
    if (error) { setErrore(error.message); return }
    setPrenotazioni(prev => prev.filter(p => p.id !== id))
    setSelezionata(null)
  }

  function naviga(delta: number) {
    setStartDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + delta)
      return d
    })
  }

  const giorni = getGiorni(startDate, 14)
  const oggi = localDateStr(new Date())
  const prenotazioneSelezionata = prenotazioni.find(p => p.id === selezionata)

  function formatRange(): string {
    const [y1, m1, d1] = giorni[0].split('-')
    const [y2, m2, d2] = giorni[giorni.length - 1].split('-')
    const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
    const fine = `${Number(d2)} ${mesi[Number(m2) - 1]} ${y2}`
    const inizio = m1 === m2 ? `${Number(d1)}` : `${Number(d1)} ${mesi[Number(m1) - 1]}`
    return `${inizio} – ${fine}`
  }

  const inputStyle = { display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', boxSizing: 'border-box' } as const
  const selectStyle = { ...inputStyle, background: 'white' }
  const formValid = form.camera_id && form.cliente_id && form.data_arrivo && form.data_partenza

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '1.75rem', color: '#888', fontSize: '14px' }}>Caricamento...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '1.75rem', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif' }}>Prenotazioni</h1>
          <button
            onClick={() => { setMostraForm(true); setIdInModifica(null); setForm(FORM_VUOTO); setErroreForm(null) }}
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}
          >+ Nuova prenotazione</button>
        </div>

        {errore && (
          <div style={{ marginBottom: '1rem', padding: '10px 14px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '13px' }}>
            {errore}
          </div>
        )}

        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#0F6E56', fontWeight: 500 }}>● In corso</span>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#FAEEDA', color: '#854F0B', fontWeight: 500 }}>● Confermata</span>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#E6F1FB', color: '#185FA5', fontWeight: 500 }}>● In arrivo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => naviga(-7)} style={{ padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #ccc', background: 'white', cursor: 'pointer', fontSize: '13px' }}>←</button>
            <span style={{ fontSize: '13px', color: '#555', minWidth: '170px', textAlign: 'center' }}>{formatRange()}</span>
            <button onClick={() => naviga(7)} style={{ padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #ccc', background: 'white', cursor: 'pointer', fontSize: '13px' }}>→</button>
          </div>
        </div>

        <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', overflow: 'auto' }}>
          {camere.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nessuna camera attiva trovata.</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `110px repeat(${giorni.length}, 1fr)`,
              gap: '2px', padding: '12px', minWidth: '700px'
            }}>
              <div />
              {giorni.map(g => (
                <div key={g} style={{
                  textAlign: 'center', fontSize: '12px',
                  color: g === oggi ? '#BA7517' : '#888',
                  fontWeight: g === oggi ? 600 : 400,
                  padding: '4px 0'
                }}>
                  {Number(g.split('-')[2])}
                </div>
              ))}
              {camere.map(camera => (
                <RigaCamera
                  key={camera.id}
                  camera={camera}
                  giorni={giorni}
                  prenotazioni={prenotazioni}
                  selezionata={selezionata}
                  onSeleziona={setSelezionata}
                />
              ))}
            </div>
          )}
        </div>

        {prenotazioneSelezionata && (
          <div style={{ marginTop: '1.25rem', background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dettaglio prenotazione</div>
              <button onClick={() => setSelezionata(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Cliente', valore: prenotazioneSelezionata.clienti ? `${prenotazioneSelezionata.clienti.nome} ${prenotazioneSelezionata.clienti.cognome}` : '—' },
                { label: 'Camera', valore: prenotazioneSelezionata.camere?.nome ?? '—' },
                { label: 'Arrivo', valore: formatData(prenotazioneSelezionata.data_arrivo) },
                { label: 'Partenza', valore: formatData(prenotazioneSelezionata.data_partenza) },
                { label: 'N° ospiti', valore: String(prenotazioneSelezionata.num_ospiti ?? '—') },
                { label: 'Prezzo totale', valore: prenotazioneSelezionata.prezzo_totale ? `€ ${prenotazioneSelezionata.prezzo_totale}` : '—' },
                { label: 'Canale', valore: prenotazioneSelezionata.canale ?? '—' },
                { label: 'Stato', valore: prenotazioneSelezionata.stato ?? '—' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.valore}</div>
                </div>
              ))}
            </div>
            {prenotazioneSelezionata.note && (
              <div style={{ marginTop: '12px', background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Note</div>
                <div style={{ fontSize: '13px' }}>{prenotazioneSelezionata.note}</div>
              </div>
            )}
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => apriModifica(prenotazioneSelezionata)}
                style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}
              >Modifica</button>
              <button
                onClick={() => eliminaPrenotazione(prenotazioneSelezionata.id)}
                disabled={eliminando}
                style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #f5c6c6', background: 'white', fontSize: '13px', cursor: eliminando ? 'default' : 'pointer', color: '#c0392b', opacity: eliminando ? 0.6 : 1 }}
              >{eliminando ? 'Eliminazione...' : 'Elimina'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal nuova prenotazione */}
      {mostraForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) { setMostraForm(false); setIdInModifica(null) } }}
        >
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '500px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '1.25rem' }}>{idInModifica ? 'Modifica prenotazione' : 'Nuova prenotazione'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Camera *</label>
                <select value={form.camera_id} onChange={e => setForm({ ...form, camera_id: e.target.value })} style={selectStyle}>
                  <option value="">— Seleziona —</option>
                  {camere.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Cliente *</label>
                <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} style={selectStyle}>
                  <option value="">— Seleziona —</option>
                  {clienti.map(c => <option key={c.id} value={c.id}>{c.cognome} {c.nome}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Data arrivo *</label>
                <input type="date" value={form.data_arrivo} onChange={e => setForm({ ...form, data_arrivo: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Data partenza *</label>
                <input type="date" value={form.data_partenza} onChange={e => setForm({ ...form, data_partenza: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>N° ospiti</label>
                <input type="number" min={1} value={form.num_ospiti} onChange={e => setForm({ ...form, num_ospiti: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Prezzo totale (€)</label>
                <input type="number" min={0} value={form.prezzo_totale} onChange={e => setForm({ ...form, prezzo_totale: Number(e.target.value) })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Stato</label>
                <select value={form.stato} onChange={e => setForm({ ...form, stato: e.target.value })} style={selectStyle}>
                  {STATI.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Canale</label>
                <select value={form.canale} onChange={e => setForm({ ...form, canale: e.target.value })} style={selectStyle}>
                  <option value="">— Seleziona —</option>
                  {CANALI.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Note</label>
              <textarea
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                rows={3}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {erroreForm && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '12px' }}>
                {erroreForm}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setMostraForm(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button
                onClick={salvaPrenotazione}
                disabled={salvando || !formValid}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: salvando || !formValid ? 'default' : 'pointer', opacity: salvando || !formValid ? 0.7 : 1 }}
              >
                {salvando ? 'Salvataggio...' : idInModifica ? 'Salva modifiche' : 'Salva prenotazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
