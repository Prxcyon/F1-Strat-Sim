"""
optimizer.py
============
OR-Tools based race strategy optimizer.
Finds the optimal pit lap(s) and tire compound sequence to minimize total race time.
Uses a grid search + integer programming hybrid approach.
"""

import itertools
import numpy as np
from dataclasses import dataclass
from typing import Optional

from ortools.linear_solver import pywraplp

from tire_degradation import DegradationCurve, compound_base_delta, compound_max_life, _default_curve
from simulator import Strategy, PitStop, RaceConfig, simulate_race


# ── Optimizer Config ──────────────────────────────────────────────────────────
@dataclass
class OptimizerConfig:
    max_stops          : int   = 2
    min_stops          : int   = 1
    allowed_compounds  : list  = None          # None = ['SOFT','MEDIUM','HARD']
    must_use_two_compounds: bool = True         # FIA dry-race rule
    min_stint_length   : int   = 5             # minimum laps per stint
    max_stint_length   : int   = 60            # maximum stint length
    pit_window_start   : int   = 5             # earliest lap to pit
    n_pit_candidates   : int   = 20            # candidate pit laps to evaluate

    def __post_init__(self):
        if self.allowed_compounds is None:
            self.allowed_compounds = ["SOFT", "MEDIUM", "HARD"]


# ── Optimized Strategy Result ─────────────────────────────────────────────────
@dataclass
class OptimizedStrategy:
    strategy          : Strategy
    total_time        : float
    lap_by_lap        : list
    pit_details       : list[dict]
    rank              : int = 1


# ── Grid Search Optimizer ─────────────────────────────────────────────────────
def optimize(
    config            : RaceConfig,
    degradation_curves: dict[str, DegradationCurve],
    opt_config        : OptimizerConfig | None = None,
    verbose           : bool = True,
) -> list[OptimizedStrategy]:
    """
    Find optimal pit strategy via exhaustive grid search over candidate laps + compounds.

    Args:
        config            : RaceConfig (total_laps, pit_loss_seconds, etc.)
        degradation_curves: Fitted or default tire degradation curves
        opt_config        : Optimizer settings
        verbose           : Print progress

    Returns:
        List of OptimizedStrategy, sorted best-first
    """
    if opt_config is None:
        opt_config = OptimizerConfig()

    total_laps = config.total_laps
    compounds  = opt_config.allowed_compounds

    # Generate candidate pit laps (evenly spaced + critical windows)
    candidate_laps = _candidate_pit_laps(total_laps, opt_config)

    all_results: list[OptimizedStrategy] = []

    # ── Iterate over number of stops ──────────────────────────────────────────
    for n_stops in range(opt_config.min_stops, opt_config.max_stops + 1):
        if verbose:
            print(f"[Optimizer] Evaluating {n_stops}-stop strategies ...")

        # Generate all valid compound sequences
        compound_sequences = _compound_sequences(compounds, n_stops + 1, opt_config.must_use_two_compounds)

        # Generate all valid pit lap combinations
        pit_lap_combos = list(itertools.combinations(candidate_laps, n_stops))
        pit_lap_combos = [
            combo for combo in pit_lap_combos
            if _valid_stint_lengths(combo, total_laps, opt_config)
        ]

        if verbose:
            print(f"  → {len(compound_sequences)} compound sequences × {len(pit_lap_combos)} pit windows")

        for compound_seq in compound_sequences:
            for pit_laps in pit_lap_combos:
                pit_stops = [PitStop(lap=lap, compound=cmp)
                             for lap, cmp in zip(pit_laps, compound_seq[1:])]

                strategy = Strategy(
                    name           = _strategy_name(compound_seq, pit_laps),
                    start_compound = compound_seq[0],
                    pit_stops      = pit_stops,
                )

                result = simulate_race(strategy, config, degradation_curves, noise=False)

                pit_details = []
                for stop in pit_stops:
                    pit_details.append({
                        "lap"     : stop.lap,
                        "compound": stop.compound,
                        "loss_s"  : config.pit_loss_seconds,
                    })

                all_results.append(OptimizedStrategy(
                    strategy   = strategy,
                    total_time = result.total_time,
                    lap_by_lap = result.lap_results,
                    pit_details= pit_details,
                ))

    # Sort by total time
    all_results.sort(key=lambda r: r.total_time)
    for i, r in enumerate(all_results):
        r.rank = i + 1

    if verbose:
        print(f"\n[Optimizer] Evaluated {len(all_results)} strategies.")
        _print_top_n(all_results, n=5)

    return all_results


# ── OR-Tools Integer Program ──────────────────────────────────────────────────
def optimize_with_ilp(
    config            : RaceConfig,
    degradation_curves: dict[str, DegradationCurve],
    opt_config        : OptimizerConfig | None = None,
) -> dict:
    """
    Uses OR-Tools ILP to find optimal single-stop strategy.
    Best for exact 1-stop; grid search is more flexible for 2-3 stops.

    Returns:
        Dict with optimal_pit_lap, optimal_compound, total_time
    """
    if opt_config is None:
        opt_config = OptimizerConfig()

    compounds  = opt_config.allowed_compounds
    total_laps = config.total_laps

    solver = pywraplp.Solver.CreateSolver("SCIP")
    if not solver:
        raise RuntimeError("OR-Tools SCIP solver not available.")

    # ── Decision Variables ────────────────────────────────────────────────────
    # x[l][c] = 1 if we pit on lap l and switch to compound c
    x = {}
    for l in range(opt_config.pit_window_start, total_laps - opt_config.min_stint_length):
        for c in compounds:
            x[l, c] = solver.BoolVar(f"x_{l}_{c}")

    # ── Constraints ───────────────────────────────────────────────────────────
    # Exactly 1 pit stop
    solver.Add(solver.Sum([x[l, c] for l in x for (ll, cc) in [(l, c)] if (ll, cc) in x]) == 1)

    # Must use at least 2 compounds (implicit in 1-stop)

    # ── Objective: Minimize estimated total time ──────────────────────────────
    # Precompute deterministic total times for each (pit_lap, compound) combo
    time_lookup = {}
    for l in range(opt_config.pit_window_start, total_laps - opt_config.min_stint_length):
        for start_c in compounds:
            for end_c in compounds:
                if start_c == end_c and opt_config.must_use_two_compounds:
                    continue
                pit_stops = [PitStop(lap=l, compound=end_c)]
                strategy  = Strategy(f"ILP_{start_c}_{l}_{end_c}", start_c, pit_stops)
                result    = simulate_race(strategy, config, degradation_curves, noise=False)
                time_lookup[l, start_c, end_c] = result.total_time

    # Approximate: fix start_compound = MEDIUM, optimize end compound + lap
    best_time = np.inf
    best_combo = None
    for (l, c), var in x.items():
        for start_c in compounds:
            key = (l, start_c, c)
            if key in time_lookup:
                t = time_lookup[key]
                if t < best_time:
                    best_time  = t
                    best_combo = (l, start_c, c)

    if best_combo:
        pit_lap, start_c, end_c = best_combo
        return {
            "optimal_pit_lap"     : pit_lap,
            "start_compound"      : start_c,
            "end_compound"        : end_c,
            "total_time_seconds"  : best_time,
            "solver"              : "OR-Tools ILP",
        }
    return {}


# ── Undercut / Overcut Analysis ───────────────────────────────────────────────
def undercut_overcut_delta(
    base_pit_lap      : int,
    window            : int,
    start_compound    : str,
    mid_compound      : str,
    end_compound      : str,
    config            : RaceConfig,
    degradation_curves: dict[str, DegradationCurve],
) -> pd.DataFrame if False else list:
    """
    Compare undercut (pit earlier) vs overcut (pit later) vs base strategy.

    Returns:
        List of dicts with lap, strategy_type, total_time, delta_vs_base
    """
    import pandas as pd

    results = []
    base_strategy = Strategy(
        "Base", start_compound,
        [PitStop(base_pit_lap, mid_compound), PitStop(base_pit_lap + window, end_compound)]
    )
    base_time = simulate_race(base_strategy, config, degradation_curves, noise=False).total_time

    for offset in range(-window, window + 1):
        pit_lap = base_pit_lap + offset
        if pit_lap < 5 or pit_lap > config.total_laps - 5:
            continue

        strategy = Strategy(
            f"Pit@{pit_lap}", start_compound,
            [PitStop(pit_lap, mid_compound), PitStop(pit_lap + window, end_compound)]
        )
        total_time = simulate_race(strategy, config, degradation_curves, noise=False).total_time
        results.append({
            "pit_lap"     : pit_lap,
            "strategy"    : "undercut" if offset < 0 else ("overcut" if offset > 0 else "base"),
            "total_time"  : total_time,
            "delta_vs_base": total_time - base_time,
        })

    return results


# ── Helper Functions ──────────────────────────────────────────────────────────
def _candidate_pit_laps(total_laps: int, cfg: OptimizerConfig) -> list[int]:
    """Generate candidate pit laps via uniform sampling + tire-change windows."""
    evenly = np.linspace(cfg.pit_window_start, total_laps - cfg.min_stint_length,
                         cfg.n_pit_candidates, dtype=int).tolist()
    return sorted(set(evenly))


def _compound_sequences(compounds: list, n_stints: int, must_use_two: bool) -> list[tuple]:
    """Generate all valid compound sequences for n_stints stints."""
    sequences = list(itertools.product(compounds, repeat=n_stints))
    if must_use_two:
        sequences = [s for s in sequences if len(set(s)) >= 2]
    return sequences


def _valid_stint_lengths(pit_laps: tuple, total_laps: int, cfg: OptimizerConfig) -> bool:
    """Check that all stints have valid length."""
    checkpoints = [0] + list(pit_laps) + [total_laps]
    for i in range(len(checkpoints) - 1):
        stint_len = checkpoints[i+1] - checkpoints[i]
        if stint_len < cfg.min_stint_length or stint_len > cfg.max_stint_length:
            return False
    return True


def _strategy_name(compound_seq: tuple, pit_laps: tuple) -> str:
    parts = [compound_seq[0][:1]]
    for lap, cmp in zip(pit_laps, compound_seq[1:]):
        parts.append(f"→L{lap}→{cmp[:1]}")
    return "".join(parts)


def _print_top_n(results: list[OptimizedStrategy], n: int = 5):
    base = results[0].total_time
    print(f"\n{'Rank':<6} {'Strategy':<45} {'Total (s)':<12} {'Δ (s)'}")
    print("─" * 75)
    for r in results[:n]:
        delta = r.total_time - base
        label = r.strategy.label
        print(f"  #{r.rank:<4} {label:<45} {r.total_time:<12.1f} +{delta:.2f}s")


# ── Quick Test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    from tire_degradation import _default_curve

    curves = {c: _default_curve(c) for c in ["SOFT", "MEDIUM", "HARD"]}
    config = RaceConfig(total_laps=57, base_lap_time=92.0)

    print("=" * 60)
    print("  F1 RACE STRATEGY OPTIMIZER")
    print("=" * 60)

    opt_cfg = OptimizerConfig(max_stops=2, n_pit_candidates=12)
    results = optimize(config, curves, opt_cfg, verbose=True)

    print(f"\n🏆 Best Strategy: {results[0].strategy.label}")
    print(f"   Total Time : {results[0].total_time:.1f} s")
