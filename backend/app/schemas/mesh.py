from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class MeshLinkResponse(BaseModel):
    id: int
    source_node_id: str
    target_node_id: str
    link_quality_lqi: int
    rssi: int
    hop_count: int
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True

class MeshNetworkResponse(BaseModel):
    gateway_id: str
    total_nodes: int
    online_nodes: int
    average_rssi: float
    max_hops: int
    network_health: str # HEALTHY, DEGRADED, CRITICAL
    nodes: List[dict]
    links: List[MeshLinkResponse]
