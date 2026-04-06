import os
import sys
import pandas as pd
import fastf1
from pathlib import Path

# Fix imports since we are in backend
sys.path.insert(0, os.path.dirname(__file__))
from data_loader import load_session, extract_laps

DATA_FILE = Path(__file__).parent.parent / "data" / "all_laps_history.csv"

def fetch_all():
    all_laps = []
    
    # 2023 to 2025
    for year in range(2023, 2026):
        print(f"\\n=== Fetching {year} Schedule ===")
        try:
            schedule = fastf1.get_event_schedule(year)
        except Exception as e:
            print(f"Could not load schedule for {year}: {e}")
            continue
            
        # Get races (event format)
        races = schedule[schedule['EventFormat'].isin(['conventional', 'sprint'])] 
        
        for idx, row in races.iterrows():
            gp = row['EventName']
            if "Testing" in gp:
                continue
            
            try:
                session = load_session(year, gp, 'R')
                laps = extract_laps(session)
                laps['Year'] = year
                laps['GrandPrix'] = gp
                all_laps.append(laps)
            except Exception as e:
                print(f"Skipping {year} {gp}: {e}")
                
    if all_laps:
        df = pd.concat(all_laps, ignore_index=True)
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(DATA_FILE, index=False)
        print(f"\\nSuccessfully saved {len(df)} laps to {DATA_FILE}")
    else:
        print("No data collected.")

if __name__ == "__main__":
    fetch_all()
