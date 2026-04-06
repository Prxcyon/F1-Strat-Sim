import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Use os.path logic to find .env if needed, but load_dotenv() usually finds it in Cwd
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(url, key)

def get_race_id(year: int, grand_prix: str):
    """Get or create race record in Supabase."""
    res = supabase.table("races").select("id").match({"year": year, "grand_prix": grand_prix}).execute()
    if res.data:
        return res.data[0]["id"]
    
    # Create if missing (default total_laps=57, can be updated later)
    new_race = supabase.table("races").insert({
        "year": year,
        "grand_prix": grand_prix,
        "total_laps": 57 
    }).execute()
    return new_race.data[0]["id"]

def save_simulation(race_id: str, name: str, total_time: float, pit_stops: list, mc_results: dict):
    """Save Monte Carlo or Deterministic simulation results."""
    supabase.table("strategies").insert({
        "race_id": race_id,
        "name": name,
        "total_time": total_time,
        "pit_stops": pit_stops,
        "mc_results": mc_results
    }).execute()
