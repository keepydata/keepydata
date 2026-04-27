import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState('')

  async function handleLogin() {
    setCaricamento(true)
    setErrore('')
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setErrore('Email o password non corretti')
    }
    
    setCaricamento(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f4f0'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '0.5px solid #e0ddd6',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '380px'
      }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '24px',
          fontWeight: '500',
          marginBottom: '4px'
        }}>Keepydata</h1>
        <p style={{
          fontSize: '13px',
          color: '#888',
          marginBottom: '2rem'
        }}>Accedi al tuo B&B</p>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nome@email.it"
            style={{
              display: 'block', width: '100%', marginTop: '4px',
              padding: '9px 12px', borderRadius: '8px',
              border: '0.5px solid #ccc', fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              display: 'block', width: '100%', marginTop: '4px',
              padding: '9px 12px', borderRadius: '8px',
              border: '0.5px solid #ccc', fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {errore && (
          <p style={{
            fontSize: '13px', color: '#c0392b',
            marginBottom: '12px', padding: '8px 12px',
            background: '#fdf0ee', borderRadius: '6px'
          }}>{errore}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={caricamento}
          style={{
            width: '100%', padding: '10px',
            background: '#BA7517', color: 'white',
            border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: '500',
            cursor: caricamento ? 'not-allowed' : 'pointer',
            opacity: caricamento ? 0.7 : 1
          }}
        >
          {caricamento ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </div>
    </div>
  )
}