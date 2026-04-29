import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const voci = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Prenotazioni', path: '/prenotazioni' },
    { label: 'Check-in / Check-out', path: '/checkin' },
    { label: 'Clienti', path: '/clienti' },
    { label: 'Fatturazione', path: '/fatturazione' },
    { label: 'Disponibilità', path: '/disponibilita' },
    { label: 'Impostazioni', path: '/impostazioni' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{
        width: '220px', background: 'white',
        borderRight: '0.5px solid #e0ddd6',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0
      }}>
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '0.5px solid #e0ddd6' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 500 }}>Keepydata</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Gestione B&B</div>
        </div>

        <nav style={{ padding: '0.75rem 0', flex: 1 }}>
          {voci.map(voce => (
            <div
              key={voce.path}
              onClick={() => navigate(voce.path)}
              style={{
                padding: '9px 1.25rem',
                fontSize: '13.5px',
                cursor: 'pointer',
                borderLeft: location.pathname === voce.path ? '2.5px solid #BA7517' : '2.5px solid transparent',
                background: location.pathname === voce.path ? '#FAEEDA' : 'transparent',
                color: location.pathname === voce.path ? '#854F0B' : '#666',
                fontWeight: location.pathname === voce.path ? 500 : 400,
              }}
            >{voce.label}</div>
          ))}
        </nav>

        <div style={{ padding: '1rem 1.25rem', borderTop: '0.5px solid #e0ddd6' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>B&B La Terrazza</div>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>5 camere</div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '6px', borderRadius: '8px',
              border: '0.5px solid #ccc', background: 'white',
              fontSize: '12px', cursor: 'pointer'
            }}
          >Esci</button>
        </div>
      </aside>

      <main style={{ marginLeft: '220px', flex: 1, background: '#f5f4f0', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}