import React, { useState } from 'react'
import axios from 'axios'

export default function CitizenReport() {
  const [phone, setPhone] = useState('')
  const [upi, setUpi] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle, submitting, success

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !phone) return

    setStatus('submitting')
    
    const formData = new FormData()
    formData.append('phone', phone)
    formData.append('upi', upi)
    formData.append('audio', file)

    try {
      await axios.post('https://digital-public-safety.onrender.com/api/reports/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setStatus('success')
    } catch (err) {
      alert("Error submitting to database: " + err.message)
      setStatus('idle')
    }
  }

  return (
    <div className="fade-up">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e' }}>🚨</div>
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>File Official Report</h2>
          <p style={{ fontSize: '0.85rem' }}>Submit scammer details directly to the Law Enforcement Database.</p>
        </div>
      </div>

      <div className="card">
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Report Submitted Successfully</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              The audio recording and scammer details have been securely transmitted to the SHIELD Law Enforcement Database for Voice Biometric tracking.
            </p>
            <button className="btn btn-secondary" onClick={() => { setStatus('idle'); setPhone(''); setUpi(''); setFile(null) }}>
              File Another Report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Scammer Phone Number</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. +91 98765 43210" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Scammer UPI ID or Bank Account (Optional)</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. fraudster@sbi" 
                value={upi}
                onChange={e => setUpi(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Upload Call Recording (Audio Evidence)</label>
              <div style={{ 
                border: '1px dashed var(--border)', 
                padding: '1.5rem', 
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                cursor: 'pointer'
              }}>
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={e => setFile(e.target.files[0])}
                  style={{ display: 'block', margin: '0 auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                  required
                />
                {!file && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Accepts .wav, .mp3, .m4a</p>}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ background: '#f43f5e', color: '#fff', border: 'none', marginTop: '0.5rem' }}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Encrypting & Submitting...' : 'Submit to Law Enforcement'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
