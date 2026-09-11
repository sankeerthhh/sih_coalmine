from typing import Dict, Any, List, Optional
import math
from app.core.config import settings
from app.ai.ml_classifier import subsidence_classifier

class RiskScorer:
    """
    Stage 5 & 6: Transparent Risk Fusion Engine & Explainable Risk Classification.
    Synthesizes:
    1. Geotechnical Rule-Based Risk (60% weight) - resultant tilt, displacement, vibration, crack, spatial divergence
    2. Supervised ML Risk Prediction (25% weight) - Random Forest probability-weighted severity (0, 33, 66, 100)
    3. Unsupervised AI Anomaly Score (15% weight) - Isolation Forest multi-sensor statistical outlier score
    """
    DISCLAIMER = (
        "Prototype / Simulated Sensor Data. Transparent Multi-Model Risk Fusion "
        "(60% Geotechnical Heuristic + 25% Supervised ML + 15% Isolation Forest Anomaly). "
        "Geotechnical validation and mine safety officer review required prior to field actions."
    )

    @classmethod
    def calculate_node_risk(
        cls,
        features: Dict[str, float],
        anomaly_score: float,
        ml_prediction: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        resultant_tilt = features.get("resultant_tilt", 0.0)
        disp_velocity = features.get("displacement_velocity", 0.0)
        displacement = features.get("displacement", 0.0)
        vibration_rms = features.get("vibration_rms", 0.0)
        spatial_deviation = features.get("spatial_deviation", 0.0)
        crack_event = features.get("crack_event", 0.0)

        # 1. Tilt Risk Component (0 - 100)
        tilt_score = min(100.0, (resultant_tilt / 4.5) * 100.0)

        # 2. Displacement Velocity & Magnitude Component (0 - 100)
        disp_score = min(100.0, max(
            (disp_velocity / 20.0) * 80.0,
            (displacement / 40.0) * 100.0
        ))

        # 3. Vibration Anomaly Component (0 - 100)
        vib_score = min(100.0, (vibration_rms / 10.0) * 100.0)

        # 4. Spatial Correlation Component (0 - 100)
        spatial_score = min(100.0, (spatial_deviation / 2.0) * 100.0)

        # 5. Crack Pin Trigger Component (0 or 100)
        crack_score = 100.0 if crack_event > 0.5 else 0.0

        # Geotechnical Heuristic Weights
        w_tilt = 0.25
        w_disp = 0.35
        w_vib = 0.15
        w_spatial = 0.15
        w_crack = 0.10

        geotechnical_score = (
            (tilt_score * w_tilt) +
            (disp_score * w_disp) +
            (vib_score * w_vib) +
            (spatial_score * w_spatial) +
            (crack_score * w_crack)
        )

        # Obtain Supervised ML prediction if not supplied
        if ml_prediction is None:
            ml_prediction = subsidence_classifier.predict_risk(features)

        ml_weighted_severity = float(ml_prediction.get("weighted_severity", 0.0))
        anomaly_component = float(anomaly_score * 100.0)

        # --- Transparent Normalized Risk Fusion Formula ---
        # 60% Geotechnical Rule-Based Risk
        # 25% Supervised Random Forest Probability-Weighted Severity
        # 15% Isolation Forest Anomaly Score
        fused_risk_score = (
            (0.60 * geotechnical_score) +
            (0.25 * ml_weighted_severity) +
            (0.15 * anomaly_component)
        )
        final_risk_score = round(min(100.0, max(0.0, fused_risk_score)), 1)

        # Factor contributions (percentage breakdown of total geotechnical points)
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

        # Classification based on fused score
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
        if pct_disp > 30 and displacement > 8.0:
            reasons.append(f"Accelerating vertical displacement (+{displacement:.1f} mm)")
        if pct_tilt > 20 and resultant_tilt > 1.0:
            reasons.append(f"Differential surface tilt angle (+{resultant_tilt:.2f}°)")
        if crack_event > 0.5:
            reasons.append("Tension crack initiation sensor triggered")
        if pct_vib > 20 and vibration_rms > 2.5:
            reasons.append(f"Elevated micro-seismic acoustic/vibration ({vibration_rms:.1f} mm/s RMS)")
        if pct_spatial > 20 and spatial_deviation > 0.5:
            reasons.append(f"Spatial gradient divergence from adjacent cluster ({spatial_deviation:.2f}°)")

        if ml_prediction.get("predicted_class") in ["HIGH", "CRITICAL"]:
            reasons.append(f"Supervised ML predicts {ml_prediction['predicted_class']} risk ({ml_prediction['confidence']*100:.0f}% confidence)")

        explanation = "; ".join(reasons) if reasons else "Ground movements within baseline equilibrium tolerance."

        return {
            "risk_score": final_risk_score,
            "geotechnical_heuristic_score": round(geotechnical_score, 1),
            "ml_severity_score": ml_weighted_severity,
            "anomaly_score_component": round(anomaly_component, 1),
            "risk_classification": classification,
            "tilt_factor": pct_tilt,
            "displacement_factor": pct_disp,
            "vibration_factor": pct_vib,
            "spatial_correlation_factor": pct_spatial,
            "fusion_weights": {"geotechnical": 0.60, "supervised_ml": 0.25, "anomaly_forest": 0.15},
            "ml_prediction": ml_prediction,
            "explanation": explanation,
            "scientific_disclaimer": cls.DISCLAIMER
        }

risk_scorer = RiskScorer()
