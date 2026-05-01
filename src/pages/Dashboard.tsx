import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

interface PrenOggi {
  data_arrivo: string
  data_partenza: string
  camera_id: string
  camere: { nome: string }[] | null
  clienti: { nome: string; cognome: string }[] | null
}

interface Movimento {
  tipo: 'CHECK-IN' | 'CHECK-OUT'
  testo: string
}

function getNome(utente: { email?: string; user_metadata?: Record<string, string> } | null): string {
  if (!utente) return ''
  const meta = utente.user_metadata
  if (meta?.full_name) return meta.full_name
  if (meta?.name) return meta.name
  if (utente.email) return utente.email.split('@')[0]
  return ''
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nomeCliente(p: PrenOggi): string {
  const c = Array.isArray(p.clienti) ? p.clienti[0] : p.clienti
  if (!c) return '—'
  return `${c.cognome} ${c.nome}`.trim()
}

function nomeCamera(p: PrenOggi): string {
  const cam = Array.isArray(p.camere) ? p.camere[0] : p.camere
  return cam?.nome ?? '—'
}

export default function Dashboard() {
  const [utente, setUtente] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [occupazione, setOccupazione] = useState<{ occupate: number; totale: number } | null>(null)
  const [checkins, setCheckins] = useState<PrenOggi[]>([])
  const [checkouts, setCheckouts] = useState<PrenOggi[]>([])
  const [movimenti, setMovimenti] = useState<Movimento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function caricaDati() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUtente(user)

        const { data: utenteData, error: errUtente } = await supabase
          .from('utenti')
          .select('struttura_id')
          .eq('id', user.id)
          .single()

        if (errUtente || !utenteData?.struttura_id) return
        const sid = utenteData.struttura_id
        const oggi = localDateStr(new Date())

        const [camereRes, prenRes] = await Promise.all([
          supabase.from('camere').select('id').eq('struttura_id', sid).eq('attiva', true),
          supabase
            .from('prenotazioni')
            .select('data_arrivo, data_partenza, camera_id, camere(nome), clienti(nome, cognome)')
            .eq('struttura_id', sid)
            .neq('stato', 'cancellata'),
        ])

        if (camereRes.error) throw camereRes.error
        if (prenRes.error) throw prenRes.error

        const totale = camereRes.data?.length ?? 0
        const prenotazioni = (prenRes.data ?? []) as PrenOggi[]

        const ciOggi = prenotazioni.filter(p => p.data_arrivo === oggi)
        const coOggi = prenotazioni.filter(p => p.data_partenza === oggi)
        const occupateIds = new Set(
          prenotazioni
            .filter(p => p.data_arrivo <= oggi && p.data_partenza > oggi)
            .map(p => p.camera_id)
        )

        setCheckins(ciOggi)
        setCheckouts(coOggi)
        setOccupazione({ occupate: occupateIds.size, totale })
        setMovimenti([
          ...ciOggi.map(p => ({ tipo: 'CHECK-IN' as const, testo: `${nomeCliente(p)} → ${nomeCamera(p)}` })),
          ...coOggi.map(p => ({ tipo: 'CHECK-OUT' as const, testo: `${nomeCliente(p)} → ${nomeCamera(p)}` })),
        ])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    caricaDati()
  }, [])

  const nome = getNome(utente)
  const ora = new Date().getHours()
  const saluto = ora < 12 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'

  const percOcc = occupazione && occupazione.totale > 0
    ? `${Math.round((occupazione.occupate / occupazione.totale) * 100)}%`
    : loading ? '…' : '—'
  const subOcc = occupazione
    ? `${occupazione.occupate} su ${occupazione.totale} camere`
    : loading ? '' : '—'

  const kpi = [
    {
      label: 'Occupazione oggi',
      valore: percOcc,
      sub: subOcc,
    },
    {
      label: 'Check-in oggi',
      valore: loading ? '…' : String(checkins.length),
      sub: loading ? '' : checkins.map(nomeCliente).join(', ') || '—',
    },
    {
      label: 'Check-out oggi',
      valore: loading ? '…' : String(checkouts.length),
      sub: loading ? '' : checkouts.map(nomeCliente).join(', ') || '—',
    },
  ]

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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          {kpi.map((k, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '1rem 1.25rem', border: '0.5px solid #e0ddd6' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 500, lineHeight: '1' }}>{k.valore}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Movimenti di oggi</div>
          {loading ? (
            <div style={{ fontSize: '13px', color: '#aaa' }}>Caricamento…</div>
          ) : movimenti.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#aaa' }}>Nessun movimento oggi.</div>
          ) : movimenti.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 0',
                borderBottom: i < movimenti.length - 1 ? '0.5px solid #f0ede6' : 'none',
                fontSize: '13px',
              }}
            >
              <span style={{
                fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: 500,
                background: item.tipo === 'CHECK-IN' ? '#E1F5EE' : '#E6F1FB',
                color: item.tipo === 'CHECK-IN' ? '#1D9E75' : '#185FA5',
              }}>
                {item.tipo}
              </span>
              <span>{item.testo}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
