import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: '4px',
  padding: '9px 12px', borderRadius: '8px',
  border: '0.5px solid #ccc', fontSize: '14px',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', color: '#666', fontWeight: '500',
}

export default function Registrati() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [citta, setCitta] = useState('')
  const [cap, setCap] = useState('')
  const [provincia, setProvincia] = useState('')
  const [indirizzo, setIndirizzo] = useState('')
  const [piva, setPiva] = useState('')
  const [telefono, setTelefono] = useState('')

  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState('')

  async function handleRegistrazione() {
    if (!email || !password || !nome || !citta || !indirizzo) {
      setErrore('Compila tutti i campi obbligatori.')
      return
    }
    if (password.length < 6) {
      setErrore('La password deve essere di almeno 6 caratteri.')
      return
    }

    setCaricamento(true)
    setErrore('')

    try {
      // 1. Crea utente in Supabase Auth
      const { data: authData, error: errAuth } = await supabase.auth.signUp({ email, password })
      if (errAuth) throw errAuth
      const user = authData.user
      if (!user) throw new Error('Creazione utente non riuscita.')

      // 2. Autentica subito l'utente appena creato
      const { error: errLogin } = await supabase.auth.signInWithPassword({ email, password })
      if (errLogin) throw errLogin

      // Attende che la sessione JWT sia propagata nel client prima degli insert RLS
      await new Promise(resolve => setTimeout(resolve, 500))

      // 3. Inserisce la struttura
      const { data: strutturaData, error: errStruttura } = await supabase
        .from('strutture')
        .insert({ nome, citta, cap, provincia: provincia.toUpperCase(), indirizzo, piva, telefono, email })
        .select('id')
        .single()
      if (errStruttura) throw errStruttura

      // 4. Collega utente alla struttura
      const { error: errUtente } = await supabase
        .from('utenti')
        .insert({ id: user.id, struttura_id: strutturaData.id, email, ruolo: 'proprietario', attivo: true })
      if (errUtente) throw errUtente

      navigate('/dashboard')
    } catch (e: unknown) {
      setErrore((e as Error).message ?? 'Errore durante la registrazione.')
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f5f4f0', padding: '2rem',
    }}>
      <div style={{
        background: 'white', borderRadius: '12px',
        border: '0.5px solid #e0ddd6', padding: '2.5rem',
        width: '100%', maxWidth: '480px',
      }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '500', marginBottom: '4px' }}>
          Keepydata
        </h1>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '2rem' }}>
          Crea il tuo account B&B
        </p>

        {/* Accesso */}
        <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Credenziali di accesso
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="nome@email.it" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="min. 6 caratteri" style={inputStyle} />
          </div>
        </div>

        {/* Dati struttura */}
        <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Dati struttura
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          <div style={{ gridColumn: 'span 4' }}>
            <label style={labelStyle}>Nome struttura *</label>
            <input value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Es. B&B Il Girasole" style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <label style={labelStyle}>Indirizzo *</label>
            <input value={indirizzo} onChange={e => setIndirizzo(e.target.value)}
              placeholder="Via Roma, 12" style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Città *</label>
            <input value={citta} onChange={e => setCitta(e.target.value)}
              placeholder="Es. Firenze" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>CAP</label>
            <input
              value={cap}
              onChange={e => setCap(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="50100"
              maxLength={5}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Prov.</label>
            <input
              value={provincia}
              onChange={e => setProvincia(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())}
              placeholder="FI"
              maxLength={2}
              style={{ ...inputStyle, textTransform: 'uppercase' }}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Telefono</label>
            <input value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="+39 000 0000000" style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Partita IVA</label>
            <input value={piva} onChange={e => setPiva(e.target.value)}
              placeholder="IT12345678901" style={inputStyle} />
          </div>
        </div>

        {errore && (
          <p style={{
            fontSize: '13px', color: '#c0392b', marginBottom: '12px',
            padding: '8px 12px', background: '#fdf0ee', borderRadius: '6px',
          }}>{errore}</p>
        )}

        <button
          onClick={handleRegistrazione}
          disabled={caricamento}
          style={{
            width: '100%', padding: '10px', background: '#BA7517',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: '500',
            cursor: caricamento ? 'not-allowed' : 'pointer',
            opacity: caricamento ? 0.7 : 1,
          }}
        >
          {caricamento ? 'Registrazione in corso...' : 'Crea account'}
        </button>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '13px', color: '#888' }}>
          Hai già un account?{' '}
          <Link to="/" style={{ color: '#BA7517', textDecoration: 'none', fontWeight: 500 }}>
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}
