import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PORTALS = [
  {
    id: 'citizen',
    path: '/citizen',
    icon: '👥',
    label: 'Citizen Portal',
    tagline: 'Are you being scammed right now?',
    description: 'Real-time scam detection, FIR generation, and AI-powered fraud shield chatbot for Indian citizens.',
    features: ['Digital Arrest Scam Detector', 'AI Fraud Shield Chatbot', 'FIR Auto-Generator', 'Hindi + English support'],
    accent: '#6366f1',
    glow: 'rgba(99,102,241,0.2)',
    border: 'rgba(99,102,241,0.4)',
  },
  {
    id: 'bank',
    path: '/bank',
    icon: '🏦',
    label: 'Bank / POS Terminal',
    tagline: 'Verify currency in under 2 seconds',
    description: 'AI-powered counterfeit currency scanner for bank tellers and point-of-sale terminals.',
    features: ['Live Camera Scanner', '6-Point Security Analysis', 'All denominations supported', 'Audit trail export'],
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.2)',
    border: 'rgba(16,185,129,0.4)',
  },
  {
    id: 'le',
    path: '/le',
    icon: '🚔',
    label: 'Law Enforcement',
    tagline: 'Command-center intelligence',
    description: 'Fraud network graph analysis and geospatial crime heatmap for law enforcement agencies.',
    features: ['Fraud Network Graph', 'Crime Heatmap (DBSCAN)', 'Patrol Deployment AI', 'Court-admissible export'],
    accent: '#22d3ee',
    glow: 'rgba(34,211,238,0.2)',
    border: 'rgba(34,211,238,0.4)',
  },
  {
    id: 'telecom',
    path: '/telecom',
    icon: '📡',
    label: 'Telecom B2B API',
    tagline: 'Block VoIP spoofing instantly',
    description: 'Enterprise telecom integration for Jio/Airtel to intercept spoofed international scam calls before they ring.',
    features: ['SIP Header Analysis', 'Spoofed Number Blocking', 'Zero-Download Citizen Protection', 'B2B Revenue Model'],
    accent: '#f43f5e',
    glow: 'rgba(244,63,94,0.2)',
    border: 'rgba(244,63,94,0.4)',
  },
]

const STATS = [
  { value: '1.14M', label: 'Cybercrime complaints in 2023' },
  { value: '₹1,776 Cr', label: 'Lost to digital arrest scams (2024)' },
  { value: '60%', label: 'YoY rise in cybercrime' },
  { value: '1930', label: 'National Cybercrime Helpline' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState(null)
  const [badgeId, setBadgeId] = useState('')
  const [policeError, setPoliceError] = useState('')

  const handlePortalClick = (portalId, path) => {
    if (portalId === 'citizen') {
      setActiveModal('citizen')
    } else if (portalId === 'le') {
      setActiveModal('le')
    } else {
      navigate(path) // Bank portal is open for now
    }
  }

  const handlePoliceLogin = () => {
    if (badgeId === 'SHIELD-CBI-77') {
      navigate('/le')
    } else {
      setPoliceError('Invalid Badge ID. Access Denied.')
    }
  }

  return (
      <div className="page" style={{ background: 'var(--bg-primary)', position: 'relative' }}>
        
        {/* ── MODALS ── */}
        {activeModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
          }}>
            <div className="card fade-up" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
              <button 
                onClick={() => { setActiveModal(null); setPoliceError(''); setBadgeId('') }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >✕</button>

              {activeModal === 'citizen' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <h2 style={{ marginBottom: '0.5rem', color: '#6366f1' }}>Citizen Login</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Authenticate to securely file FIRs and report scammers.</p>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => navigate('/citizen')}
                    style={{ fontSize: '1.1rem', padding: '1rem', justifyContent: 'center' }}
                  >
                    🚀 Enter Citizen Portal
                  </button>
                </div>
                </div>
              )}

              {activeModal === 'le' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <h2 style={{ marginBottom: '0.5rem', color: '#22d3ee' }}>Law Enforcement Access</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Restricted Portal. Enter your official badge ID to proceed.</p>
                  
                  <input 
                    type="password"
                    placeholder="Enter Badge ID (Try: SHIELD-CBI-77)"
                    className="input"
                    value={badgeId}
                    onChange={e => setBadgeId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePoliceLogin()}
                    style={{ textAlign: 'center', letterSpacing: '0.1em', marginBottom: '1rem' }}
                  />
                  
                  {policeError && <p style={{ color: '#f43f5e', fontSize: '0.8rem', marginBottom: '1rem' }}>{policeError}</p>}
                  
                  <button onClick={handlePoliceLogin} className="btn btn-primary" style={{ width: '100%', background: '#22d3ee', color: '#000' }}>
                    Authenticate
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo-icon">🛡️</div>
          <span>SHIELD</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '0.25rem' }}>
            Digital Public Safety
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>● LIVE</span>
          <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            cybercrime.gov.in ↗
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 1.5rem 3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="fade-up fade-up-1">
          <span className="badge badge-red" style={{ marginBottom: '1.5rem', fontSize: '0.8rem' }}>
            🔴 1.14 Million Cybercrime Complaints in 2023 — We Fight Back
          </span>
        </div>

        <h1 className="fade-up fade-up-2" style={{
          background: 'linear-gradient(135deg, #f1f5f9 30%, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '1.25rem',
        }}>
          AI for Digital<br />Public Safety
        </h1>

        <p className="fade-up fade-up-3" style={{
          fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto 2.5rem',
          color: 'var(--text-secondary)',
        }}>
          SHIELD detects digital arrest scams, counterfeit currency, and fraud networks —
          <strong style={{ color: 'var(--text-primary)' }}> before the money moves.</strong>
        </p>

        {/* Stats strip */}
        <div className="fade-up fade-up-4" style={{
          display: 'flex', justifyContent: 'center', gap: '2.5rem',
          flexWrap: 'wrap', marginBottom: '4rem',
        }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--indigo-light)' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Portal Cards ── */}
      <section style={{ padding: '0 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
            Select your portal to continue
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {PORTALS.map((p, i) => (
              <button
                key={p.id}
                id={`portal-${p.id}`}
                onClick={() => handlePortalClick(p.id, p.path)}
                className="fade-up"
                style={{
                  animationDelay: `${i * 0.1 + 0.3}s`, opacity: 0,
                  background: 'var(--bg-card)',
                  border: `1px solid ${p.border}`,
                  borderRadius: 'var(--radius-xl)',
                  padding: '2rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 20px 40px ${p.glow}`
                  e.currentTarget.style.background = 'var(--bg-card-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.background = 'var(--bg-card)'
                }}
              >
                {/* Gradient orb */}
                <div style={{
                  position: 'absolute', top: '-40px', right: '-40px',
                  width: '140px', height: '140px',
                  background: `radial-gradient(circle, ${p.glow} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{p.icon}</div>

                <h3 style={{ color: p.accent, marginBottom: '0.35rem' }}>{p.label}</h3>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  {p.tagline}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  {p.description}
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: p.accent }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                <div style={{
                  marginTop: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '0.8rem', color: p.accent, fontWeight: 600 }}>Enter Portal →</span>
                  <span className="badge" style={{
                    background: p.glow, color: p.accent,
                    border: `1px solid ${p.border}`, fontSize: '0.7rem',
                  }}>AI Powered</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '1.5rem',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem',
      }}>
        SHIELD Platform · Hackathon Problem #6 · AI for Digital Public Safety · Built for India 🇮🇳
      </footer>
      </div>
  )
}
