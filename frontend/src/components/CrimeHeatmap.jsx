import { useEffect, useState } from 'react'
import axios from 'axios'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API = 'https://digital-public-safety.onrender.com'

const RISK_COLORS = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#22c55e' }

function FitBounds({ complaints }) {
  const map = useMap()
  useEffect(() => {
    if (complaints?.length) map.fitBounds([[8, 68], [37, 97]], { padding: [20, 20] })
  }, [complaints, map])
  return null
}

export default function CrimeHeatmap() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/geo/heatmap`)
      .then(({ data }) => setData(data))
      .catch(() => setError('Could not load heatmap data. Ensure backend is running.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
  if (error) return <div className="card" style={{ borderColor: 'rgba(244,63,94,0.4)' }}><p style={{ color: '#fb7185' }}>⚠️ {error}</p></div>

  return (
    <div className="fade-up">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'var(--cyan-glow)' }}>🗺️</div>
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>Geospatial Crime Heatmap</h2>
          <p style={{ fontSize: '0.85rem' }}>DBSCAN-clustered fraud hotspots · Click any circle for details</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', gap: '1rem' }}>
        {/* Map */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <MapContainer
            center={[22, 78]}
            zoom={5}
            style={{ height: '480px', width: '100%', background: '#080b14' }}
            id="crime-map"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com">CARTO</a>'
            />
            <FitBounds complaints={data?.complaints} />

            {/* Individual complaint dots */}
            {data?.complaints?.map((c, i) => (
              <CircleMarker
                key={`c-${i}`}
                center={[c.lat, c.lon]}
                radius={3}
                pathOptions={{ color: 'transparent', fillColor: '#6366f1', fillOpacity: 0.35 }}
              >
                <Popup>
                  <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                    <strong>{c.type}</strong><br />
                    {c.city} · ₹{c.amount_lost?.toLocaleString()} lost
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Cluster circles */}
            {data?.clusters?.map(cl => (
              <CircleMarker
                key={cl.cluster_id}
                center={[cl.centroid_lat, cl.centroid_lon]}
                radius={Math.min(8 + cl.complaint_count / 4, 30)}
                pathOptions={{
                  color: RISK_COLORS[cl.risk_level],
                  fillColor: RISK_COLORS[cl.risk_level],
                  fillOpacity: 0.2,
                  weight: 2,
                }}
                eventHandlers={{ click: () => setSelected(cl) }}
              >
                <Popup>
                  <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                    <strong style={{ color: RISK_COLORS[cl.risk_level] }}>{cl.risk_level} RISK</strong><br />
                    {cl.complaint_count} complaints<br />
                    Primary: {cl.dominant_type}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Risk legend */}
          <div className="card">
            <h4 style={{ marginBottom: '0.75rem' }}>Risk Levels</h4>
            {Object.entries(RISK_COLORS).map(([level, color]) => (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{level} Risk Cluster</span>
              </div>
            ))}
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Complaints</span>
              <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>{data?.total}</span>
            </div>
          </div>

          {/* Cluster list */}
          <div className="card" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>Top Hotspots</h4>
            {data?.clusters?.slice(0, 8).map(cl => (
              <div
                key={cl.cluster_id}
                onClick={() => setSelected(cl)}
                style={{
                  padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', marginBottom: '0.4rem',
                  background: selected?.cluster_id === cl.cluster_id ? 'var(--bg-card-hover)' : 'transparent',
                  border: `1px solid ${selected?.cluster_id === cl.cluster_id ? 'var(--border-accent)' : 'transparent'}`,
                  transition: 'var(--transition)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{cl.dominant_type}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cl.complaint_count} complaints</div>
                </div>
                <span className={`badge ${cl.risk_level === 'HIGH' ? 'badge-red' : cl.risk_level === 'MEDIUM' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '0.65rem' }}>
                  {cl.risk_level}
                </span>
              </div>
            ))}
          </div>

          {/* Selected cluster detail */}
          {selected && (
            <div className="card card-glow" id="cluster-detail">
              <h4 style={{ marginBottom: '0.75rem' }}>Cluster Detail</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  ['Complaints', selected.complaint_count],
                  ['Primary Crime', selected.dominant_type],
                  ['Risk Level', selected.risk_level],
                  ['Lat / Lon', `${selected.centroid_lat.toFixed(2)}, ${selected.centroid_lon.toFixed(2)}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                🚔 Recommend Patrol Deployment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
