import { useState } from 'react'
import Navbar from '../../components/Navbar'

export default function TelecomPortal() {
  const [callState, setCallState] = useState('idle') // idle, ringing, blocked, safe_ring
  const [callType, setCallType] = useState('fake') // fake, real

  const simulateCall = (type) => {
    setCallType(type)
    setCallState('ringing')
    
    // Simulate API delay
    setTimeout(() => {
      setCallState(type === 'fake' ? 'blocked' : 'safe_ring')
    }, 2000)
  }

  const resetCall = () => setCallState('idle')

  return (
    <div className="page" data-portal="telecom">
      <Navbar portal="telecom" tabs={[]} activeTab="" onTabChange={() => {}} />

      <main style={{ flex: 1, padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: '#6366f1' }}>
            Telecom B2B Integration API
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Zero-friction digital safety. SHIELD integrates directly at the network level (Jio/Airtel) 
            to mathematically prove VoIP spoofing and block scam calls before they ever reach the citizen.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          
          {/* API Documentation Side */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Live API Simulation</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              When a call is initiated, the Telecom Carrier sends the SIP headers to SHIELD for real-time verification.
            </p>

            <div style={{ background: '#1e1e1e', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              <div style={{ color: '#569cd6', marginBottom: '0.5rem' }}>POST /api/v1/telecom/verify-sip</div>
              {callType === 'fake' ? `{
  "caller_id": "+91-11-23410000",
  "routing_metadata": {
    "network_type": "VoIP_SIP_TRUNK",
    "origin_ip": "103.220.XX.XX",
    "geo_location": "Cambodia",
    "proxy_hops": 4
  }
}` : `{
  "caller_id": "+91-11-23410000",
  "routing_metadata": {
    "network_type": "LANDLINE_PSTN",
    "origin_ip": "LOCAL_EXCHANGE",
    "geo_location": "New Delhi, India",
    "proxy_hops": 0
  }
}`}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button 
                onClick={() => simulateCall('fake')} 
                className="btn btn-primary" 
                disabled={callState === 'ringing'}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem', padding: '1rem', background: '#f43f5e', borderColor: '#f43f5e' }}
              >
                🚨 Inject Spoofed Call
              </button>
              <button 
                onClick={() => simulateCall('real')} 
                className="btn btn-primary" 
                disabled={callState === 'ringing'}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem', padding: '1rem', background: '#10b981', borderColor: '#10b981' }}
              >
                ✅ Inject Real Call
              </button>
            </div>
            
            {(callState === 'blocked' || callState === 'safe_ring') && (
               <button onClick={resetCall} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                 Reset Demo
               </button>
            )}
          </div>

          {/* Smartphone UI Mockup */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '320px', height: '650px', 
              background: '#000', 
              border: '14px solid #222', 
              borderRadius: '40px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Phone Notch */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '25px', background: '#222', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', zIndex: 10 }}></div>

              {/* Phone Screen */}
              <div style={{ 
                width: '100%', height: '100%', 
                background: callState === 'idle' ? 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop) center/cover' : 
                            callState === 'ringing' ? '#1a1a1a' : 
                            callState === 'blocked' ? '#991b1b' : '#065f46',
                display: 'flex', flexDirection: 'column',
                transition: 'background 0.3s ease'
              }}>
                
                {callState === 'idle' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <div style={{ color: '#fff', fontSize: '3rem', fontWeight: 200 }}>10:41</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Monday, Oct 24</div>
                  </div>
                )}

                {callState === 'ringing' && (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#fff', flex: 1 }}>
                    <div style={{ fontSize: '1rem', color: '#aaa', marginBottom: '0.5rem' }}>Incoming Call</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>CBI Headquarters</div>
                    <div style={{ fontSize: '1rem', color: '#aaa' }}>+91 11 2341 0000</div>
                    
                    <div style={{ marginTop: '3rem' }}>
                       <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontSize: '3rem' }}>👮</span>
                       </div>
                    </div>
                  </div>
                )}

                {callState === 'blocked' && (
                  <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#fff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚨</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2 }}>BLOCKED BY SHIELD</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fca5a5', marginBottom: '1.5rem' }}>
                      SPOOFED CALLER ID
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', textAlign: 'left' }}>
                      <b>Original Caller ID:</b> Delhi Police <br/>
                      <b>Actual Origin:</b> VoIP Server (Cambodia)<br/><br/>
                      <span style={{ color: '#fecaca' }}>This network connection has been terminated to protect you from financial fraud.</span>
                    </div>
                  </div>
                )}

                {callState === 'safe_ring' && (
                  <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#fff', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '1rem', color: '#a7f3d0', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>✅</span> SHIELD VERIFIED SECURE
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>CBI Headquarters</div>
                    <div style={{ fontSize: '1rem', color: '#d1fae5' }}>+91 11 2341 0000</div>
                    
                    <div style={{ marginTop: '2rem' }}>
                       <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontSize: '3rem' }}>👮</span>
                       </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', padding: '0 1rem' }}>
                       <div style={{ width: '60px', height: '60px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📞</div>
                       <div style={{ width: '60px', height: '60px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', transform: 'rotate(135deg)' }}>📞</div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
