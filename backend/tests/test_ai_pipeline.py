from datetime import datetime, timezone
from app.ai.validation import SensorValidator
from app.ai.feature_extraction import feature_extractor
from app.ai.anomaly_detector import anomaly_detector
from app.ai.risk_scorer import risk_scorer

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
