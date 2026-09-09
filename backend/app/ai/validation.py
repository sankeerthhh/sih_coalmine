import math
from typing import Tuple, Optional, Dict, Any

class SensorValidator:
    """
    Stage 1: Sensor data validation and physical sanity checks.
    Rejects physically impossible readings or corrupt frames.
    """
    MIN_TILT = -45.0
    MAX_TILT = 45.0
    MAX_DISPLACEMENT_STEP = 150.0 # mm maximum plausible physical jump per sample
    MAX_VIBRATION = 60.0          # mm/s RMS
    MIN_BATTERY = 0.0
    MAX_BATTERY = 100.0

    @classmethod
    def validate_reading(
        cls, 
        tilt_x: float, 
        tilt_y: float, 
        displacement: float, 
        vibration: float, 
        battery_level: float,
        previous_displacement: Optional[float] = None
    ) -> Tuple[bool, Optional[str]]:
        if math.isnan(tilt_x) or math.isnan(tilt_y):
            return False, "Tilt values cannot be NaN"
        
        if not (cls.MIN_TILT <= tilt_x <= cls.MAX_TILT):
            return False, f"Tilt X {tilt_x} out of physical bounds [{cls.MIN_TILT}, {cls.MAX_TILT}]"
            
        if not (cls.MIN_TILT <= tilt_y <= cls.MAX_TILT):
            return False, f"Tilt Y {tilt_y} out of physical bounds [{cls.MIN_TILT}, {cls.MAX_TILT}]"

        if displacement < 0.0:
            return False, "Displacement cannot be negative"
            
        if previous_displacement is not None:
            step = abs(displacement - previous_displacement)
            if step > cls.MAX_DISPLACEMENT_STEP:
                return False, f"Displacement instantaneous jump ({step:.1f} mm) exceeds plausible geotechnical limits"

        if vibration < 0.0 or vibration > cls.MAX_VIBRATION:
            return False, f"Vibration {vibration} out of range [0, {cls.MAX_VIBRATION}]"

        if not (cls.MIN_BATTERY <= battery_level <= cls.MAX_BATTERY):
            return False, f"Battery {battery_level}% invalid"

        return True, None
