import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import BorderGlow from './BorderGlow'

const COMPOUNDS = {
  SOFT:   { k: 0.12, plateau: 2.5, base: -0.8, maxLife: 25, color: '#E8002D' },
  MEDIUM: { k: 0.07, plateau: 1.8, base:  0.0, maxLife: 40, color: '#d4ab00' },
  HARD:   { k: 0.04, plateau: 1.2, base:  0.5, maxLife: 60, color: '#c8c8c8' },
}

function degDelta(compound, age) {
  const c = COMPOUNDS[compound]
  return c.plateau * (1 - Math.exp(-c.k * age))
}

const ages = Array.from({ length: 45 }, (_, i) => i + 1)

const data = ages.map(age => ({
  age,
  SOFT:   +degDelta('SOFT', age).toFixed(3),
  MEDIUM: +degDelta('MEDIUM', age).toFixed(3),
  HARD:   +degDelta('HARD', age).toFixed(3),
}))

export default function DegradationPanel() {
  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.2}>
        <div className="chart-card" style={{ border: 'none', margin: 0 }}>
          <p className="chart-title">Tyre Degradation — Time Loss vs Fresh Tyre</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="age"
                tick={{ fill: '#555b66', fontSize: 11, fontFamily: 'DM Mono' }}
                label={{ value: 'Tyre Age (laps)', position: 'insideBottom', offset: -2, fill: '#555b66', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#555b66', fontSize: 11, fontFamily: 'DM Mono' }}
                label={{ value: 'Time Loss (s)', angle: -90, position: 'insideLeft', fill: '#555b66', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ background: '#181b20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'DM Mono' }}
                formatter={(v, name) => [`+${v.toFixed(3)}s`, name]}
                labelFormatter={l => `Tyre age: ${l} laps`}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', paddingTop: 10 }} />
              {Object.entries(COMPOUNDS).map(([name, c]) => (
                <Line
                  key={name} type="monotone" dataKey={name}
                  stroke={c.color} strokeWidth={2.5} dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </BorderGlow>

      <div style={{ marginTop: 20 }}>
        <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.2}>
          <div className="chart-card" style={{ border: 'none', margin: 0 }}>
            <p className="chart-title">Compound Properties</p>
            <table className="tyre-table">
              <thead>
                <tr>
                  <th>Compound</th>
                  <th>Degradation Model</th>
                  <th>+5 laps</th>
                  <th>+15 laps</th>
                  <th>+25 laps</th>
                  <th>Plateau</th>
                  <th>Max Life</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(COMPOUNDS).map(([name, c]) => (
                  <tr key={name}>
                    <td>
                      <span className="compound-pill">
                        <span className="compound-dot" style={{ background: c.color, width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
                        {name}
                      </span>
                    </td>
                    <td>Exponential</td>
                    <td>+{degDelta(name, 5).toFixed(2)}s</td>
                    <td>+{degDelta(name, 15).toFixed(2)}s</td>
                    <td>+{degDelta(name, 25).toFixed(2)}s</td>
                    <td>+{c.plateau.toFixed(1)}s</td>
                    <td>~{c.maxLife} laps</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12 }}>
              Model: Δt = plateau × (1 − e<sup>−k × age</sup>). Curves are fitted from real FastF1 stint data.
            </p>
          </div>
        </BorderGlow>
      </div>
    </div>
  )
}
