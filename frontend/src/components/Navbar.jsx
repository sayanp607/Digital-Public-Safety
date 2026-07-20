import { useNavigate } from 'react-router-dom'

export default function Navbar({ portal, tabs, activeTab, onTabChange }) {
  const navigate = useNavigate()

  const portalMeta = {
    citizen: { label: 'Citizen Portal', icon: '👥', accent: '#6366f1' },
    bank:    { label: 'Bank Portal',    icon: '🏦', accent: '#10b981' },
    le:      { label: 'LE Dashboard',   icon: '🚔', accent: '#22d3ee' },
    telecom: { label: 'Telecom API',    icon: '📡', accent: '#f43f5e' },
  }

  const meta = portalMeta[portal]

  return (
    <nav className="navbar">
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
        >
          <div className="logo-icon">🛡️</div>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>SHIELD</span>
        </button>

        <div style={{ height: '20px', width: '1px', background: 'var(--border)' }} />

        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, color: meta.accent }}>
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Tabs */}
      {tabs && (
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'var(--transition)',
                background: activeTab === tab.id ? meta.accent : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>● LIVE</span>
        <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm">
          ← All Portals
        </button>
      </div>
    </nav>
  )
}
