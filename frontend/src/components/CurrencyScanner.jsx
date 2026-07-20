import { useState, useRef } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const CHECK_LABELS = {
  serial_number_format:  'Serial Number Format',
  security_thread:       'Security Thread',
  microprint_sharpness:  'Microprint Sharpness',
  color_gradient:        'Color Gradient',
  intaglio_print:        'Intaglio Print',
  watermark_region:      'Watermark Region',
}

export default function CurrencyScanner() {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef()

  function handleFile(f) {
    if (!f) return
    setFile(f); setResult(null); setError('')
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  async function scan() {
    if (!file) return
    setLoading(true); setError(''); setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await axios.post(`${API}/api/currency/scan`, form)
      setResult(data)
    } catch {
      setError('Could not reach the backend. Ensure FastAPI is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const isGenuine = result?.verdict === 'GENUINE'

  return (
    <div className="fade-up">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'var(--emerald-glow)' }}>💵</div>
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>Counterfeit Currency Scanner</h2>
          <p style={{ fontSize: '0.85rem' }}>Upload or capture a currency note — AI checks 6 RBI security features</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Upload panel */}
        <div className="card">
          <div
            id="drop-zone"
            onClick={() => inputRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'var(--transition)',
              marginBottom: '1rem',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--emerald)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {preview ? (
              <img src={preview} alt="Note preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} />
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📷</div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Drop image here</p>
                <p style={{ fontSize: '0.8rem' }}>or click to upload · JPG, PNG, WEBP</p>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} id="currency-upload" />

          <button
            id="scan-btn"
            onClick={scan}
            disabled={!file || loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', opacity: !file ? 0.5 : 1 }}
          >
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Scanning...</> : '🔬 Scan Currency'}
          </button>

          {error && <p style={{ color: '#fb7185', fontSize: '0.8rem', marginTop: '0.75rem' }}>⚠️ {error}</p>}
        </div>

        {/* Results panel */}
        <div>
          {!result && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <p style={{ color: 'var(--text-muted)' }}>Scan result will appear here</p>
            </div>
          )}

          {result && (
            <div className="card card-glow fade-up" id="currency-result">
              {/* Verdict */}
              <div style={{
                textAlign: 'center', padding: '1.25rem',
                background: isGenuine ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                borderRadius: 'var(--radius-md)', marginBottom: '1.25rem',
                border: `1px solid ${isGenuine ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{isGenuine ? '✅' : '❌'}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: isGenuine ? '#34d399' : '#fb7185' }}>
                  {result.verdict}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {result.confidence}% confidence
                </div>
              </div>

              {/* Feature checks */}
              <h4 style={{ marginBottom: '0.75rem' }}>Security Feature Analysis</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(result.checks || {}).map(([key, val]) => (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.6rem 0.875rem', borderRadius: 'var(--radius-sm)',
                    background: val.passed ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)',
                    border: `1px solid ${val.passed ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{CHECK_LABELS[key] || key}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{val.detail}</span>
                      <span style={{ color: val.passed ? '#34d399' : '#fb7185', fontWeight: 700 }}>{val.passed ? '✓' : '✗'}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {result.features_passed}/{result.features_total} security features passed
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
