import { useState, useEffect } from 'react'
import { fmtTime } from '../App'
import BorderGlow from './BorderGlow'

const COMPOUND_COLORS = {
  SOFT: '#E8002D', MEDIUM: '#d4ab00', HARD: '#c8c8c8',
}

export default function OptimizerPanel({ results, selected, onToggle, config }) {
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoad] = useState(false)

  const base = results[0].mc.mean

  useEffect(() => {
    if (results?.[0]) fetchAI(results[0], config)
  }, [results])

  async function fetchAI(best, cfg) {
    setAiLoad(true)
    setAiText('')
    const prompt = `You are an F1 race strategist. In exactly 3 sentences, explain why this is the optimal strategy for the ${cfg.grandPrix} Grand Prix (${cfg.totalLaps || 57} laps): ${best.name}. Pit stops at lap(s): ${best.pits.map(p => `Lap ${p.lap} switching to ${p.cmp}`).join(', ')}. Cover tyre degradation rate, the undercut/overcut opportunity, and how fuel load affects pace. Be precise and technical. No markdown, no bullet points.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 220,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      setAiText(data.content?.[0]?.text || fallback(best, cfg))
    } catch {
      setAiText(fallback(best, cfg))
    }
    setAiLoad(false)
  }

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div className="strat-grid">
        {results.slice(0, 8).map((r, i) => {
          const delta = r.mc.mean - base
          return (
            <div
              key={r.name}
              className={`strat-card cursor-target ${i === 0 ? 'best' : ''} ${selected.includes(r.name) ? 'selected' : ''}`}
              onClick={() => onToggle(r.name)}
            >
              <div className={`strat-rank ${i === 0 ? 'gold' : ''}`}>
                {i === 0 ? '▶' : `#${i + 1}`}
              </div>

              <div className="strat-info">
                <div className="strat-name">{r.name}</div>
                <div className="strat-meta">
                  {r.pits.map(p => (
                    <span key={p.lap} className="pit-badge">
                      <span style={{ color: COMPOUND_COLORS[p.cmp] }}>●</span> L{p.lap} → {p.cmp}
                    </span>
                  ))}
                  <span style={{ color: 'var(--text3)' }}>±{r.mc.std.toFixed(1)}s variability</span>
                </div>
              </div>

              <div className="strat-time">
                <div className="t">{fmtTime(r.mc.mean)}</div>
                <div className={`delta ${i === 0 ? 'delta-red' : ''}`}>
                  {i === 0 ? 'fastest' : `+${delta.toFixed(1)}s`}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <BorderGlow className="ai-container cursor-target" borderRadius={16} glowIntensity={0.5}>
        <div className="ai-box" style={{ border: 'none', margin: 0 }}>
          <div className="ai-box-header">
            <span className="ai-tag">AI Analyst</span>
            <h3>Strategy Briefing — {results[0].name}</h3>
          </div>
          <p className={`ai-text ${aiLoading ? 'loading' : ''}`}>
            {aiLoading ? 'Generating race strategy analysis…' : aiText}
          </p>
        </div>
      </BorderGlow>
    </div>
  )
}

function fallback(best, cfg) {
  return `The ${best.name} strategy exploits the tyre degradation window specific to ${cfg.grandPrix}, where the initial compound provides maximum attack pace before performance drops off. Pitting at lap ${best.pits[0]?.lap} creates an undercut opportunity as rival compounds approach the cliff phase, with the fresher rubber immediately offsetting the pit stop delta. The lighter fuel load in the final stint amplifies the pace advantage of the fresher compound, securing a net positive total race time versus longer stints.`
}
