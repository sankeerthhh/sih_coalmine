# System Architecture & Wireless Surface Mesh

## 1. Physical Sensor Deployment
The surface array consists of 24 intelligent telemetry nodes deployed in a grid over active and planned underground depillaring panels. Each node includes:
- Tri-axial MEMS Inclinometer ($\pm 0.01^\circ$ precision)
- Extensometer displacement anchor wire
- Piezoelectric vibration RMS sensor
- Breakable tension-wire crack detection circuit
- Semtech SX1262 LoRa transceiver (868 MHz / 433 MHz)
- Solar harvester with 3.2V LiFePO4 battery pack

## 2. LoRa Surface Mesh Topology
Nodes form a Directed Acyclic Graph (DAG) with Substation Gateway N01 as the root:
- **Root Gateway (N01):** High-power LoRa concentrator equipped with cellular/Ethernet uplink to the cloud/on-premise server.
- **Repeaters (N02, N04, N06, N09, N10, N12):** Relay packets from distant boundary nodes, reducing transmission power requirements.
- **Dynamic Link Quality Metric (LQI):** Packets automatically reroute through alternative adjacent nodes if an intermediate repeater battery depletes or link degrades.

## 3. Data Ingestion & Storage Architecture
- **Protocol Support:** REST JSON payload ingestion (`POST /api/v1/sensors/ingest`) and MQTT binary frames (`coal/mine/+/telemetry`).
- **Database Indexing:** Indexed on `(node_id, timestamp)` and `(panel_id, timestamp)` for high-throughput time-series queries.
- **WebSocket Dispatcher:** Real-time push via `ConnectionManager` distributing telemetry updates to active desktop operator displays in $< 50\text{ ms}$.
