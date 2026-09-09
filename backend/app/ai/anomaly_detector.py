import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    """
    Stage 4: AI Anomaly Detection using Isolation Forest and Statistical Distance.
    Flags unusual multi-sensor combinations (e.g. rising tilt with displacement spike).
    """
    def __init__(self):
        self.model = None

    def _ensure_model(self):
        if self.model is None:
            # Baseline normal surface strata parameters (tilt ~0-0.5 deg, disp ~0-2mm, vib ~0.2-1.5 mm/s)
            np.random.seed(42)
            normal_samples = np.column_stack([
                np.random.normal(loc=0.3, scale=0.15, size=500), # resultant_tilt
                np.random.normal(loc=0.01, scale=0.01, size=500),# tilt_rate
                np.random.normal(loc=1.5, scale=0.5, size=500),  # displacement
                np.random.normal(loc=0.02, scale=0.02, size=500),# disp_velocity
                np.random.normal(loc=0.8, scale=0.3, size=500),  # vibration
                np.random.normal(loc=0.1, scale=0.08, size=500)  # spatial_deviation
            ])
            
            self.model = IsolationForest(
                n_estimators=100,
                contamination=0.05,
                random_state=42
            )
            self.model.fit(normal_samples)

    def detect_anomaly(self, features: Dict[str, float]) -> Dict[str, Any]:
        self._ensure_model()
        vector = np.array([[
            features.get("resultant_tilt", 0.0),
            features.get("tilt_rate", 0.0),
            features.get("displacement", 0.0),
            features.get("displacement_velocity", 0.0),
            features.get("vibration_rms", 0.0),
            features.get("spatial_deviation", 0.0)
        ]])

        # Decision function: lower values mean more anomalous
        score_raw = self.model.decision_function(vector)[0]
        prediction = self.model.predict(vector)[0] # -1 for outlier, 1 for inlier
        
        # Normalize score between 0.0 (perfectly normal) and 1.0 (extreme anomaly)
        # Decision function is typically between -0.3 and +0.3
        anomaly_score = float(np.clip(1.0 - ((score_raw + 0.3) / 0.6), 0.0, 1.0))
        
        is_outlier = (prediction == -1) or (anomaly_score > 0.65) or (features.get("crack_event", 0.0) == 1.0)
        
        return {
            "anomaly_score": round(anomaly_score, 3),
            "is_outlier": is_outlier,
            "raw_score": round(float(score_raw), 4)
        }

anomaly_detector = AnomalyDetector()
