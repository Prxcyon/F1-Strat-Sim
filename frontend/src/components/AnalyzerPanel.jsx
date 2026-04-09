import { useState, useCallback } from 'react'
import Loader from './Loader'
import { API_BASE_URL } from '../api_config'
import BorderGlow from './BorderGlow'
import CyberInput from './CyberInput'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, AreaChart, Area
} from 'recharts'

export default function AnalyzerPanel({ config }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  
  // State for driver selection
  const [driverA, setDriverA] = useState('VER')
  const [driverB, setDriverB] = useState('LEC')

  const fetchTelemetry = useCallback(async () => {
    console.log("Fetching telemetry for:", driverA, "vs", driverB, "at", config.grandPrix);
    setLoading(true)
    try {
      const gPrix = config.grandPrix.split(' ')[0] 
      const res = await fetch(`${API_BASE_URL}/compare-drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: 2024,
          grand_prix: gPrix,
          driver_a: driverA.toUpperCase(),
          driver_b: driverB.toUpperCase(),
          session: "Q"
        })
      })
      
      const json = await res.json()
      console.log("Telemetry Response:", json);
      if (json.status === 'success') {
        setData(json)
      } else {
        alert(json.detail || "Failed to fetch telemetry.")
      }
    } catch (err) {
      console.error("Telemetry Error:", err)
      alert("API Connection Error")
    }
    setLoading(false)
  }, [config, driverA, driverB])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ background: '#1e1e1e', border: '1px solid #333', padding: '10px', borderRadius: '4px' }}>
          <p className="label">{`Distance: ${label}m`}</p>
          {payload.map((p, i) => (
             <p key={i} style={{ color: p.color, margin: 0 }}>
               {p.name}: {p.value} {p.name.includes('Speed') ? 'km/h' : (p.name.includes('Delta') ? 's' : '%')}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analyzer-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px 20px', color: '#fff' }}>
      
      {/* HEADER SECTION */}
      <div className="analyzer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Driver Performance Analyzer</h2>
          <p style={{ margin: '5px 0', color: 'var(--text3)' }}>Powered by FastF1 & SHAP Explainer</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ width: '100px' }}>
            <CyberInput 
              value={driverA} 
              onChange={(e) => setDriverA(e.target.value)}
              placeholder="VER"
              showIcon={false}
              showFilter={false}
              style={{ height: '45px', fontSize: '14px', textTransform: 'uppercase', textAlign: 'center', paddingInline: '10px' }}
            />
          </div>
          <span style={{ color: 'var(--text3)', fontWeight: 'bold' }}>VS</span>
          <div style={{ width: '100px' }}>
            <CyberInput 
              value={driverB} 
              onChange={(e) => setDriverB(e.target.value)}
              placeholder="LEC"
              showIcon={false}
              showFilter={false}
              style={{ height: '45px', fontSize: '14px', textTransform: 'uppercase', textAlign: 'center', paddingInline: '10px' }}
            />
          </div>
          <button className="run-btn cursor-target" onClick={fetchTelemetry} disabled={loading} style={{ padding: '12px 24px', background: 'var(--accent)', borderRadius: '12px', fontWeight: 'bold' }}>
            {loading ? 'Analyzing...' : 'Fetch Telemetry'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <Loader />
          <p className="loading-text">Downloading AWS High-Frequency Telemetry & Generating SHAP Insights...</p>
        </div>
      )}

      {/* DASHBOARD RENDER */}
      {data && !loading && (
        <div className="dashboard-scroll" style={{ paddingRight: '10px' }}>
          <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px' }}>
            
            {/* TOP STATS CARDS */}
            <div className="telemetry-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', alignItems: 'stretch', height: '380px', maxHeight: '380px' }}>
              {/* Driver A Card */}
              <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.5}>
                <div style={{ padding: '25px', height: '100%', borderLeft: '6px solid #ef5350', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(239, 83, 80, 0.05)' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>PRIMARY DRIVER</div>
                  <div style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1 }}>{data.driver_a}</div>
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>LAP DELTA</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: data.delta > 0 ? '#4caf50' : '#ef5350', fontFamily: 'DM Mono' }}>
                      {data.delta > 0 ? `-${data.delta.toFixed(3)}s` : `+${Math.abs(data.delta).toFixed(3)}s`}
                    </div>
                  </div>
                </div>
              </BorderGlow>

              {/* TRACK MAP (Centered & Larger) */}
              <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.3} style={{ height: '380px', maxHeight: '380px' }}>
                <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Track Map Analysis</div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '10px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', background: '#ef5350', borderRadius: '2px' }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{data.driver_a} SECTOR BEST</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', background: '#42a5f5', borderRadius: '2px' }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{data.driver_b} SECTOR BEST</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '280px', maxHeight: '280px', position: 'relative', overflow: 'hidden' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {(() => {
                        if (data.chart_data.length === 0 || typeof data.chart_data[0].X === 'undefined') {
                          return <div style={{textAlign:'center', marginTop:'50px'}}>No Coordinate Data</div>;
                        }
                        
                        const validPoints = data.chart_data.filter(d => !isNaN(d.X) && !isNaN(d.Y));
                        if (validPoints.length < 2) return <div style={{textAlign:'center', marginTop:'50px'}}>Insufficient Coordinate Data</div>;

                        const minX = Math.min(...validPoints.map(d => d.X));
                        const maxX = Math.max(...validPoints.map(d => d.X));
                        const minY = Math.min(...validPoints.map(d => d.Y));
                        const maxY = Math.max(...validPoints.map(d => d.Y));
                        const dx = maxX - minX;
                        const dy = maxY - minY;
                        const size = Math.max(dx, dy);
                        
                        return (
                          <svg width="100%" height="100%" viewBox={`${minX - dx*0.2} ${-(maxY + dy*0.2)} ${size*1.4} ${size*1.4}`} preserveAspectRatio="xMidYMid meet">
                            {validPoints.map((point, i) => {
                              if (i === validPoints.length - 1) return null;
                              const next = validPoints[i+1];
                              return (
                                <line 
                                  key={i}
                                  x1={point.X} y1={-point.Y}
                                  x2={next.X} y2={-next.Y}
                                  stroke={point.Delta < 0 ? '#42a5f5' : '#ef5350'}
                                  strokeWidth={size * 0.02}
                                  strokeLinecap="round"
                                />
                              )
                            })}
                          </svg>
                        )
                      })()}
                    </ResponsiveContainer>
                  </div>
                </div>
              </BorderGlow>

              {/* Driver B Card */}
              <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.5}>
                <div style={{ padding: '25px', height: '100%', borderRight: '6px solid #42a5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right', background: 'rgba(66, 165, 245, 0.05)' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>RIVAL DRIVER</div>
                  <div style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1 }}>{data.driver_b}</div>
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>LAP DELTA</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: data.delta < 0 ? '#4caf50' : '#ef5350', fontFamily: 'DM Mono' }}>
                      {data.delta < 0 ? `-${Math.abs(data.delta).toFixed(3)}s` : `+${data.delta.toFixed(3)}s`}
                    </div>
                  </div>
                </div>
              </BorderGlow>
            </div>

            <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.4}>
              <div style={{ background: 'linear-gradient(135deg, rgba(44, 62, 80, 0.4) 0%, rgba(26, 37, 47, 0.4) 100%)', padding: '25px', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '120px', opacity: 0.03, pointerEvents: 'none' }}>BRAIN</div>
                 <div style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900, marginBottom: '12px' }}>🤖 EXPLAINABLE AI INSIGHTS (SHAP)</div>
                 <div style={{ fontSize: '20px', fontWeight: '500', lineHeight: 1.6, color: '#ecf0f1', maxWidth: '90%' }}>
                   {data.ai_insights.summary}
                 </div>
                 
                 <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                   {data.ai_insights.shap_values.slice(0, 3).map((sv, i) => (
                     <div key={i} style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>{sv.feature}</div>
                       <div style={{ color: sv.contribution_s < 0 ? '#ef5350' : '#4caf50', fontWeight: '900', fontFamily: 'DM Mono' }}>
                         {sv.contribution_s > 0 ? '+' : ''}{sv.contribution_s}s
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </BorderGlow>

            {/* TELEMETRY CHARTS SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
              {/* Speed Overlay */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem' }}>Velocity Profiling <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>(km/h)</span></h3>
                </div>
                <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.2}>
                  <div style={{ height: '230px', padding: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.chart_data} syncId="telemetry" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="Distance" hide />
                        <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" fontSize={10} width={40} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey={`Speed_${data.driver_a}`} stroke="#ef5350" strokeWidth={3} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey={`Speed_${data.driver_b}`} stroke="#42a5f5" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </BorderGlow>
              </div>

              {/* Throttle Overlay */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem' }}>Throttle Modulation <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>(%)</span></h3>
                </div>
                <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.2}>
                  <div style={{ height: '160px', padding: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.chart_data} syncId="telemetry" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="Distance" hide />
                        <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={10} width={40} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey={`Throttle_${data.driver_a}`} stroke="#ef5350" fill="#ef5350" fillOpacity={0.1} strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Area type="monotone" dataKey={`Throttle_${data.driver_b}`} stroke="#42a5f5" fill="#42a5f5" fillOpacity={0.1} strokeWidth={2} dot={false} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </BorderGlow>
              </div>

              {/* Time Delta */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem' }}>Phase Displacement <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>(s)</span></h3>
                </div>
                <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.2}>
                  <div style={{ height: '160px', padding: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.chart_data} syncId="telemetry" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="Distance" hide />
                        <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" fontSize={10} width={40} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                        <Area type="monotone" dataKey="Delta" stroke="#ffeb3b" fill="#ffeb3b" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </BorderGlow>
              </div>
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>Telemetry Comparison</h2>
          <p>Enter two drivers to overlay their fastest qualifying laps and extract SHAP logic.</p>
        </div>
      )}
    </div>
  )
}
