import pytest
from datetime import datetime, timezone
from app.ai.validation import SensorValidator
from app.ai.feature_extraction import feature_extractor
from app.ai.anomaly_detector import anomaly_detector
from app.ai.ml_classifier import subsidence_classifier
from app.ai.risk_scorer import risk_scorer
from app.ai.subsidence_fingerprint import subsidence_fingerprint_engine
from app.ai.early_warning_engine import early_warning_engine
from app.ai.spatial_analyzer import spatial_risk_analyzer
from app.services.gemini_service import gemini_service

def test_sensor_validation_sanity():
    # Valid reading
    valid, msg = SensorValidator.validate_reading(
        tilt_x=1.2, tilt_y=0.8, displacement=15.0, vibration=2.0, battery_level=95.0
    )
    assert valid is True
    assert msg is None

    # Invalid tilt (> 45 deg)
    invalid, err = SensorValidator.validate_reading(
        tilt_x=55.0, tilt_y=0.0, displacement=5.0, vibration=1.0, battery_level=90.0
    )
    assert invalid is False
    assert "bounds" in err

    # Invalid negative displacement
    invalid, err = SensorValidator.validate_reading(
        tilt_x=0.0, tilt_y=0.0, displacement=-10.0, vibration=1.0, battery_level=90.0
    )
    assert invalid is False
    assert "negative" in err

def test_ai_feature_extraction_and_risk_scoring():
    features = feature_extractor.extract_node_features(
        node_id="N14",
        timestamp=datetime.now(timezone.utc),
        tilt_x=4.0,
        tilt_y=3.0,
        displacement=35.0,
        vibration=8.0,
        crack_detected=True,
        neighbor_tilts=[0.5, 0.6]
    )
    assert features["resultant_tilt"] == 5.0 # 3-4-5 triangle
    assert features["crack_event"] == 1.0

    anomaly = anomaly_detector.detect_anomaly(features)
    assert 0.0 <= anomaly["anomaly_score"] <= 1.0

    risk = risk_scorer.calculate_node_risk(features, anomaly["anomaly_score"])
    assert risk["risk_score"] > 60.0
    assert risk["risk_classification"] in ["HIGH", "CRITICAL"]
    assert "Tension crack initiation" in risk["explanation"]
    assert "scientific_disclaimer" in risk
    assert risk["fusion_weights"]["geotechnical"] == 0.60
    assert risk["fusion_weights"]["supervised_ml"] == 0.25
    assert risk["fusion_weights"]["anomaly_forest"] == 0.15

def test_supervised_ml_classifier_regimes():
    # Normal baseline
    normal_feat = {
        "resultant_tilt": 0.25,
        "tilt_rate": 0.005,
        "displacement": 1.5,
        "displacement_velocity": 0.05,
        "vibration_rms": 0.5,
        "spatial_deviation": 0.1,
        "crack_event": 0.0
    }
    pred_normal = subsidence_classifier.predict_risk(normal_feat)
    assert pred_normal["predicted_class"] == "NORMAL"
    assert pred_normal["probabilities"]["NORMAL"] > 0.60
    assert pred_normal["weighted_severity"] < 30.0

    # Critical regime
    critical_feat = {
        "resultant_tilt": 4.5,
        "tilt_rate": 0.45,
        "displacement": 55.0,
        "displacement_velocity": 15.0,
        "vibration_rms": 12.0,
        "spatial_deviation": 3.0,
        "crack_event": 1.0
    }
    pred_crit = subsidence_classifier.predict_risk(critical_feat)
    assert pred_crit["predicted_class"] in ["HIGH", "CRITICAL"]
    assert pred_crit["weighted_severity"] > 70.0
    assert "Prototype ML Model" in pred_crit["scientific_disclaimer"]

def test_subsidence_fingerprint_states():
    # Baseline stable fingerprint
    feat_stable = {"resultant_tilt": 0.2, "tilt_rate": 0.005, "displacement": 1.2, "displacement_velocity": 0.02, "vibration_rms": 0.4, "spatial_deviation": 0.08, "crack_event": 0.0}
    ml_stable = subsidence_classifier.predict_risk(feat_stable)
    fp_stable = subsidence_fingerprint_engine.evaluate_fingerprint(feat_stable, 0.05, ml_stable)
    assert fp_stable["fingerprint_state"] == "STABLE"
    assert fp_stable["severity_index"] == 1

    # Progressive subsidence fingerprint
    feat_prog = {"resultant_tilt": 1.5, "tilt_rate": 0.08, "displacement": 14.0, "displacement_velocity": 1.2, "vibration_rms": 3.2, "spatial_deviation": 0.8, "crack_event": 0.0}
    ml_prog = subsidence_classifier.predict_risk(feat_prog)
    fp_prog = subsidence_fingerprint_engine.evaluate_fingerprint(feat_prog, 0.45, ml_prog)
    assert fp_prog["fingerprint_state"] in ["PROGRESSIVE_SUBSIDENCE", "ACCELERATING_SUBSIDENCE"]
    assert len(fp_prog["contributing_signals"]) >= 2
    assert any("displacement" in s.lower() for s in fp_prog["contributing_signals"])

def test_early_warning_engine_levels():
    feat_crit = {"resultant_tilt": 4.0, "tilt_rate": 0.35, "displacement": 45.0, "displacement_velocity": 8.0, "vibration_rms": 9.5, "spatial_deviation": 2.5, "crack_event": 1.0}
    ml_crit = subsidence_classifier.predict_risk(feat_crit)
    fused_crit = risk_scorer.calculate_node_risk(feat_crit, 0.85, ml_crit)
    fp_crit = subsidence_fingerprint_engine.evaluate_fingerprint(feat_crit, 0.85, ml_crit)

    ew_crit = early_warning_engine.evaluate_early_warning("PANEL-B3", fused_crit, fp_crit, ml_crit, feat_crit, "N14")
    assert ew_crit["warning_level"] == "CRITICAL"
    assert "cessation" in ew_crit["recommended_action"].lower() or "halt" in ew_crit["recommended_action"].lower()

def test_spatial_risk_zone_aggregation():
    mock_nodes = [
        {"id": "N12", "panel_id": "PANEL-B3", "latitude": 22.3625, "longitude": 82.7555, "status": "CRITICAL", "displacement": 35.0, "resultant_tilt": 3.2, "crack_detected": True, "risk_score": 85.0},
        {"id": "N14", "panel_id": "PANEL-B3", "latitude": 22.3645, "longitude": 82.7580, "status": "CRITICAL", "displacement": 42.0, "resultant_tilt": 4.1, "crack_detected": True, "risk_score": 92.0},
        {"id": "N01", "panel_id": "PANEL-B1", "latitude": 22.3600, "longitude": 82.7490, "status": "ONLINE", "displacement": 1.2, "resultant_tilt": 0.2, "crack_detected": False, "risk_score": 12.0}
    ]
    zones = spatial_risk_analyzer.evaluate_spatial_zones(mock_nodes)
    assert len(zones) >= 1
    zone_b3 = next(z for z in zones if z["zone_id"] == "ZONE-B3-CORE")
    assert zone_b3["risk_level"] in ["HIGH", "CRITICAL"]
    assert "N14" in zone_b3["affected_node_ids"]
    assert zone_b3["influence_radius_meters"] > 50.0

@pytest.mark.anyio
async def test_gemini_explanation_generation():
    context = {
        "panel_id": "PANEL-B3",
        "displacement": 32.0,
        "resultant_tilt": 2.8,
        "fused_risk_score": 82.0,
        "risk_classification": "CRITICAL",
        "fingerprint_state": "CRITICAL_DEFORMATION",
        "detected_signals": ["Increasing displacement", "Rising tilt rate"],
        "crack_detected": True
    }
    explanation = await gemini_service.generate_explanation(context)
    assert "geotechnical_explanation" in explanation
    assert len(explanation["primary_contributing_factors"]) >= 2
    assert len(explanation["recommended_actions"]) >= 1
    assert "source" in explanation
