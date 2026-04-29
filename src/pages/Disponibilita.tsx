import { useState } from 'react'
import Layout from '../components/Layout'

type StatoGiorno = 'libero' | 'occupato' | 'chiuso'

interface Giorno {
  numero: number
  stato: StatoGiorno
}

function generaMese(anno: number, mese: number, occupati: number[], chiusi: number[]): Giorno[] {
  const giorni = new Date(anno, mese, 0).getDate()
  return Array.from({ length: giorni }, (_, i) => {
    const n = i + 1
    const stato: StatoGiorno = chiusi.includes(n) ? 'chiuso' : occupati.includes(n) ? 'occupato' : 'libero'
    return { numero: n, stato }
  })
}

function coloreGiorno(stato: StatoGiorno) {
  if (stato === 'chiuso') return { bg: '#FCEBEB', color: '#A32D2D' }
  if (stato === 'occupato') return { bg: '#FAEEDA', color: '#854F0B' }
  return { bg: '#E1F5EE', color: '#0F6E56' }
}

function MiniCalendario({ nome, giorni, primoGiorno }: { nome: string, giorni: Giorno[], primoGiorno: number }) {
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
          const c = coloreGiorno(g.stato)
          return (
            <div key={g.numero} style={{
              height: '28px', borderRadius: '3px',
              background: c.bg, color: c.color,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '11px',
              cursor: 'pointer'
            }}>{g.numero}</div>
          )
        })}
      </div>
    </div>
  )
}

const APR_OCC = [1,2,3,4,5,6,7,8,9,10,13,14,15,16,17,18,19,20,21,23,24,25]
const APR_CHIUSI = [11,12]
const MAG_OCC = [1,2,3,7,8,9,10,15,16,22,23,24,25,26,27,28]
const MAG_CHIUSI = [12,13,14]

export default function Disponibilita() {
  const [bloccoInizio, setBloccoInizio] = useState('')
  const [bloccoFine, setBloccoFine] = useState('')
  const [bloccoNota, setBloccoNota] = useState('')

  const aprile = generaMese(2026, 4, APR_OCC, APR_CHIUSI)
  const maggio = generaMese(2026, 5, MAG_OCC, MAG_CHIUSI)

  const primoGiornoApr = new Date(2026, 3, 1).getDay()
  const primoGiornoMag = new Date(2026, 4, 1).getDay()

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif', marginBottom: '1rem' }}>Disponibilità</h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#0F6E56', fontWeight: 500 }}>■ Libero</span>
          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#FAEEDA', color: '#854F0B', fontWeight: 500 }}>■ Occupato</span>
          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#FCEBEB', color: '#A32D2D', fontWeight: 500 }}>■ Chiuso</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <MiniCalendario nome="Aprile 2026" giorni={aprile} primoGiorno={primoGiornoApr} />
          <MiniCalendario nome="Maggio 2026" giorni={maggio} primoGiorno={primoGiornoMag} />
        </div>

        <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Blocca periodo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Data inizio</label>
              <input type="date" value={bloccoInizio} onChange={e => setBloccoInizio(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Data fine</label>
              <input type="date" value={bloccoFine} onChange={e => setBloccoFine(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Nota</label>
              <input type="text" value={bloccoNota} onChange={e => setBloccoNota(e.target.value)}
                placeholder="Es. Manutenzione"
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif' }} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}>Salva blocco</button>
          </div>
        </div>
      </div>
    </Layout>
  )
}