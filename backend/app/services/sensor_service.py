import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

logger = logging.getLogger("subsidence.sensor_service")

from app.models.sensor import SensorNode
from app.models.reading import SensorReading
from app.models.risk_assessment import RiskAssessment
from app.models.panel import Panel
from app.schemas.sensor import SensorReadingCreate
from app.ai.validation import SensorValidator
from app.ai.feature_extraction import feature_extractor
from app.ai.anomaly_detector import anomaly_detector
from app.ai.ml_classifier import subsidence_classifier
from app.ai.risk_scorer import risk_scorer
from app.ai.subsidence_fingerprint import subsidence_fingerprint_engine
from app.ai.early_warning_engine import early_warning_engine
from app.services.alert_service import alert_service
from app.websocket.connection_manager import connection_manager

class SensorService:
    @staticmethod
    async def process_telemetry(db: Session, data: SensorReadingCreate, source: str = "SIMULATION") -> Dict[str, Any]:
        node = db.query(SensorNode).filter(SensorNode.id == data.node_id).first()
        if not node:
            raise ValueError(f"Sensor node {data.node_id} does not exist in registry.")

        # Get previous reading for rate of change calculation
        prev_reading = (
            db.query(SensorReading)
            .filter(SensorReading.node_id == data.node_id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        prev_disp = prev_reading.displacement if prev_reading else None

        # Stage 1: Validation
        is_valid, error_msg = SensorValidator.validate_reading(
            tilt_x=data.tilt_x,
            tilt_y=data.tilt_y,
            displacement=data.displacement,
            vibration=data.vibration,
            battery_level=data.battery_level,
            previous_displacement=prev_disp
        )
        if not is_valid:
            raise ValueError(f"Sensor validation failure: {error_msg}")

        timestamp = data.timestamp or datetime.now(timezone.utc)
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)

        # Query neighbor tilts within the same panel for spatial correlation
        neighbor_nodes = (
            db.query(SensorNode.id)
            .filter(SensorNode.panel_id == node.panel_id, SensorNode.id != node.id)
            .all()
        )
        neighbor_ids = [n[0] for n in neighbor_nodes]
        neighbor_tilts = []
        if neighbor_ids:
            from sqlalchemy import func
            subq = (
                db.query(
                    SensorReading.node_id,
                    func.max(SensorReading.id).label("max_id")
                )
                .filter(SensorReading.node_id.in_(neighbor_ids))
                .group_by(SensorReading.node_id)
                .subquery()
            )
            latest_readings = (
                db.query(SensorReading.tilt_x, SensorReading.tilt_y)
                .join(subq, SensorReading.id == subq.c.max_id)
                .all()
            )
            for r in latest_readings:
                neighbor_tilts.append((r[0]**2 + r[1]**2)**0.5)

        # Stage 2 & 3: Noise Filtering & Feature Extraction
        features = feature_extractor.extract_node_features(
            node_id=data.node_id,
            timestamp=timestamp,
            tilt_x=data.tilt_x,
            tilt_y=data.tilt_y,
            displacement=data.displacement,
            vibration=data.vibration,
            crack_detected=data.crack_detected,
            neighbor_tilts=neighbor_tilts
        )

        # Stage 4: AI Anomaly Detection (Isolation Forest)
        anomaly_result = anomaly_detector.detect_anomaly(features)

        # Stage 5: Supervised ML Risk Classification (Random Forest)
        ml_result = subsidence_classifier.predict_risk(features)

        # Stage 6: Transparent Risk Fusion Engine (60% Geotechnical + 25% Supervised ML + 15% Anomaly)
        risk_result = risk_scorer.calculate_node_risk(
            features=features,
            anomaly_score=anomaly_result["anomaly_score"],
            ml_prediction=ml_result
        )

        # Stage 7: Subsidence Fingerprint Engine
        fingerprint_result = subsidence_fingerprint_engine.evaluate_fingerprint(
            features=features,
            anomaly_score=anomaly_result["anomaly_score"],
            ml_prediction=ml_result
        )

        # Stage 8: Early Warning Evaluation
        early_warning_result = early_warning_engine.evaluate_early_warning(
            panel_id=node.panel_id,
            fused_risk=risk_result,
            fingerprint=fingerprint_result,
            ml_prediction=ml_result,
            features=features,
            node_id=node.id
        )

        # Save Reading to Database
        reading = SensorReading(
            node_id=data.node_id,
            timestamp=timestamp,
            tilt_x=data.tilt_x,
            tilt_y=data.tilt_y,
            displacement=data.displacement,
            vibration=data.vibration,
            crack_detected=data.crack_detected,
            battery_level=data.battery_level,
            signal_strength=data.signal_strength,
            anomaly_score=anomaly_result["anomaly_score"],
            is_outlier=anomaly_result["is_outlier"]
        )
        db.add(reading)

        # Update Sensor Node status & metadata
        node.battery_level = data.battery_level
        node.signal_strength_rssi = data.signal_strength
        node.last_seen_at = timestamp
        
        # Determine node operational status
        classification = risk_result["risk_classification"]
        if classification == "CRITICAL":
            node.status = "CRITICAL"
        elif classification in ["WARNING", "HIGH"]:
            node.status = "WARNING"
        else:
            node.status = "ONLINE"

        # Update panel status and save Risk Assessment
        panel = db.query(Panel).filter(Panel.id == node.panel_id).first()
        if panel:
            panel.risk_level = classification

        assessment = RiskAssessment(
            panel_id=node.panel_id,
            timestamp=timestamp,
            risk_score=risk_result["risk_score"],
            risk_classification=classification,
            primary_contributing_node_id=node.id,
            tilt_factor=risk_result["tilt_factor"],
            displacement_factor=risk_result["displacement_factor"],
            vibration_factor=risk_result["vibration_factor"],
            spatial_correlation_factor=risk_result["spatial_correlation_factor"],
            explanation=risk_result["explanation"]
        )
        try:
            db.add(assessment)
            db.commit()
            db.refresh(reading)
            db.refresh(node)
        except Exception:
            db.rollback()
            raise

        # Generate alert if abnormal condition
        alert_obj = None
        if classification in ["WARNING", "HIGH", "CRITICAL"] or data.crack_detected:
            cluster_name = f"Cluster {node.id} & adjacent nodes ({node.panel_id})"
            condition = (
                f"Abnormal ground deformation: tilt {features['resultant_tilt']}°, "
                f"displacement {data.displacement:.1f}mm"
            )
            if data.crack_detected:
                condition += " [Crack wire severed]"

            severity = "CRITICAL" if (classification == "CRITICAL" or data.crack_detected) else "WARNING"
            action = (
                "Immediate geotechnical field inspection recommended. Restrict heavy equipment movement."
                if severity == "CRITICAL"
                else "Increase telemetry sampling frequency and monitor adjacent sensor array."
            )

            alert_obj = alert_service.create_or_update_alert(
                db=db,
                panel_id=node.panel_id,
                node_cluster=cluster_name,
                title=f"Subsidence Anomaly Detected ({severity})",
                condition_detected=condition,
                severity=severity,
                ai_risk_score=risk_result["risk_score"],
                measured_tilt=features["resultant_tilt"],
                measured_displacement=data.displacement,
                crack_detected=data.crack_detected,
                recommended_action=action
            )

            if severity == "CRITICAL" and alert_obj:
                try:
                    from app.services.notification_service import notification_service
                    notification_service.dispatch_critical_warning(
                        panel_id=node.panel_id,
                        title=f"AUTOMATED SUBSIDENCE EARLY WARNING: {node.panel_id}",
                        measured_displacement=data.displacement,
                        measured_tilt=features["resultant_tilt"],
                        crack_detected=data.crack_detected,
                        hours_to_breach=14.0,
                        recommended_action=action,
                        alert_id=alert_obj.id
                    )
                except Exception as notif_err:
                    logger.warning(f"Automated notification dispatch skipped or failed: {notif_err}")

        # Broadcast via WebSocket to all dashboard clients
        ws_payload = {
            "type": "SENSOR_TELEMETRY_UPDATE",
            "data": {
                "reading": {
                    "id": reading.id,
                    "node_id": node.id,
                    "panel_id": node.panel_id,
                    "timestamp": timestamp.isoformat(),
                    "tilt_x": data.tilt_x,
                    "tilt_y": data.tilt_y,
                    "resultant_tilt": features["resultant_tilt"],
                    "displacement": data.displacement,
                    "vibration": data.vibration,
                    "crack_detected": data.crack_detected,
                    "battery_level": data.battery_level,
                    "signal_strength": data.signal_strength,
                    "status": node.status,
                    "anomaly_score": anomaly_result["anomaly_score"],
                    "source": source
                },
                "risk": {
                    "panel_id": node.panel_id,
                    "risk_score": risk_result["risk_score"],
                    "geotechnical_score": risk_result["geotechnical_heuristic_score"],
                    "ml_severity_score": risk_result["ml_severity_score"],
                    "risk_classification": classification,
                    "explanation": risk_result["explanation"],
                    "fusion_weights": risk_result["fusion_weights"],
                    "factors": {
                        "tilt": risk_result["tilt_factor"],
                        "displacement": risk_result["displacement_factor"],
                        "vibration": risk_result["vibration_factor"],
                        "spatial": risk_result["spatial_correlation_factor"]
                    },
                    "ml_prediction": {
                        "predicted_class": ml_result["predicted_class"],
                        "confidence": ml_result["confidence"],
                        "probabilities": ml_result["probabilities"],
                        "model_type": ml_result["model_type"]
                    },
                    "fingerprint": {
                        "state": fingerprint_result["fingerprint_state"],
                        "summary": fingerprint_result["summary"],
                        "signals": fingerprint_result["contributing_signals"],
                        "severity_index": fingerprint_result["severity_index"]
                    },
                    "early_warning": {
                        "level": early_warning_result["warning_level"],
                        "urgency": early_warning_result["urgency"],
                        "action": early_warning_result["recommended_action"]
                    }
                },
                "alert": {
                    "id": alert_obj.id,
                    "severity": alert_obj.severity,
                    "title": alert_obj.title,
                    "status": alert_obj.status
                } if alert_obj else None
            }
        }
        await connection_manager.broadcast(ws_payload)

        return {
            "reading_id": reading.id,
            "status": "PROCESSED",
            "source": source,
            "risk_score": risk_result["risk_score"],
            "classification": classification,
            "ml_predicted_class": ml_result["predicted_class"],
            "fingerprint_state": fingerprint_result["fingerprint_state"],
            "warning_level": early_warning_result["warning_level"],
            "alert_id": alert_obj.id if alert_obj else None
        }

sensor_service = SensorService()
