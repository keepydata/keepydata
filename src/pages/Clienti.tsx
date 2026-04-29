import { useState } from 'react'
import Layout from '../components/Layout'

interface Cliente {
  id: number
  nome: string
  cognome: string
  email: string
  telefono: string
  nazionalita: string
  soggiorni: number
  ultimaVisita: string
  stato: string
}

const CLIENTI: Cliente[] = [
  { id: 1, nome: 'Marco', cognome: 'Rossi', email: 'marco.rossi@email.it', telefono: '+39 333 1234567', nazionalita: '🇮🇹 Italia', soggiorni: 3, ultimaVisita: 'In corso', stato: 'presente' },
  { id: 2, nome: 'Klaus', cognome: 'Müller', email: 'k.muller@email.de', telefono: '+49 170 9876543', nazionalita: '🇩🇪 Germania', soggiorni: 1, ultimaVisita: 'In corso', stato: 'presente' },
  { id: 3, nome: 'Sarah', cognome: 'Lee', email: 'sarah.lee@email.co.uk', telefono: '+44 7700 123456', nazionalita: '🇬🇧 UK', soggiorni: 2, ultimaVisita: '16 apr 2026', stato: 'checkout' },
  { id: 4, nome: 'Marco', cognome: 'Bianchi', email: 'm.bianchi@email.it', telefono: '+39 347 7654321', nazionalita: '🇮🇹 Italia', soggiorni: 1, ultimaVisita: 'Atteso 20 apr', stato: 'prenotato' },
  { id: 5, nome: 'Yuki', cognome: 'Nakamura', email: 'y.nakamura@email.jp', telefono: '+81 90 1234 5678', nazionalita: '🇯🇵 Giappone', soggiorni: 1, ultimaVisita: 'Atteso 21 apr', stato: 'prenotato' },
  { id: 6, nome: 'Claire', cognome: 'Dubois', email: 'c.dubois@email.fr', telefono: '+33 6 12 34 56 78', nazionalita: '🇫🇷 Francia', soggiorni: 2, ultimaVisita: '18 apr 2026', stato: 'prenotato' },
  { id: 7, nome: 'Li', cognome: 'Wang', email: 'li.wang@email.cn', telefono: '+86 138 1234 5678', nazionalita: '🇨🇳 Cina', soggiorni: 1, ultimaVisita: 'Atteso 24 apr', stato: 'prenotato' },
]

function iniziali(nome: string, cognome: string) {
  return (nome[0] + cognome[0]).toUpperCase()
}

function coloreAvatar(stato: string) {
  if (stato === 'presente') return { bg: '#E1F5EE', color: '#0F6E56' }
  if (stato === 'checkout') return { bg: '#E6F1FB', color: '#185FA5' }
  return { bg: '#FAEEDA', color: '#854F0B' }
}

function Badge({ stato }: { stato: string }) {
  const map: Record<string, { label: string, bg: string, color: string }> = {
    presente: { label: 'Presente', bg: '#E1F5EE', color: '#0F6E56' },
    checkout: { label: 'Check-out', bg: '#E6F1FB', color: '#185FA5' },
    prenotato: { label: 'Prenotato', bg: '#FAEEDA', color: '#854F0B' },
  }
  const s = map[stato] ?? map.prenotato
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export default function Clienti() {
  const [ricerca, setRicerca] = useState('')
  const [selezionato, setSelezionato] = useState<Cliente | null>(null)

  const filtrati = CLIENTI.filter(c =>
    `${c.nome} ${c.cognome} ${c.email} ${c.nazionalita}`.toLowerCase().includes(ricerca.toLowerCase())
  )

  return (
    <Layout>
      <div style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'Georgia, serif' }}>Clienti</h1>
          <button style={{ padding: '8px 16px', borderRadius: '8px', background: '#BA7517', color: 'white', border: 'none', fontSize: '13px', cursor: 'pointer' }}>+ Nuovo cliente</button>
        </div>

        <input
          type="text"
          placeholder="Cerca per nome, email, nazionalità..."
          value={ricerca}
          onChange={e => setRicerca(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid #ccc', fontSize: '13px', fontFamily: 'sans-serif', marginBottom: '1rem', background: 'white', color: '#333' }}
        />

        <div style={{ background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e0ddd6' }}>
                {['Ospite', 'Nazionalità', 'Soggiorni', 'Ultima visita', 'Stato', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrati.map(c => {
                const av = coloreAvatar(c.stato)
                return (
                  <tr key={c.id} style={{ borderBottom: '0.5px solid #f0ede6', cursor: 'pointer' }} onClick={() => setSelezionato(c === selezionato ? null : c)}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, flexShrink: 0 }}>
                          {iniziali(c.nome, c.cognome)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.nome} {c.cognome}</div>
                          <div style={{ fontSize: '11px', color: '#888' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{c.nazionalita}</td>
                    <td style={{ padding: '10px 12px' }}>{c.soggiorni}</td>
                    <td style={{ padding: '10px 12px', color: '#888' }}>{c.ultimaVisita}</td>
                    <td style={{ padding: '10px 12px' }}><Badge stato={c.stato} /></td>
                    <td style={{ padding: '10px 12px', color: '#BA7517', fontSize: '12px' }}>Dettaglio →</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {selezionato && (
          <div style={{ marginTop: '1.25rem', background: 'white', border: '0.5px solid #e0ddd6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Dettaglio cliente</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Nome completo', valore: `${selezionato.nome} ${selezionato.cognome}` },
                { label: 'Email', valore: selezionato.email },
                { label: 'Telefono', valore: selezionato.telefono },
                { label: 'Nazionalità', valore: selezionato.nazionalita },
                { label: 'Soggiorni totali', valore: String(selezionato.soggiorni) },
                { label: 'Ultima visita', valore: selezionato.ultimaVisita },
              ].map((item, i) => (
                <div key={i} style={{ background: '#f5f4f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.valore}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer' }}>Modifica</button>
              <button style={{ padding: '7px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: 'white', fontSize: '13px', cursor: 'pointer', color: '#c0392b' }}>Elimina</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}