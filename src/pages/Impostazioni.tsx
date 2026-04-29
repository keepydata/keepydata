import { useState } from 'react'
import Layout from '../components/Layout'

interface Camera {
  id: number
  nome: string
  tipo: string
  posti: number
  prezzo: number
  attiva: boolean
}

const CAMERE_DEFAULT: Camera[] = [
  { id: 1, nome: 'Camera Tramonto', tipo: 'Doppia standard', posti: 2, prezzo: 130, attiva: true },
  { id: 2, nome: 'Camera Marina', tipo: 'Tripla', posti: 3, prezzo: 120, attiva: true },
  { id: 3, nome: 'Camera Pini', tipo: 'Doppia classic', posti: 2, prezzo: 100, attiva: true },
  { id: 4, nome: 'Camera Levante', tipo: 'Singola superior', posti: 1, prezzo: 90, attiva: true },
  { id: 5, nome: 'Suite Terrazza', tipo: 'Suite con terrazza', posti: 2, prezzo: 150, attiva: true },
]

export default function Impostazioni() {
  const [camere, setCamere] = useState<Camera[]>(CAMERE_DEFAULT)
  const [struttura, setStruttura] = useState({
    nome: 'B&B La Terrazza',
    piva: 'IT 12345678901',
    indirizzo: 'Via Aurelia 42, Viareggio',
    email: 'info@laterrazza.it',
    telefono: '+39 0584 123456',
    citta: 'Viareggio'
  })
  const [salvato, setSalvato] = useState(false)

  function salvaStruttura() {
    setSalvato(true)
    setTimeout(() => setSalvato(false), 2000)
  }

  function toggleCamera(id: number) {
    setCamere(camere.map(c => c.id === id ? { ...c, attiva: !c.attiva } : c))
  }

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif', marginBottom: '1.5rem' }}>Impostazioni</h1>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Dati struttura</div>
          <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Nome struttura', key: 'nome' },
                { label: 'Partita IVA', key: 'piva' },
                { label: 'Indirizzo', key: 'indirizzo' },
                { label: 'Città', key: 'citta' },
                { label: 'Email', key: 'email' },
                { label: 'Telefono', key: 'telefono' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>{field.label}</label>
                  <input
                    value={struttura[field.key as keyof typeof struttura]}
                    onChange={e => setStruttura({ ...struttura, [field.key]: e.target.value })}
                    style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
              {salvato && <span style={{ fontSize: '12px', color: '#0F6E56' }}>✓ Salvato!</span>}
              <button onClick={salvaStruttura} style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}>Salva</button>
            </div>
          </div>
        </div>

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
                    onClick={() => toggleCamera(c.id)}
                    style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      border: 'none', cursor: 'pointer', fontWeight: 500,
                      background: c.attiva ? '#E1F5EE' : '#F1EFE8',
                      color: c.attiva ? '#0F6E56' : '#5F5E5A'
                    }}
                  >{c.attiva ? 'Attiva' : 'Inattiva'}</button>
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{c.tipo} · {c.posti} {c.posti === 1 ? 'posto' : 'posti'}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: '#BA7517' }}>€ {c.prezzo} <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>/ notte</span></div>
              </div>
            ))}
            <div style={{
              background: 'white', border: '0.5px dashed #ccc',
              borderRadius: '12px', padding: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#888', fontSize: '13px'
            }}>+ Aggiungi camera</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}