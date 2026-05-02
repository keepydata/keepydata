import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

interface Camera {
  id: string
  nome: string
  tipo: string
  posti: number
  prezzo_notte: number
  attiva: boolean
  struttura_id: string
}

interface Struttura {
  id: string
  nome: string
  piva: string
  indirizzo: string
  citta: string
  email: string
  telefono: string
  tassa_soggiorno: number
  user_id: string
}

const CAMPI_STRUTTURA = [
  { label: 'Nome struttura', key: 'nome' },
  { label: 'Partita IVA', key: 'piva' },
  { label: 'Indirizzo', key: 'indirizzo' },
  { label: 'Città', key: 'citta' },
  { label: 'Email', key: 'email' },
  { label: 'Telefono', key: 'telefono' },
] as const

const CAMERA_VUOTA = { nome: '', tipo: '', posti: 2, prezzo_notte: 0, attiva: true }

export default function Impostazioni() {
  const [struttura, setStruttura] = useState<Struttura | null>(null)
  const [camere, setCamere] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvato, setSalvato] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const [mostraForm, setMostraForm] = useState(false)
  const [cameraInEdit, setCameraInEdit] = useState<Camera | null>(null)
  const [formCamera, setFormCamera] = useState(CAMERA_VUOTA)
  const [salvanndoCamera, setSalvandoCamera] = useState(false)

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

        const { data: struttureData, error: errStruttura } = await supabase
          .from('strutture')
          .select('*')
          .eq('id', utenteData.struttura_id)
          .single()

        if (errStruttura) throw errStruttura
        if (struttureData) setStruttura(struttureData)

        if (struttureData) {
          const { data: camereData, error: errCamere } = await supabase
            .from('camere')
            .select('*')
            .eq('struttura_id', struttureData.id)
            .order('nome')

          if (errCamere) throw errCamere
          setCamere(camereData ?? [])
        }
      } catch (e: unknown) {
        setErrore((e as Error).message ?? 'Errore nel caricamento')
      } finally {
        setLoading(false)
      }
    }
    caricaDati()
  }, [])

  async function salvaStruttura() {
    if (!struttura) return
    setSalvando(true)
    setErrore(null)
    try {
      const { error } = await supabase
        .from('strutture')
        .update({
          nome: struttura.nome,
          piva: struttura.piva,
          indirizzo: struttura.indirizzo,
          citta: struttura.citta,
          email: struttura.email,
          telefono: struttura.telefono,
          tassa_soggiorno: struttura.tassa_soggiorno ?? 0,
        })
        .eq('id', struttura.id)

      if (error) throw error
      setSalvato(true)
      setTimeout(() => setSalvato(false), 2000)
    } catch (e: unknown) {
      setErrore((e as Error).message ?? 'Errore nel salvataggio')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleCamera(camera: Camera) {
    const { error } = await supabase
      .from('camere')
      .update({ attiva: !camera.attiva })
      .eq('id', camera.id)

    if (!error) {
      setCamere(prev => prev.map(c => c.id === camera.id ? { ...c, attiva: !c.attiva } : c))
    }
  }

  function apriNuovaCamera() {
    setCameraInEdit(null)
    setFormCamera(CAMERA_VUOTA)
    setMostraForm(true)
  }

  function apriModificaCamera(camera: Camera) {
    setCameraInEdit(camera)
    setFormCamera({ nome: camera.nome, tipo: camera.tipo, posti: camera.posti, prezzo_notte: camera.prezzo_notte, attiva: camera.attiva })
    setMostraForm(true)
  }

  async function salvaCamera() {
    if (!struttura) return
    setSalvandoCamera(true)
    setErrore(null)
    try {
      if (cameraInEdit) {
        const { error } = await supabase
          .from('camere')
          .update(formCamera)
          .eq('id', cameraInEdit.id)

        if (error) throw error
        setCamere(prev => prev.map(c => c.id === cameraInEdit.id ? { ...c, ...formCamera } : c))
      } else {
        const { data, error } = await supabase
          .from('camere')
          .insert({ ...formCamera, struttura_id: struttura.id })
          .select()
          .single()

        if (error) throw error
        setCamere(prev => [...prev, data])
      }
      setMostraForm(false)
    } catch (e: unknown) {
      setErrore((e as Error).message ?? 'Errore nel salvataggio camera')
    } finally {
      setSalvandoCamera(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '1.75rem', color: '#888', fontSize: '14px' }}>Caricamento...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif', marginBottom: '1.5rem' }}>Impostazioni</h1>

        {errore && (
          <div style={{ marginBottom: '1rem', padding: '10px 14px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '13px' }}>
            {errore}
          </div>
        )}

        {/* Dati struttura */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Dati struttura</div>
          {struttura ? (
            <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {CAMPI_STRUTTURA.map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>{field.label}</label>
                    <input
                      value={struttura[field.key] ?? ''}
                      onChange={e => setStruttura({ ...struttura, [field.key]: e.target.value })}
                      style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '0.5px solid #f0ede6' }}>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Tassa di soggiorno (€ per persona per notte)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={struttura.tassa_soggiorno ?? 0}
                  onChange={e => setStruttura({ ...struttura, tassa_soggiorno: Number(e.target.value) })}
                  style={{ display: 'block', width: '200px', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                {salvato && <span style={{ fontSize: '12px', color: '#0F6E56' }}>✓ Salvato!</span>}
                <button
                  onClick={salvaStruttura}
                  disabled={salvando}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: salvando ? 'default' : 'pointer', opacity: salvando ? 0.7 : 1 }}
                >
                  {salvando ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem', color: '#888', fontSize: '13px' }}>
              Nessuna struttura trovata per questo account.
            </div>
          )}
        </div>

        {/* Camere */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Camere</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {camere.map(c => (
              <div key={c.id} style={{
                background: 'white', border: `0.5px solid ${c.attiva ? '#e0ddd6' : '#f0ede6'}`,
                borderRadius: '12px', padding: '1rem',
                opacity: c.attiva ? 1 : 0.6
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{c.nome}</div>
                  <button
                    onClick={() => toggleCamera(c)}
                    style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      border: 'none', cursor: 'pointer', fontWeight: 500,
                      background: c.attiva ? '#E1F5EE' : '#F1EFE8',
                      color: c.attiva ? '#0F6E56' : '#5F5E5A'
                    }}
                  >{c.attiva ? 'Attiva' : 'Inattiva'}</button>
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{c.tipo} · {c.posti} {c.posti === 1 ? 'posto' : 'posti'}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '20px', fontWeight: 500, color: '#BA7517' }}>€ {c.prezzo_notte}<span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>/ notte</span></div>
                  <button
                    onClick={() => apriModificaCamera(c)}
                    style={{ fontSize: '11px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                  >Modifica</button>
                </div>
              </div>
            ))}

            <div
              onClick={apriNuovaCamera}
              style={{
                background: 'white', border: '0.5px dashed #ccc',
                borderRadius: '12px', padding: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#888', fontSize: '13px'
              }}
            >+ Aggiungi camera</div>
          </div>
        </div>
      </div>

      {/* Modal form camera */}
      {mostraForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={e => { if (e.target === e.currentTarget) setMostraForm(false) }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '1.25rem' }}>
              {cameraInEdit ? 'Modifica camera' : 'Nuova camera'}
            </div>

            {[
              { label: 'Nome camera', key: 'nome', type: 'text' },
              { label: 'Tipo (es. Doppia, Suite)', key: 'tipo', type: 'text' },
              { label: 'Posti letto', key: 'posti', type: 'number' },
              { label: 'Prezzo per notte (€)', key: 'prezzo_notte', type: 'number' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>{field.label}</label>
                <input
                  type={field.type}
                  value={formCamera[field.key as keyof typeof formCamera] as string | number}
                  onChange={e => setFormCamera({ ...formCamera, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                  style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="attiva"
                checked={formCamera.attiva}
                onChange={e => setFormCamera({ ...formCamera, attiva: e.target.checked })}
              />
              <label htmlFor="attiva" style={{ fontSize: '13px', cursor: 'pointer' }}>Camera attiva</label>
            </div>

            {errore && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '12px' }}>
                {errore}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMostraForm(false)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}
              >Annulla</button>
              <button
                onClick={salvaCamera}
                disabled={salvanndoCamera || !formCamera.nome.trim()}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: salvanndoCamera ? 'default' : 'pointer', opacity: salvanndoCamera || !formCamera.nome.trim() ? 0.7 : 1 }}
              >{salvanndoCamera ? 'Salvataggio...' : 'Salva'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
