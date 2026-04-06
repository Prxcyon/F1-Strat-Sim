"""
data_loader.py
==============
Loads F1 race data using FastF1 API and caches it locally.
Extracts laps, stints, pit stops, weather, and session metadata.
"""

import os
import fastf1
import pandas as pd
import numpy as np
from pathlib import Path


# ── Cache Configuration ────────────────────────────────────────────────────────
CACHE_DIR = Path(__file__).parent.parent / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))


# ── Session Loader ─────────────────────────────────────────────────────────────
def load_session(year: int, grand_prix: str, session_type: str = "R", telemetry: bool = False) -> fastf1.core.Session:
    """
    Load a FastF1 session.

    Args:
        year        : Season year (e.g. 2023)
        grand_prix  : Race name (e.g. 'Monaco', 'Bahrain', 'Silverstone')
        session_type: 'R' = Race, 'Q' = Qualifying, 'FP1' / 'FP2' / 'FP3'
        telemetry   : Whether to load car and position data

    Returns:
        Loaded FastF1 Session object
    """
    print(f"[DataLoader] Loading {year} {grand_prix} – {session_type} (Telemetry: {telemetry}) ...")
    session = fastf1.get_session(year, grand_prix, session_type)
    session.load(telemetry=telemetry, weather=True, messages=False)
    print(f"[DataLoader] Session loaded ✓  |  Laps: {len(session.laps)}")
    return session


# ── Lap Data Extractor ─────────────────────────────────────────────────────────
def extract_laps(session: fastf1.core.Session, driver: str | None = None) -> pd.DataFrame:
    """
    Extract clean lap-by-lap data from a session.

    Args:
        session : Loaded FastF1 session
        driver  : 3-letter driver code (e.g. 'VER', 'HAM'). None = all drivers.

    Returns:
        DataFrame with one row per lap
    """
    laps = session.laps.copy()

    if driver:
        laps = laps[laps["Driver"] == driver.upper()]

    # Convert LapTime to seconds (float)
    laps["LapTimeSeconds"] = laps["LapTime"].dt.total_seconds()

    # Filter: remove in/out laps and safety car laps
    laps = laps[laps["IsAccurate"] == True]
    laps = laps.dropna(subset=["LapTimeSeconds", "Compound", "TyreLife"])

    # Rename for clarity
    laps = laps.rename(columns={
        "TyreLife"    : "TireAge",
        "Compound"    : "TireCompound",
        "LapNumber"   : "LapNum",
        "PitInTime"   : "PitIn",
        "PitOutTime"  : "PitOut",
    })

    # Encode tire compound
    compound_map = {"SOFT": 0, "MEDIUM": 1, "HARD": 2, "INTERMEDIATE": 3, "WET": 4}
    laps["TireCompoundCode"] = laps["TireCompound"].map(compound_map).fillna(-1).astype(int)

    # Pit stop flag
    laps["IsPitLap"] = laps["PitIn"].notna().astype(int)

    # Fuel load proxy: decreases linearly over race laps (avg ~1.6 kg/lap)
    max_lap = laps["LapNum"].max()
    laps["FuelLoad"] = 100 * (1 - laps["LapNum"] / (max_lap + 1))

    # Stint number
    laps = _add_stint_number(laps)

    cols = [
        "Driver", "Team", "LapNum", "LapTimeSeconds",
        "TireCompound", "TireCompoundCode", "TireAge",
        "IsPitLap", "FuelLoad", "StintNum",
        "SpeedI1", "SpeedI2", "SpeedFL", "SpeedST",
    ]
    available = [c for c in cols if c in laps.columns]
    return laps[available].reset_index(drop=True)


def _add_stint_number(laps: pd.DataFrame) -> pd.DataFrame:
    """Assign a stint counter based on pit stop flags."""
    laps = laps.sort_values(["Driver", "LapNum"]).copy()
    laps["StintNum"] = laps.groupby("Driver")["IsPitLap"].cumsum()
    # Stint number is cumulative pits BEFORE this lap
    laps["StintNum"] = laps["StintNum"] - laps["IsPitLap"]
    laps["StintNum"] = laps["StintNum"] + 1
    return laps


# ── Pit Stop Extractor ─────────────────────────────────────────────────────────
def extract_pit_stops(session: fastf1.core.Session) -> pd.DataFrame:
    """
    Extract pit stop summary per driver.

    Returns:
        DataFrame: driver, lap, old_compound, new_compound, duration_estimate
    """
    laps = session.laps.copy()
    laps["LapTimeSeconds"] = laps["LapTime"].dt.total_seconds()

    pit_laps = laps[laps["PitInTime"].notna()].copy()
    pit_laps = pit_laps[["Driver", "LapNumber", "Compound", "TyreLife"]].rename(columns={
        "LapNumber": "PitLap",
        "Compound" : "OldCompound",
        "TyreLife" : "TiresUsedBeforePit",
    })

    # Next compound after pit
    next_compound = laps[laps["PitOutTime"].notna()][["Driver", "LapNumber", "Compound"]].copy()
    next_compound = next_compound.rename(columns={"LapNumber": "ReturnLap", "Compound": "NewCompound"})
    next_compound["PitLap"] = next_compound["ReturnLap"] - 1

    pit_summary = pit_laps.merge(next_compound[["Driver", "PitLap", "NewCompound"]], on=["Driver", "PitLap"], how="left")

    return pit_summary.reset_index(drop=True)


# ── Weather Extractor ──────────────────────────────────────────────────────────
def extract_weather(session: fastf1.core.Session) -> pd.DataFrame:
    """
    Extract weather snapshots from the session.

    Returns:
        DataFrame with AirTemp, TrackTemp, Humidity, Rainfall columns.
    """
    weather = session.weather_data.copy()
    weather = weather[["Time", "AirTemp", "TrackTemp", "Humidity", "Pressure", "Rainfall"]].copy()
    weather["Rainfall"] = weather["Rainfall"].astype(bool)
    return weather.reset_index(drop=True)


# ── Driver List ────────────────────────────────────────────────────────────────
def get_drivers(session: fastf1.core.Session) -> list[str]:
    """Return sorted list of 3-letter driver codes in the session."""
    return sorted(session.laps["Driver"].unique().tolist())


# ── Season Schedule ────────────────────────────────────────────────────────────
def get_season_schedule(year: int) -> pd.DataFrame:
    """Return the full race calendar for a given F1 season."""
    schedule = fastf1.get_event_schedule(year)
    return schedule[["RoundNumber", "Country", "Location", "EventName", "EventDate"]].copy()


# ── Quick Validation ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    session = load_session(2023, "Bahrain", "R")
    drivers = get_drivers(session)
    print(f"Drivers: {drivers}")

    laps = extract_laps(session, driver="VER")
    print(laps.head(10))

    pits = extract_pit_stops(session)
    print(pits)
