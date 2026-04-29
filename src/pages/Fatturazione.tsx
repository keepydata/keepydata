import { useState } from 'react'
import Layout from '../components/Layout'

interface Fattura {
  id: number
  numero: string
  cliente: string
  camera: string
  periodo: string
  imponibile: number
  iva: number
  totale: number
  stato: 'bozza' | 'inviata' | 'pagata'
}

const FATTURE: Fattura[] = [
  { id: 1, numero: '2026/008', cliente: 'Fam. Rossi', camera: 'Marina', periodo: '16–21 apr', imponibile: 545, iva: 55, totale: 600, stato: 'inviata' },
  { id: 2, numero: '2026/007', cliente: 'Klaus Müller', camera: 'Levante', periodo: '16–20 apr', imponibile: 364, iva: 36, totale: 400, stato: 'inviata' },
  { id: 3, numero: '2026/006', cliente: 'Sarah Lee', camera: 'Tramonto', periodo: '13–16 apr', imponibile: 355, iva: 35, totale: 390, stato: 'pagata' },
  { id: 4, numero: '2026/005', cliente: 'Pierre Garnier', camera: 'Pini', periodo: '10–14 apr', imponibile: 400, iva: 40, totale: 440, stato: 'pagata' },
  { id: 5, numero: '2026/004', cliente: 'Anna Schmidt', camera: 'Levante', periodo: '8–12 apr', imponibile: 327, iva: 33, totale: 360, stato: 'pagata' },
  { id: 6, numero: '2026/003', cliente: 'Marco Bianchi', camera: 'Suite', periodo: '20–25 apr', imponibile: 682, iva: 68, totale: 750, stato: 'bozza' },
]

function Badge({ stato }: { stato: string }) {
  const map: Record<string, { label: string, bg: string, color: string }> = {
    pagata: { label: 'Pagata', bg: '#E1F5EE', color: '#0F6E56' },
    inviata: { label: 'Inviata', bg: '#FAEEDA', color: '#854F0B' },
    bozza: { label: 'Bozza', bg: '#F1EFE8', color: '#5F5E5A' },
  }
  const s = map[stato] ?? map.bozza
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export default function Fatturazione() {
  const [selezionata, setSelezionata] = useState<Fattura | null>(null)

  const fatturato = FATTURE.reduce((acc, f) => acc + f.totale, 0)
  const daIncassare = FATTURE.filter(f => f.stato === 'inviata').reduce((acc, f) => acc + f.totale, 0)
  const incassato = FATTURE.filter(f => f.stato === 'pagata').reduce((acc, f) => acc + f.totale, 0)
  const ivatotale = FATTURE.reduce((acc, f) => acc + f.iva, 0)

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif' }}>Fatturazione</h1>
          <button style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}>+ Nuova fattura</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          {[
            { label: 'Fatturato aprile', valore: `€ ${fatturato.toLocaleString('it-IT')}`, sub: `${FATTURE.length} fatture` },
            { label: 'Da incassare', valore: `€ ${daIncassare.toLocaleString('it-IT')}`, sub: `${FATTURE.filter(f => f.stato === 'inviata').length} fatture inviate` },
            { label: 'Incassato', valore: `€ ${incassato.toLocaleString('it-IT')}`, sub: `${FATTURE.filter(f => f.stato === 'pagata').length} pagate` },
            { label: 'IVA del periodo', valore: `€ ${ivatotale.toLocaleString('it-IT')}`, sub: 'Aliquota 10%' },
          ].map((kpi, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '1rem 1.25rem', border: '0.5px solid #e0ddd6' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{kpi.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 500, lineHeight: '1' }}>{kpi.valore}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e0ddd6' }}>
                {['N°', 'Cliente', 'Camera', 'Periodo', 'Imponibile', 'IVA', 'Totale', 'Stato', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FATTURE.map(f => (
                <tr key={f.id} style={{ borderBottom: '0.5px solid #f0ede6', cursor: 'pointer' }} onClick={() => setSelezionata(f === selezionata ? null : f)}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{f.numero}</td>
                  <td style={{ padding: '10px 12px' }}>{f.cliente}</td>
                  <td style={{ padding: '10px 12px', color: '#888' }}>{f.camera}</td>
                  <td style={{ padding: '10px 12px', color: '#888' }}>{f.periodo}</td>
                  <td style={{ padding: '10px 12px' }}>€ {f.imponibile}</td>
                  <td style={{ padding: '10px 12px', color: '#888' }}>€ {f.iva}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>€ {f.totale}</td>
                  <td style={{ padding: '10px 12px' }}><Badge stato={f.stato} /></td>
                  <td style={{ padding: '10px 12px', color: '#BA7517', fontSize: '12px' }}>Dettaglio →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selezionata && (
          <div style={{ marginTop: '1.25rem', background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Dettaglio fattura {selezionata.numero}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Cliente', valore: selezionata.cliente },
                { label: 'Camera', valore: selezionata.camera },
                { label: 'Periodo', valore: selezionata.periodo },
                { label: 'Stato', valore: selezionata.stato },
                { label: 'Imponibile', valore: `€ ${selezionata.imponibile}` },
                { label: 'IVA 10%', valore: `€ ${selezionata.iva}` },
                { label: 'Totale', valore: `€ ${selezionata.totale}` },
              ].map((item, i) => (
                <div key={i} style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.valore}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}>Scarica PDF</button>
              <button style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}>Modifica</button>
              <button style={{ padding: '7px 14px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}>Segna come pagata</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}