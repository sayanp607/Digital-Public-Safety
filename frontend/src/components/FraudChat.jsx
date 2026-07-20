import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const SUGGESTED = [
  'Someone called claiming to be from CBI and said my Aadhaar is linked to a crime',
  'I got a WhatsApp message saying I won a lottery and need to pay tax first',
  'A person on video call showed a fake police badge and demanded money',
]

export default function FraudChat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Namaste! 🙏 I'm your AI Fraud Shield assistant.\n\nDescribe what's happening and I'll instantly tell you if it's a scam — in Hindi or English. You can also ask: \"क्या यह एक scam है?\"",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [recognitionInstance, setRecognitionInstance] = useState(null)
  const [speechLang, setSpeechLang] = useState('bn-IN')
  const bottomRef = useRef(null)

  function toggleListen() {
    if (listening && recognitionInstance) {
      recognitionInstance.stop()
      setListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech AI is not supported in this browser. Please use Google Chrome.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = speechLang

    recognition.onstart = () => setListening(true)
    
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(transcript)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    
    recognition.start()
    setRecognitionInstance(recognition)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(msg) {
    const text = (msg || input).trim()
    if (!text) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${API}/api/scam/chat`, { message: text })
      setMessages(prev => [...prev, { role: 'bot', text: data.response }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Unable to reach the AI server. Please ensure the backend is running. If in danger, call 1930 immediately.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'var(--indigo-glow)' }}>🤖</div>
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>Fraud Shield Chat</h2>
          <p style={{ fontSize: '0.85rem' }}>Talk to the AI — Hindi or English. Get instant scam verdict.</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Chat window */}
        <div className="chat-wrap" id="chat-window">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`} style={{ whiteSpace: 'pre-wrap' }}>
              {m.role === 'bot' && <span style={{ fontSize: '0.7rem', color: 'var(--indigo-light)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>🛡️ SHIELD AI</span>}
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble bot">
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo)',
                    animation: 'pulse-ring 1.2s infinite', animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try asking:</span>
            {SUGGESTED.map(s => (
              <button key={s} onClick={() => send(s)} className="btn btn-secondary btn-sm" style={{ textAlign: 'left', justifyContent: 'flex-start', whiteSpace: 'normal' }}>
                "{s}"
              </button>
            ))}
          </div>
        )}

        <div className="divider" style={{ margin: '0' }} />

        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select 
              value={speechLang} 
              onChange={e => setSpeechLang(e.target.value)}
              className="input"
              style={{ padding: '0.25rem 0.5rem', height: 'auto', minHeight: '32px', fontSize: '0.85rem', width: 'auto' }}
              disabled={listening}
            >
              <option value="en-IN">English</option>
              <option value="bn-IN">Bengali (বাংলা)</option>
              <option value="hi-IN">Hindi (हिंदी)</option>
            </select>
            <button
              onClick={toggleListen}
              className="btn btn-sm"
              style={{ background: listening ? 'rgba(244,63,94,0.1)' : 'var(--bg-secondary)', color: listening ? '#f43f5e' : 'var(--text-primary)', border: `1px solid ${listening ? '#f43f5e' : 'var(--border-color)'}` }}
            >
              {listening ? '🛑 Stop Recording' : '🎙️ Speak to AI'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <textarea
              id="chat-input"
              className="input"
              style={{ minHeight: '52px', maxHeight: '120px', resize: 'none', flex: 1 }}
              placeholder="Describe your situation... / अपनी समस्या बताएं..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              disabled={loading}
            />
            <button id="send-btn" onClick={() => send()} disabled={loading || !input.trim()} className="btn btn-primary" style={{ height: '52px', padding: '0 1.25rem', opacity: !input.trim() ? 0.5 : 1 }}>
              Send
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          In immediate danger? Call <strong style={{ color: '#f43f5e' }}>1930</strong> · Report at <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" style={{ color: 'var(--indigo-light)' }}>cybercrime.gov.in</a>
        </p>
      </div>
    </div>
  )
}
