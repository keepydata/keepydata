import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

interface Cliente {
  id: string
  struttura_id: string
  nome: string
  cognome: string
  email: string
  telefono: string
  nazionalita: string
  tipo_documento: string
  numero_documento: string
}

const FORM_VUOTO = {
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  nazionalita: '',
  tipo_documento: '',
  numero_documento: '',
}

const TIPI_DOCUMENTO = ['Carta d\'identità', 'Passaporto', 'Patente', 'Permesso di soggiorno']

function iniziali(nome: string, cognome: string) {
  return ((nome[0] ?? '') + (cognome[0] ?? '')).toUpperCase()
}

export default function Clienti() {
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [struttura_id, setStrutturaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)
  const [ricerca, setRicerca] = useState('')
  const [selezionato, setSelezionato] = useState<Cliente | null>(null)
  const [mostraForm, setMostraForm] = useState(false)
  const [form, setForm] = useState(FORM_VUOTO)
  const [salvando, setSalvando] = useState(false)
  const [erroreForm, setErroreForm] = useState<string | null>(null)

  useEffect(() => {
    async function caricaClienti() {
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

        setStrutturaId(utenteData.struttura_id)

        const { data, error } = await supabase
          .from('clienti')
          .select('*')
          .eq('struttura_id', utenteData.struttura_id)
          .order('cognome')

        if (error) throw error
        setClienti(data ?? [])
      } catch (e: unknown) {
        setErrore((e as Error).message ?? 'Errore nel caricamento')
      } finally {
        setLoading(false)
      }
    }
    caricaClienti()
  }, [])

  async function aggiungiCliente() {
    if (!struttura_id) return
    setSalvando(true)
    setErroreForm(null)
    try {
      const { data, error } = await supabase
        .from('clienti')
        .insert({ ...form, struttura_id })
        .select()
        .single()

      if (error) throw error
      setClienti(prev => [...prev, data].sort((a, b) => a.cognome.localeCompare(b.cognome)))
      setMostraForm(false)
      setForm(FORM_VUOTO)
    } catch (e: unknown) {
      setErroreForm((e as Error).message ?? 'Errore nel salvataggio')
    } finally {
      setSalvando(false)
    }
  }

  const filtrati = clienti.filter(c =>
    `${c.nome} ${c.cognome} ${c.email} ${c.nazionalita}`.toLowerCase().includes(ricerca.toLowerCase())
  )

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif' }}>Clienti</h1>
          <button
            onClick={() => { setMostraForm(true); setErroreForm(null); setForm(FORM_VUOTO) }}
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}
          >+ Nuovo cliente</button>
        </div>

        {errore && (
          <div style={{ marginBottom: '1rem', padding: '10px 14px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '13px' }}>
            {errore}
          </div>
        )}

        <input
          type="text"
          placeholder="Cerca per nome, email, nazionalità..."
          value={ricerca}
          onChange={e => setRicerca(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', marginBottom: '1rem', background: 'white', color: '#333', boxSizing: 'border-box' }}
        />

        <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '13px' }}>Caricamento...</div>
          ) : filtrati.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '13px' }}>
              {ricerca ? 'Nessun cliente trovato.' : 'Nessun cliente registrato.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e0ddd6' }}>
                  {['Ospite', 'Nazionalità', 'Documento', 'Telefono', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrati.map((c, idx) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: idx < filtrati.length - 1 ? '0.5px solid #f0ede6' : 'none', cursor: 'pointer', background: selezionato?.id === c.id ? '#faf9f7' : 'white' }}
                    onClick={() => setSelezionato(selezionato?.id === c.id ? null : c)}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FAEEDA', color: '#854F0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, flexShrink: 0 }}>
                          {iniziali(c.nome, c.cognome)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.nome} {c.cognome}</div>
                          <div style={{ fontSize: '11px', color: '#888' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#555' }}>{c.nazionalita || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#555' }}>
                      {c.tipo_documento ? <span>{c.tipo_documento}{c.numero_documento ? ` · ${c.numero_documento}` : ''}</span> : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#555' }}>{c.telefono || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#BA7517', fontSize: '12px' }}>Dettaglio →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selezionato && (
          <div style={{ marginTop: '1.25rem', background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Dettaglio cliente</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Nome completo', valore: `${selezionato.nome} ${selezionato.cognome}` },
                { label: 'Email', valore: selezionato.email || '—' },
                { label: 'Telefono', valore: selezionato.telefono || '—' },
                { label: 'Nazionalità', valore: selezionato.nazionalita || '—' },
                { label: 'Tipo documento', valore: selezionato.tipo_documento || '—' },
                { label: 'N° documento', valore: selezionato.numero_documento || '—' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.valore}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal nuovo cliente */}
      {mostraForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setMostraForm(false) }}
        >
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '460px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '1.25rem' }}>Nuovo cliente</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {([
                { label: 'Nome *', key: 'nome', type: 'text' },
                { label: 'Cognome *', key: 'cognome', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Telefono', key: 'telefono', type: 'tel' },
                { label: 'Nazionalità', key: 'nazionalita', type: 'text' },
                { label: 'N° documento', key: 'numero_documento', type: 'text' },
              ] as { label: string; key: keyof typeof FORM_VUOTO; type: string }[]).map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Tipo documento</label>
              <select
                value={form.tipo_documento}
                onChange={e => setForm({ ...form, tipo_documento: e.target.value })}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', background: 'white', boxSizing: 'border-box' }}
              >
                <option value="">— Seleziona —</option>
                {TIPI_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {erroreForm && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '12px' }}>
                {erroreForm}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMostraForm(false)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}
              >Annulla</button>
              <button
                onClick={aggiungiCliente}
                disabled={salvando || !form.nome.trim() || !form.cognome.trim()}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: salvando ? 'default' : 'pointer', opacity: salvando || !form.nome.trim() || !form.cognome.trim() ? 0.7 : 1 }}
              >{salvando ? 'Salvataggio...' : 'Aggiungi cliente'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
