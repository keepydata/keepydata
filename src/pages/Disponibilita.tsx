import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

interface Giorno {
  numero: number
  percentuale: number
}

interface PrenRaw {
  data_arrivo: string
  data_partenza: string
  stato: string
  camera_id: string
}

interface Camera {
  id: string
}

const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

function computaGiorni(anno: number, mese0: number, prenotazioni: PrenRaw[], totaleCamere: number): Giorno[] {
  const numGiorni = new Date(anno, mese0 + 1, 0).getDate()
  return Array.from({ length: numGiorni }, (_, i) => {
    const n = i + 1
    const dataStr = `${anno}-${String(mese0 + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`
    const prenotazioniGiorno = prenotazioni.filter(p => p.data_arrivo <= dataStr && dataStr < p.data_partenza)
    const camereOccupate = new Set(prenotazioniGiorno.map(p => p.camera_id)).size
    const percentuale = totaleCamere > 0 ? Math.round(camereOccupate / totaleCamere * 100) : 0
    return { numero: n, percentuale }
  })
}

function coloreGiorno(percentuale: number) {
  if (percentuale === 0)   return { bg: '#E1F5EE', color: '#0F6E56' }
  if (percentuale < 100)   return { bg: '#FAEEDA', color: '#854F0B' }
  return { bg: '#FCEBEB', color: '#A32D2D' }
}

function MiniCalendario({ nome, giorni, primoGiorno }: { nome: string; giorni: Giorno[]; primoGiorno: number }) {
  const offset = primoGiorno === 0 ? 6 : primoGiorno - 1
  return (
    <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
      <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '12px' }}>{nome}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {['L','M','M','G','V','S','D'].map((g, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: '#888', fontWeight: 500, padding: '4px 0' }}>{g}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {giorni.map(g => {
          const c = coloreGiorno(g.percentuale)
          return (
            <div key={g.numero} style={{
              minHeight: '34px', borderRadius: '3px',
              background: c.bg, color: c.color,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', fontSize: '11px', padding: '2px 0',
            }}>
              <span>{g.numero}</span>
              {g.percentuale > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 600, color: c.color, lineHeight: 1.2 }}>{g.percentuale}%</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Disponibilita() {
  const [strutturaId, setStrutturaId] = useState<string | null>(null)
  const [prenotazioni, setPrenotazioni] = useState<PrenRaw[]>([])
  const [camere, setCamere] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)

  const [meseBase, setMeseBase] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const [bloccoInizio, setBloccoInizio] = useState('')
  const [bloccoFine, setBloccoFine] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [bloccato, setBloccato] = useState(false)
  const [erroreBlocco, setErroreBlocco] = useState<string | null>(null)

  useEffect(() => {
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

        const [prenRes, camereRes] = await Promise.all([
          supabase
            .from('prenotazioni')
            .select('data_arrivo, data_partenza, stato, camera_id')
            .eq('struttura_id', sid)
            .neq('stato', 'cancellata'),
          supabase
            .from('camere')
            .select('id')
            .eq('struttura_id', sid)
            .eq('attiva', true),
        ])

        if (prenRes.error) throw prenRes.error
        if (camereRes.error) throw camereRes.error

        setPrenotazioni(prenRes.data ?? [])
        setCamere(camereRes.data ?? [])
      } catch (e: unknown) {
        setErrore((e as Error).message ?? 'Errore nel caricamento')
      } finally {
        setLoading(false)
      }
    }
    caricaDati()
  }, [])

  const mese1 = meseBase
  const mese2 = new Date(meseBase.getFullYear(), meseBase.getMonth() + 1, 1)

  const totaleCamere = camere.length
  const giorni1 = computaGiorni(mese1.getFullYear(), mese1.getMonth(), prenotazioni, totaleCamere)
  const giorni2 = computaGiorni(mese2.getFullYear(), mese2.getMonth(), prenotazioni, totaleCamere)

  function nomeMese(d: Date) {
    return `${MESI_IT[d.getMonth()]} ${d.getFullYear()}`
  }

  function mesePrecedente() {
    setMeseBase(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function meseSucessivo() {
    setMeseBase(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  async function salvaBlocco() {
    if (!strutturaId || !bloccoInizio || !bloccoFine) return
    if (bloccoFine <= bloccoInizio) {
      setErroreBlocco('La data fine deve essere successiva alla data inizio.')
      return
    }
    if (camere.length === 0) {
      setErroreBlocco('Nessuna camera attiva trovata per questa struttura.')
      return
    }
    setSalvando(true)
    setErroreBlocco(null)
    try {
      const inserimenti = camere.map(c => ({
        struttura_id: strutturaId,
        camera_id: c.id,
        data_arrivo: bloccoInizio,
        data_partenza: bloccoFine,
        stato: 'blocco',
      }))
      const { error } = await supabase.from('prenotazioni').insert(inserimenti)
      if (error) throw error

      setPrenotazioni(prev => [
        ...prev,
        ...inserimenti.map(ins => ({
          data_arrivo: ins.data_arrivo,
          data_partenza: ins.data_partenza,
          stato: 'blocco',
          camera_id: ins.camera_id,
        })),
      ])
      setBloccoInizio('')
      setBloccoFine('')
      setBloccato(true)
      setTimeout(() => setBloccato(false), 3000)
    } catch (e: unknown) {
      setErroreBlocco((e as Error).message ?? 'Errore nel salvataggio')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif', marginBottom: '1rem' }}>Disponibilità</h1>

        {errore && (
          <div style={{ marginBottom: '1rem', padding: '10px 14px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '13px' }}>
            {errore}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#0F6E56', fontWeight: 500 }}>■ 0% libero</span>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#FAEEDA', color: '#854F0B', fontWeight: 500 }}>■ Parzialmente occupato</span>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#FCEBEB', color: '#A32D2D', fontWeight: 500 }}>■ 100% occupato</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={mesePrecedente}
              style={{ padding: '5px 10px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}
            >←</button>
            <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '180px', textAlign: 'center' }}>
              {nomeMese(mese1)} – {nomeMese(mese2)}
            </span>
            <button
              onClick={meseSucessivo}
              style={{ padding: '5px 10px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}
            >→</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '13px' }}>Caricamento disponibilità…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <MiniCalendario nome={nomeMese(mese1)} giorni={giorni1} primoGiorno={mese1.getDay()} />
            <MiniCalendario nome={nomeMese(mese2)} giorni={giorni2} primoGiorno={mese2.getDay()} />
          </div>
        )}

        <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Blocca periodo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Data inizio</label>
              <input
                type="date"
                value={bloccoInizio}
                onChange={e => setBloccoInizio(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Data fine</label>
              <input
                type="date"
                value={bloccoFine}
                onChange={e => setBloccoFine(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {erroreBlocco && (
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: '#FDECEA', color: '#B71C1C', fontSize: '12px' }}>
              {erroreBlocco}
            </div>
          )}

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
            {bloccato && <span style={{ fontSize: '12px', color: '#0F6E56' }}>✓ Periodo bloccato!</span>}
            <button
              onClick={salvaBlocco}
              disabled={salvando || !bloccoInizio || !bloccoFine}
              style={{
                padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white',
                border: 'none', fontSize: '13px',
                cursor: salvando || !bloccoInizio || !bloccoFine ? 'default' : 'pointer',
                opacity: salvando || !bloccoInizio || !bloccoFine ? 0.7 : 1,
              }}
            >
              {salvando ? 'Salvataggio…' : 'Salva blocco'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
