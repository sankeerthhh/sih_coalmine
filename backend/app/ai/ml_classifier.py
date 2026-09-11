import os
import numpy as np
from typing import Dict, Any, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier

class SubsidenceClassifier:
    """
    Supervised Machine Learning Subsidence Risk Classifier
    Trained on geotechnical multi-sensor features across coal extraction panels:
    - Resultant surface tilt (degrees)
    - Angular tilt rate (deg/min)
    - Vertical surface displacement (mm)
    - Displacement velocity (mm/min)
    - Micro-seismic vibration RMS (mm/s)
    - Spatial cluster divergence (degrees)
    - Tension crack event trigger (binary 0/1)

    Classifies into 4 discrete operational risk regimes:
    NORMAL, WARNING, HIGH, CRITICAL
    """
    CLASSES = ["NORMAL", "WARNING", "HIGH", "CRITICAL"]
    SEVERITY_WEIGHTS = {"NORMAL": 0.0, "WARNING": 33.3, "HIGH": 66.6, "CRITICAL": 100.0}

    DISCLAIMER = (
        "Prototype ML Model — Trained on Simulated/Labeled Data. "
        "Field geotechnical calibration required before operational mine deployment."
    )

    def __init__(self):
        self.model: Optional[RandomForestClassifier] = None
        self.feature_names = [
            "resultant_tilt",
            "tilt_rate",
            "displacement",
            "displacement_velocity",
            "vibration_rms",
            "spatial_deviation",
            "crack_event"
        ]

    def _generate_synthetic_training_dataset(self, n_samples_per_class: int = 300) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generates a physically sensible synthetic dataset modeled after underground
        coal mining subsidence dynamics (elastic deformation, inelastic creep, shear failure, and rupture).
        Includes realistic sensor noise and boundary overlap.
        """
        np.random.seed(42)
        X_list = []
        y_list = []

        # 1. NORMAL Class (Elastic equilibrium)
        n = n_samples_per_class
        tilt_norm = np.clip(np.random.normal(0.25, 0.12, n), 0.0, 0.7)
        tilt_rate_norm = np.clip(np.random.normal(0.005, 0.004, n), 0.0, 0.025)
        disp_norm = np.clip(np.random.normal(1.8, 0.7, n), 0.1, 4.5)
        disp_vel_norm = np.clip(np.random.normal(0.08, 0.06, n), 0.0, 0.4)
        vib_norm = np.clip(np.random.normal(0.6, 0.25, n), 0.1, 1.6)
        spatial_norm = np.clip(np.random.normal(0.12, 0.08, n), 0.0, 0.4)
        crack_norm = np.zeros(n)
        X_norm = np.column_stack([tilt_norm, tilt_rate_norm, disp_norm, disp_vel_norm, vib_norm, spatial_norm, crack_norm])
        X_list.append(X_norm)
        y_list.extend([0] * n)

        # 2. WARNING Class (Developing inelastic creep / differential settlement)
        tilt_warn = np.clip(np.random.normal(1.1, 0.35, n), 0.5, 2.2)
        tilt_rate_warn = np.clip(np.random.normal(0.06, 0.03, n), 0.015, 0.15)
        disp_warn = np.clip(np.random.normal(12.0, 3.5, n), 4.0, 22.0)
        disp_vel_warn = np.clip(np.random.normal(1.0, 0.45, n), 0.25, 2.6)
        vib_warn = np.clip(np.random.normal(2.6, 0.8, n), 1.2, 4.8)
        spatial_warn = np.clip(np.random.normal(0.75, 0.25, n), 0.25, 1.6)
        crack_warn = np.random.choice([0.0, 1.0], size=n, p=[0.97, 0.03])
        X_warn = np.column_stack([tilt_warn, tilt_rate_warn, disp_warn, disp_vel_warn, vib_warn, spatial_warn, crack_warn])
        X_list.append(X_warn)
        y_list.extend([1] * n)

        # 3. HIGH Class (Progressive subsidence trough & tensile stress concentration)
        tilt_high = np.clip(np.random.normal(2.6, 0.55, n), 1.6, 3.8)
        tilt_rate_high = np.clip(np.random.normal(0.18, 0.06, n), 0.08, 0.38)
        disp_high = np.clip(np.random.normal(28.0, 5.5, n), 16.0, 42.0)
        disp_vel_high = np.clip(np.random.normal(4.5, 1.4, n), 1.8, 8.5)
        vib_high = np.clip(np.random.normal(6.2, 1.5, n), 3.2, 10.0)
        spatial_high = np.clip(np.random.normal(1.6, 0.45, n), 0.8, 2.8)
        crack_high = np.random.choice([0.0, 1.0], size=n, p=[0.75, 0.25])
        X_high = np.column_stack([tilt_high, tilt_rate_high, disp_high, disp_vel_high, vib_high, spatial_high, crack_high])
        X_list.append(X_high)
        y_list.extend([2] * n)

        # 4. CRITICAL Class (Imminent surface collapse / tension crack rupture)
        tilt_crit = np.clip(np.random.normal(4.2, 0.8, n), 2.8, 7.5)
        tilt_rate_crit = np.clip(np.random.normal(0.45, 0.15, n), 0.20, 1.2)
        disp_crit = np.clip(np.random.normal(48.0, 8.0, n), 30.0, 85.0)
        disp_vel_crit = np.clip(np.random.normal(12.0, 3.8, n), 5.5, 28.0)
        vib_crit = np.clip(np.random.normal(11.0, 2.8, n), 5.5, 20.0)
        spatial_crit = np.clip(np.random.normal(2.8, 0.7, n), 1.5, 5.0)
        crack_crit = np.random.choice([0.0, 1.0], size=n, p=[0.15, 0.85])
        X_crit = np.column_stack([tilt_crit, tilt_rate_crit, disp_crit, disp_vel_crit, vib_crit, spatial_crit, crack_crit])
        X_list.append(X_crit)
        y_list.extend([3] * n)

        X = np.vstack(X_list)
        y = np.array(y_list)
        return X, y

    def _ensure_model(self):
        if self.model is None:
            X, y = self._generate_synthetic_training_dataset(n_samples_per_class=350)
            self.model = RandomForestClassifier(
                n_estimators=120,
                max_depth=8,
                min_samples_split=4,
                class_weight="balanced",
                random_state=42
            )
            self.model.fit(X, y)

    def predict_risk(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Executes supervised classification and returns class, confidence,
        probability distribution, and probability-weighted severity score.
        """
        self._ensure_model()

        vector = np.array([[
            float(features.get("resultant_tilt", 0.0)),
            float(features.get("tilt_rate", 0.0)),
            float(features.get("displacement", 0.0)),
            float(features.get("displacement_velocity", 0.0)),
            float(features.get("vibration_rms", 0.0)),
            float(features.get("spatial_deviation", 0.0)),
            1.0 if features.get("crack_event", 0.0) > 0.5 else 0.0
        ]])

        probs = self.model.predict_proba(vector)[0]
        class_idx = int(np.argmax(probs))
        predicted_class = self.CLASSES[class_idx]
        confidence = float(probs[class_idx])

        # If crack event is triggered, enforce minimum HIGH/CRITICAL representation
        if features.get("crack_event", 0.0) > 0.5 and class_idx < 2:
            probs[3] += 0.35
            probs[2] += 0.25
            probs = probs / np.sum(probs)
            class_idx = int(np.argmax(probs))
            predicted_class = self.CLASSES[class_idx]
            confidence = float(probs[class_idx])

        prob_dict = {
            cls_name: round(float(probs[i]), 3)
            for i, cls_name in enumerate(self.CLASSES)
        }

        # Probability-weighted severity calculation (0.0 to 100.0)
        # NORMAL: 0, WARNING: 33.3, HIGH: 66.6, CRITICAL: 100.0
        weighted_severity = (
            (prob_dict["NORMAL"] * 0.0) +
            (prob_dict["WARNING"] * 33.33) +
            (prob_dict["HIGH"] * 66.67) +
            (prob_dict["CRITICAL"] * 100.0)
        )
        weighted_severity = round(float(np.clip(weighted_severity, 0.0, 100.0)), 1)

        # Feature importances
        importances = {}
        if hasattr(self.model, "feature_importances_"):
            for fname, imp in zip(self.feature_names, self.model.feature_importances_):
                importances[fname] = round(float(imp), 3)

        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 3),
            "probabilities": prob_dict,
            "weighted_severity": weighted_severity,
            "model_type": "Random Forest Classifier (Supervised)",
            "feature_importances": importances,
            "scientific_disclaimer": self.DISCLAIMER
        }

subsidence_classifier = SubsidenceClassifier()
