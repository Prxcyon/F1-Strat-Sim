import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer
} from 'recharts'
import BorderGlow from './BorderGlow'

const COLORS = ['#E8002D','#3b82f6','#10b981','#f59e0b','#a855f7','#ec4899','#06b6d4']

export default function LapTimePanel({ results, selected, onToggle }) {
  const sel = results.filter(r => selected.includes(r.name))

  const maxLap = results[0]?.laps.length || 57
  const lapNums = Array.from({ length: maxLap }, (_, i) => i + 1)

  const data = lapNums.map(lap => {
    const row = { lap }
    sel.forEach(r => {
      const l = r.laps[lap - 1]
      if (l) row[r.name] = +l.lapTime.toFixed(2)
    })
    return row
  })

  const allPitLaps = sel.flatMap(r => r.pits.map(p => ({ lap: p.lap, strat: r.name })))

  return (
    <div style={{ padding: '10px' }}>
      <div className="pills-row" style={{ marginBottom: '20px' }}>
        {results.slice(0, 8).map((r, i) => (
          <span
            key={r.name}
            className={`pill cursor-target ${selected.includes(r.name) ? 'on' : ''}`}
            onClick={() => onToggle(r.name)}
          >
            {r.name}
          </span>
        ))}
      </div>

      <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.2}>
        <div className="chart-card" style={{ border: 'none', margin: 0 }}>
          <p className="chart-title">Lap Time vs Lap Number</p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="lap"
                tick={{ fill: '#555b66', fontSize: 11, fontFamily: 'DM Mono' }}
                label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: '#555b66', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#555b66', fontSize: 11, fontFamily: 'DM Mono' }}
                label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft', fill: '#555b66', fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#181b20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'DM Mono' }}
                labelStyle={{ color: '#8a8f99' }}
                itemStyle={{ color: '#f0f0f0' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', paddingTop: 12 }}
              />
              {allPitLaps.map((p, i) => (
                <ReferenceLine
                  key={i} x={p.lap}
                  stroke="rgba(232,0,45,0.35)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              ))}
              {sel.map((r, i) => (
                <Line
                  key={r.name}
                  type="monotone"
                  dataKey={r.name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
            Red dashed lines indicate pit stops. Visible jumps show tyre compound transitions.
          </p>
        </div>
      </BorderGlow>

      <div style={{ marginTop: 20 }}>
        <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.2}>
          <div className="chart-card" style={{ border: 'none', margin: 0 }}>
            <p className="chart-title">Cumulative Race Time</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={lapNums.map(lap => {
                  const row = { lap }
                  sel.forEach(r => {
                    const l = r.laps[lap - 1]
                    if (l) row[r.name] = +(l.cum / 60).toFixed(3)
                  })
                  return row
                })}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="lap" tick={{ fill: '#555b66', fontSize: 11, fontFamily: 'DM Mono' }} />
                <YAxis tick={{ fill: '#555b66', fontSize: 11, fontFamily: 'DM Mono' }}
                  label={{ value: 'Race Time (min)', angle: -90, position: 'insideLeft', fill: '#555b66', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#181b20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'DM Mono' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', paddingTop: 8 }} />
                {sel.map((r, i) => (
                  <Line key={r.name} type="monotone" dataKey={r.name}
                    stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </BorderGlow>
      </div>
    </div>
  )
}
