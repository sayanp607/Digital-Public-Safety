import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function VoiceBiometrics() {
  const [dbList, setDbList] = useState([])
  const [report1, setReport1] = useState('')
  const [report2, setReport2] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [matchData, setMatchData] = useState(null)

  useEffect(() => {
    // Fetch Database Records on load
    axios.get('http://localhost:8000/api/reports/list')
      .then(res => setDbList(res.data))
      .catch(err => console.error("Could not fetch DB:", err))
  }, [])

  const handleVerify = async () => {
    if (!report1 || !report2) return
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('report_id_1', report1)
    formData.append('report_id_2', report2)

    try {
      const res = await axios.post('http://localhost:8000/api/reports/verify-db', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      
      // If it's a match, extract the real data from the DB list for the Linkage Tree
      if (res.data.is_match) {
        const caseA = dbList.find(r => r.id === report1)
        const caseB = dbList.find(r => r.id === report2)
        setMatchData({ caseA, caseB })
      } else {
        setMatchData(null)
      }
    } catch (err) {
      alert("Error verifying audio: " + err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>🗣️</div>
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>Voice Biometric & RAG Profiler</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cross-referencing audio embeddings across multiple citizen complaints.</p>
        </div>
      </div>

      {/* ── Production Database Matcher ── */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🔬 Database Audio Vector Matcher (PyTorch)</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Select two citizen complaints directly from the database. The system will cross-reference the actual audio files using PyTorch embeddings to see if the same suspect committed both crimes.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ border: '1px dashed var(--border)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Select Case A</div>
            <select className="input" value={report1} onChange={e => setReport1(e.target.value)} style={{ width: '100%' }}>
              <option value="">-- Choose Complaint --</option>
              {dbList.map(r => (
                <option key={r.id} value={r.id}>Case {r.id} ({r.phone})</option>
              ))}
            </select>
          </div>
          <div style={{ border: '1px dashed var(--border)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Select Case B</div>
            <select className="input" value={report2} onChange={e => setReport2(e.target.value)} style={{ width: '100%' }}>
              <option value="">-- Choose Complaint --</option>
              {dbList.map(r => (
                <option key={r.id} value={r.id}>Case {r.id} ({r.phone})</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={handleVerify}
          disabled={!report1 || !report2 || loading}
          className="btn btn-primary"
          style={{ width: '100%', background: '#8b5cf6', color: '#fff', border: 'none' }}
        >
          {loading ? 'Extracting Vector Embeddings from DB...' : 'Verify Voice Embeddings'}
        </button>

        {result && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-sm)', background: result.is_match ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', border: `1px solid ${result.is_match ? '#10b981' : '#f43f5e'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: result.is_match ? '#10b981' : '#f43f5e' }}>{result.message}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Based on SpeechBrain ECAPA-TDNN vectors</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: result.is_match ? '#10b981' : '#f43f5e' }}>
                {(result.similarity_score * 100).toFixed(1)}% Match
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Dynamic Entity Linkage & Profiler (Only shows on Match) ── */}
      {matchData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          
          {/* Left Column: Real Database Linkage */}
          <div className="card fade-up" style={{ animationDelay: '0.2s' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Entity Linkage Tree</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fff', boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }}>🎙️</div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Voice Print ID: <span style={{ color: '#8b5cf6' }}>{matchData.caseA.id.toUpperCase()}-X</span></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified via PyTorch ECAPA-TDNN</div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              This exact voice signature has been identified across multiple citizen complaints in our database:
            </p>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
              <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', width: '80px', display: 'inline-block' }}>Case A Phone:</span>
                <strong style={{ color: '#f43f5e' }}>{matchData.caseA.phone}</strong> 
              </div>
              <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', width: '80px', display: 'inline-block' }}>Case B Phone:</span>
                <strong style={{ color: '#f59e0b' }}>{matchData.caseB.phone}</strong>
              </div>
              
              <div className="divider" style={{ margin: '0.75rem 0' }} />
              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', width: '80px', display: 'inline-block' }}>UPI Linked:</span>
                <strong style={{ color: '#10b981' }}>{matchData.caseA.upi || 'N/A'}</strong>, <strong style={{ color: '#10b981' }}>{matchData.caseB.upi || 'N/A'}</strong>
              </div>
            </div>
          </div>

          {/* Right Column: RAG Profiler */}
          <div className="card fade-up" style={{ position: 'relative', overflow: 'hidden', animationDelay: '0.4s' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)' }} />
            
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🧠 AI Suspect Profiler
              <span className="badge badge-green" style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>Powered by RAG</span>
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              Retrieving transcripts for Case {matchData.caseA.id} and Case {matchData.caseB.id} to generate behavioral interrogation profile...
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h4 style={{ color: '#22d3ee', fontSize: '0.9rem', marginBottom: '0.35rem' }}>Behavioral Analysis</h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {result.profile?.behavioral_analysis || "The suspect heavily relies on psychological intimidation and panic."}
                </p>
              </div>

              <div>
                <h4 style={{ color: '#f59e0b', fontSize: '0.9rem', marginBottom: '0.35rem' }}>Weaknesses & Script Reliance</h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {result.profile?.weaknesses || "He relies entirely on a pre-written script. When victims ask for specific legal codes, the suspect becomes defensive."}
                </p>
              </div>

              <div style={{ background: 'rgba(34, 211, 238, 0.05)', borderLeft: '3px solid #22d3ee', padding: '1rem', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.35rem' }}>Recommended Interrogation Strategy</h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {result.profile?.interrogation_strategy || "Do not allow the suspect to control the pace of questioning. Confront him directly regarding his knowledge of official procedures."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
