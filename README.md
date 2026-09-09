# AI-Enabled Smart Mine Subsidence Monitoring & Early Warning Platform

**Organization:** Ministry of Coal, Government of India  
**Core Innovation:** Wireless Surface Mesh Network for Real-Time Subsidence Detection  
**Problem Statement:** Smart India Hackathon (SIH) Geotechnical Decision Support  

---

## 1. Problem Overview

Surface subsidence induced by underground coal mining presents substantial geotechnical risks to nearby rural communities, railway lines, road infrastructure, agricultural lands, and environmental watersheds.

This platform provides a continuous, real-time monitoring and early warning system powered by a distributed surface mesh network of low-cost wireless sensor nodes deployed across underground coal extraction panels.

### Telemetry Pipeline
$$\text{Sensor Node} \longrightarrow \text{LoRa Mesh} \longrightarrow \text{Gateway} \longrightarrow \text{FastAPI Ingestion} \longrightarrow \text{SQL Database} \longrightarrow \text{AI Anomaly Pipeline} \longrightarrow \text{GIS Risk Map} \longrightarrow \text{Early Warning Alerts}$$

---

## 2. Core Features

1. **Wireless Surface Mesh Network (Unique Innovation):** Visualizes multi-hop LoRa DAG topology, link quality (LQI), RSSI signal strength, and autonomous failover rerouting around offline nodes.
2. **Real-Time Geotechnical Telemetry:** Live streaming of resultant surface tilt, vertical displacement velocity, vibration RMS, tension crack initiation, and battery voltage without manual page refresh.
3. **AI Anomaly Detection & Explainable Risk Scoring:** Scikit-Learn Isolation Forest combined with geotechnical factor attribution ($0 - 100$ Risk Index with percentage contribution of tilt, displacement velocity, vibration, and spatial divergence).
4. **Interactive GIS Strata Mapping:** Leaflet & OpenStreetMap interface rendering mine boundaries, 5 underground panels (A1, A2, B1, B2, B3), sensor status pins, and subsidence danger contours.
5. **Early Warning Alert Lifecycle:** Acknowledge and resolve workflows with operator notes and actionable geotechnical guidance.
6. **Time-Series Analytics:** Multi-axis historical trend analysis (1h, 24h, 7d, 30d) with 1-click CSV export.
7. **Subsystem Diagnostics:** Gateway health, database query metrics, AI engine throughput, and real-time telemetry diagnostics.
8. **Interactive SIH Demonstration Toolbar:** 1-click trigger buttons for judges (*Normal*, *Early Warning*, *Critical Subsidence*, *Node Failure*, *Mesh Degraded*, *Reset*).
9. **Offline Resilience:** Auto-reconnecting WebSockets and persistent fallback indicators.

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS (Industrial safety palette: `#0F172A` Navy, `#1E293B` Slate, `#2563EB` Blue, `#16A34A` Green, `#F59E0B` Amber, `#DC2626` Red), Lucide Icons, Leaflet GIS, Recharts, Zustand.
- **Backend:** Python 3.13, FastAPI (Async REST + WebSockets), SQLAlchemy 2.0 (SQLite local zero-friction fallback + PostgreSQL for Docker), Pydantic v2, PyJWT, Passlib (bcrypt).
- **AI Engine:** Scikit-Learn (Isolation Forest), NumPy, Pandas.
- **Simulator:** Configurable multi-scenario LoRa frame generator.
- **Containerization:** Docker & Docker Compose.

---

## 4. Quick Start (Windows Local)

### Prerequisites
- Python 3.10+
- Node.js v18+

### Step 1: Clone and Seed Database
```powershell
cd backend
python -m pip install -r requirements.txt
python seed_data.py
```

### Step 2: Launch Backend
```powershell
# In /backend directory
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 3: Launch Frontend
```powershell
# In /frontend directory
npm.cmd install
npm.cmd run dev
```
Open Browser: [http://localhost:5173](http://localhost:5173)

*Or simply double-click `run-all.bat` on Windows to launch both services simultaneously!*

---

## 5. Demo Credentials

- **Email:** `admin@coal.gov.in`
- **Password:** `Admin@Coal2026`
- *(A "Fill Demo" button is provided on the login page for instant 1-click access)*

---

## 6. SIH Judge Demonstration Flow (2–3 Minutes)

1. **Login:** Log in with demo credentials.
2. **Dashboard Review:** Observe 24 active nodes, panel B3 status, and the mini GIS map.
3. **Trigger Early Warning:** Click **`⚠ Early Warning`** in the top demo bar:
   - Panel B3 nodes (N12-N16) show rising tilt and displacement.
   - AI Risk Index rises into **WARNING (31–60)**.
   - Yellow risk contour circle appears on the GIS map.
   - An early warning alert is generated automatically.
4. **Trigger Critical Subsidence:** Click **`🔴 Critical Subsidence`**:
   - Nodes turn **Red**, crack wire trips, AI risk index exceeds **80 (CRITICAL)**.
   - Map displays high-risk subsidence trough contour.
   - Critical alert triggers with recommended action: *"Immediate field inspection recommended"*.
   - Click **Acknowledge** on the alert.
5. **Inspect Wireless Mesh Network:** Navigate to **Sensor Network** to inspect the multi-hop LoRa DAG topology.
6. **Trigger Node Failure:** Click **`📡 Node Failure`** to observe Node N14 drop offline while the mesh topology self-heals around it.
7. **Reset:** Click **`↻ Reset`** to restore baseline quiescent conditions.

---

## 7. Running Tests

```powershell
# Backend unit & integration test suite (9 tests)
cd backend
python -m pytest tests/ -v -p no:langsmith -p no:faker

# Frontend TypeScript compilation and production bundle build
cd frontend
npm.cmd run build
```

---

## 8. Docker & Cloud Production Deployment

### Option A: Local / VPS Full-Stack Docker Compose
Deploy all 4 services (Frontend Nginx, FastAPI Backend, PostgreSQL DB, Mosquitto MQTT) with automated schema and seed initialization:

```bash
docker compose up --build -d
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173) or [http://localhost](http://localhost)
- **Backend API & Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: Port `5432` *(Auto-seeded from `database/supabase_schema_and_seed.sql` on initial container launch)*
- **Mosquitto MQTT Broker**: Port `1883`

To stop services:
```bash
docker compose down
```

---

### Option B: Cloud PaaS Deployment (Render + Supabase + Vercel)

#### 1. Database (Supabase Cloud PostgreSQL)
The platform is natively pre-configured for Supabase PostgreSQL. The full schema and demonstrative seed data script is located in:
[`database/supabase_schema_and_seed.sql`](database/supabase_schema_and_seed.sql)

#### 2. Backend (Render Web Service)
Using the included [`render.yaml`](render.yaml) blueprint:
1. Connect your GitHub repository to [Render.com](https://render.com).
2. Create a new **Blueprint** instance selecting `render.yaml`.
3. Set your `DATABASE_URL` environment variable pointing to your Supabase PostgreSQL pooler or instance.

#### 3. Frontend (Vercel or Netlify)
The frontend includes [`frontend/vercel.json`](frontend/vercel.json) for automatic SPA routing fallback:
1. Import the `frontend/` folder into [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**.
3. Build command: `npm run build` | Output directory: `dist`.

---

### Option C: Continuous Integration (GitHub Actions)
The repository includes automated CI in [`.github/workflows/ci.yml`](.github/workflows/ci.yml):
- **Backend**: Executes pytest suite with simulated telemetry and auth validation.
- **Frontend**: Enforces TypeScript compilation and Vite production bundle integrity.
- **Docker**: Automatically validates compose configuration syntax on every push.

---

## 9. Scientific & Regulatory Disclaimer

> **Prototype / Simulated Sensor Data**: This system is designed as an AI-assisted geotechnical decision support and early warning platform. It does not claim 100% predictive certainty. Real-world mine deployment requires geotechnical baseline calibration, borehole extensometer cross-validation, and certification under Directorate General of Mines Safety (DGMS) regulatory standards.
