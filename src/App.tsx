import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Prenotazioni from './pages/Prenotazioni'

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
        <Route path="/dashboard" element={utente ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/prenotazioni" element={utente ? <Prenotazioni /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}