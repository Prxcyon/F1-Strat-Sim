import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { fmtTime } from '../App'
import BorderGlow from './BorderGlow'

const COLORS = ['#E8002D', '#3b82f6', '#10b981', '#f59e0b']

export default function MonteCarloPanel({ results, selected, onToggle }) {
  const sel = results.filter(r => selected.includes(r.name)).slice(0, 4)

  const allTimes = sel.flatMap(r => r.mc.all)
  const minT = Math.min(...allTimes)
  const maxT = Math.max(...allTimes)
  const BINS = 24
  const step = (maxT - minT) / BINS

  const histData = Array.from({ length: BINS }, (_, i) => {
    const binMin = minT + i * step
    const binMax = binMin + step
    const row = { bin: binMin.toFixed(0) }
    sel.forEach(r => {
      row[r.name] = r.mc.all.filter(t => t >= binMin && t < binMax).length
    })
    return row
  })

  const rangeData = sel.map(r => ({
    name: r.name,
    range: +(r.mc.p90 - r.mc.p10).toFixed(1),
    std: +r.mc.std.toFixed(1),
  }))

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      <div className="pills-row" style={{ marginBottom: '20px' }}>
        {results.slice(0, 8).map((r, i) => (
          <span key={r.name} className={`pill cursor-target ${selected.includes(r.name) ? 'on' : ''}`} onClick={() => onToggle(r.name)}>
            {r.name}
          </span>
        ))}
      </div>

      <div className="chart-grid">
        <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.2}>
          <div className="chart-card" style={{ border: 'none', margin: 0 }}>
            <p className="chart-title">Race Time Distribution (500 runs)</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={histData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="bin" tick={{ fill: '#555b66', fontSize: 10, fontFamily: 'DM Mono' }}
                  tickFormatter={v => `${(+v / 60).toFixed(0)}m`} />
                <YAxis tick={{ fill: '#555b66', fontSize: 10, fontFamily: 'DM Mono' }} />
                <Tooltip
                  contentStyle={{ background: '#181b20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, fontFamily: 'DM Mono' }}
                  labelFormatter={v => `~${fmtTime(+v)}`}
                />
                {sel.map((r, i) => (
                  <Bar key={r.name} dataKey={r.name} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BorderGlow>

        <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.2}>
          <div className="chart-card" style={{ border: 'none', margin: 0 }}>
            <p className="chart-title">P10–P90 Variability Range</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rangeData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fill: '#555b66', fontSize: 10, fontFamily: 'DM Mono' }}
                  label={{ value: 'Range (s)', position: 'insideBottom', offset: -2, fill: '#555b66', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#555b66', fontSize: 10, fontFamily: 'DM Mono' }} width={120} />
                <Tooltip
                  contentStyle={{ background: '#181b20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, fontFamily: 'DM Mono' }}
                  formatter={v => [`${v}s`, 'P10–P90 range']}
                />
                <Bar dataKey="range" radius={[0, 4, 4, 0]}>
                  {rangeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BorderGlow>
      </div>

      <div className="mc-stats-grid" style={{ marginTop: '20px' }}>
        {sel.map((r, i) => (
          <BorderGlow key={r.name} className="cursor-target" borderRadius={8} glowIntensity={0.4} style={{ borderTop: `4px solid ${COLORS[i % COLORS.length]}` }}>
            <div className="mc-stat-card" style={{ border: 'none', margin: 0, height: '100%' }}>
              <p className="name" style={{ color: COLORS[i % COLORS.length] }}>{r.name}</p>
              {[
                ['Mean', fmtTime(r.mc.mean)],
                ['Best', fmtTime(r.mc.best)],
                ['P10', fmtTime(r.mc.p10)],
                ['Median', fmtTime(r.mc.p50)],
                ['P90', fmtTime(r.mc.p90)],
                ['±σ', `${r.mc.std.toFixed(1)}s`],
              ].map(([k, v]) => (
                <div key={k} className="row">
                  <span className="key">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </BorderGlow>
        ))}
      </div>
    </div>
  )
}
