from typing import Dict, Any, List, Optional
import math
from app.core.config import settings

class RiskScorer:
    """
    Stage 5 & 6: Explainable Risk Scoring Model & Risk Classification.
    Combines multi-modal geotechnical features into an explainable 0-100 Risk Score.
    """
    DISCLAIMER = (
        "Prototype / Simulated Sensor Data. AI-assisted anomaly detection and decision support. "
        "Geotechnical validation and mine safety officer review required prior to field actions."
    )

    @classmethod
    def calculate_node_risk(
        cls,
        features: Dict[str, float],
        anomaly_score: float
    ) -> Dict[str, Any]:
        resultant_tilt = features.get("resultant_tilt", 0.0)
        disp_velocity = features.get("displacement_velocity", 0.0)
        displacement = features.get("displacement", 0.0)
        vibration_rms = features.get("vibration_rms", 0.0)
        spatial_deviation = features.get("spatial_deviation", 0.0)
        crack_event = features.get("crack_event", 0.0)

        # 1. Tilt Risk Component (0 - 100)
        # Normal < 0.5 deg, Warning 0.5 - 2.0 deg, Critical > 4.0 deg
        tilt_score = min(100.0, (resultant_tilt / 4.5) * 100.0)

        # 2. Displacement Velocity & Magnitude Component (0 - 100)
        # Normal < 5 mm/min, High > 25 mm/min; or absolute disp > 30 mm
        disp_score = min(100.0, max(
            (disp_velocity / 20.0) * 80.0,
            (displacement / 40.0) * 100.0
        ))

        # 3. Vibration Anomaly Component (0 - 100)
        # Normal < 2 mm/s, High > 8 mm/s
        vib_score = min(100.0, (vibration_rms / 10.0) * 100.0)

        # 4. Spatial Correlation Component (0 - 100)
        # Deviation from neighbors > 1.5 deg signals differential subsidence
        spatial_score = min(100.0, (spatial_deviation / 2.0) * 100.0)

        # 5. Crack Pin Trigger Component (0 or 100)
        crack_score = 100.0 if crack_event > 0.5 else 0.0

        # Weighted Composition
        w_tilt = 0.25
        w_disp = 0.35
        w_vib = 0.15
        w_spatial = 0.15
        w_crack = 0.10

        composite_score = (
            (tilt_score * w_tilt) +
            (disp_score * w_disp) +
            (vib_score * w_vib) +
            (spatial_score * w_spatial) +
            (crack_score * w_crack)
        )

        # Blend with AI Isolation Forest anomaly score for non-linear outlier detection
        final_risk_score = round(min(100.0, max(0.0, (composite_score * 0.7) + (anomaly_score * 100.0 * 0.3))), 1)

        # Relative factor contributions (percentage breakdown)
        total_raw_points = (tilt_score * w_tilt) + (disp_score * w_disp) + (vib_score * w_vib) + (spatial_score * w_spatial) + (crack_score * w_crack)
        if total_raw_points > 0:
            pct_tilt = round(((tilt_score * w_tilt) / total_raw_points) * 100, 1)
            pct_disp = round(((disp_score * w_disp) / total_raw_points) * 100, 1)
            pct_vib = round(((vib_score * w_vib) / total_raw_points) * 100, 1)
            pct_spatial = round(((spatial_score * w_spatial) / total_raw_points) * 100, 1)
        else:
            pct_tilt = 25.0
            pct_disp = 35.0
            pct_vib = 20.0
            pct_spatial = 20.0

        # Classification
        if final_risk_score <= settings.THRESHOLD_NORMAL:
            classification = "NORMAL"
        elif final_risk_score <= settings.THRESHOLD_WARNING:
            classification = "WARNING"
        elif final_risk_score <= settings.THRESHOLD_HIGH:
            classification = "HIGH"
        else:
            classification = "CRITICAL"

        # Generate Explainable Geotechnical Rationale
        reasons = []
        if pct_disp > 30 and displacement > 10.0:
            reasons.append(f"Accelerating vertical displacement (+{displacement:.1f} mm)")
        if pct_tilt > 20 and resultant_tilt > 1.0:
            reasons.append(f"Differential surface tilt angle (+{resultant_tilt:.2f}°)")
        if crack_event > 0.5:
            reasons.append("Tension crack initiation sensor triggered")
        if pct_vib > 20 and vibration_rms > 3.0:
            reasons.append(f"Elevated micro-seismic acoustic/vibration ({vibration_rms:.1f} mm/s RMS)")
        if pct_spatial > 20:
            reasons.append(f"Spatial gradient divergence from adjacent cluster ({spatial_deviation:.2f}°)")

        explanation = "; ".join(reasons) if reasons else "Ground movements within baseline equilibrium tolerance."

        return {
            "risk_score": final_risk_score,
            "risk_classification": classification,
            "tilt_factor": pct_tilt,
            "displacement_factor": pct_disp,
            "vibration_factor": pct_vib,
            "spatial_correlation_factor": pct_spatial,
            "explanation": explanation,
            "scientific_disclaimer": cls.DISCLAIMER
        }

risk_scorer = RiskScorer()
