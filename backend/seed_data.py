import json
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.models.mine import Mine
from app.models.panel import Panel
from app.models.sensor import SensorNode
from app.models.reading import SensorReading
from app.models.risk_assessment import RiskAssessment
from app.models.mesh_link import MeshLink
from app.models.alert import Alert

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).filter(User.email == "admin@coal.gov.in").first():
        return

    print("[SEED] Seeding database with Ministry of Coal demonstrative data...")

    # 1. Admin User
    admin = User(
        email="admin@coal.gov.in",
        hashed_password=get_password_hash("Admin@Coal2026"),
        full_name="Mine Safety Officer (SECL)",
        role="ADMIN"
    )
    db.add(admin)

    # 2. Mine
    mine = Mine(
        id="MINE-SECL-KORBA",
        name="Korba Underground Coal Mine (Block-A)",
        organization="Ministry of Coal / South Eastern Coalfields Limited",
        latitude=22.3595,
        longitude=82.7501,
        boundary_geojson=json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [82.7420, 22.3520],
                [82.7600, 22.3520],
                [82.7620, 22.3680],
                [82.7400, 22.3680],
                [82.7420, 22.3520]
            ]]
        })
    )
    db.add(mine)
    db.commit()

    # 3. Underground Panels
    panels_data = [
        {"id": "PANEL-A1", "name": "Panel A1 (Sealed Gaf)", "status": "INACTIVE", "depth": 160.0, "risk": "NORMAL",
         "coords": [[82.7430, 22.3540], [82.7490, 22.3540], [82.7490, 22.3590], [82.7430, 22.3590], [82.7430, 22.3540]]},
        {"id": "PANEL-A2", "name": "Panel A2 (Post-Depillared)", "status": "INACTIVE", "depth": 175.0, "risk": "NORMAL",
         "coords": [[82.7500, 22.3540], [82.7560, 22.3540], [82.7560, 22.3590], [82.7500, 22.3590], [82.7500, 22.3540]]},
        {"id": "PANEL-B1", "name": "Panel B1 (Continuous Miner)", "status": "ACTIVE", "depth": 190.0, "risk": "NORMAL",
         "coords": [[82.7430, 22.3600], [82.7490, 22.3600], [82.7490, 22.3650], [82.7430, 22.3650], [82.7430, 22.3600]]},
        {"id": "PANEL-B2", "name": "Panel B2 (Development Section)", "status": "ACTIVE", "depth": 185.0, "risk": "NORMAL",
         "coords": [[82.7500, 22.3600], [82.7560, 22.3600], [82.7560, 22.3650], [82.7500, 22.3650], [82.7500, 22.3600]]},
        {"id": "PANEL-B3", "name": "Panel B3 (Active Depillaring - Core)", "status": "ACTIVE", "depth": 210.0, "risk": "NORMAL",
         "coords": [[82.7530, 22.3610], [82.7600, 22.3610], [82.7600, 22.3670], [82.7530, 22.3670], [82.7530, 22.3610]]}
    ]

    for p in panels_data:
        panel_obj = Panel(
            id=p["id"],
            mine_id="MINE-SECL-KORBA",
            name=p["name"],
            extraction_status=p["status"],
            depth_meters=p["depth"],
            risk_level=p["risk"],
            boundary_geojson=json.dumps({"type": "Polygon", "coordinates": [p["coords"]]})
        )
        db.add(panel_obj)
    db.commit()

    # 4. 24 Sensor Nodes across panels with mesh topology
    # Center of panel B3 is ~ [22.3640, 82.7565]
    sensors_meta = [
        # Gateway at central substation
        {"id": "N01", "panel": "PANEL-B1", "lat": 22.3600, "lon": 82.7490, "is_gw": True, "parent": None, "model": "LoRa-Gateway-Hub"},
        # Panel A1 & A2 nodes
        {"id": "N02", "panel": "PANEL-A1", "lat": 22.3550, "lon": 82.7450, "is_gw": False, "parent": "N01"},
        {"id": "N03", "panel": "PANEL-A1", "lat": 22.3575, "lon": 82.7470, "is_gw": False, "parent": "N02"},
        {"id": "N04", "panel": "PANEL-A2", "lat": 22.3555, "lon": 82.7525, "is_gw": False, "parent": "N01"},
        {"id": "N05", "panel": "PANEL-A2", "lat": 22.3580, "lon": 82.7545, "is_gw": False, "parent": "N04"},
        # Panel B1 nodes
        {"id": "N06", "panel": "PANEL-B1", "lat": 22.3615, "lon": 82.7450, "is_gw": False, "parent": "N01"},
        {"id": "N07", "panel": "PANEL-B1", "lat": 22.3635, "lon": 82.7470, "is_gw": False, "parent": "N06"},
        {"id": "N08", "panel": "PANEL-B1", "lat": 22.3640, "lon": 82.7445, "is_gw": False, "parent": "N07"},
        # Panel B2 nodes
        {"id": "N09", "panel": "PANEL-B2", "lat": 22.3610, "lon": 82.7515, "is_gw": False, "parent": "N01"},
        {"id": "N10", "panel": "PANEL-B2", "lat": 22.3630, "lon": 82.7535, "is_gw": False, "parent": "N09"},
        {"id": "N11", "panel": "PANEL-B2", "lat": 22.3645, "lon": 82.7520, "is_gw": False, "parent": "N10"},
        # Panel B3 High Density Cluster (Core Subsidence Monitoring Area)
        {"id": "N12", "panel": "PANEL-B3", "lat": 22.3625, "lon": 82.7555, "is_gw": False, "parent": "N10"},
        {"id": "N13", "panel": "PANEL-B3", "lat": 22.3635, "lon": 82.7570, "is_gw": False, "parent": "N12"},
        {"id": "N14", "panel": "PANEL-B3", "lat": 22.3645, "lon": 82.7580, "is_gw": False, "parent": "N13"},
        {"id": "N15", "panel": "PANEL-B3", "lat": 22.3655, "lon": 82.7565, "is_gw": False, "parent": "N14"},
        {"id": "N16", "panel": "PANEL-B3", "lat": 22.3660, "lon": 82.7585, "is_gw": False, "parent": "N15"},
        {"id": "N17", "panel": "PANEL-B3", "lat": 22.3620, "lon": 82.7580, "is_gw": False, "parent": "N12"},
        {"id": "N18", "panel": "PANEL-B3", "lat": 22.3638, "lon": 82.7595, "is_gw": False, "parent": "N17"},
        # Perimeter / Infrastructure Warning Nodes
        {"id": "N19", "panel": "PANEL-B3", "lat": 22.3670, "lon": 82.7550, "is_gw": False, "parent": "N15"},
        {"id": "N20", "panel": "PANEL-B2", "lat": 22.3665, "lon": 82.7505, "is_gw": False, "parent": "N11"},
        {"id": "N21", "panel": "PANEL-A1", "lat": 22.3530, "lon": 82.7485, "is_gw": False, "parent": "N03"},
        {"id": "N22", "panel": "PANEL-A2", "lat": 22.3535, "lon": 82.7555, "is_gw": False, "parent": "N04"},
        {"id": "N23", "panel": "PANEL-B1", "lat": 22.3590, "lon": 82.7430, "is_gw": False, "parent": "N06"},
        {"id": "N24", "panel": "PANEL-B3", "lat": 22.3665, "lon": 82.7600, "is_gw": False, "parent": "N16"}
    ]

    for s in sensors_meta:
        node = SensorNode(
            id=s["id"],
            panel_id=s["panel"],
            name=f"Surface Node {s['id']}{' (LoRa Gateway Hub)' if s.get('is_gw') else ''}",
            latitude=s["lat"],
            longitude=s["lon"],
            hardware_model=s.get("model", "LoRa-SX1262-Subsidence-V2"),
            mesh_parent_id=s["parent"],
            is_gateway=s.get("is_gw", False),
            status="ONLINE",
            battery_level=round(random.uniform(92.0, 99.5), 1),
            signal_strength_rssi=int(random.uniform(-75, -63)),
            last_seen_at=datetime.utcnow()
        )
        db.add(node)
    db.commit()

    # 5. Mesh Links
    for s in sensors_meta:
        if s["parent"]:
            link = MeshLink(
                source_node_id=s["id"],
                target_node_id=s["parent"],
                link_quality_lqi=random.randint(215, 250),
                rssi=random.randint(-78, -65),
                hop_count=1 if s["parent"] == "N01" else 2,
                status="ACTIVE"
            )
            db.add(link)
    db.commit()

    # 6. Historical baseline readings for each node (past 12 hours)
    now = datetime.utcnow()
    for s in sensors_meta:
        for i in range(12, 0, -1):
            t = now - timedelta(hours=i)
            # stable small background fluctuation
            reading = SensorReading(
                node_id=s["id"],
                timestamp=t,
                tilt_x=round(random.uniform(-0.15, 0.15), 2),
                tilt_y=round(random.uniform(-0.15, 0.15), 2),
                displacement=round(random.uniform(0.5, 1.8), 1),
                vibration=round(random.uniform(0.2, 0.6), 2),
                crack_detected=False,
                battery_level=round(98.0 - (i * 0.05), 1),
                signal_strength=random.randint(-76, -64),
                anomaly_score=round(random.uniform(0.02, 0.08), 3),
                is_outlier=False
            )
            db.add(reading)
    db.commit()

    # 7. Initial Risk Assessments
    for i in range(12, 0, -1):
        t = now - timedelta(hours=i)
        ra = RiskAssessment(
            panel_id="PANEL-B3",
            timestamp=t,
            risk_score=round(random.uniform(11.0, 18.0), 1),
            risk_classification="NORMAL",
            primary_contributing_node_id="N14",
            tilt_factor=22.0,
            displacement_factor=38.0,
            vibration_factor=20.0,
            spatial_correlation_factor=20.0,
            explanation="Ground movements within baseline geotechnical equilibrium tolerance."
        )
        db.add(ra)
    db.commit()

    print("[SEED] Database seeding complete! Admin created (admin@coal.gov.in / Admin@Coal2026).")

if __name__ == "__main__":
    from app.core.database import SessionLocal, Base, engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
