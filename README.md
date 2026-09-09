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

## 8. Docker Deployment

```bash
docker compose up --build
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8000](http://localhost:8000)
- MQTT Broker: Port 1883
- PostgreSQL: Port 5432

---

## 9. Scientific & Regulatory Disclaimer

> **Prototype / Simulated Sensor Data**: This system is designed as an AI-assisted geotechnical decision support and early warning platform. It does not claim 100% predictive certainty. Real-world mine deployment requires geotechnical baseline calibration, borehole extensometer cross-validation, and certification under Directorate General of Mines Safety (DGMS) regulatory standards.
