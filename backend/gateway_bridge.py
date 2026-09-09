#!/usr/bin/env python3
"""
LoRa Wireless Surface Mesh Gateway Bridge
Connects physical ESP32 LoRa Gateway over USB Serial OR runs realistic Virtual Mesh Emulation.

Usage:
  # Mode 1: Virtual Mesh Emulation (No hardware required)
  python gateway_bridge.py --mode emulate --interval 5

  # Mode 2: Physical ESP32 Gateway Hardware (USB Serial)
  python gateway_bridge.py --mode serial --port /dev/ttyUSB0 --baud 115200
"""

import argparse
import json
import logging
import random
import time
import sys
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [LORA-BRIDGE] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("gateway_bridge")

DEFAULT_INGEST_URL = "http://localhost:8000/api/v1/sensors/ingest"

# 24 Mesh Nodes topology definition matching Ministry of Coal SECL setup
MESH_NODES = [
    {"id": "N01", "panel": "PANEL-A1", "parent": None, "hop": 0, "is_gateway": True},
    {"id": "N02", "panel": "PANEL-A1", "parent": "N01", "hop": 1},
    {"id": "N03", "panel": "PANEL-A1", "parent": "N02", "hop": 2},
    {"id": "N04", "panel": "PANEL-A1", "parent": "N01", "hop": 1},
    {"id": "N05", "panel": "PANEL-A2", "parent": "N04", "hop": 2},
    {"id": "N06", "panel": "PANEL-A2", "parent": "N05", "hop": 3},
    {"id": "N07", "panel": "PANEL-A2", "parent": "N06", "hop": 4},
    {"id": "N08", "panel": "PANEL-A2", "parent": "N07", "hop": 5},
    {"id": "N09", "panel": "PANEL-B1", "parent": "N01", "hop": 1},
    {"id": "N10", "panel": "PANEL-B1", "parent": "N09", "hop": 2},
    {"id": "N11", "panel": "PANEL-B1", "parent": "N10", "hop": 3},
    {"id": "N12", "panel": "PANEL-B1", "parent": "N11", "hop": 4},
    {"id": "N13", "panel": "PANEL-B3", "parent": "N12", "hop": 5},
    {"id": "N14", "panel": "PANEL-B3", "parent": "N13", "hop": 6}, # Active depillaring epicenter
    {"id": "N15", "panel": "PANEL-B3", "parent": "N14", "hop": 7},
    {"id": "N16", "panel": "PANEL-B3", "parent": "N15", "hop": 8},
    {"id": "N17", "panel": "PANEL-B2", "parent": "N09", "hop": 2},
    {"id": "N18", "panel": "PANEL-B2", "parent": "N17", "hop": 3},
    {"id": "N19", "panel": "PANEL-B2", "parent": "N18", "hop": 4},
    {"id": "N20", "panel": "PANEL-B2", "parent": "N19", "hop": 5},
    {"id": "N21", "panel": "PANEL-B3", "parent": "N14", "hop": 7},
    {"id": "N22", "panel": "PANEL-B3", "parent": "N21", "hop": 8},
    {"id": "N23", "panel": "PANEL-B2", "parent": "N20", "hop": 6},
    {"id": "N24", "panel": "PANEL-B3", "parent": "N16", "hop": 9}
]

def forward_to_backend(payload: dict, url: str) -> bool:
    try:
        res = requests.post(url, json=payload, timeout=3.0)
        if res.status_code in (200, 201):
            logger.info(f"-> Ingested {payload['node_id']} | Disp: {payload['displacement']:.2f}mm | Tilt: {payload['tilt_x']:.2f}° | RSSI: {payload['signal_strength']}dBm")
            return True
        else:
            logger.error(f"Ingest failed ({res.status_code}): {res.text}")
            return False
    except requests.exceptions.RequestException as e:
        logger.warning(f"Backend unreachable at {url}: {e}")
        return False

def run_serial_mode(port: str, baud: int, url: str):
    """Reads physical ESP32 LoRa Gateway over USB Serial port"""
    try:
        import serial
    except ImportError:
        logger.error("pyserial is required for serial mode. Install with: pip install pyserial")
        sys.exit(1)

    logger.info(f"Opening hardware serial port {port} at {baud} baud...")
    try:
        ser = serial.Serial(port, baud, timeout=1.0)
    except Exception as exc:
        logger.error(f"Cannot open serial port {port}: {exc}")
        sys.exit(1)

    logger.info("Listening for incoming LoRa radio packets from ESP32...")
    while True:
        try:
            line = ser.readline().decode('utf-8', errors='replace').strip()
            if not line:
                continue
            if line.startswith("{") and line.endswith("}"):
                data = json.loads(line)
                forward_to_backend(data, url)
            else:
                logger.debug(f"[RAW SERIAL] {line}")
        except KeyboardInterrupt:
            logger.info("Serial bridge stopped by user.")
            break
        except Exception as err:
            logger.error(f"Serial processing error: {err}")

def run_emulation_mode(url: str, interval: float, scenario: str):
    """Synthesizes authentic LoRa 865MHz mesh traffic without requiring physical hardware"""
    logger.info(f"Starting Virtual LoRa Mesh Emulation (Scenario: {scenario}, Interval: {interval}s)...")
    logger.info(f"Frequency: 865.5 MHz | Modulation: LoRa SF7 / BW 125kHz | Nodes: 24 active")

    step = 0
    # State tracking for smooth temporal transitions
    node_disp = {n["id"]: random.uniform(2.0, 5.0) for n in MESH_NODES}
    node_tilt = {n["id"]: random.uniform(0.3, 0.9) for n in MESH_NODES}

    while True:
        try:
            step += 1
            # Pick a subset of nodes to transmit this cycle (mesh staggered burst)
            active_batch = random.sample(MESH_NODES, k=min(6, len(MESH_NODES)))
            
            for node in active_batch:
                node_id = node["id"]
                panel = node["panel"]

                # Add scenario dynamics
                if scenario == "CRITICAL" and panel == "PANEL-B3":
                    node_disp[node_id] += random.uniform(0.2, 0.6)
                    node_tilt[node_id] += random.uniform(0.05, 0.15)
                    crack = (node_disp[node_id] > 20.0 or random.random() < 0.25)
                    vib = random.uniform(0.8, 1.8)
                elif scenario == "WARNING" and panel == "PANEL-B3":
                    node_disp[node_id] += random.uniform(0.05, 0.15)
                    node_tilt[node_id] += random.uniform(0.02, 0.05)
                    crack = False
                    vib = random.uniform(0.3, 0.7)
                else:
                    # Normal diurnal oscillation
                    node_disp[node_id] += random.uniform(-0.02, 0.03)
                    node_disp[node_id] = max(1.0, min(8.0, node_disp[node_id]))
                    crack = False
                    vib = random.uniform(0.1, 0.3)

                packet = {
                    "node_id": node_id,
                    "tilt_x": round(node_tilt[node_id], 2),
                    "tilt_y": round(node_tilt[node_id] * random.uniform(0.7, 1.2), 2),
                    "displacement": round(node_disp[node_id], 2),
                    "vibration": round(vib, 2),
                    "crack_detected": crack,
                    "battery_level": round(max(30.0, 95.0 - (step * 0.01)), 1),
                    "signal_strength": int(-65 - (node["hop"] * 6) + random.randint(-3, 3))
                }

                forward_to_backend(packet, url)

            time.sleep(interval)
        except KeyboardInterrupt:
            logger.info("LoRa virtual mesh stopped by user.")
            break

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ministry of Coal Subsidence LoRa Gateway Bridge")
    parser.add_argument("--mode", choices=["serial", "emulate"], default="emulate", help="Bridge execution mode")
    parser.add_argument("--port", default="/dev/ttyUSB0", help="Serial port for physical ESP32 Gateway")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate for physical ESP32")
    parser.add_argument("--url", default=DEFAULT_INGEST_URL, help="Backend telemetry ingestion URL")
    parser.add_argument("--interval", type=float, default=5.0, help="Emulation transmission cycle (seconds)")
    parser.add_argument("--scenario", choices=["NORMAL", "WARNING", "CRITICAL"], default="NORMAL", help="Emulation scenario")
    args = parser.parse_args()

    if args.mode == "serial":
        run_serial_mode(args.port, args.baud, args.url)
    else:
        run_emulation_mode(args.url, args.interval, args.scenario)
