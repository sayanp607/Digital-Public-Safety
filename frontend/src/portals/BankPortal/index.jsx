import { useState } from 'react'
import Navbar from '../../components/Navbar'
import CurrencyScanner from '../../components/CurrencyScanner'

const TABS = [
  { id: 'scanner', icon: '💵', label: 'Currency Scanner' },
]

export default function BankPortal() {
  const [tab, setTab] = useState('scanner')

  return (
    <div className="page" data-portal="bank">
      <Navbar portal="bank" tabs={TABS} activeTab={tab} onTabChange={setTab} />

      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
        {/* Info banner */}
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 'var(--radius-md)', padding: '0.875rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem',
        }}>
          <span style={{ fontSize: '1.25rem' }}>🏦</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#34d399' }}>Bank Teller / POS Terminal Mode</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              AI analyses 6 security features — RBI specifications · Record high FICN seizures in 2025
            </div>
          </div>
        </div>

        {tab === 'scanner' && <CurrencyScanner />}
      </main>
    </div>
  )
}
