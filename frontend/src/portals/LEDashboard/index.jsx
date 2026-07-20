import { useState } from 'react'
import Navbar from '../../components/Navbar'
import FraudGraph from '../../components/FraudGraph'
import CrimeHeatmap from '../../components/CrimeHeatmap'
import VoiceBiometrics from '../../components/VoiceBiometrics'

const TABS = [
  { id: 'graph',   icon: '🕸️', label: 'Fraud Network' },
  { id: 'heatmap', icon: '🗺️', label: 'Crime Heatmap' },
  { id: 'rag',     icon: '🗣️', label: 'Voice Biometrics' },
]

const STATS = [
  { value: '3', label: 'Active Fraud Hubs', color: '#f43f5e' },
  { value: '8', label: 'Money Mules Detected', color: '#f59e0b' },
  { value: '397', label: 'Geo-tagged Complaints', color: '#22d3ee' },
  { value: '10', label: 'High-Risk Districts', color: '#6366f1' },
]

export default function LEDashboard() {
  const [tab, setTab] = useState('graph')

  return (
    <div className="page" data-portal="le">
      <Navbar portal="le" tabs={TABS} activeTab={tab} onTabChange={setTab} />

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {/* Stats row */}
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
          {STATS.map(s => (
            <div key={s.label} className="stat-card fade-up">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {tab === 'graph'   && <FraudGraph />}
        {tab === 'heatmap' && <CrimeHeatmap />}
        {tab === 'rag'     && <VoiceBiometrics />}
      </main>
    </div>
  )
}
