"""
model.py
========
Lap time prediction model.
Uses XGBoost as the primary model with a Linear Regression baseline.
Saves/loads trained model artifacts.
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from sklearn.linear_model import Ridge
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score, KFold
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

import xgboost as xgb

from feature_engineering import build_features, save_artifacts


MODEL_PATH   = Path(__file__).parent.parent / "data" / "lap_model.pkl"
RESULTS_PATH = Path(__file__).parent.parent / "results"
RESULTS_PATH.mkdir(parents=True, exist_ok=True)


# ── Model Registry ─────────────────────────────────────────────────────────────
MODELS = {
    "ridge"   : Ridge(alpha=1.0),
    "gbm"     : GradientBoostingRegressor(n_estimators=300, max_depth=4, learning_rate=0.05),
    "xgboost" : xgb.XGBRegressor(
        n_estimators   = 500,
        max_depth       = 6,
        learning_rate   = 0.03,
        subsample       = 0.8,
        colsample_bytree= 0.8,
        reg_alpha       = 0.1,
        reg_lambda      = 1.0,
        objective       = "reg:squarederror",
        random_state    = 42,
        n_jobs          = -1,
    ),
}


# ── Training ──────────────────────────────────────────────────────────────────
def train(laps: pd.DataFrame, model_name: str = "xgboost", cv_folds: int = 5) -> dict:
    """
    Train a lap time prediction model.

    Args:
        laps       : Raw laps DataFrame from data_loader
        model_name : 'ridge' | 'gbm' | 'xgboost'
        cv_folds   : Number of cross-validation folds

    Returns:
        dict with model, MAE, RMSE, feature importances
    """
    if model_name not in MODELS:
        raise ValueError(f"Unknown model '{model_name}'. Choose from {list(MODELS.keys())}")

    print(f"[Model] Building features ...")
    X, y = build_features(laps, training=True)
    save_artifacts()

    print(f"[Model] Training {model_name.upper()} on {len(X)} laps ...")
    model = MODELS[model_name]

    # Cross-validation
    kf    = KFold(n_splits=cv_folds, shuffle=True, random_state=42)
    cv_mae = -cross_val_score(model, X, y, cv=kf, scoring="neg_mean_absolute_error", n_jobs=-1)
    print(f"[Model] CV MAE: {cv_mae.mean():.4f} ± {cv_mae.std():.4f} s")

    # Final fit on all data
    model.fit(X, y)

    # In-sample evaluation
    y_pred = model.predict(X)
    mae    = mean_absolute_error(y, y_pred)
    rmse   = root_mean_squared_error(y, y_pred)
    print(f"[Model] Train MAE: {mae:.4f} s  |  RMSE: {rmse:.4f} s")

    # Feature importances (XGBoost & GBM only)
    importances = {}
    if hasattr(model, "feature_importances_"):
        importances = dict(zip(X.columns, model.feature_importances_))
        importances = dict(sorted(importances.items(), key=lambda x: -x[1]))

    # Save model
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"[Model] Saved → {MODEL_PATH}")

    return {
        "model"       : model,
        "cv_mae_mean" : float(cv_mae.mean()),
        "cv_mae_std"  : float(cv_mae.std()),
        "train_mae"   : float(mae),
        "train_rmse"  : float(rmse),
        "importances" : importances,
        "n_laps"      : len(X),
        "features"    : list(X.columns),
    }


# ── Inference ─────────────────────────────────────────────────────────────────
_model_cache = None

def predict(laps: pd.DataFrame) -> np.ndarray:
    """
    Predict lap times for a feature DataFrame.

    Args:
        laps: DataFrame with same columns as training data (LapTimeSeconds optional)

    Returns:
        Array of predicted lap times in seconds
    """
    global _model_cache
    if _model_cache is None:
        _model_cache = load_model()

    X, _ = build_features(laps, training=False)
    return _model_cache.predict(X)


def predict_single(
    tire_compound   : str,
    tire_age        : int,
    lap_num         : int,
    fuel_load       : float,
    driver          : str = "VER",
    stint_num       : int = 1,
) -> float:
    """
    Predict a single lap time from scalar inputs.

    Returns:
        Predicted lap time in seconds
    """
    compound_map = {"SOFT": 0, "MEDIUM": 1, "HARD": 2, "INTERMEDIATE": 3, "WET": 4}
    single = pd.DataFrame([{
        "Driver"          : driver,
        "LapNum"          : lap_num,
        "TireCompound"    : tire_compound,
        "TireCompoundCode": compound_map.get(tire_compound.upper(), 1),
        "TireAge"         : tire_age,
        "IsPitLap"        : 0,
        "FuelLoad"        : fuel_load,
        "StintNum"        : stint_num,
    }])
    return float(predict(single)[0])


# ── Model Persistence ─────────────────────────────────────────────────────────
def load_model():
    """Load trained model from disk."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No trained model found at {MODEL_PATH}. Run train() first."
        )
    model = joblib.load(MODEL_PATH)
    print(f"[Model] Loaded from {MODEL_PATH} ✓")
    return model


# ── Evaluation Report ─────────────────────────────────────────────────────────
def evaluation_report(results: dict) -> str:
    """Generate a human-readable evaluation summary."""
    lines = [
        "=" * 50,
        "  LAP TIME MODEL — EVALUATION REPORT",
        "=" * 50,
        f"  Trained on    : {results['n_laps']} laps",
        f"  CV MAE        : {results['cv_mae_mean']:.3f} ± {results['cv_mae_std']:.3f} s",
        f"  Train MAE     : {results['train_mae']:.3f} s",
        f"  Train RMSE    : {results['train_rmse']:.3f} s",
        "",
        "  Top 10 Feature Importances:",
    ]
    for i, (feat, score) in enumerate(list(results["importances"].items())[:10]):
        lines.append(f"    {i+1:2d}. {feat:<30s} {score:.4f}")
    lines.append("=" * 50)
    return "\n".join(lines)


# ── Quick Test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Fake data for smoke test
    np.random.seed(42)
    n = 300
    compound = np.random.choice(["SOFT", "MEDIUM", "HARD"], n)
    compound_map = {"SOFT": 0, "MEDIUM": 1, "HARD": 2}
    tire_age = np.random.randint(1, 30, n)

    fake = pd.DataFrame({
        "Driver"          : np.random.choice(["VER", "HAM", "LEC"], n),
        "LapNum"          : np.random.randint(1, 70, n),
        "LapTimeSeconds"  : 90 + tire_age * 0.05 + np.random.randn(n) * 0.3,
        "TireCompound"    : compound,
        "TireCompoundCode": [compound_map[c] for c in compound],
        "TireAge"         : tire_age,
        "IsPitLap"        : np.random.choice([0, 1], n, p=[0.95, 0.05]),
        "FuelLoad"        : np.random.uniform(20, 100, n),
        "StintNum"        : np.random.choice([1, 2, 3], n),
    })

    results = train(fake, model_name="xgboost")
    print(evaluation_report(results))

    # Single prediction
    t = predict_single("SOFT", tire_age=5, lap_num=10, fuel_load=85.0)
    print(f"\nSingle prediction (Soft, age=5, lap=10): {t:.3f} s")
