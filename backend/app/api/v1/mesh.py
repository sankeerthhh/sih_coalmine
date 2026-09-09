from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sensor import SensorNode
from app.models.mesh_link import MeshLink
from app.schemas.mesh import MeshNetworkResponse, MeshLinkResponse

router = APIRouter(prefix="/mesh", tags=["Wireless Mesh Network"])

@router.get("", response_model=MeshNetworkResponse)
def get_mesh_network(db: Session = Depends(get_db)):
    nodes = db.query(SensorNode).order_by(SensorNode.id.asc()).all()
    links = db.query(MeshLink).all()

    total_nodes = len(nodes)
    online_nodes = sum(1 for n in nodes if n.status != "OFFLINE")
    
    avg_rssi = -71.4
    if nodes:
        avg_rssi = round(sum(n.signal_strength_rssi for n in nodes) / len(nodes), 1)

    max_hops = max([l.hop_count for l in links], default=3)
    
    broken_links = sum(1 for l in links if l.status == "BROKEN")
    if broken_links > 2 or online_nodes < total_nodes - 3:
        health = "CRITICAL"
    elif broken_links > 0 or online_nodes < total_nodes:
        health = "DEGRADED"
    else:
        health = "HEALTHY"

    gateway = next((n for n in nodes if n.is_gateway), None)
    gw_id = gateway.id if gateway else "N01"

    node_data = [
        {
            "id": n.id,
            "name": n.name,
            "panel_id": n.panel_id,
            "latitude": n.latitude,
            "longitude": n.longitude,
            "is_gateway": n.is_gateway,
            "status": n.status,
            "battery_level": n.battery_level,
            "signal_strength_rssi": n.signal_strength_rssi,
            "parent_id": n.mesh_parent_id
        }
        for n in nodes
    ]

    return MeshNetworkResponse(
        gateway_id=gw_id,
        total_nodes=total_nodes,
        online_nodes=online_nodes,
        average_rssi=avg_rssi,
        max_hops=max_hops,
        network_health=health,
        nodes=node_data,
        links=[MeshLinkResponse.model_validate(l) for l in links]
    )
