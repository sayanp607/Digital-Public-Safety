import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

export default function CitizenLogin({ onLogin }) {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    if (!phone.trim() || !email.trim()) {
      setError('Please provide both Phone Number and Family Email')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Register or Login using MongoDB Upsert
      await axios.post(`${API}/api/users/register`, {
        citizen_id: phone,
        email: email
      })
      
      // On success, pass the user object back to the portal
      onLogin({ phone, email })
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Failed to connect to SHIELD Database. Ensure FastAPI is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', minHeight: '60vh', padding: '2rem' 
    }}>
      <div className="card fade-up" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center', borderTop: '4px solid #8b5cf6' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Citizen Portal Login</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Secure access to the SHIELD network. Your emergency email acts as your secure digital signature.
        </p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Phone Number (Citizen ID)</label>
            <input 
              type="text" 
              className="input" 
              placeholder="+91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Family Emergency Email</label>
            <input 
              type="email" 
              className="input" 
              placeholder="family@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
