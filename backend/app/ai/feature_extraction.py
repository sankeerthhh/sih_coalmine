import math
from typing import List, Dict, Optional, Any
from datetime import datetime

class FeatureExtractor:
    """
    Stage 2 & 3: Noise Filtering & Feature Extraction.
    Calculates physical geotechnical metrics:
    - Resultant tilt magnitude (degrees)
    - Tilt angular rate (deg/min)
    - Displacement velocity (mm/min)
    - Filtered vibration RMS (EMA smoothed)
    - Spatial cluster correlation / deviation
    """
    def __init__(self, ema_alpha: float = 0.35):
        self.ema_alpha = ema_alpha
        self._last_readings: Dict[str, Dict[str, Any]] = {}

    def extract_node_features(
        self,
        node_id: str,
        timestamp: datetime,
        tilt_x: float,
        tilt_y: float,
        displacement: float,
        vibration: float,
        crack_detected: bool,
        neighbor_tilts: Optional[List[float]] = None
    ) -> Dict[str, float]:
        # Resultant tilt magnitude
        resultant_tilt = math.sqrt(tilt_x**2 + tilt_y**2)

        prev = self._last_readings.get(node_id)
        
        # Calculate rates of change
        if prev:
            dt_seconds = max((timestamp - prev["timestamp"]).total_seconds(), 1.0)
            dt_minutes = dt_seconds / 60.0
            tilt_rate = abs(resultant_tilt - prev["resultant_tilt"]) / dt_minutes
            displacement_velocity = (displacement - prev["displacement"]) / dt_minutes
            # EMA for vibration
            filtered_vibration = (self.ema_alpha * vibration) + ((1.0 - self.ema_alpha) * prev["filtered_vibration"])
        else:
            tilt_rate = 0.0
            displacement_velocity = 0.0
            filtered_vibration = vibration

        # Spatial correlation: deviation from neighbor nodes in same panel
        spatial_deviation = 0.0
        if neighbor_tilts and len(neighbor_tilts) > 0:
            avg_neighbor_tilt = sum(neighbor_tilts) / len(neighbor_tilts)
            spatial_deviation = abs(resultant_tilt - avg_neighbor_tilt)

        # Store state for next delta
        self._last_readings[node_id] = {
            "timestamp": timestamp,
            "resultant_tilt": resultant_tilt,
            "displacement": displacement,
            "filtered_vibration": filtered_vibration
        }

        return {
            "resultant_tilt": round(resultant_tilt, 3),
            "tilt_rate": round(tilt_rate, 4),
            "displacement": round(displacement, 2),
            "displacement_velocity": round(displacement_velocity, 3),
            "vibration_rms": round(filtered_vibration, 3),
            "crack_event": 1.0 if crack_detected else 0.0,
            "spatial_deviation": round(spatial_deviation, 3)
        }

feature_extractor = FeatureExtractor()
