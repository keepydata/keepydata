import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const IVA = 0.10

interface Fattura {
  id: string
  numero: string
  struttura_id: string
  prenotazione_id: string | null
  cliente_id: string | null
  imponibile: number
  iva: number
  totale: number
  stato: 'bozza' | 'inviata' | 'pagata'
  data_fattura: string | null
  clienti: { nome: string; cognome: string }[] | null
  prenotazioni: { data_arrivo: string; data_partenza: string; camere: { nome: string }[] | null }[] | null
}

interface Struttura {
  id: string
  nome: string
  piva: string
  indirizzo: string
  citta: string
  email: string
  telefono: string
}

interface PrenForm {
  id: string
  data_arrivo: string
  data_partenza: string
  prezzo_totale: number | null
  cliente_id: string | null
  clienti: { nome: string; cognome: string }[] | null
  camere: { nome: string }[] | null
}

const STATI_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  pagata: { label: 'Pagata', bg: '#E1F5EE', color: '#0F6E56' },
  inviata: { label: 'Inviata', bg: '#FAEEDA', color: '#854F0B' },
  bozza:  { label: 'Bozza',   bg: '#F1EFE8', color: '#5F5E5A' },
}

function Badge({ stato }: { stato: string }) {
  const s = STATI_LABEL[stato] ?? STATI_LABEL.bozza
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function nomeClienteFattura(f: Fattura): string {
  const c = Array.isArray(f.clienti) ? f.clienti[0] : f.clienti
  if (!c) return '—'
  return `${c.cognome} ${c.nome}`.trim()
}

function nomeCameraFattura(f: Fattura): string {
  const pren = Array.isArray(f.prenotazioni) ? f.prenotazioni[0] : f.prenotazioni
  if (!pren) return '—'
  const cam = Array.isArray(pren.camere) ? pren.camere[0] : pren.camere
  return cam?.nome ?? '—'
}

function periodoFattura(f: Fattura): string {
  const pren = Array.isArray(f.prenotazioni) ? f.prenotazioni[0] : f.prenotazioni
  if (!pren) return '—'
  return `${formatData(pren.data_arrivo)} – ${formatData(pren.data_partenza)}`
}

function formatData(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
  return `${Number(d)} ${mesi[Number(m) - 1]} ${y}`
}

function formatEuro(n: number): string {
  return `€ ${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const FORM_VUOTO = {
  prenotazione_id: '',
  imponibile: 0,
  stato: 'bozza' as 'bozza' | 'inviata' | 'pagata',
}

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px',
  borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px',
  fontFamily: 'sans-serif', boxSizing: 'border-box',
}

export default function Fatturazione() {
  const [struttura_id, setStrutturaId] = useState<string | null>(null)
  const [struttura, setStruttura] = useState<Struttura | null>(null)
  const [fatture, setFatture] = useState<Fattura[]>([])
  const [prenotazioni, setPrenotazioni] = useState<PrenForm[]>([])
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)
  const [selezionata, setSelezionata] = useState<Fattura | null>(null)
  const [mostraForm, setMostraForm] = useState(false)
  const [form, setForm] = useState(FORM_VUOTO)
  const [salvando, setSalvando] = useState(false)
  const [erroreForm, setErroreForm] = useState<string | null>(null)

  const iva = Math.round(form.imponibile * IVA * 100) / 100
  const totale = Math.round((form.imponibile + iva) * 100) / 100

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

        const [strutturaRes, fattureRes, prenRes] = await Promise.all([
          supabase.from('strutture').select('id, nome, piva, indirizzo, citta, email, telefono').eq('id', sid).single(),
          supabase
            .from('fatture')
            .select('*, clienti(nome, cognome), prenotazioni(data_arrivo, data_partenza, camere(nome))')
            .eq('struttura_id', sid)
            .order('numero', { ascending: false }),
          supabase
            .from('prenotazioni')
            .select('id, data_arrivo, data_partenza, prezzo_totale, cliente_id, clienti(nome, cognome), camere(nome)')
            .eq('struttura_id', sid)
            .neq('stato', 'cancellata')
            .order('data_arrivo', { ascending: false }),
        ])

        if (strutturaRes.error) throw strutturaRes.error
        if (fattureRes.error) throw fattureRes.error
        if (prenRes.error) throw prenRes.error

        setStruttura(strutturaRes.data as Struttura)
        setFatture((fattureRes.data ?? []) as Fattura[])
        setPrenotazioni((prenRes.data ?? []) as PrenForm[])
      } catch (e: unknown) {
        setErrore((e as Error).message ?? 'Errore nel caricamento')
      } finally {
        setLoading(false)
      }
    }
    caricaDati()
  }, [])

  async function creaFattura() {
    if (!struttura_id || !form.prenotazione_id) return
    setSalvando(true)
    setErroreForm(null)
    try {
      const pren = prenotazioni.find(p => p.id === form.prenotazione_id)
      const anno = new Date().getFullYear()
      const nAnno = fatture.filter(f => f.numero.startsWith(String(anno))).length + 1
      const numero = `${anno}/${String(nAnno).padStart(3, '0')}`

      const { data, error } = await supabase
        .from('fatture')
        .insert({
          struttura_id,
          prenotazione_id: form.prenotazione_id,
          cliente_id: pren?.cliente_id ?? null,
          numero,
          imponibile: form.imponibile,
          iva,
          totale,
          stato: form.stato,
          data_fattura: new Date().toISOString().slice(0, 10),
        })
        .select('*, clienti(nome, cognome), prenotazioni(data_arrivo, data_partenza, camere(nome))')
        .single()

      if (error) throw error
      setFatture(prev => [data as Fattura, ...prev])
      setMostraForm(false)
      setForm(FORM_VUOTO)
    } catch (e: unknown) {
      setErroreForm((e as Error).message ?? 'Errore nel salvataggio')
    } finally {
      setSalvando(false)
    }
  }

  async function aggiornaStato(f: Fattura, stato: 'bozza' | 'inviata' | 'pagata') {
    const { error } = await supabase.from('fatture').update({ stato }).eq('id', f.id)
    if (error) { setErrore(error.message); return }
    const aggiornata = { ...f, stato }
    setFatture(prev => prev.map(x => x.id === f.id ? aggiornata : x))
    setSelezionata(aggiornata)
  }

  function generaPDF(f: Fattura) {
    const doc = new jsPDF()
    const mL = 20   // margin left
    const mR = 190  // margin right
    let y = 20

    const riga = (label: string, valore: string, labelX = mL, valoreX = mR) => {
      doc.text(label, labelX, y)
      doc.text(valore, valoreX, y, { align: 'right' })
      y += 6
    }

    // — Intestazione struttura (sinistra) —
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text(struttura?.nome ?? '', mL, y)
    y += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    if (struttura?.indirizzo) { doc.text(`${struttura.indirizzo}${struttura.citta ? ', ' + struttura.citta : ''}`, mL, y); y += 5 }
    if (struttura?.piva)      { doc.text(`P.IVA: ${struttura.piva}`, mL, y); y += 5 }
    if (struttura?.email)     { doc.text(`Email: ${struttura.email}`, mL, y); y += 5 }
    if (struttura?.telefono)  { doc.text(`Tel: ${struttura.telefono}`, mL, y); y += 5 }
    doc.setTextColor(0)

    // — Numero e data fattura (destra) —
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`FATTURA N° ${f.numero}`, mR, 20, { align: 'right' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Data: ${f.data_fattura ? formatData(f.data_fattura) : '—'}`, mR, 29, { align: 'right' })

    y += 6

    // — Separatore —
    doc.setDrawColor(220)
    doc.setLineWidth(0.4)
    doc.line(mL, y, mR, y)
    y += 8

    // — Dati cliente —
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('CLIENTE', mL, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(nomeClienteFattura(f), mL, y)
    y += 12

    // — Separatore —
    doc.setDrawColor(220)
    doc.line(mL, y, mR, y)
    y += 8

    // — Descrizione soggiorno —
    doc.setFont('helvetica', 'bold')
    doc.text('DESCRIZIONE PRESTAZIONE', mL, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(`Soggiorno in ${nomeCameraFattura(f)}`, mL, y)
    y += 5
    doc.text(`Periodo: ${periodoFattura(f)}`, mL, y)
    y += 16

    // — Separatore —
    doc.setDrawColor(220)
    doc.line(mL, y, mR, y)
    y += 8

    // — Importi (allineati a destra) —
    const cLabel = 140
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    riga('Imponibile', formatEuro(f.imponibile), cLabel, mR)
    riga('IVA 10%', formatEuro(f.iva), cLabel, mR)

    doc.setDrawColor(180)
    doc.line(cLabel, y, mR, y)
    y += 5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    riga('Totale', formatEuro(f.totale), cLabel, mR)

    // — Footer —
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('Documento generato elettronicamente', 105, 285, { align: 'center' })

    doc.save(`Fattura_${f.numero.replace('/', '-')}.pdf`)
  }

  const fatturato  = fatture.reduce((acc, f) => acc + f.totale, 0)
  const daIncassare = fatture.filter(f => f.stato === 'inviata').reduce((acc, f) => acc + f.totale, 0)
  const incassato  = fatture.filter(f => f.stato === 'pagata').reduce((acc, f) => acc + f.totale, 0)
  const ivaTotale  = fatture.reduce((acc, f) => acc + f.iva, 0)

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif' }}>Fatturazione</h1>
          <button
            onClick={() => { setMostraForm(true); setForm(FORM_VUOTO); setErroreForm(null) }}
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}
          >+ Nuova fattura</button>
        </div>

        {errore && (
          <div style={{ marginBottom: '1rem', padding: '10px 14px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '13px' }}>
            {errore}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          {[
            { label: 'Fatturato',     valore: formatEuro(fatturato),   sub: `${fatture.length} fatture` },
            { label: 'Da incassare',  valore: formatEuro(daIncassare),  sub: `${fatture.filter(f => f.stato === 'inviata').length} inviate` },
            { label: 'Incassato',     valore: formatEuro(incassato),    sub: `${fatture.filter(f => f.stato === 'pagata').length} pagate` },
            { label: 'IVA del periodo', valore: formatEuro(ivaTotale), sub: 'Aliquota 10%' },
          ].map((kpi, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '1rem 1.25rem', border: '0.5px solid #e0ddd6' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{kpi.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 500, lineHeight: '1' }}>{kpi.valore}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '13px' }}>Caricamento...</div>
          ) : fatture.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nessuna fattura presente.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e0ddd6' }}>
                  {['N°', 'Cliente', 'Camera', 'Periodo', 'Imponibile', 'IVA', 'Totale', 'Stato', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fatture.map((f, idx) => (
                  <tr
                    key={f.id}
                    style={{ borderBottom: idx < fatture.length - 1 ? '0.5px solid #f0ede6' : 'none', cursor: 'pointer', background: selezionata?.id === f.id ? '#faf9f7' : 'white' }}
                    onClick={() => setSelezionata(selezionata?.id === f.id ? null : f)}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{f.numero}</td>
                    <td style={{ padding: '10px 12px' }}>{nomeClienteFattura(f)}</td>
                    <td style={{ padding: '10px 12px', color: '#888' }}>{nomeCameraFattura(f)}</td>
                    <td style={{ padding: '10px 12px', color: '#888' }}>{periodoFattura(f)}</td>
                    <td style={{ padding: '10px 12px' }}>{formatEuro(f.imponibile)}</td>
                    <td style={{ padding: '10px 12px', color: '#888' }}>{formatEuro(f.iva)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{formatEuro(f.totale)}</td>
                    <td style={{ padding: '10px 12px' }}><Badge stato={f.stato} /></td>
                    <td style={{ padding: '10px 12px', color: '#BA7517', fontSize: '12px' }}>Dettaglio →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selezionata && (
          <div style={{ marginTop: '1.25rem', background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dettaglio fattura {selezionata.numero}
              </div>
              <button onClick={() => setSelezionata(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {([
                { label: 'Cliente',      valore: nomeClienteFattura(selezionata) },
                { label: 'Camera',       valore: nomeCameraFattura(selezionata) },
                { label: 'Periodo',      valore: periodoFattura(selezionata) },
                { label: 'Data fattura', valore: selezionata.data_fattura ? formatData(selezionata.data_fattura) : '—' },
                { label: 'Imponibile',   valore: formatEuro(selezionata.imponibile) },
                { label: 'IVA 10%',      valore: formatEuro(selezionata.iva) },
                { label: 'Totale',       valore: formatEuro(selezionata.totale) },
                { label: 'Stato',        valore: <Badge stato={selezionata.stato} /> },
              ] as { label: string; valore: React.ReactNode }[]).map((item, i) => (
                <div key={i} style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.valore}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => generaPDF(selezionata)}
                style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}
              >Scarica PDF</button>
              {selezionata.stato === 'bozza' && (
                <button
                  onClick={() => aggiornaStato(selezionata, 'inviata')}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}
                >Segna come inviata</button>
              )}
              {selezionata.stato !== 'pagata' && (
                <button
                  onClick={() => aggiornaStato(selezionata, 'pagata')}
                  style={{ padding: '7px 14px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}
                >Segna come pagata</button>
              )}
            </div>
          </div>
        )}
      </div>

      {mostraForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setMostraForm(false) }}
        >
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '1.25rem' }}>Nuova fattura</div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Prenotazione *</label>
              <select
                value={form.prenotazione_id}
                onChange={e => {
                  const pren = prenotazioni.find(p => p.id === e.target.value)
                  const imponibile = pren?.prezzo_totale != null
                    ? Math.round(pren.prezzo_totale / (1 + IVA) * 100) / 100
                    : 0
                  setForm({ ...form, prenotazione_id: e.target.value, imponibile })
                }}
                style={{ ...inputStyle, background: 'white' }}
              >
                <option value="">— Seleziona prenotazione —</option>
                {prenotazioni.map(p => {
                  const c = Array.isArray(p.clienti) ? p.clienti[0] : p.clienti
                  const cam = Array.isArray(p.camere) ? p.camere[0] : p.camere
                  return (
                    <option key={p.id} value={p.id}>
                      {c ? `${c.cognome} ${c.nome}` : '—'} · {cam?.nome ?? '—'} · {formatData(p.data_arrivo)}
                    </option>
                  )
                })}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Imponibile (€) *</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.imponibile}
                  onChange={e => setForm({ ...form, imponibile: Number(e.target.value) })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>IVA 10%</label>
                <input
                  type="number"
                  value={iva}
                  readOnly
                  style={{ ...inputStyle, background: '#f5f4f0', color: '#888' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Totale</label>
                <input
                  type="number"
                  value={totale}
                  readOnly
                  style={{ ...inputStyle, background: '#f5f4f0', color: '#888' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Stato</label>
              <select
                value={form.stato}
                onChange={e => setForm({ ...form, stato: e.target.value as 'bozza' | 'inviata' | 'pagata' })}
                style={{ ...inputStyle, background: 'white' }}
              >
                <option value="bozza">Bozza</option>
                <option value="inviata">Inviata</option>
                <option value="pagata">Pagata</option>
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
                onClick={creaFattura}
                disabled={salvando || !form.prenotazione_id || form.imponibile <= 0}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: salvando || !form.prenotazione_id || form.imponibile <= 0 ? 'default' : 'pointer', opacity: salvando || !form.prenotazione_id || form.imponibile <= 0 ? 0.7 : 1 }}
              >
                {salvando ? 'Salvataggio...' : 'Crea fattura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
