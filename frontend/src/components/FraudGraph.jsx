import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import * as d3 from 'd3'

const API = 'https://digital-public-safety.onrender.com'

const ROLE_LABELS = {
  SCAMMER_HUB: { label: 'Scammer Hub', color: '#f43f5e', badge: 'badge-red' },
  MONEY_MULE:  { label: 'Money Mule',  color: '#f59e0b', badge: 'badge-amber' },
  VICTIM:      { label: 'Victim',       color: '#22c55e', badge: 'badge-green' },
  UNKNOWN:     { label: 'Unknown',      color: '#6366f1', badge: 'badge-indigo' },
}

export default function FraudGraph() {
  const svgRef = useRef()
  const [graphData, setGraphData] = useState(null)
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`${API}/api/graph/demo`)
      .then(({ data }) => { setGraphData(data.graph); setStats(data.stats) })
      .catch(() => setError('Could not load graph data. Ensure backend is running.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!graphData || !svgRef.current) return
    drawGraph(graphData, svgRef.current, setSelected)
  }, [graphData])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
  if (error) return <div className="card" style={{ borderColor: 'rgba(244,63,94,0.4)' }}><p style={{ color: '#fb7185' }}>⚠️ {error}</p></div>

  return (
    <div className="fade-up">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'var(--cyan-glow)' }}>🕸️</div>
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>Fraud Network Graph</h2>
          <p style={{ fontSize: '0.85rem' }}>Click any node to inspect. Drag to explore the network.</p>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {Object.entries(ROLE_LABELS).map(([role, meta]) => (
          <span key={role} className={`badge ${meta.badge}`}>
            ● {meta.label}
          </span>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'start', gap: '1rem' }}>
        {/* Graph canvas */}
        <div className="card" style={{ padding: '0.5rem', overflow: 'hidden' }}>
          <svg ref={svgRef} style={{ width: '100%', height: '420px', display: 'block' }} id="fraud-graph-svg" />
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Stats */}
          {stats && (
            <div className="card">
              <h4 style={{ marginBottom: '0.75rem' }}>Network Stats</h4>
              {[
                ['Total Nodes', stats.total_nodes, '#6366f1'],
                ['Scammer Hubs', stats.scammer_hubs, '#f43f5e'],
                ['Money Mules', stats.money_mules, '#f59e0b'],
                ['Victims', stats.victims, '#22c55e'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected node detail */}
          {selected ? (
            <div className="card card-glow" id="node-detail">
              <h4 style={{ marginBottom: '0.75rem' }}>Node Detail</h4>
              <div className={`badge ${ROLE_LABELS[selected.role]?.badge || 'badge-indigo'}`} style={{ marginBottom: '0.75rem' }}>
                {ROLE_LABELS[selected.role]?.label || selected.role}
              </div>
              {[
                ['ID', selected.id],
                ['Risk Score', `${selected.risk_score}/100`],
                ['Outgoing', selected.out_degree],
                ['Incoming', selected.in_degree],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{k}</span>
                  <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                📄 Export Intelligence Package
              </button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click a node in the graph to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function drawGraph(graphData, svgEl, onSelect) {
  const width = svgEl.clientWidth || 560
  const height = 420

  d3.select(svgEl).selectAll('*').remove()

  const svg = d3.select(svgEl)
    .attr('viewBox', `0 0 ${width} ${height}`)

  // Background
  svg.append('rect').attr('width', width).attr('height', height)
    .attr('fill', '#0d1117').attr('rx', 12)

  const g = svg.append('g')

  // Zoom
  svg.call(d3.zoom().scaleExtent([0.3, 4]).on('zoom', e => g.attr('transform', e.transform)))

  const nodes = graphData.nodes.map(n => ({ ...n }))
  const links = graphData.edges.map(e => ({ source: e.from, target: e.to, count: e.count }))

  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(80))
    .force('charge', d3.forceManyBody().strength(-180))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide(20))

  // Links
  const link = g.append('g').selectAll('line').data(links).join('line')
    .attr('stroke', 'rgba(255,255,255,0.08)')
    .attr('stroke-width', d => Math.min(d.count, 4))

  // Nodes
  const node = g.append('g').selectAll('circle').data(nodes).join('circle')
    .attr('r', d => d.role === 'SCAMMER_HUB' ? 14 : d.role === 'MONEY_MULE' ? 10 : 7)
    .attr('fill', d => d.color)
    .attr('stroke', '#080b14').attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
      .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
    )
    .on('click', (_, d) => onSelect(d))

  // Pulse for hub nodes
  g.append('g').selectAll('circle').data(nodes.filter(n => n.role === 'SCAMMER_HUB')).join('circle')
    .attr('r', 20).attr('fill', 'none').attr('stroke', '#f43f5e').attr('stroke-width', 1.5)
    .attr('opacity', 0.4)
    .each(function() { animatePulse(d3.select(this)) })

  function animatePulse(sel) {
    sel.transition().duration(1500).ease(d3.easeSinOut)
      .attr('r', 28).attr('opacity', 0)
      .on('end', () => { sel.attr('r', 20).attr('opacity', 0.4); animatePulse(sel) })
  }

  sim.on('tick', () => {
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
    node.attr('cx', d => d.x).attr('cy', d => d.y)
    g.selectAll('circle').filter((d, i, nodes) => d3.select(nodes[i]).attr('r') > 14)
      .attr('cx', d => d?.x || 0).attr('cy', d => d?.y || 0)
  })
}
