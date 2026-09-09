# REST & WebSocket API Specification

Base URL: `/api/v1`

## 1. Authentication
- `POST /api/v1/auth/login`: Authenticate with `{ email, password }` returning `{ access_token, user }`.
- `GET /api/v1/auth/me`: Validate session.

## 2. Dashboard
- `GET /api/v1/dashboard/summary`: 6 core executive KPIs, active panel, and system status.

## 3. Sensor Telemetry & Ingestion
- `GET /api/v1/sensors`: Query all 24 nodes with latest telemetry.
- `GET /api/v1/sensors/{id}`: Node detail.
- `GET /api/v1/sensors/{id}/readings?hours=24`: Time-series readings.
- `POST /api/v1/sensors/ingest`: Telemetry ingestion from LoRa gateway or simulator.

## 4. Mesh Network
- `GET /api/v1/mesh`: Node positions, directed DAG links, RSSI signal values, and hop counts.

## 5. AI Risk Assessment
- `GET /api/v1/risk/current?panel_id=PANEL-B3`: Composite risk score, classification, and factor attribution.
- `GET /api/v1/risk/history?panel_id=PANEL-B3`: Historical risk evaluations.

## 6. Alerts
- `GET /api/v1/alerts?status=ACTIVE&severity=ALL`: Query alerts.
- `POST /api/v1/alerts/{id}/acknowledge`: Acknowledge alert with operator notes.
- `POST /api/v1/alerts/{id}/resolve`: Resolve alert.

## 7. Analytics
- `GET /api/v1/analytics/trends?sensor_id=N14&range_str=24h`: Parametric time-series data.

## 8. Simulator Scenarios
- `POST /api/v1/simulator/scenario`: Trigger SIH demonstration scenario (`NORMAL`, `EARLY_WARNING`, `SUBSIDENCE_CRITICAL`, `SENSOR_FAILURE`, `NETWORK_FAILURE`, `RESET`).
- `GET /api/v1/simulator/status`: Current simulation state.

## 9. Real-Time WebSocket
- `WS /ws/telemetry`: Telemetry stream pushing `SENSOR_TELEMETRY_UPDATE` and `SIMULATOR_SCENARIO_CHANGED`.
