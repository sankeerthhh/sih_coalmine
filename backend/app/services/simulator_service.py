import asyncio
import random
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.sensor import SensorNode
from app.models.reading import SensorReading
from app.models.alert import Alert
from app.models.panel import Panel
from app.models.mesh_link import MeshLink
from app.schemas.sensor import SensorReadingCreate
from app.services.sensor_service import sensor_service
from app.websocket.connection_manager import connection_manager

class SimulatorService:
    def __init__(self):
        self.current_scenario: str = "NORMAL"
        self.is_running: bool = False
        self.tick_count: int = 0
        self.affected_nodes: List[str] = ["N12", "N13", "N14", "N15", "N16"]
        self._task: asyncio.Task = None

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "current_scenario": self.current_scenario,
            "active_affected_nodes": self.affected_nodes if self.current_scenario in ["EARLY_WARNING", "SUBSIDENCE_CRITICAL", "SENSOR_FAILURE"] else [],
            "tick_count": self.tick_count
        }

    async def set_scenario(self, scenario: str, speed: float = 1.0) -> Dict[str, Any]:
        self.current_scenario = scenario.upper()
        self.is_running = True
        self.tick_count = 0

        db = SessionLocal()
        try:
            if self.current_scenario == "RESET" or self.current_scenario == "NORMAL":
                # Reset all nodes to ONLINE with normal baselines
                nodes = db.query(SensorNode).all()
                for n in nodes:
                    n.status = "ONLINE"
                    n.battery_level = round(random.uniform(92.0, 99.0), 1)
                    n.signal_strength_rssi = int(random.uniform(-78, -62))
                    n.last_seen_at = datetime.utcnow()
                
                # Reset panels to NORMAL
                panels = db.query(Panel).all()
                for p in panels:
                    p.risk_level = "NORMAL"

                # Reset mesh links to ACTIVE
                links = db.query(MeshLink).all()
                for l in links:
                    l.status = "ACTIVE"
                    l.link_quality_lqi = random.randint(200, 240)

                db.commit()

            elif self.current_scenario == "SENSOR_FAILURE":
                # Specifically drop node N14
                n14 = db.query(SensorNode).filter(SensorNode.id == "N14").first()
                if n14:
                    n14.status = "OFFLINE"
                    n14.battery_level = 0.0
                    n14.signal_strength_rssi = -120
                    db.commit()

            elif self.current_scenario == "NETWORK_FAILURE":
                # Degrade repeater mesh link
                repeater_link = db.query(MeshLink).filter(MeshLink.source_node_id.in_(["N10", "N11"])).first()
                if repeater_link:
                    repeater_link.status = "BROKEN"
                    repeater_link.link_quality_lqi = 0
                    db.commit()

        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

        # Run a telemetry burst in background for immediate visual feedback
        asyncio.create_task(self.execute_tick())

        # Broadcast scenario change
        await connection_manager.broadcast({
            "type": "SIMULATOR_SCENARIO_CHANGED",
            "data": self.get_status()
        })

        return self.get_status()

    async def execute_tick(self):
        self.tick_count += 1
        db = SessionLocal()
        try:
            nodes = db.query(SensorNode).all()
            for node in nodes:
                # If sensor failure scenario and node is N14, skip transmission (simulate dropped node)
                if self.current_scenario == "SENSOR_FAILURE" and node.id == "N14":
                    continue

                is_affected = node.id in self.affected_nodes and node.panel_id == "PANEL-B3"

                if self.current_scenario == "SUBSIDENCE_CRITICAL" and is_affected:
                    # Severe ground movement
                    tilt_x = round(random.uniform(3.5, 4.8), 2)
                    tilt_y = round(random.uniform(2.8, 4.2), 2)
                    displacement = round(random.uniform(28.0, 42.0), 1)
                    vibration = round(random.uniform(6.5, 12.0), 2)
                    crack_detected = True if node.id in ["N13", "N14"] else False
                    battery = max(10.0, node.battery_level - 0.1)
                    signal = int(random.uniform(-85, -74))
                elif self.current_scenario == "EARLY_WARNING" and is_affected:
                    # Developing deformation
                    tilt_x = round(random.uniform(1.2, 2.4), 2)
                    tilt_y = round(random.uniform(0.9, 1.8), 2)
                    displacement = round(random.uniform(9.0, 16.0), 1)
                    vibration = round(random.uniform(2.5, 4.8), 2)
                    crack_detected = False
                    battery = max(10.0, node.battery_level - 0.05)
                    signal = int(random.uniform(-80, -68))
                else:
                    # Normal stable background telemetry
                    tilt_x = round(random.uniform(-0.35, 0.35), 2)
                    tilt_y = round(random.uniform(-0.35, 0.35), 2)
                    displacement = round(random.uniform(0.8, 2.2), 1)
                    vibration = round(random.uniform(0.2, 0.9), 2)
                    crack_detected = False
                    battery = round(node.battery_level, 1)
                    signal = int(node.signal_strength_rssi)

                telemetry = SensorReadingCreate(
                    node_id=node.id,
                    timestamp=datetime.utcnow(),
                    tilt_x=tilt_x,
                    tilt_y=tilt_y,
                    displacement=displacement,
                    vibration=vibration,
                    crack_detected=crack_detected,
                    battery_level=battery,
                    signal_strength=signal
                )

                try:
                    await sensor_service.process_telemetry(db, telemetry)
                except Exception:
                    db.rollback()
                
                # Yield control to event loop so other HTTP requests are processed with zero latency
                await asyncio.sleep(0.01)
        except Exception:
            db.rollback()
        finally:
            db.close()

simulator_service = SimulatorService()
