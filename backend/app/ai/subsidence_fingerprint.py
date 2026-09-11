from typing import Dict, Any, List, Optional

class SubsidenceFingerprintEngine:
    """
    Stage 7: Multi-Parameter Subsidence Fingerprint Engine
    Synthesizes multi-sensor kinematic signals into discrete explainable fingerprint states:
    1. STABLE
    2. EARLY_DEFORMATION
    3. PROGRESSIVE_SUBSIDENCE
    4. ACCELERATING_SUBSIDENCE
    5. CRITICAL_DEFORMATION

    Evaluates combinations of physical phenomena (tilt trend, displacement velocity,
    vibration anomaly, crack wire status, spatial correlation, and ML probabilities)
    rather than single isolated thresholds.
    """

    STATES = [
        "STABLE",
        "EARLY_DEFORMATION",
        "PROGRESSIVE_SUBSIDENCE",
        "ACCELERATING_SUBSIDENCE",
        "CRITICAL_DEFORMATION"
    ]

    @classmethod
    def evaluate_fingerprint(
        cls,
        features: Dict[str, float],
        anomaly_score: float,
        ml_prediction: Dict[str, Any],
        kinematic_progression: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        resultant_tilt = float(features.get("resultant_tilt", 0.0))
        tilt_rate = float(features.get("tilt_rate", 0.0))
        displacement = float(features.get("displacement", 0.0))
        disp_velocity = float(features.get("displacement_velocity", 0.0))
        vibration_rms = float(features.get("vibration_rms", 0.0))
        spatial_dev = float(features.get("spatial_deviation", 0.0))
        crack_event = float(features.get("crack_event", 0.0)) > 0.5

        probs = ml_prediction.get("probabilities", {})
        p_crit = probs.get("CRITICAL", 0.0)
        p_high = probs.get("HIGH", 0.0)
        p_warn = probs.get("WARNING", 0.0)

        velocity_mm_day = kinematic_progression.get("velocity_mm_day", 0.0) if kinematic_progression else disp_velocity * 24.0

        # Determine individual contributing physical signals
        signals = []
        signal_details = []

        if displacement > 5.0 or disp_velocity > 0.5:
            signals.append("Increasing surface displacement")
            signal_details.append(f"Vertical movement at {displacement:.1f} mm")

        if tilt_rate > 0.03 or resultant_tilt > 1.2:
            signals.append("Rising differential tilt rate")
            signal_details.append(f"Resultant tilt {resultant_tilt:.2f}° (rate {tilt_rate:.3f}°/min)")

        if vibration_rms > 2.5:
            signals.append("Micro-seismic vibration anomaly")
            signal_details.append(f"Elevated stratum acoustic energy ({vibration_rms:.1f} mm/s RMS)")

        if spatial_dev > 0.6:
            signals.append("Spatial gradient divergence from adjacent cluster")
            signal_details.append(f"Differential cluster settlement (Δ {spatial_dev:.2f}°)")

        if crack_event:
            signals.append("Surface tension crack continuity loss")
            signal_details.append("Crack detection pull-wire circuit severed")

        if anomaly_score > 0.50:
            signals.append("Multi-parameter statistical outlier detected")
            signal_details.append(f"Isolation Forest outlier score: {anomaly_score:.2f}")

        if p_crit > 0.30 or p_high > 0.50:
            signals.append("High ML subsidence risk probability")
            signal_details.append(f"Supervised model probability: {(p_crit + p_high)*100:.0f}%")

        # Determine composite fingerprint state
        # Priority logic:
        # CRITICAL_DEFORMATION: Crack event OR (disp > 35mm AND velocity > 10mm/day) OR p_crit > 0.60
        # ACCELERATING_SUBSIDENCE: disp > 20mm AND (disp_velocity > 3.0 OR vibration > 5.0) OR (p_crit > 0.30 OR p_high > 0.60)
        # PROGRESSIVE_SUBSIDENCE: disp > 8.0mm AND (tilt > 1.0 OR vibration > 2.0 OR spatial_dev > 0.5) OR p_high > 0.35 OR p_warn > 0.60
        # EARLY_DEFORMATION: disp > 3.0mm OR resultant_tilt > 0.6 OR anomaly_score > 0.35 OR p_warn > 0.30
        # STABLE: baseline

        if crack_event or (displacement >= 35.0 and velocity_mm_day >= 8.0) or p_crit >= 0.55:
            state = "CRITICAL_DEFORMATION"
            summary = "Imminent surface rupture / extreme tensile shear across depillaring perimeter."
            severity_index = 5
        elif (displacement >= 20.0 and velocity_mm_day >= 3.5) or p_high >= 0.50 or p_crit >= 0.25:
            state = "ACCELERATING_SUBSIDENCE"
            summary = "Accelerating vertical displacement with correlated micro-seismic acoustic emission."
            severity_index = 4
        elif (displacement >= 8.0 and (resultant_tilt >= 0.8 or vibration_rms >= 2.0 or spatial_dev >= 0.5)) or p_high >= 0.25 or p_warn >= 0.50:
            state = "PROGRESSIVE_SUBSIDENCE"
            summary = "Progressive subsidence trough development with differential tilt and neighbor divergence."
            severity_index = 3
        elif displacement >= 3.0 or resultant_tilt >= 0.6 or anomaly_score >= 0.35 or p_warn >= 0.25:
            state = "EARLY_DEFORMATION"
            summary = "Initial elastic-inelastic transition observed; micro-strain starting to accumulate."
            severity_index = 2
        else:
            state = "STABLE"
            summary = "Quiescent strata equilibrium; all multi-sensor parameters within baseline tolerance."
            severity_index = 1

        return {
            "fingerprint_state": state,
            "severity_index": severity_index,
            "summary": summary,
            "contributing_signals": signals,
            "signal_details": signal_details,
            "signal_count": len(signals),
            "is_actionable": severity_index >= 3
        }

subsidence_fingerprint_engine = SubsidenceFingerprintEngine()
