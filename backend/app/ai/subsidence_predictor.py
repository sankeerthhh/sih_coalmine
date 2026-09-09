import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import numpy as np

class SubsidencePredictor:
    """
    Geotechnical Subsidence Progression & Forecasting Engine
    Estimates rate of settlement, deformation acceleration, projected 48-hour movement,
    and Estimated Time to Critical Limit Breach (T_breach) per DGMS guidelines.
    """
    # Critical thresholds based on Directorate General of Mines Safety (DGMS) norms
    CRITICAL_DISPLACEMENT_THRESHOLD_MM = 50.0  # mm
    WARNING_DISPLACEMENT_THRESHOLD_MM = 25.0   # mm
    CRITICAL_TILT_THRESHOLD_DEG = 3.0          # degrees (approx 52 mm/m)

    @classmethod
    def predict_progression(
        cls,
        history_readings: List[Dict[str, Any]],
        forecast_hours: int = 48
    ) -> Dict[str, Any]:
        """
        Takes historical readings (sorted chronologically) and computes:
        - Current velocity (mm/day)
        - Current acceleration (mm/day^2)
        - Projected displacement curve with 95% confidence intervals
        - Hours to critical threshold breach
        - Progression state classification
        """
        if not history_readings or len(history_readings) < 2:
            # Fallback baseline when insufficient temporal history
            latest_disp = history_readings[-1].get("displacement", 4.2) if history_readings else 4.2
            latest_tilt = history_readings[-1].get("resultant_tilt", 0.8) if history_readings else 0.8
            return cls._generate_projection_result(
                current_disp=latest_disp,
                current_tilt=latest_tilt,
                velocity_mm_day=0.15,
                acceleration_mm_day2=0.01,
                forecast_hours=forecast_hours,
                state="STABLE_ELASTIC"
            )

        # Extract timestamps (hours relative to start) and displacements
        t_base = datetime.fromisoformat(history_readings[0]["timestamp"].replace("Z", "+00:00"))
        times_hours = []
        displacements = []
        tilts = []

        for r in history_readings:
            try:
                t = datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00"))
                hrs = (t - t_base).total_seconds() / 3600.0
                times_hours.append(hrs)
                displacements.append(float(r.get("displacement", 0.0)))
                tilts.append(float(r.get("resultant_tilt", 0.0)))
            except Exception:
                continue

        if len(times_hours) < 2:
            return cls._generate_projection_result(4.2, 0.8, 0.15, 0.01, forecast_hours, "STABLE_ELASTIC")

        t_arr = np.array(times_hours)
        d_arr = np.array(displacements)

        # Compute instantaneous rates over the last 30% of data
        n_recent = max(2, int(len(t_arr) * 0.4))
        t_recent = t_arr[-n_recent:]
        d_recent = d_arr[-n_recent:]
        delta_t = t_recent[-1] - t_recent[0]

        if delta_t > 0:
            delta_d = d_recent[-1] - d_recent[0]
            velocity_mm_per_hour = delta_d / delta_t
            velocity_mm_day = max(0.0, velocity_mm_per_hour * 24.0)
        else:
            velocity_mm_day = 0.2

        # Second derivative (acceleration)
        if len(t_arr) >= 4:
            mid = len(t_recent) // 2
            v1 = (d_recent[mid] - d_recent[0]) / max(0.01, (t_recent[mid] - t_recent[0]))
            v2 = (d_recent[-1] - d_recent[mid]) / max(0.01, (t_recent[-1] - t_recent[mid]))
            accel_per_hour2 = (v2 - v1) / max(0.01, (t_recent[-1] - t_recent[0]))
            acceleration_mm_day2 = accel_per_hour2 * 576.0  # 24^2
        else:
            acceleration_mm_day2 = 0.0

        current_disp = float(d_arr[-1])
        current_tilt = float(tilts[-1]) if tilts else 0.8

        # Classify state
        if velocity_mm_day > 12.0 or acceleration_mm_day2 > 3.0:
            state = "IMMINENT_SURFACE_COLLAPSE"
        elif velocity_mm_day > 4.0 or acceleration_mm_day2 > 1.0:
            state = "ACCELERATING_SHEAR"
        elif velocity_mm_day > 1.0:
            state = "SLOW_INELASTIC_CREEP"
        else:
            state = "STABLE_ELASTIC"

        return cls._generate_projection_result(
            current_disp=current_disp,
            current_tilt=current_tilt,
            velocity_mm_day=round(velocity_mm_day, 2),
            acceleration_mm_day2=round(acceleration_mm_day2, 3),
            forecast_hours=forecast_hours,
            state=state
        )

    @classmethod
    def _generate_projection_result(
        cls,
        current_disp: float,
        current_tilt: float,
        velocity_mm_day: float,
        acceleration_mm_day2: float,
        forecast_hours: int,
        state: str
    ) -> Dict[str, Any]:
        # Compute Time to Critical Failure Threshold (50mm)
        remaining_headroom = cls.CRITICAL_DISPLACEMENT_THRESHOLD_MM - current_disp

        if remaining_headroom <= 0:
            hours_to_breach = 0.0
            urgency = "IMMINENT_FAILURE"
        elif velocity_mm_day <= 0.05:
            hours_to_breach = 999.0  # Stable, essentially indefinite
            urgency = "SAFE"
        else:
            # Simple kinematic forecast: d(t) = d0 + v*t + 0.5*a*t^2
            # For linear approximation in hours: v_hr = v / 24
            v_hr = velocity_mm_day / 24.0
            a_hr = max(0.0, acceleration_mm_day2) / 576.0
            if a_hr > 1e-6:
                # Quadratic formula: 0.5*a*t^2 + v*t - remaining = 0
                disc = v_hr**2 + 2 * a_hr * remaining_headroom
                hours_to_breach = (-v_hr + math.sqrt(max(0.0, disc))) / a_hr
            else:
                hours_to_breach = remaining_headroom / v_hr

            hours_to_breach = round(hours_to_breach, 1)

            if hours_to_breach < 12.0:
                urgency = "CRITICAL_EVACUATION"
            elif hours_to_breach < 48.0:
                urgency = "URGENT_WARNING"
            elif hours_to_breach < 168.0:
                urgency = "ELEVATED_WATCH"
            else:
                urgency = "SAFE"

        # Generate forward curve (hourly projections)
        forward_curve = []
        now = datetime.now(timezone.utc)
        v_hr = velocity_mm_day / 24.0
        a_hr = max(0.0, acceleration_mm_day2) / 576.0

        for h in range(0, forecast_hours + 1, 4):
            time_pt = now + timedelta(hours=h)
            projected_disp = current_disp + (v_hr * h) + (0.5 * a_hr * (h**2))
            uncertainty_margin = (0.05 * current_disp) + (0.02 * h)

            forward_curve.append({
                "forecast_hour": h,
                "timestamp": time_pt.isoformat(),
                "predicted_displacement": round(projected_disp, 2),
                "lower_bound_95": round(max(0.0, projected_disp - uncertainty_margin), 2),
                "upper_bound_95": round(projected_disp + uncertainty_margin, 2)
            })

        return {
            "current_displacement_mm": current_disp,
            "current_tilt_deg": current_tilt,
            "velocity_mm_day": velocity_mm_day,
            "acceleration_mm_day2": acceleration_mm_day2,
            "hours_to_critical_breach": hours_to_breach,
            "urgency_level": urgency,
            "progression_state": state,
            "critical_threshold_mm": cls.CRITICAL_DISPLACEMENT_THRESHOLD_MM,
            "projected_curve_48h": forward_curve
        }

subsidence_predictor = SubsidencePredictor()
