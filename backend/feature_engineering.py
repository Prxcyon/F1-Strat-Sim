"""
feature_engineering.py
=======================
Transforms raw lap data into an ML-ready feature matrix.
Handles encoding, interaction terms, rolling averages, and normalization.
"""

import pandas as pd
import numpy as np
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import joblib
from pathlib import Path


SCALER_PATH  = Path(__file__).parent.parent / "data" / "scaler.pkl"
ENCODER_PATH = Path(__file__).parent.parent / "data" / "encoders.pkl"

COMPOUND_ORDER = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"]


# ── Core Feature Builder ───────────────────────────────────────────────────────
def build_features(laps: pd.DataFrame, training: bool = True) -> tuple[pd.DataFrame, pd.Series | None]:
    """
    Build feature matrix from raw lap DataFrame.

    Args:
        laps    : Output of data_loader.extract_laps()
        training: If True, fit scalers and return target. If False, use saved scalers.

    Returns:
        X (feature DataFrame), y (LapTimeSeconds or None in inference mode)
    """
    df = laps.copy()

    # ── Target ────────────────────────────────────────────────────────────────
    y = df.pop("LapTimeSeconds") if "LapTimeSeconds" in df.columns else None

    # ── Tire Features ─────────────────────────────────────────────────────────
    df["TireAgeSq"]      = df["TireAge"] ** 2                        # non-linear degradation
    df["TireAgeLog"]     = np.log1p(df["TireAge"])                   # log decay
    df["TireAge_x_Soft"] = df["TireAge"] * (df["TireCompoundCode"] == 0).astype(int)
    df["TireAge_x_Hard"] = df["TireAge"] * (df["TireCompoundCode"] == 2).astype(int)

    # ── Compound One-Hot ──────────────────────────────────────────────────────
    compound_dummies = pd.get_dummies(df["TireCompound"], prefix="Cmp", drop_first=False)
    for col in [f"Cmp_{c}" for c in COMPOUND_ORDER]:
        if col not in compound_dummies:
            compound_dummies[col] = 0
    df = pd.concat([df, compound_dummies], axis=1)
    df.drop(columns=["TireCompound", "TireCompoundCode"], errors="ignore", inplace=True)

    # ── Fuel Load ─────────────────────────────────────────────────────────────
    df["FuelEffect"] = df["FuelLoad"] * 0.03   # ~0.03 s per kg of fuel

    # ── Lap Number Features ───────────────────────────────────────────────────
    df["LapNumSq"]  = df["LapNum"] ** 2
    df["EarlyRace"] = (df["LapNum"] <= 10).astype(int)
    df["LateRace"]  = (df["LapNum"] >= df["LapNum"].max() - 10).astype(int)

    # ── Stint Relative Lap ────────────────────────────────────────────────────
    if "StintNum" in df.columns:
        df["StintLap"] = df.groupby(["Driver", "StintNum"])["LapNum"].transform(
            lambda x: x - x.min()
        )
    else:
        df["StintLap"] = df["TireAge"]

    # ── Driver & Team Encoding ────────────────────────────────────────────────
    if "Driver" in df.columns or "Team" in df.columns:
        df = _encode_categorical(df, fit=training)

    # ── Rolling Lap Time Avg ──────────────────────────────────────────────────
    # (Only available in training; set 0 in inference)
    if y is not None:
        df["RollingAvg3"] = (
            y.groupby(laps["Driver"]).transform(lambda x: x.rolling(3, min_periods=1).mean())
            if "Driver" in laps.columns
            else y.rolling(3, min_periods=1).mean()
        )
    else:
        df["RollingAvg3"] = 0

    # ── Drop ID columns ───────────────────────────────────────────────────────
    df.drop(columns=["IsPitLap", "StintNum"], errors="ignore", inplace=True)

    # ── Fill NaNs ─────────────────────────────────────────────────────────────
    df = df.fillna(df.median(numeric_only=True))

    # ── Scale Numeric Features ────────────────────────────────────────────────
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    df[numeric_cols] = _scale(df[numeric_cols], fit=training)

    return df, y


# ── Categorical Encoder (Global State) ────────────────────────────────────────
_cat_encoder: OneHotEncoder | None = None
_cat_cols = ["Driver", "Team"]

def _encode_categorical(df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
    global _cat_encoder
    
    # Check which columns exist
    cols_to_encode = [c for c in _cat_cols if c in df.columns]
    if not cols_to_encode:
        return df
        
    df_cat = df[cols_to_encode].fillna("UNK")
    
    if fit or _cat_encoder is None:
        _cat_encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        encoded = _cat_encoder.fit_transform(df_cat)
    else:
        encoded = _cat_encoder.transform(df_cat)
        
    encoded_cols = _cat_encoder.get_feature_names_out(cols_to_encode)
    df_encoded = pd.DataFrame(encoded, columns=encoded_cols, index=df.index)
    
    df = pd.concat([df, df_encoded], axis=1)
    df.drop(columns=cols_to_encode, inplace=True)
    return df


# ── Scaler (Global State) ─────────────────────────────────────────────────────
_scaler: StandardScaler | None = None

def _scale(df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
    global _scaler
    if fit or _scaler is None:
        _scaler = StandardScaler()
        scaled = _scaler.fit_transform(df)
    else:
        scaled = _scaler.transform(df)
    return pd.DataFrame(scaled, columns=df.columns, index=df.index)


# ── Persistence ───────────────────────────────────────────────────────────────
def save_artifacts():
    """Save fitted scaler and encoder to disk."""
    SCALER_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(_scaler, SCALER_PATH)
    joblib.dump(_cat_encoder, ENCODER_PATH)
    print(f"[FeatureEng] Artifacts saved → {SCALER_PATH.parent}")


def load_artifacts():
    """Load fitted scaler and encoder from disk."""
    global _scaler, _cat_encoder
    _scaler      = joblib.load(SCALER_PATH)
    _cat_encoder = joblib.load(ENCODER_PATH)
    print("[FeatureEng] Artifacts loaded ✓")


# ── Tire Degradation Feature ──────────────────────────────────────────────────
def add_degradation_delta(laps: pd.DataFrame) -> pd.DataFrame:
    """
    Add 'DeltaVsPrevLap' — how much slower this lap is vs the first lap of the stint.
    Useful for fitting degradation curves directly.
    """
    df = laps.copy().sort_values(["Driver", "LapNum"])
    df["StintBaseLap"] = df.groupby(["Driver", "StintNum"])["LapTimeSeconds"].transform("first")
    df["DeltaVsBase"]  = df["LapTimeSeconds"] - df["StintBaseLap"]
    return df


# ── Quick Test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Minimal smoke test with fake data
    fake = pd.DataFrame({
        "Driver"         : ["VER"] * 20,
        "LapNum"         : list(range(1, 21)),
        "LapTimeSeconds" : [90.0 + i * 0.05 for i in range(20)],
        "TireCompound"   : ["SOFT"] * 10 + ["MEDIUM"] * 10,
        "TireCompoundCode": [0]*10 + [1]*10,
        "TireAge"        : list(range(1, 11)) + list(range(1, 11)),
        "IsPitLap"       : [0]*9 + [1] + [0]*10,
        "FuelLoad"       : [100 - i * 1.5 for i in range(20)],
        "StintNum"       : [1]*10 + [2]*10,
    })
    X, y = build_features(fake, training=True)
    print(f"Feature matrix shape: {X.shape}")
    print(X.head())
