import { useState } from 'react'
import Layout from '../components/Layout'

interface Prenotazione {
  id: number
  camera: string
  cliente: string
  dal: number
  al: number
  colore: string
  testo: string
}

const CAMERE = ['Tramonto', 'Marina', 'Pini', 'Levante', 'Suite Terrazza']

const PRENOTAZIONI: Prenotazione[] = [
  { id: 1, camera: 'Tramonto', cliente: 'Lee', dal: 13, al: 16, colore: '#FAEEDA', testo: '#854F0B' },
  { id: 2, camera: 'Tramonto', cliente: 'Rossi', dal: 17, al: 21, colore: '#E1F5EE', testo: '#0F6E56' },
  { id: 3, camera: 'Marina', cliente: 'Fam. Rossi', dal: 16, al: 21, colore: '#E1F5EE', testo: '#0F6E56' },
  { id: 4, camera: 'Marina', cliente: 'Nakamura', dal: 22, al: 26, colore: '#FAEEDA', testo: '#854F0B' },
  { id: 5, camera: 'Pini', cliente: 'Dubois', dal: 18, al: 22, colore: '#E6F1FB', testo: '#185FA5' },
  { id: 6, camera: 'Pini', cliente: 'Wang', dal: 24, al: 27, colore: '#E1F5EE', testo: '#0F6E56' },
  { id: 7, camera: 'Levante', cliente: 'Müller', dal: 16, al: 20, colore: '#E6F1FB', testo: '#185FA5' },
  { id: 8, camera: 'Levante', cliente: 'García', dal: 22, al: 25, colore: '#FAEEDA', testo: '#854F0B' },
  { id: 9, camera: 'Suite Terrazza', cliente: 'Bianchi', dal: 20, al: 25, colore: '#E1F5EE', testo: '#0F6E56' },
]

const GIORNI = Array.from({ length: 14 }, (_, i) => i + 16)

function RigaCamera({ camera, selezionata, onSeleziona }: {
  camera: string
  selezionata: number | null
  onSeleziona: (id: number | null) => void
}) {
  return (
    <>
      <div style={{
        fontSize: '12px', fontWeight: '500',
        color: '#666', display: 'flex',
        alignItems: 'center', padding: '4px 0'
      }}>{camera}</div>
      {GIORNI.map(giorno => {
        const pren = PRENOTAZIONI.find(p => p.camera === camera && giorno >= p.dal && giorno < p.al)
        const inizio = pren ? giorno === pren.dal : false

        if (pren && inizio) {
          return (
            <div
              key={giorno}
              onClick={() => onSeleziona(pren.id === selezionata ? null : pren.id)}
              style={{
                height: '36px', background: pren.colore,
                borderRadius: '4px 0 0 4px',
                display: 'flex', alignItems: 'center',
                paddingLeft: '8px', fontSize: '11px',
                fontWeight: '500', color: pren.testo,
                cursor: 'pointer', whiteSpace: 'nowrap',
                overflow: 'hidden',
                outline: pren.id === selezionata ? `2px solid ${pren.testo}` : 'none'
              }}
            >{pren.cliente}</div>
          )
        }

        if (pren && !inizio) {
          return (
            <div key={giorno} style={{
              height: '36px',
              background: pren.colore
            }} />
          )
        }

        return (
          <div key={giorno} style={{
            height: '36px', borderRadius: '3px',
            background: '#f5f4f0'
          }} />
        )
      })}
    </>
  )
}

export default function Prenotazioni() {
  const [selezionata, setSelezionata] = useState<number | null>(null)
  const prenotazioneSelezionata = PRENOTAZIONI.find(x => x.id === selezionata)

 return (
    <Layout>
    <div style={{ padding: '1.75rem', fontFamily: 'sans-serif' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '1.5rem'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', fontFamily: 'Georgia, serif' }}>
          Prenotazioni
        </h1>
        <button style={{
          padding: '8px 16px', borderRadius: '8px',
          background: '#BA7517', color: 'white',
          border: 'none', fontSize: '13px', cursor: 'pointer'
        }}>+ Nuova prenotazione</button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#0F6E56', fontWeight: '500' }}>● In corso</span>
        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#FAEEDA', color: '#854F0B', fontWeight: '500' }}>● Confermata</span>
        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#E6F1FB', color: '#185FA5', fontWeight: '500' }}>● In arrivo</span>
      </div>

      <div style={{
        background: 'white', border: '0.5px solid #e0ddd6',
        borderRadius: '12px', overflow: 'auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `100px repeat(${GIORNI.length}, 1fr)`,
          gap: '2px', padding: '12px', minWidth: '700px'
        }}>
          <div></div>
          {GIORNI.map(g => (
            <div key={g} style={{
              textAlign: 'center', fontSize: '12px',
              color: g === 16 ? '#BA7517' : '#888',
              fontWeight: g === 16 ? '500' : '400',
              padding: '4px 0'
            }}>{g}</div>
          ))}

          {CAMERE.map(camera => (
            <RigaCamera
              key={camera}
              camera={camera}
              selezionata={selezionata}
              onSeleziona={setSelezionata}
            />
          ))}
        </div>
      </div>

      {prenotazioneSelezionata && (
        <div style={{
          marginTop: '1.25rem', background: 'white',
          border: '0.5px solid #e0ddd6', borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{
            fontSize: '11px', fontWeight: '500', color: '#888',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'
          }}>Dettaglio prenotazione</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Cliente', valore: prenotazioneSelezionata.cliente },
              { label: 'Camera', valore: prenotazioneSelezionata.camera },
              { label: 'Arrivo', valore: `${prenotazioneSelezionata.dal} apr 2026` },
              { label: 'Partenza', valore: `${prenotazioneSelezionata.al} apr 2026` },
            ].map((item, i) => (
              <div key={i} style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.valore}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button style={{
              padding: '7px 14px', borderRadius: '8px',
              border: '0.5px solid #ccc', background: 'white',
              fontSize: '13px', cursor: 'pointer'
            }}>Modifica</button>
            <button style={{
              padding: '7px 14px', borderRadius: '8px',
              border: '0.5px solid #ccc', background: 'white',
              fontSize: '13px', cursor: 'pointer', color: '#c0392b'
            }}>Elimina</button>
          </div>
        </div>
      )}
    </div>
    </Layout>
  )
}