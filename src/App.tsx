import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Registrati from './pages/Registrati'
import Dashboard from './pages/Dashboard'
import Prenotazioni from './pages/Prenotazioni'
import Clienti from './pages/Clienti'
import Checkin from './pages/Checkin'
import Fatturazione from './pages/Fatturazione'
import Disponibilita from './pages/Disponibilita'
import Impostazioni from './pages/Impostazioni'

export default function App() {
  const [utente, setUtente] = useState<{ email?: string } | null>(null)
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUtente(data.session?.user ?? null)
      setCaricamento(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUtente(session?.user ?? null)
    })
  }, [])

  if (caricamento) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', color: '#888'
    }}>
      Caricamento...
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={utente ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/registrati" element={utente ? <Navigate to="/dashboard" /> : <Registrati />} />
        <Route path="/dashboard" element={utente ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/prenotazioni" element={utente ? <Prenotazioni /> : <Navigate to="/" />} />
        <Route path="/clienti" element={utente ? <Clienti /> : <Navigate to="/" />} />
        <Route path="/checkin" element={utente ? <Checkin /> : <Navigate to="/" />} />
        <Route path="/fatturazione" element={utente ? <Fatturazione /> : <Navigate to="/" />} />
        <Route path="/disponibilita" element={utente ? <Disponibilita /> : <Navigate to="/" />} />
        <Route path="/impostazioni" element={utente ? <Impostazioni /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}