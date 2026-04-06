"""
explainer.py
============
Integrates SHAP (SHapley Additive exPlanations) to explain the lap time difference
between two drivers based on their telemetry features.
"""

import shap
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

def generate_shap_explanation(features_a: dict, features_b: dict, driver_a: str, driver_b: str):
    """
    Creates an explainer mapping exactly which features contributed to the lap time delta
    between driver A and driver B.
    """
    # 1. Base Dataset Construction (1v1 isolation)
    # Since we want to explain A vs B, we construct a synthetic linear gradient between A and B
    # to train a localized micro-model. This forces SHAP to perfectly distribute the delta
    # among the features that differ.
    
    ignore_keys = {"lap_time_s"}
    feature_cols = [k for k in features_a.keys() if k not in ignore_keys]
    
    # Create 100 interpolation steps between Driver A and Driver B
    data = []
    for alpha in np.linspace(0, 1, 100):
        row = {}
        for col in feature_cols:
            row[col] = features_a[col] + alpha * (features_b[col] - features_a[col])
        # Target is the interpolated lap time
        target = features_a["lap_time_s"] + alpha * (features_b["lap_time_s"] - features_a["lap_time_s"])
        row["lap_time_s"] = target
        data.append(row)
        
    df = pd.DataFrame(data)
    X = df[feature_cols]
    y = df["lap_time_s"]
    
    # 2. Train Local Model
    # A RandomForest with max_depth=3 will capture the linear interpolation perfectly
    model = RandomForestRegressor(n_estimators=10, max_depth=3, random_state=42)
    model.fit(X, y)
    
    # 3. SHAP Value Extraction
    explainer = shap.TreeExplainer(model)
    # Calculate SHAP values for Driver B (comparing against the dataset mean, which is halfway between A and B)
    # We'll take the difference in SHAP predictions between B and A.
    
    shap_values_a = explainer.shap_values(pd.DataFrame([features_a])[feature_cols])[0]
    shap_values_b = explainer.shap_values(pd.DataFrame([features_b])[feature_cols])[0]
    
    # Delta SHAP: How much did this feature contribute to Driver B's time minus Driver A's time?
    # Positive means it made Driver B SLOWER (added lap time). Negative means it made Driver B FASTER.
    delta_shaps = shap_values_b - shap_values_a
    
    results = []
    for i, col in enumerate(feature_cols):
        results.append({
            "feature": col,
            "contribution_s": round(delta_shaps[i], 3)
        })
        
    # Sort by absolute impact
    results.sort(key=lambda x: abs(x["contribution_s"]), reverse=True)
    
    # 4. Generate LLM-style Natural Language String
    delta_lap = features_b["lap_time_s"] - features_a["lap_time_s"]
    ahead = driver_a if delta_lap > 0 else driver_b
    behind = driver_b if delta_lap > 0 else driver_a
    gap = abs(delta_lap)
    
    # Pick top contributing feature
    top_feature = results[0]
    feat_name = top_feature["feature"].replace("_", " ")
    
    # Logic: if top_feature contribution is positive, it made Driver B SLOWER (Driver A faster).
    # If contribution negative, it made Driver B FASTER.
    if top_feature["contribution_s"] > 0:
        reason = f"{driver_a} gained significant advantage (+{abs(top_feature['contribution_s']):.2f}s) due to better {feat_name}."
    else:
        reason = f"{driver_b} gained significant advantage (+{abs(top_feature['contribution_s']):.2f}s) due to better {feat_name}."
    
    summary = f"{ahead} was faster by {gap:.3f}s. {reason}"
    
    return {
        "summary": summary,
        "shap_values": results
    }

if __name__ == "__main__":
    fa = {"avg_speed": 220, "max_speed": 340, "time_full_throttle": 0.70, "time_heavy_braking": 0.15, "lap_time_s": 90.000}
    fb = {"avg_speed": 218, "max_speed": 338, "time_full_throttle": 0.68, "time_heavy_braking": 0.17, "lap_time_s": 90.250}
    print(generate_shap_explanation(fa, fb, "VER", "NOR"))
