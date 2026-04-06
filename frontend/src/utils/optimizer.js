// optimizer.js
// JS port of the Python backend simulation logic.
// Used by the React frontend to run strategy optimisation client-side.

const GP_LAPS = {
  Bahrain: 57, Monaco: 78, Silverstone: 52,
  Spa: 44, Monza: 53, Suzuka: 53, COTA: 56,
}

const COMPOUNDS = {
  SOFT:   { k: 0.12, plateau: 2.5, base: -0.8, maxLife: 25 },
  MEDIUM: { k: 0.07, plateau: 1.8, base:  0.0, maxLife: 40 },
  HARD:   { k: 0.04, plateau: 1.2, base:  0.5, maxLife: 60 },
}

// Exponential tyre degradation model
function degDelta(compound, age) {
  const c = COMPOUNDS[compound]
  return c.plateau * (1 - Math.exp(-c.k * age))
}

// Deterministic race simulation (noise=false for optimisation)
function simRace(startCmp, pits, totalLaps, baseLap, pitLoss, noise = false, seed = 42) {
  let cur = startCmp
  let age = 1
  let total = 0
  const sched = {}
  pits.forEach(p => { sched[p.lap] = p.cmp })

  const laps = []
  let rngState = seed

  function rng() {
    rngState = (rngState * 1664525 + 1013904223) & 0xffffffff
    return (rngState >>> 0) / 0xffffffff
  }

  for (let l = 1; l <= totalLaps; l++) {
    const deg      = degDelta(cur, age)
    const cmpBase  = COMPOUNDS[cur].base
    const fuelSave = 0.065 * (l - 1)
    const sc       = noise && rng() < 0.04 ? 28 : 0
    const n        = noise ? (rng() - 0.5) * 0.5 : 0

    let lt = baseLap + deg + cmpBase - fuelSave + sc + n
    lt = Math.max(lt, baseLap - 6)

    const isPit = sched[l] !== undefined
    if (isPit) lt += pitLoss
    total += lt

    laps.push({
      lap: l, compound: cur, age,
      lapTime: +lt.toFixed(3),
      cum: +total.toFixed(3),
      isPit,
      newCmp: sched[l] || null,
    })

    if (isPit && sched[l]) { cur = sched[l]; age = 1 } else age++
  }
  return { total, laps }
}

// Monte Carlo: run N noisy simulations
function monteCarlo(strat, totalLaps, baseLap, pitLoss, n = 500) {
  const times = []
  for (let i = 0; i < n; i++) {
    const res = simRace(strat.startCmp, strat.pits, totalLaps, baseLap, pitLoss, true, i * 7 + 42)
    times.push(res.total)
  }
  times.sort((a, b) => a - b)
  const sum  = times.reduce((s, v) => s + v, 0)
  const mean = sum / n
  const std  = Math.sqrt(times.reduce((s, v) => s + (v - mean) ** 2, 0) / n)
  return {
    mean, std,
    p10:   times[Math.floor(n * 0.10)],
    p25:   times[Math.floor(n * 0.25)],
    p50:   times[Math.floor(n * 0.50)],
    p75:   times[Math.floor(n * 0.75)],
    p90:   times[Math.floor(n * 0.90)],
    best:  times[0],
    worst: times[n - 1],
    all:   times,
  }
}

// Generate candidate strategies
function buildStrategies(totalLaps, maxStops) {
  const strats = []
  const t3 = Math.round(totalLaps / 3)
  const t2 = Math.round(totalLaps / 2)
  const t23 = Math.round(2 * totalLaps / 3)
  const t25 = Math.round(totalLaps * 0.25)
  const t40 = Math.round(totalLaps * 0.40)
  const t60 = Math.round(totalLaps * 0.60)

  if (maxStops >= 1) {
    const onePit = [
      ['SOFT',   t2,   'HARD'],
      ['SOFT',   t2,   'MEDIUM'],
      ['MEDIUM', t2,   'HARD'],
      ['SOFT',   t40,  'HARD'],
      ['SOFT',   t60,  'HARD'],
      ['MEDIUM', t40,  'HARD'],
    ]
    onePit.forEach(([s, l, e]) => {
      strats.push({ name: `1-Stop ${s[0]}→${e[0]} @L${l}`, startCmp: s, pits: [{ lap: l, cmp: e }] })
    })
  }

  if (maxStops >= 2) {
    const twoPit = [
      ['SOFT',   'MEDIUM', 'HARD',   t3,  t23],
      ['SOFT',   'HARD',   'MEDIUM', t3,  t23],
      ['MEDIUM', 'SOFT',   'HARD',   t3,  t23],
      ['SOFT',   'MEDIUM', 'HARD',   t25, t60],
      ['SOFT',   'HARD',   'MEDIUM', t40, t60],
    ]
    twoPit.forEach(([s, m, e, l1, l2]) => {
      strats.push({ name: `2-Stop ${s[0]}→${m[0]}→${e[0]}`, startCmp: s, pits: [{ lap: l1, cmp: m }, { lap: l2, cmp: e }] })
    })
  }

  if (maxStops >= 3) {
    const q = Math.round(totalLaps / 4)
    strats.push({
      name: '3-Stop S→S→S→H',
      startCmp: 'SOFT',
      pits: [{ lap: q, cmp: 'SOFT' }, { lap: q * 2, cmp: 'SOFT' }, { lap: q * 3, cmp: 'HARD' }]
    })
    strats.push({
      name: '3-Stop S→M→M→H',
      startCmp: 'SOFT',
      pits: [{ lap: q, cmp: 'MEDIUM' }, { lap: q * 2, cmp: 'MEDIUM' }, { lap: q * 3, cmp: 'HARD' }]
    })
  }

  return strats
}

// Main optimiser entry point
export function runOptimizer(config) {
  const totalLaps = GP_LAPS[config.grandPrix] || 57
  const { baseLapTime, pitLoss, maxStops } = config

  const strategies = buildStrategies(totalLaps, maxStops)

  const results = strategies.map(s => {
    const det = simRace(s.startCmp, s.pits, totalLaps, baseLapTime, pitLoss, false)
    const mc  = monteCarlo(s, totalLaps, baseLapTime, pitLoss, 400)
    return { ...s, total: det.total, laps: det.laps, mc }
  })

  results.sort((a, b) => a.mc.mean - b.mc.mean)
  results.forEach((r, i) => { r.rank = i + 1 })

  return results
}
