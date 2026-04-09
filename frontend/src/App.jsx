import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import OptimizerPanel from './components/OptimizerPanel'
import LapTimePanel from './components/LapTimePanel'
import DegradationPanel from './components/DegradationPanel'
import MonteCarloPanel from './components/MonteCarloPanel'
import PredictorPanel from './components/PredictorPanel'
import AnalyzerPanel from './components/AnalyzerPanel'
import LandingPage from './components/LandingPage'
import Loader from './components/Loader'
import TargetCursor from './components/TargetCursor'
import BorderGlow from './components/BorderGlow'
import { runOptimizer } from './utils/optimizer'
import './styles/global.css'

const TABS = [
  { id: 'optimizer',    label: 'Optimizer' },
  { id: 'laptime',      label: 'Lap Chart' },
  { id: 'degradation',  label: 'Tyre Deg' },
  { id: 'montecarlo',   label: 'Monte Carlo' },
]

export default function App() {
  const [appMode, setAppMode] = useState('optimizer') // 'optimizer' | 'predictor' | 'analyzer'
  const [activeTab, setActiveTab] = useState('optimizer')
  const [config, setConfig] = useState({
    grandPrix:   'Bahrain',
    baseLapTime: 92.0,
    pitLoss:     22.0,
    maxStops:    2,
  })
  const [results, setResults]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [selectedStrats, setSelected] = useState([])
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const handleOptimize = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const res = runOptimizer(config)
      setResults(res)
      setSelected([res[0].name, res[1]?.name].filter(Boolean))
      setLoading(false)
    }, 60)
  }, [config])

  const toggleStrat = useCallback((name) => {
    setSelected(prev =>
      prev.includes(name)
        ? prev.length > 1 ? prev.filter(n => n !== name) : prev
        : [...prev, name]
    )
  }, [])

  return (
    <>
      <TargetCursor 
        targetSelector=".cursor-target, button, .tab-btn, .circular-gallery" 
        active={!isGalleryOpen}
      />
      
      <LandingPage>
        <div className="app-shell" style={{ background: 'transparent', height: '100%', overflow: 'hidden', border: 'none' }}>
          <Sidebar
            mode={appMode}
            config={config}
            onChange={setConfig}
            onOptimize={handleOptimize}
            loading={loading}
            isGalleryOpen={isGalleryOpen}
            setIsGalleryOpen={setIsGalleryOpen}
          />
        <main className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>
          <div className="mode-switch" style={{ display: 'flex', gap: '10px', padding: '15px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg2)', zIndex: 20 }}>
            <button 
              className={`tab-btn cursor-target ${appMode === 'optimizer' ? 'active' : ''}`}
              onClick={() => setAppMode('optimizer')}
              style={{ fontSize: '1.0rem', padding: '8px 16px', background: appMode === 'optimizer' ? 'var(--accent)' : 'transparent', color: appMode === 'optimizer' ? '#fff' : 'var(--text2)', borderRadius: '6px', pointerEvents: 'auto' }}
            >
              Strategy Engine
            </button>
            <button 
              className={`tab-btn cursor-target ${appMode === 'predictor' ? 'active' : ''}`}
              onClick={() => setAppMode('predictor')}
              style={{ fontSize: '1.0rem', padding: '8px 16px', background: appMode === 'predictor' ? 'var(--accent)' : 'transparent', color: appMode === 'predictor' ? '#fff' : 'var(--text2)', borderRadius: '6px', pointerEvents: 'auto' }}
            >
              ML Predictor
            </button>
            <button 
              className={`tab-btn cursor-target ${appMode === 'analyzer' ? 'active' : ''}`}
              onClick={() => setAppMode('analyzer')}
              style={{ fontSize: '1.0rem', padding: '8px 16px', background: appMode === 'analyzer' ? 'var(--accent)' : 'transparent', color: appMode === 'analyzer' ? '#fff' : 'var(--text2)', borderRadius: '6px', pointerEvents: 'auto' }}
            >
              Telemetry Analyzer
            </button>
          </div>

          {appMode === 'optimizer' && (
            <>
              <Header grandPrix={config.grandPrix} hasResults={!!results} />

              {results && (
            <>
              <div className="stat-row">
                {[
                  { label: 'Optimal Strategy', value: results[0].name, mono: false },
                  { label: 'Race Time',  value: fmtTime(results[0].mc.mean), mono: true },
                  { label: 'Vs Worst',   value: `−${(results.at(-1).mc.mean - results[0].mc.mean).toFixed(1)}s`, mono: true },
                  { label: 'Evaluated',  value: `${results.length} strategies`, mono: false },
                ].map(s => (
                  <BorderGlow key={s.label} className="cursor-target" borderRadius={12} glowRadius={30} glowIntensity={0.6}>
                    <div className="stat-card" style={{ border: 'none', margin: 0, height: '100%' }}>
                      <span className="stat-label">{s.label}</span>
                      <span className={`stat-value ${s.mono ? 'mono' : ''}`}>{s.value}</span>
                    </div>
                  </BorderGlow>
                ))}
              </div>

              <nav className="tab-bar">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    className={`tab-btn cursor-target ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              <div className="panel-area" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {activeTab === 'optimizer'   && <OptimizerPanel results={results} selected={selectedStrats} onToggle={toggleStrat} config={config} />}
                {activeTab === 'laptime'     && <LapTimePanel results={results} selected={selectedStrats} onToggle={toggleStrat} />}
                {activeTab === 'degradation' && <DegradationPanel />}
                {activeTab === 'montecarlo'  && <MonteCarloPanel results={results} selected={selectedStrats} onToggle={toggleStrat} />}
              </div>
            </>
          )}

          {!results && !loading && (
            <div className="empty-state">
              <div className="empty-icon">⬡</div>
              <h2>Configure &amp; Optimise</h2>
              <p>Select a Grand Prix, adjust pit strategy parameters,<br />then click <strong>Run Optimiser</strong> to analyse all strategies.</p>
            </div>
          )}

              {loading && (
                <div className="empty-state">
                  <Loader />
                  <p className="loading-text">Running Monte Carlo simulation…</p>
                </div>
              )}
            </>
          )}
          
          {appMode === 'predictor' && <PredictorPanel config={config} />}
          {appMode === 'analyzer' && <AnalyzerPanel config={config} />}
        </main>
        </div>
      </LandingPage>
    </>
  )
}

export function fmtTime(s) {
  const m = Math.floor(s / 60)
  const ss = (s % 60).toFixed(1).padStart(4, '0')
  return `${m}:${ss}`
}
