"""
tire_degradation.py
===================
Models how lap times degrade as tires age.
Fits exponential + linear curves per compound using real stint data.
Outputs degradation coefficients used by the race simulator.
"""

import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
from dataclasses import dataclass, field
from typing import Callable
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pathlib import Path


RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


# ── Degradation Models ────────────────────────────────────────────────────────
def linear_model(age: np.ndarray, base: float, slope: float) -> np.ndarray:
    """Lap time = base + slope * tire_age"""
    return base + slope * age


def exponential_model(age: np.ndarray, base: float, k: float, plateau: float) -> np.ndarray:
    """Lap time = base + plateau * (1 - exp(-k * age))"""
    return base + plateau * (1 - np.exp(-k * age))


def quadratic_model(age: np.ndarray, base: float, a: float, b: float) -> np.ndarray:
    """Lap time = base + a * age + b * age^2"""
    return base + a * age + b * age ** 2


MODEL_FUNCS: dict[str, Callable] = {
    "linear"     : linear_model,
    "exponential": exponential_model,
    "quadratic"  : quadratic_model,
}


# ── Default Compound Parameters (fallback if not enough data) ─────────────────
# Approximate real-world degradation in seconds per lap
DEFAULT_DEGRADATION = {
    "SOFT"        : {"model": "exponential", "base": 0.0, "k": 0.12, "plateau": 2.5},
    "MEDIUM"      : {"model": "exponential", "base": 0.0, "k": 0.07, "plateau": 1.8},
    "HARD"        : {"model": "exponential", "base": 0.0, "k": 0.04, "plateau": 1.2},
    "INTERMEDIATE": {"model": "linear",      "base": 0.0, "slope": 0.06},
    "WET"         : {"model": "linear",      "base": 0.0, "slope": 0.04},
}


# ── Degradation Fit Result ────────────────────────────────────────────────────
@dataclass
class DegradationCurve:
    compound    : str
    model_name  : str
    params      : dict
    r_squared   : float
    n_samples   : int
    source      : str    # 'fitted' or 'default'

    def predict(self, tire_age: float | np.ndarray) -> float | np.ndarray:
        """Predict time DELTA above base lap time for a given tire age."""
        func = MODEL_FUNCS[self.model_name]
        age  = np.asarray(tire_age)
        return func(age, **self.params) - self.params.get("base", 0)

    def __repr__(self):
        return (
            f"DegradationCurve({self.compound}, {self.model_name}, "
            f"R²={self.r_squared:.3f}, n={self.n_samples}, src={self.source})"
        )


# ── Fitter ────────────────────────────────────────────────────────────────────
def fit_degradation_curves(laps: pd.DataFrame, min_samples: int = 15) -> dict[str, DegradationCurve]:
    """
    Fit degradation curves per tire compound from stint data.

    Args:
        laps       : DataFrame with TireCompound, TireAge, LapTimeSeconds
        min_samples: Minimum laps per compound to attempt fitting

    Returns:
        Dict mapping compound → DegradationCurve
    """
    curves: dict[str, DegradationCurve] = {}

    for compound in laps["TireCompound"].unique():
        cmp_laps = laps[laps["TireCompound"] == compound].copy()
        cmp_laps = cmp_laps[cmp_laps["TireAge"] >= 1].dropna(subset=["LapTimeSeconds", "TireAge"])

        if len(cmp_laps) < min_samples:
            print(f"[TireDeg] {compound}: not enough data ({len(cmp_laps)} laps) → using defaults")
            curves[compound] = _default_curve(compound)
            continue

        # Normalize: delta from each stint's first lap
        cmp_laps = cmp_laps.copy()
        cmp_laps["BaseLap"] = cmp_laps.groupby(["Driver", "StintNum"])["LapTimeSeconds"].transform("first")
        cmp_laps["Delta"]   = cmp_laps["LapTimeSeconds"] - cmp_laps["BaseLap"]
        cmp_laps = cmp_laps[cmp_laps["Delta"] >= 0]  # remove anomalies

        age   = cmp_laps["TireAge"].values
        delta = cmp_laps["Delta"].values

        best_curve = _try_all_models(compound, age, delta)
        curves[compound] = best_curve
        print(f"[TireDeg] {compound}: {best_curve}")

    # Fill missing compounds with defaults
    for compound in DEFAULT_DEGRADATION:
        if compound not in curves:
            curves[compound] = _default_curve(compound)

    return curves


def _try_all_models(compound: str, age: np.ndarray, delta: np.ndarray) -> DegradationCurve:
    """Try all model types and return the best fit by R²."""
    best_r2   = -np.inf
    best_curve = None

    for model_name, func in MODEL_FUNCS.items():
        try:
            if model_name == "linear":
                p0 = [0.0, 0.05]
                bounds = ([-10, 0], [10, 2])
            elif model_name == "exponential":
                p0 = [0.0, 0.1, 2.0]
                bounds = ([-5, 0.001, 0], [5, 2.0, 10])
            else:  # quadratic
                p0 = [0.0, 0.05, 0.001]
                bounds = ([-10, -1, -0.1], [10, 2, 0.5])

            popt, _ = curve_fit(func, age, delta, p0=p0, bounds=bounds, maxfev=5000)

            y_pred = func(age, *popt)
            ss_res = np.sum((delta - y_pred) ** 2)
            ss_tot = np.sum((delta - delta.mean()) ** 2)
            r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0

            if r2 > best_r2:
                best_r2   = r2
                param_names = func.__code__.co_varnames[1:func.__code__.co_argcount]
                best_params = dict(zip(param_names, popt))
                best_curve  = DegradationCurve(
                    compound   = compound,
                    model_name = model_name,
                    params     = best_params,
                    r_squared  = r2,
                    n_samples  = len(age),
                    source     = "fitted",
                )
        except Exception as e:
            print(f"[TireDeg] {compound} {model_name} fit failed: {e}")

    return best_curve or _default_curve(compound)


def _default_curve(compound: str) -> DegradationCurve:
    """Return a DegradationCurve from hardcoded defaults."""
    defaults = DEFAULT_DEGRADATION.get(compound, DEFAULT_DEGRADATION["MEDIUM"])
    model_name = defaults["model"]
    params = {k: v for k, v in defaults.items() if k != "model"}
    return DegradationCurve(
        compound   = compound,
        model_name = model_name,
        params     = params,
        r_squared  = 0.0,
        n_samples  = 0,
        source     = "default",
    )


# ── Compound Properties ───────────────────────────────────────────────────────
COMPOUND_PROPERTIES = {
    "SOFT"        : {"base_delta": -0.8, "max_life": 25, "warmup_laps": 1},
    "MEDIUM"      : {"base_delta":  0.0, "max_life": 40, "warmup_laps": 2},
    "HARD"        : {"base_delta":  0.5, "max_life": 60, "warmup_laps": 3},
    "INTERMEDIATE": {"base_delta":  5.0, "max_life": 30, "warmup_laps": 2},
    "WET"         : {"base_delta": 10.0, "max_life": 20, "warmup_laps": 1},
}

def compound_base_delta(compound: str) -> float:
    """Pace advantage/disadvantage vs MEDIUM on a fresh tire (seconds)."""
    return COMPOUND_PROPERTIES.get(compound, COMPOUND_PROPERTIES["MEDIUM"])["base_delta"]

def compound_max_life(compound: str) -> int:
    """Approximate maximum usable stint length (laps)."""
    return COMPOUND_PROPERTIES.get(compound, COMPOUND_PROPERTIES["MEDIUM"])["max_life"]


# ── Plotting ──────────────────────────────────────────────────────────────────
def plot_degradation_curves(curves: dict[str, DegradationCurve], save: bool = True):
    """Plot fitted degradation curves for all compounds."""
    fig, ax = plt.subplots(figsize=(10, 6))
    colors  = {"SOFT": "#E8002D", "MEDIUM": "#FFF200", "HARD": "#FFFFFF",
                "INTERMEDIATE": "#39B54A", "WET": "#0067FF"}

    ages = np.linspace(1, 45, 200)
    for compound, curve in curves.items():
        delta = curve.predict(ages)
        label = f"{compound} ({curve.model_name}, R²={curve.r_squared:.2f})"
        ax.plot(ages, delta, label=label, color=colors.get(compound, "gray"), linewidth=2)

    ax.set_facecolor("#1a1a2e")
    fig.set_facecolor("#0f0f1a")
    ax.set_xlabel("Tire Age (laps)", color="white")
    ax.set_ylabel("Time Loss vs Fresh Tire (s)", color="white")
    ax.set_title("Tire Degradation Curves", color="white", fontsize=14)
    ax.tick_params(colors="white")
    ax.legend(facecolor="#1a1a2e", labelcolor="white")
    ax.grid(alpha=0.2, color="white")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")

    if save:
        path = RESULTS_DIR / "tire_degradation.png"
        plt.savefig(path, dpi=150, bbox_inches="tight")
        print(f"[TireDeg] Plot saved → {path}")
    plt.close()


# ── Quick Test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    curves = {c: _default_curve(c) for c in DEFAULT_DEGRADATION}
    print("\nDefault curves:")
    for c, curve in curves.items():
        age5  = curve.predict(5)
        age20 = curve.predict(20)
        print(f"  {c:<15s}  age=5 → +{age5:.2f}s   age=20 → +{age20:.2f}s")
    plot_degradation_curves(curves)
