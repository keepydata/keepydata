import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [utente, setUtente] = useState<{ email?: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUtente(data.user)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f4f0',
      fontFamily: 'Georgia, serif'
    }}>
      <div style={{
        background: 'white',
        borderBottom: '0.5px solid #e0ddd6',
        padding: '0 1.75rem',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '17px', fontWeight: '500' }}>Keepydata</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#888', fontFamily: 'sans-serif' }}>
            {utente?.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 12px', borderRadius: '8px',
              border: '0.5px solid #ccc', background: 'white',
              fontSize: '13px', cursor: 'pointer',
              fontFamily: 'sans-serif'
            }}
          >
            Esci
          </button>
        </div>
      </div>

      <div style={{ padding: '1.75rem' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          marginBottom: '1.5rem'
        }}>Dashboard</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Occupazione oggi', valore: '80%', sub: '4 su 5 camere' },
            { label: 'Fatturato mese', valore: '€ 4.820', sub: '+12% vs mese scorso' },
            { label: 'Check-in oggi', valore: '2', sub: 'Rossi, Müller' },
            { label: 'Check-out oggi', valore: '1', sub: 'Camera Tramonto' }
          ].map((kpi, i) => (
            <div key={i} style={{
              background: '#f5f4f0',
              borderRadius: '8px',
              padding: '1rem 1.25rem'
            }}>
              <div style={{
                fontSize: '12px', color: '#888',
                marginBottom: '6px', fontFamily: 'sans-serif'
              }}>{kpi.label}</div>
              <div style={{
                fontSize: '24px', fontWeight: '500',
                lineHeight: '1', fontFamily: 'sans-serif'
              }}>{kpi.valore}</div>
              <div style={{
                fontSize: '11px', color: '#888',
                marginTop: '4px', fontFamily: 'sans-serif'
              }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'white',
          border: '0.5px solid #e0ddd6',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{
            fontSize: '11px', fontWeight: '500',
            color: '#888', textTransform: 'uppercase',
            letterSpacing: '0.5px', marginBottom: '1rem',
            fontFamily: 'sans-serif'
          }}>Movimenti di oggi</div>
          {[
            { tipo: 'CHECK-IN', testo: 'Fam. Rossi → Camera Marina', colore: '#1D9E75', bg: '#E1F5EE' },
            { tipo: 'CHECK-IN', testo: 'Klaus Müller → Camera Levante', colore: '#1D9E75', bg: '#E1F5EE' },
            { tipo: 'CHECK-OUT', testo: 'Sarah Lee → Camera Tramonto', colore: '#185FA5', bg: '#E6F1FB' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 0',
              borderBottom: i < 2 ? '0.5px solid #f0ede6' : 'none',
              fontFamily: 'sans-serif', fontSize: '13px'
            }}>
              <span style={{
                fontSize: '10px', padding: '2px 7px',
                borderRadius: '20px', fontWeight: '500',
                background: item.bg, color: item.colore
              }}>{item.tipo}</span>
              <span>{item.testo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}