from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.models.sensor import SensorNode
from app.models.reading import SensorReading
from app.models.risk_assessment import RiskAssessment
from app.models.panel import Panel
from app.schemas.sensor import SensorReadingCreate
from app.ai.validation import SensorValidator
from app.ai.feature_extraction import feature_extractor
from app.ai.anomaly_detector import anomaly_detector
from app.ai.risk_scorer import risk_scorer
from app.services.alert_service import alert_service
from app.websocket.connection_manager import connection_manager

class SensorService:
    @staticmethod
    async def process_telemetry(db: Session, data: SensorReadingCreate) -> Dict[str, Any]:
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

        # Stage 4: AI Anomaly Detection
        anomaly_result = anomaly_detector.detect_anomaly(features)

        # Stage 5 & 6: Risk Scoring & Classification
        risk_result = risk_scorer.calculate_node_risk(
            features=features,
            anomaly_score=anomaly_result["anomaly_score"]
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
                    "anomaly_score": anomaly_result["anomaly_score"]
                },
                "risk": {
                    "panel_id": node.panel_id,
                    "risk_score": risk_result["risk_score"],
                    "risk_classification": classification,
                    "explanation": risk_result["explanation"],
                    "factors": {
                        "tilt": risk_result["tilt_factor"],
                        "displacement": risk_result["displacement_factor"],
                        "vibration": risk_result["vibration_factor"],
                        "spatial": risk_result["spatial_correlation_factor"]
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
            "risk_score": risk_result["risk_score"],
            "classification": classification,
            "alert_id": alert_obj.id if alert_obj else None
        }

sensor_service = SensorService()
