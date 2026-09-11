from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class EarlyWarningEngine:
    """
    Stage 9: Automated Geotechnical Early Warning Engine
    Evaluates fused risk scores, deformation velocities, supervised ML probabilities,
    and subsidence fingerprints to generate 5-tier early warnings:
    - NORMAL
    - WATCH
    - WARNING
    - HIGH RISK
    - CRITICAL
    """
    WARNING_LEVELS = ["NORMAL", "WATCH", "WARNING", "HIGH_RISK", "CRITICAL"]

    ACTION_PROTOCOLS = {
        "CRITICAL": (
            "CRITICAL EMERGENCY: Immediate cessation of all depillaring / extraction activities in {panel_id}. "
            "Activate surface perimeter sirens, initiate emergency SMS/Email broadcast to DGMS & Mine Safety Officers, "
            "and establish 200m exclusionary cordon around {zone_or_node}."
        ),
        "HIGH_RISK": (
            "HIGH RISK ADVISORY: Restrict heavy machinery and vehicular transport across {zone_or_node} surface sector. "
            "Deploy geotechnical rapid response inspection team with secondary electronic leveling monuments. "
            "Increase wireless mesh sampling rate to 2-second telemetry cycle."
        ),
        "WARNING": (
            "ELEVATED WARNING: Heighten continuous wireless surface mesh telemetry surveillance across {panel_id}. "
            "Verify link quality on adjacent repeater nodes and notify shift overman of emerging differential tilt trend."
        ),
        "WATCH": (
            "PRECAUTIONARY WATCH: Ground deformation within initial inelastic threshold. Continue automated telemetry "
            "sampling and cross-reference with underground seam advancement logs."
        ),
        "NORMAL": (
            "NORMAL EQUILIBRIUM: Standard continuous surface strata surveillance. All multi-sensor parameters "
            "within statutory DGMS equilibrium limits."
        )
    }

    @classmethod
    def evaluate_early_warning(
        cls,
        panel_id: str,
        fused_risk: Dict[str, Any],
        fingerprint: Dict[str, Any],
        ml_prediction: Dict[str, Any],
        features: Dict[str, float],
        node_id: Optional[str] = None,
        zone_id: Optional[str] = None
    ) -> Dict[str, Any]:
        risk_score = float(fused_risk.get("risk_score", 0.0))
        disp_velocity = float(features.get("displacement_velocity", 0.0))
        displacement = float(features.get("displacement", 0.0))
        crack_event = float(features.get("crack_event", 0.0)) > 0.5
        fp_state = fingerprint.get("fingerprint_state", "STABLE")
        probs = ml_prediction.get("probabilities", {})
        p_crit = float(probs.get("CRITICAL", 0.0))
        p_high = float(probs.get("HIGH", 0.0))

        # 5-Tier Early Warning Level Determination
        # 1. CRITICAL
        if crack_event or risk_score >= 80.0 or fp_state == "CRITICAL_DEFORMATION" or (displacement >= 40.0 and disp_velocity >= 5.0) or p_crit >= 0.50:
            level = "CRITICAL"
            color = "#DC2626"
            urgency = "IMMEDIATE_FIELD_ACTION"
        # 2. HIGH RISK
        elif risk_score >= 60.0 or fp_state == "ACCELERATING_SUBSIDENCE" or (displacement >= 20.0 and disp_velocity >= 2.0) or p_high >= 0.45:
            level = "HIGH_RISK"
            color = "#EA580C"
            urgency = "URGENT_INSPECTION"
        # 3. WARNING
        elif risk_score >= 35.0 or fp_state == "PROGRESSIVE_SUBSIDENCE" or displacement >= 8.0 or disp_velocity >= 0.8:
            level = "WARNING"
            color = "#F59E0B"
            urgency = "HEIGHTENED_MONITORING"
        # 4. WATCH
        elif risk_score >= 20.0 or fp_state == "EARLY_DEFORMATION" or displacement >= 3.0:
            level = "WATCH"
            color = "#3B82F6"
            urgency = "ROUTINE_OBSERVATION"
        # 5. NORMAL
        else:
            level = "NORMAL"
            color = "#16A34A"
            urgency = "SAFE"

        target_name = zone_id or f"Sensor Node {node_id}" if node_id else f"Panel {panel_id}"
        action_template = cls.ACTION_PROTOCOLS.get(level, cls.ACTION_PROTOCOLS["NORMAL"])
        action_text = action_template.format(
            panel_id=panel_id,
            zone_or_node=target_name
        )

        detected_signals = fingerprint.get("contributing_signals", [])

        return {
            "warning_level": level,
            "color_code": color,
            "urgency": urgency,
            "panel_id": panel_id,
            "target_entity": target_name,
            "fused_risk_score": risk_score,
            "ml_risk_class": ml_prediction.get("predicted_class", "NORMAL"),
            "ml_confidence_percent": round(float(ml_prediction.get("confidence", 0.0)) * 100, 1),
            "fingerprint_state": fp_state,
            "detected_signals": detected_signals,
            "recommended_action": action_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "origin": "System Autonomous ML/Geotechnical Logic (DGMS Circular Norms)"
        }

early_warning_engine = EarlyWarningEngine()
