"""
simulator.py
============
Monte Carlo race simulator.
Simulates a full F1 race lap-by-lap given a pit strategy,
running N iterations with random noise to produce a time distribution.
"""

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional
import warnings
warnings.filterwarnings("ignore")

from tire_degradation import DegradationCurve, compound_base_delta, compound_max_life, _default_curve


# ── Strategy Definition ───────────────────────────────────────────────────────
@dataclass
class PitStop:
    lap      : int    # lap number to pit on
    compound : str    # tire to fit after stop


@dataclass
class Strategy:
    name      : str
    start_compound: str
    pit_stops : list[PitStop]
    label     : str = ""

    def __post_init__(self):
        if not self.label:
            stops = " → ".join(
                [self.start_compound[:1]] + [p.compound[:1] for p in self.pit_stops]
            )
            self.label = f"{self.name} ({stops})"


# ── Race Config ───────────────────────────────────────────────────────────────
@dataclass
class RaceConfig:
    total_laps        : int   = 57
    pit_loss_seconds  : float = 22.0      # time lost per pit stop
    safety_car_prob   : float = 0.05      # per-lap probability of SC
    safety_car_delta  : float = 30.0      # SC lap time inflation (s)
    vsc_prob          : float = 0.03
    vsc_delta         : float = 15.0
    overtaking_factor : float = 0.0       # reserved for future use
    base_lap_time     : float = 92.0      # baseline clean-air lap time (s)
    fuel_effect_per_lap: float = 0.065    # seconds of time gain per lap (fuel burns off)
    noise_std          : float = 0.25     # std dev of lap-to-lap random noise (s)
    driver_skill_delta : float = 0.0      # driver pace delta vs reference (s, negative = faster)


# ── Lap Result ────────────────────────────────────────────────────────────────
@dataclass
class LapResult:
    lap_num       : int
    compound      : str
    tire_age      : int
    lap_time      : float
    cumulative    : float
    is_pit_lap    : bool
    pit_compound  : Optional[str] = None
    sc_active     : bool = False


# ── Simulation Result ─────────────────────────────────────────────────────────
@dataclass
class SimulationResult:
    strategy          : Strategy
    total_time        : float
    lap_results       : list[LapResult]
    pit_laps          : list[int]
    total_pit_loss    : float
    mean_lap_time     : float
    fastest_lap       : float


# ── Single Race Simulation ────────────────────────────────────────────────────
def simulate_race(
    strategy          : Strategy,
    config            : RaceConfig,
    degradation_curves: dict[str, DegradationCurve],
    rng               : np.random.Generator | None = None,
    noise             : bool = True,
) -> SimulationResult:
    """
    Simulate a single race with a given strategy.

    Args:
        strategy          : Pit strategy to simulate
        config            : Race configuration
        degradation_curves: Dict of compound → DegradationCurve
        rng               : Random number generator (for reproducibility)
        noise             : Whether to add lap-to-lap noise

    Returns:
        SimulationResult
    """
    if rng is None:
        rng = np.random.default_rng()

    # Build pit schedule as a dict
    pit_schedule: dict[int, str] = {p.lap: p.compound for p in strategy.pit_stops}

    current_compound = strategy.start_compound
    tire_age         = 1
    total_time       = 0.0
    total_pit_loss   = 0.0
    lap_results      = []

    for lap in range(1, config.total_laps + 1):
        # ── Tire Degradation ──────────────────────────────────────────────────
        curve = degradation_curves.get(current_compound, _default_curve(current_compound))
        deg   = curve.predict(tire_age)

        # ── Compound Pace Delta ───────────────────────────────────────────────
        pace_delta = compound_base_delta(current_compound)

        # ── Fuel Savings (lighter car as race progresses) ─────────────────────
        fuel_saving = config.fuel_effect_per_lap * (lap - 1)

        # ── Safety Car ────────────────────────────────────────────────────────
        sc_active  = rng.random() < config.safety_car_prob if noise else False
        vsc_active = rng.random() < config.vsc_prob if noise else False
        sc_delta   = config.safety_car_delta if sc_active else (config.vsc_delta if vsc_active else 0)

        # ── Random Noise ─────────────────────────────────────────────────────
        noise_val = rng.normal(0, config.noise_std) if noise else 0.0

        # ── Lap Time ──────────────────────────────────────────────────────────
        lap_time = (
            config.base_lap_time
            + deg
            + pace_delta
            - fuel_saving
            + sc_delta
            + noise_val
            + config.driver_skill_delta
        )
        lap_time = max(lap_time, config.base_lap_time - 5)  # clamp

        # ── Pit Stop ──────────────────────────────────────────────────────────
        is_pit    = lap in pit_schedule
        new_cmp   = pit_schedule.get(lap)

        if is_pit:
            lap_time       += config.pit_loss_seconds
            total_pit_loss += config.pit_loss_seconds

        total_time += lap_time
        lap_results.append(LapResult(
            lap_num      = lap,
            compound     = current_compound,
            tire_age     = tire_age,
            lap_time     = lap_time,
            cumulative   = total_time,
            is_pit_lap   = is_pit,
            pit_compound = new_cmp,
            sc_active    = sc_active or vsc_active,
        ))

        # ── Update State ──────────────────────────────────────────────────────
        if is_pit and new_cmp:
            current_compound = new_cmp
            tire_age         = 1
        else:
            tire_age += 1

    lap_times = [r.lap_time for r in lap_results if not r.is_pit_lap]

    return SimulationResult(
        strategy        = strategy,
        total_time      = total_time,
        lap_results     = lap_results,
        pit_laps        = list(pit_schedule.keys()),
        total_pit_loss  = total_pit_loss,
        mean_lap_time   = float(np.mean(lap_times)),
        fastest_lap     = float(min(lap_times)),
    )


# ── Monte Carlo ───────────────────────────────────────────────────────────────
@dataclass
class MonteCarloResult:
    strategy      : Strategy
    n_iterations  : int
    mean_time     : float
    std_time      : float
    p10_time      : float
    p90_time      : float
    best_time     : float
    worst_time    : float
    all_times     : np.ndarray

    def summary(self) -> str:
        m, s = divmod(int(self.mean_time), 60)
        h, m = divmod(m, 60)
        return (
            f"{self.strategy.label}\n"
            f"  Mean : {h:02d}:{m:02d}:{s:02d}  ±{self.std_time:.1f}s\n"
            f"  P10–P90 : {self.p10_time:.1f}s – {self.p90_time:.1f}s\n"
            f"  Best/Worst : {self.best_time:.1f}s / {self.worst_time:.1f}s"
        )


def monte_carlo(
    strategy          : Strategy,
    config            : RaceConfig,
    degradation_curves: dict[str, DegradationCurve],
    n_iterations      : int = 500,
    seed              : int = 42,
) -> MonteCarloResult:
    """
    Run Monte Carlo simulation for a strategy.

    Args:
        strategy          : Pit strategy
        config            : Race configuration
        degradation_curves: Tire degradation curves
        n_iterations      : Number of simulation runs
        seed              : Random seed for reproducibility

    Returns:
        MonteCarloResult with distribution statistics
    """
    rng    = np.random.default_rng(seed)
    times  = np.zeros(n_iterations)

    for i in range(n_iterations):
        result  = simulate_race(strategy, config, degradation_curves, rng=rng, noise=True)
        times[i] = result.total_time

    return MonteCarloResult(
        strategy     = strategy,
        n_iterations = n_iterations,
        mean_time    = float(np.mean(times)),
        std_time     = float(np.std(times)),
        p10_time     = float(np.percentile(times, 10)),
        p90_time     = float(np.percentile(times, 90)),
        best_time    = float(np.min(times)),
        worst_time   = float(np.max(times)),
        all_times    = times,
    )


# ── Compare Strategies ────────────────────────────────────────────────────────
def compare_strategies(
    strategies        : list[Strategy],
    config            : RaceConfig,
    degradation_curves: dict[str, DegradationCurve],
    n_iterations      : int = 300,
) -> list[MonteCarloResult]:
    """
    Run Monte Carlo for multiple strategies and return sorted results.
    """
    results = []
    for i, strategy in enumerate(strategies):
        print(f"[Simulator] Running MC for '{strategy.label}' ({i+1}/{len(strategies)}) ...")
        mc = monte_carlo(strategy, config, degradation_curves, n_iterations=n_iterations, seed=i*7+42)
        results.append(mc)
        print(f"  → Mean: {mc.mean_time:.1f}s  ±{mc.std_time:.1f}s")

    results.sort(key=lambda r: r.mean_time)
    return results


# ── Common F1 Strategies ─────────────────────────────────────────────────────
def get_standard_strategies(total_laps: int = 57) -> list[Strategy]:
    """Return a set of standard 1-stop and 2-stop strategies."""
    mid  = total_laps // 2
    early = total_laps // 3
    late  = (total_laps * 2) // 3

    return [
        # 1-stop
        Strategy("1-Stop Soft-Hard",   "SOFT",   [PitStop(mid,   "HARD")]),
        Strategy("1-Stop Medium-Hard",  "MEDIUM", [PitStop(mid,   "HARD")]),
        Strategy("1-Stop Soft-Medium",  "SOFT",   [PitStop(mid,   "MEDIUM")]),

        # 2-stop
        Strategy("2-Stop S-M-H",  "SOFT",   [PitStop(early, "MEDIUM"), PitStop(late, "HARD")]),
        Strategy("2-Stop S-H-M",  "SOFT",   [PitStop(early, "HARD"),   PitStop(late, "MEDIUM")]),
        Strategy("2-Stop M-S-H",  "MEDIUM", [PitStop(early, "SOFT"),   PitStop(late, "HARD")]),

        # 3-stop
        Strategy("3-Stop S-S-S-H", "SOFT", [
            PitStop(total_laps // 5,     "SOFT"),
            PitStop(total_laps * 2 // 5, "SOFT"),
            PitStop(total_laps * 3 // 5, "HARD"),
        ]),
    ]


# ── Quick Test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    from tire_degradation import _default_curve

    curves    = {c: _default_curve(c) for c in ["SOFT", "MEDIUM", "HARD"]}
    config    = RaceConfig(total_laps=57)
    strategies = get_standard_strategies(total_laps=57)

    results = compare_strategies(strategies, config, curves, n_iterations=200)
    print("\n── Strategy Comparison ──────────────────────────────────────────")
    for rank, mc in enumerate(results, 1):
        delta = mc.mean_time - results[0].mean_time
        print(f"  #{rank}  {mc.strategy.label:<40s}  {mc.mean_time:.1f}s  (+{delta:.1f}s)")
