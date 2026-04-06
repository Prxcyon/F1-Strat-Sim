# 🏎️ F1 Race Strategy Optimization Engine

A full-stack ML system for predicting, simulating, and optimizing Formula 1 race pit strategies.

---

## 🏗️ Architecture

```
f1-strategy-engine/
│
├── data/                        # Cached race data + trained models
│   ├── cache/                   # FastF1 session cache
│   ├── lap_model.pkl            # Trained XGBoost model
│   ├── scaler.pkl               # Feature scaler
│   └── encoders.pkl             # Driver label encoder
│
├── backend/
│   ├── data_loader.py           # Phase 1: FastF1 data ingestion
│   ├── feature_engineering.py   # Phase 1: ML feature builder
│   ├── model.py                 # Phase 2: XGBoost lap time predictor
│   ├── tire_degradation.py      # Phase 3: Compound degradation curves
│   ├── simulator.py             # Phase 4: Monte Carlo race simulator
│   ├── optimizer.py             # Phase 5: OR-Tools strategy optimizer
│   └── api.py                   # Phase 8: FastAPI backend
│
├── frontend/                    # React + Tailwind dashboard
│   └── src/
│
├── notebooks/
│   └── exploration.ipynb        # EDA & model tuning
│
├── results/                     # Plots & evaluation outputs
└── requirements.txt
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Collect & Train (Phase 1–3)
```python
from backend.data_loader import load_session, extract_laps
from backend.model import train
from backend.tire_degradation import fit_degradation_curves

session = load_session(2023, "Bahrain", "R")
laps    = extract_laps(session)
results = train(laps, model_name="xgboost")
curves  = fit_degradation_curves(laps)
```

### 3. Optimize a Strategy (Phase 4–5)
```python
from backend.tire_degradation import _default_curve
from backend.simulator import RaceConfig, get_standard_strategies, compare_strategies
from backend.optimizer import optimize, OptimizerConfig

curves  = {c: _default_curve(c) for c in ["SOFT","MEDIUM","HARD"]}
config  = RaceConfig(total_laps=57, base_lap_time=92.0)
results = optimize(config, curves, OptimizerConfig(max_stops=2))

print(f"Best: {results[0].strategy.label}  →  {results[0].total_time:.1f}s")
```

### 4. Start the API
```bash
cd backend
uvicorn api:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 5. Start the Frontend
```bash
cd frontend
npm install && npm run dev
```

---

## 🤖 ML Pipeline

| Phase | Module                  | Model               | Output                    |
|-------|-------------------------|---------------------|---------------------------|
| 1     | data_loader.py          | –                   | Clean lap DataFrame       |
| 1     | feature_engineering.py  | StandardScaler      | Feature matrix            |
| 2     | model.py                | XGBoost             | Predicted lap times       |
| 3     | tire_degradation.py     | Exponential/Linear  | Degradation curves        |
| 4     | simulator.py            | Monte Carlo         | Race time distribution    |
| 5     | optimizer.py            | OR-Tools + Grid     | Optimal pit strategy      |

---

## 📊 API Endpoints

| Method | Endpoint                    | Description                            |
|--------|-----------------------------|----------------------------------------|
| GET    | `/`                         | Health check                           |
| GET    | `/compounds`                | Tire compound properties               |
| GET    | `/degradation/{compound}`   | Lap-by-lap degradation curve           |
| GET    | `/strategies/standard`      | Pre-built standard strategies          |
| POST   | `/simulate`                 | Simulate + Monte Carlo strategies      |
| POST   | `/optimize`                 | Run grid-search optimizer              |

---

## 🧠 Key Concepts

### Tire Degradation Model
```
Lap time = base_time + plateau × (1 - e^(-k × tire_age))
```
- **SOFT**: Fast but cliff degrades quickly (plateau ~2.5s, k=0.12)
- **MEDIUM**: Balanced (plateau ~1.8s, k=0.07)
- **HARD**: Slow but consistent (plateau ~1.2s, k=0.04)

### Monte Carlo Simulation
Each iteration adds:
- Random lap noise: `N(0, 0.25s)`
- Safety car probability: 5% per lap (+30s)
- VSC probability: 3% per lap (+15s)

### Optimization
- Grid search over candidate pit laps × compound sequences
- FIA rule enforced: ≥2 dry compounds must be used
- OR-Tools ILP for exact 1-stop solutions

---

## 📈 Resume Points

- ✅ Real F1 data via FastF1 API
- ✅ XGBoost with cross-validation (MAE ~0.3s)
- ✅ Exponential degradation curve fitting (scipy)
- ✅ Monte Carlo simulator with 500+ iterations
- ✅ OR-Tools integer programming
- ✅ FastAPI REST backend
- ✅ React + Recharts frontend dashboard
- ✅ Modular, production-grade code
