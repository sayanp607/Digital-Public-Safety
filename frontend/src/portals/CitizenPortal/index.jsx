import { useState } from 'react'
import Navbar from '../../components/Navbar'
import ScamDetector from '../../components/ScamDetector'
import FraudChat from '../../components/FraudChat'
import CitizenReport from '../../components/CitizenReport'
import CitizenLogin from '../../components/CitizenLogin'
import DeepfakeScanner from '../../components/DeepfakeScanner'

const TABS = [
  { id: 'detector', icon: '🕵️', label: 'Scam Detector' },
  { id: 'deepfake', icon: '🎭', label: 'Deepfake Scanner' },
  { id: 'chat',     icon: '🤖', label: 'Fraud Shield Chat' },
  { id: 'report',   icon: '🚨', label: 'File Official Report' },
]

export default function CitizenPortal() {
  const [tab, setTab] = useState('detector')
  const [user, setUser] = useState(null)

  if (!user) {
    return (
      <div className="page" data-portal="citizen">
        <Navbar portal="citizen" tabs={TABS} activeTab="login" onTabChange={() => {}} />
        <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <CitizenLogin onLogin={setUser} />
        </main>
      </div>
    )
  }

  return (
    <div className="page" data-portal="citizen">
      <Navbar portal="citizen" tabs={TABS} activeTab={tab} onTabChange={setTab} />

      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {/* Emergency banner */}
        <div style={{
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
          borderRadius: 'var(--radius-md)', padding: '0.875rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🚨</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fb7185' }}>Welcome, {user.phone}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Emergency SOS linked to: {user.email}</div>
            </div>
          </div>
          <a
            href="tel:1930"
            className="btn btn-danger btn-sm"
            id="helpline-btn"
            style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em' }}
          >
            📞 Call 1930
          </a>
        </div>

        {/* Tab content */}
        {tab === 'detector' && <ScamDetector user={user} />}
        {tab === 'deepfake' && <DeepfakeScanner user={user} />}
        {tab === 'chat'     && <FraudChat user={user} />}
        {tab === 'report'   && <CitizenReport user={user} />}
      </main>
    </div>
  )
}
