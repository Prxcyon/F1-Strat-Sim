"""
telemetry_pipeline.py
=====================
Extracts high-fidelity telemetry curves (Speed, Throttle, Brake) over Distance
for two drivers in a specific session. Calculates aggregate metrics for SHAP and analysis.
"""

import fastf1
import pandas as pd
import numpy as np
from data_loader import load_session

def get_telemetry_comparison(year: int, grand_prix: str, driver_a: str, driver_b: str, session_type: str = "R"):
    """
    Fetches the fastest lap telemetry for two drivers and aligns them by track distance.
    Downsamples to ~500 points for frontend rendering.
    """
    try:
        session = load_session(year, grand_prix, session_type, telemetry=True)
    except Exception as e:
        raise ValueError(f"Could not load session data: {e}")

    laps_a = session.laps.pick_driver(driver_a.upper())
    laps_b = session.laps.pick_driver(driver_b.upper())

    if laps_a.empty or laps_b.empty:
        raise ValueError(f"Could not find valid laps for either {driver_a} or {driver_b}")

    fast_a = laps_a.pick_fastest()
    fast_b = laps_b.pick_fastest()

    if pd.isna(fast_a['LapTime']) or pd.isna(fast_b['LapTime']):
        raise ValueError("Could not find a valid fastest lap telemetry for the drivers.")

    tel_a = fast_a.get_telemetry()
    tel_b = fast_b.get_telemetry()

    # Calculate distance-based delta
    tel_a = tel_a.add_distance()
    tel_b = tel_b.add_distance()

    # Force-coerce critical columns to numeric — FastF1 can merge them as 'object'
    for tel in [tel_a, tel_b]:
        for col in ['X', 'Y', 'Z', 'Speed', 'Throttle', 'RPM', 'Distance']:
            if col in tel.columns:
                tel[col] = pd.to_numeric(tel[col], errors='coerce')
        
        # Spatial Interpolation: Fill the gaps in X/Y (GPS is low Hz, Car is high Hz)
        # Using distance as the coordinate axis for interpolation
        tel['X'] = tel['X'].interpolate(method='linear')
        tel['Y'] = tel['Y'].interpolate(method='linear')
        tel['Z'] = tel['Z'].interpolate(method='linear')
        
        # Backfill/forward fill any remaining NaNs at the very start/end
        tel['X'] = tel['X'].ffill().bfill()
        tel['Y'] = tel['Y'].ffill().bfill()
        tel['Z'] = tel['Z'].ffill().bfill()

    # After interpolation, we only drop rows missing Distance or Speed
    tel_a = tel_a.dropna(subset=['Distance', 'Speed'])
    tel_b = tel_b.dropna(subset=['Distance', 'Speed'])

    # Resample over a common distance grid (e.g. 500 points) to align them for charting and Delta calculation
    max_dist = min(tel_a['Distance'].max(), tel_b['Distance'].max())
    distance_grid = np.linspace(0, max_dist, num=500)

    # Interpolate properties directly onto the common distance grid
    speed_a = np.interp(distance_grid, tel_a['Distance'], tel_a['Speed'])
    speed_b = np.interp(distance_grid, tel_b['Distance'], tel_b['Speed'])
    
    throttle_a = np.interp(distance_grid, tel_a['Distance'], tel_a['Throttle'])
    throttle_b = np.interp(distance_grid, tel_b['Distance'], tel_b['Throttle'])
    
    brake_a = np.interp(distance_grid, tel_a['Distance'], tel_a['Brake'].astype(float))
    brake_b = np.interp(distance_grid, tel_b['Distance'], tel_b['Brake'].astype(float))
    
    # Track Map Coordinates (from Driver A's line, as baseline)
    track_x = np.interp(distance_grid, tel_a['Distance'], tel_a['X'])
    track_y = np.interp(distance_grid, tel_a['Distance'], tel_a['Y'])
    
    # Calculate Time Delta over distance (approximation)
    time_a_grid = np.interp(distance_grid, tel_a['Distance'], tel_a['Time'].dt.total_seconds())
    time_b_grid = np.interp(distance_grid, tel_b['Distance'], tel_b['Time'].dt.total_seconds())
    delta_time = time_b_grid - time_a_grid  # positive means Driver B is slower (A is ahead)

    chart_data = []
    for i in range(len(distance_grid)):
        chart_data.append({
            "Distance": round(distance_grid[i], 1),
            "X": float(track_x[i]),
            "Y": float(track_y[i]),
            f"Speed_{driver_a}": round(float(speed_a[i]), 1),
            f"Speed_{driver_b}": round(float(speed_b[i]), 1),
            f"Throttle_{driver_a}": round(float(throttle_a[i]), 1),
            f"Throttle_{driver_b}": round(float(throttle_b[i]), 1),
            f"Brake_{driver_a}": round(float(brake_a[i]), 1),
            f"Brake_{driver_b}": round(float(brake_b[i]), 1),
            "Delta": round(float(delta_time[i]), 3)
        })

    # Aggregate features for SHAP / ML Evaluation
    def extract_features(tel):
        return {
            "avg_speed": float(tel['Speed'].mean()),
            "max_speed": float(tel['Speed'].max()),
            "time_full_throttle": float((tel['Throttle'] >= 99).sum() / len(tel)),
            "time_heavy_braking": float((tel['Brake'] == True).sum() / len(tel)),
            "avg_rpm": float(tel['RPM'].mean()),
            "lap_time_s": float(fast_a['LapTime'].total_seconds() if tel is tel_a else fast_b['LapTime'].total_seconds())
        }

    features_a = extract_features(tel_a)
    features_b = extract_features(tel_b)

    return {
        "driver_a_lap": features_a["lap_time_s"],
        "driver_b_lap": features_b["lap_time_s"],
        "delta_vs_a": round(features_b["lap_time_s"] - features_a["lap_time_s"], 3),
        "chart_data": chart_data,
        "features_a": features_a,
        "features_b": features_b
    }

if __name__ == "__main__":
    import json
    # Quick test
    res = get_telemetry_comparison(2023, "Bahrain", "VER", "LEC", "Q")
    print(f"VER vs LEC Lap Delta: {res['delta_vs_a']}s")
    print(json.dumps(res['features_a'], indent=2))
