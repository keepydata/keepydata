import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

function getNome(utente: { email?: string; user_metadata?: Record<string, string> } | null): string {
  if (!utente) return ''
  const meta = utente.user_metadata
  if (meta?.full_name) return meta.full_name
  if (meta?.name) return meta.name
  if (utente.email) return utente.email.split('@')[0]
  return ''
}

export default function Dashboard() {
  const [utente, setUtente] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUtente(data.user)
    })
  }, [])

  const nome = getNome(utente)
  const ora = new Date().getHours()
  const saluto = ora < 12 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif', margin: 0 }}>Dashboard</h1>
          {nome && (
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#666' }}>
              {saluto}, <strong style={{ color: '#333' }}>{nome}</strong> — ecco il riepilogo di oggi.
            </p>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          {[
            { label: 'Occupazione oggi', valore: '80%', sub: '4 su 5 camere' },
            { label: 'Fatturato mese', valore: '€ 4.820', sub: '+12% vs mese scorso' },
            { label: 'Check-in oggi', valore: '2', sub: 'Rossi, Müller' },
            { label: 'Check-out oggi', valore: '1', sub: 'Camera Tramonto' }
          ].map((kpi, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '1rem 1.25rem', border: '0.5px solid #e0ddd6' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{kpi.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 500, lineHeight: '1' }}>{kpi.valore}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Movimenti di oggi</div>
          {[
            { tipo: 'CHECK-IN', testo: 'Fam. Rossi → Camera Marina', colore: '#1D9E75', bg: '#E1F5EE' },
            { tipo: 'CHECK-IN', testo: 'Klaus Müller → Camera Levante', colore: '#1D9E75', bg: '#E1F5EE' },
            { tipo: 'CHECK-OUT', testo: 'Sarah Lee → Camera Tramonto', colore: '#185FA5', bg: '#E6F1FB' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 2 ? '0.5px solid #f0ede6' : 'none', fontSize: '13px' }}>
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: 500, background: item.bg, color: item.colore }}>{item.tipo}</span>
              <span>{item.testo}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}