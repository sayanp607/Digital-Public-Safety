import { useState } from 'react'
import axios from 'axios'

export default function DeepfakeScanner() {
  const [scanState, setScanState] = useState('idle') // idle, scanning, result
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      setScanState('scanning')
      setError(null)
      
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await axios.post('http://localhost:8000/api/scam/analyze-deepfake', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        setResult(response.data)
        setScanState('result')
      } catch (err) {
        console.error(err)
        setError('Failed to analyze image. Please try again.')
        setScanState('idle')
      }
    }
  }

  return (
    <div className="card fade-up">
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎭 AI Deepfake Inspector
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Scammers use AI-generated avatars to look like CBI Officers or Police on Skype/WhatsApp video calls. 
          Upload a screenshot of your video call to verify if the person is a real human.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(244,63,94,0.1)', color: '#fb7185', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {scanState === 'idle' && (
        <div style={{
          border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)',
          padding: '3rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)',
          cursor: 'pointer', transition: 'var(--transition)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Upload Video Call Screenshot</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Supports JPG, PNG (Max 5MB)
          </p>
          <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
            Select Image
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {scanState === 'scanning' && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
           <div className="spinner" style={{ width: '60px', height: '60px', borderTopColor: '#8b5cf6', margin: '0 auto 2rem' }}></div>
           <h3 style={{ marginBottom: '1rem', color: '#8b5cf6' }}>Running Forensic Vision Analysis...</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
             <div>[OK] Extracting facial mesh...</div>
             <div>[OK] Analyzing background illumination...</div>
             <div>[...] Checking uniform micro-textures...</div>
           </div>
        </div>
      )}

      {scanState === 'result' && result && (
        <div className="fade-up" style={{ textAlign: 'center' }}>
          
          {result.is_deepfake ? (
            <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid #f43f5e', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
              <h2 style={{ color: '#f43f5e', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                DEEPFAKE DETECTED
              </h2>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                {result.probability_score}% Probability of AI-Generated Avatar
              </div>

              <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '1rem' }}>
                 <h4 style={{ color: '#fb7185', marginBottom: '1rem' }}>Forensic Anomalies Found:</h4>
                 <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#d4d4d4' }}>
                   {result.anomalies.map((anom, idx) => (
                     <li key={idx}>❌ <b style={{color: '#fff'}}>Anomaly Detected:</b> {anom}</li>
                   ))}
                 </ul>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                {result.explanation}
              </p>

              <button onClick={() => setScanState('idle')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Scan Another Image
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ color: '#10b981', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                HUMAN VERIFIED
              </h2>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                {(100 - result.probability_score).toFixed(1)}% Probability of Human
              </div>

              <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '1rem' }}>
                 <h4 style={{ color: '#34d399', marginBottom: '1rem' }}>Forensic Vision Passed:</h4>
                 <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#d4d4d4' }}>
                   {result.anomalies.map((anom, idx) => (
                     <li key={idx}>✅ <b style={{color: '#fff'}}>Verified:</b> {anom}</li>
                   ))}
                   {result.anomalies.length === 0 && (
                     <li>✅ <b style={{color: '#fff'}}>Clear:</b> No synthetic artifacts detected.</li>
                   )}
                 </ul>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                {result.explanation}
              </p>

              <button onClick={() => setScanState('idle')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Scan Another Image
              </button>
            </div>
          )}
          
        </div>
      )}
    </div>
  )
}
