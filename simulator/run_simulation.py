"""
Standalone Geotechnical Sensor Simulator for SIH Demonstration.
Publishes realistic telemetry frames to the Mine Subsidence Backend API or MQTT broker.
"""

import time
import argparse
import random
import requests
from datetime import datetime

API_URL = "http://127.0.0.1:8000/api/v1"

def run_simulation(scenario: str = "NORMAL", interval: float = 3.0, iterations: int = 50):
    print(f"==================================================")
    print(f"MINE SUBSIDENCE GEOTECHNICAL TELEMETRY SIMULATOR")
    print(f"Ministry of Coal, Government of India")
    print(f"Scenario: {scenario} | Interval: {interval}s")
    print(f"==================================================")

    # Set scenario on backend
    try:
        resp = requests.post(f"{API_URL}/simulator/scenario", json={"scenario": scenario})
        if resp.status_code == 200:
            print(f"[STATUS] Backend scenario state set to: {scenario}")
    except Exception as e:
        print(f"[WARN] Could not sync scenario state to backend: {e}")

    # Generate telemetry frames
    affected_nodes = ["N12", "N13", "N14", "N15", "N16"]
    for it in range(iterations):
        print(f"\n[CYCLE #{it+1}] Publishing LoRa telemetry burst...")
        for i in range(1, 25):
            node_id = f"N{i:02d}"
            is_affected = node_id in affected_nodes

            if scenario == "SUBSIDENCE_CRITICAL" and is_affected:
                tilt_x = round(random.uniform(3.2, 4.8), 2)
                tilt_y = round(random.uniform(2.5, 4.1), 2)
                displacement = round(random.uniform(25.0, 40.0), 1)
                vibration = round(random.uniform(6.0, 11.0), 2)
                crack = True if node_id in ["N13", "N14"] else False
            elif scenario == "EARLY_WARNING" and is_affected:
                tilt_x = round(random.uniform(1.2, 2.4), 2)
                tilt_y = round(random.uniform(0.9, 1.8), 2)
                displacement = round(random.uniform(8.0, 15.0), 1)
                vibration = round(random.uniform(2.5, 4.5), 2)
                crack = False
            else:
                tilt_x = round(random.uniform(-0.25, 0.25), 2)
                tilt_y = round(random.uniform(-0.25, 0.25), 2)
                displacement = round(random.uniform(0.8, 1.8), 1)
                vibration = round(random.uniform(0.2, 0.7), 2)
                crack = False

            payload = {
                "node_id": node_id,
                "tilt_x": tilt_x,
                "tilt_y": tilt_y,
                "displacement": displacement,
                "vibration": vibration,
                "crack_detected": crack,
                "battery_level": round(random.uniform(88.0, 98.0), 1),
                "signal_strength": int(random.uniform(-78, -65))
            }

            try:
                res = requests.post(f"{API_URL}/sensors/ingest", json=payload, timeout=2.0)
                if res.status_code == 200:
                    data = res.json()
                    if is_affected and (scenario != "NORMAL"):
                        print(f"  -> {node_id}: Risk={data.get('risk_score')}% [{data.get('classification')}] Alert={data.get('alert_id')}")
            except Exception as exc:
                print(f"  [ERR] {node_id} failed: {exc}")

        time.sleep(interval)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mine Subsidence Sensor Simulator")
    parser.add_argument("--scenario", default="EARLY_WARNING", choices=["NORMAL", "EARLY_WARNING", "SUBSIDENCE_CRITICAL", "SENSOR_FAILURE"])
    parser.add_argument("--interval", type=float, default=3.0)
    parser.add_argument("--iterations", type=int, default=20)
    args = parser.parse_args()
    run_simulation(args.scenario, args.interval, args.iterations)
