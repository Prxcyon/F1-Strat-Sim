import { useState, useCallback } from 'react'
import Loader from './Loader'
import { API_BASE_URL } from '../api_config'
import BorderGlow from './BorderGlow'
import TiltedCard from './TiltedCard'

// Helper to get driver image from public or assets
// In a real app these would be actual F1 driver photos
const getDriverImg = (code) => {
  const drivers = {
    'VER': 'https://media.formula1.com/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png',
    'HAM': 'https://media.formula1.com/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png',
    'LEC': 'https://media.formula1.com/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png',
    'NOR': 'https://media.formula1.com/image/upload/c_thumb,g_face,z_0.3,h_800,w_800,q_auto/v1740000001/common/f1/2026/mclaren/lannor01/2026mclarenlannor01right.webp',
    'SAI': 'https://media.formula1.com/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png',
    'PIA': 'https://media.formula1.com/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png',
    'RUS': 'https://media.formula1.com/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png',
    'PER': 'https://media.formula1.com/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png',
    'ALO': 'https://media.formula1.com/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png',
    'STR': 'https://media.formula1.com/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png',
  }
  return drivers[code] || 'https://media.formula1.com/content/dam/fom-website/drivers/S/SILHOUETTE_Driver/silhouette.png'
}

export default function PredictorPanel({ config }) {
  const [loading, setLoading] = useState(false)
  const [predictions, setPredictions] = useState(null)

  const runPrediction = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/predict-winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grand_prix: config.grandPrix,
          total_laps: config.maxStops === 1 ? 50 : 57
        })
      })
      const data = await res.json()
      setPredictions(data.predictions)
    } catch (err) {
      console.error(err)
      alert("Failed to connect to ML Predictor API")
    }
    setLoading(false)
  }, [config])

  return (
    <div className="predictor-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '10px 30px', color: '#fff' }}>
      <div className="predictor-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>ML Winner Predictor</h2>
          <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Deterministic AI simulation for the {config.grandPrix} Grand Prix</p>
        </div>
        <button
          className="run-btn cursor-target"
          style={{
            margin: 0,
            width: 'auto',
            padding: '12px 28px',
            background: 'var(--accent)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(232, 0, 45, 0.4)',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
          onClick={runPrediction}
          disabled={loading}
        >
          {loading ? 'RUNNING SIMULATION...' : 'RUN ML PREDICTION'}
        </button>
      </div>

      {loading && (
        <div className="empty-state" style={{ height: '400px' }}>
          <Loader />
          <p className="loading-text" style={{ fontStyle: 'italic', opacity: 0.7 }}>Analyzing historical data & simulating race conditions...</p>
        </div>
      )}

      {predictions && !loading && (
        <div className="podium-area">
          <div className="podium-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '30px',
            marginBottom: '60px',
            alignItems: 'end',
            maxWidth: '1000px',
            margin: '0 auto 60px auto'
          }}>
            {/* P2 */}
            {predictions[1] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '2px' }}>🥈 2ND PLACE</div>
                <TiltedCard
                  imageSrc={getDriverImg(predictions[1].driver)}
                  altText={predictions[1].driver}
                  captionText={predictions[1].driver}
                  containerHeight="260px"
                  imageHeight="260px"
                  imageWidth="220px"
                  rotateAmplitude={12}
                  overlayContent={
                    <div className="tilted-card-overlay-content">
                      <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{predictions[1].driver}</div>
                      <div style={{ fontSize: '10px', opacity: 0.8 }}>{predictions[1].team}</div>
                    </div>
                  }
                  displayOverlayContent={true}
                />
              </div>
            )}

            {/* P1 */}
            {predictions[0] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingBottom: '30px' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '4px' }}>🏆 WINNER</div>
                <TiltedCard
                  imageSrc={getDriverImg(predictions[0].driver)}
                  altText={predictions[0].driver}
                  captionText={predictions[0].driver}
                  containerHeight="320px"
                  imageHeight="320px"
                  imageWidth="280px"
                  rotateAmplitude={18}
                  scaleOnHover={1.15}
                  overlayContent={
                    <div className="tilted-card-overlay-content" style={{ background: 'rgba(255, 215, 0, 0.15)' }}>
                      <div style={{ fontWeight: 900, fontSize: '1.8rem', color: '#ffd700' }}>{predictions[0].driver}</div>
                      <div style={{ fontSize: '12px', color: '#fff' }}>{predictions[0].team}</div>
                    </div>
                  }
                  displayOverlayContent={true}
                />
              </div>
            )}

            {/* P3 */}
            {predictions[2] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#cd7f32', textTransform: 'uppercase', letterSpacing: '2px' }}>🥉 3RD PLACE</div>
                <TiltedCard
                  imageSrc={getDriverImg(predictions[2].driver)}
                  altText={predictions[2].driver}
                  captionText={predictions[2].driver}
                  containerHeight="240px"
                  imageHeight="240px"
                  imageWidth="200px"
                  rotateAmplitude={10}
                  overlayContent={
                    <div className="tilted-card-overlay-content">
                      <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{predictions[2].driver}</div>
                      <div style={{ fontSize: '10px', opacity: 0.8 }}>{predictions[2].team}</div>
                    </div>
                  }
                  displayOverlayContent={true}
                />
              </div>
            )}
          </div>

          <BorderGlow className="cursor-target" borderRadius={12} glowIntensity={0.3}>
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
              <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '15px 10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>POS</th>
                    <th style={{ padding: '15px 10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>DRIVER</th>
                    <th style={{ padding: '15px 10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>TEAM</th>
                    <th style={{ padding: '15px 10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>RACE TIME</th>
                    <th style={{ padding: '15px 10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>GAP</th>
                    <th style={{ padding: '15px 10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>STRATEGY</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map(p => (
                    <tr key={p.driver} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="leaderboard-row">
                      <td style={{ padding: '15px 10px', fontWeight: 'bold', width: '60px' }}>{p.rank}</td>
                      <td style={{ padding: '15px 10px', fontWeight: '900', letterSpacing: '1px' }}>{p.driver}</td>
                      <td style={{ padding: '15px 10px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{p.team}</td>
                      <td style={{ padding: '15px 10px', fontFamily: 'DM Mono', fontSize: '0.9rem', color: 'var(--accent)' }}>{p.total_time_fmt}</td>
                      <td style={{ padding: '15px 10px', fontFamily: 'DM Mono', color: p.rank === 1 ? '#4caf50' : '#ffffff', fontSize: '0.9rem' }}>
                        {p.rank === 1 ? 'WINNER' : `+${p.delta_vs_winner.toFixed(2)}s`}
                      </td>
                      <td style={{ padding: '15px 10px' }}>
                        <span className="pit-badge" style={{ fontSize: '10px', padding: '4px 8px' }}>{p.pit_strategy}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BorderGlow>
        </div>
      )}

    </div>
  )
}
