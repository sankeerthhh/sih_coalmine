#!/usr/bin/env python3
"""
Model Training & Evaluation Script
Trains the Supervised Random Forest Classifier for Geotechnical Subsidence Risk Classification
and outputs validation metrics.

Usage:
  python train_model.py
"""

import os
import sys
import numpy as np
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split

# Add current path to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.ai.ml_classifier import SubsidenceClassifier

def main():
    print("=" * 60)
    print("AI-Enabled Smart Mine Subsidence Monitoring Platform")
    print("Supervised ML Classifier Training Pipeline")
    print("=" * 60)

    classifier = SubsidenceClassifier()
    print("\n[1/3] Generating synthetic geotechnical strata dataset (1,400 samples)...")
    X, y = classifier._generate_synthetic_training_dataset(n_samples_per_class=350)
    print(f"      Feature Matrix Shape: {X.shape}")
    print(f"      Class Labels: {classifier.CLASSES}")
    print("      Class Distribution:", {classifier.CLASSES[i]: int(np.sum(y == i)) for i in range(4)})

    print("\n[2/3] Performing stratified train/test split (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )

    print("\n[3/3] Training Random Forest Classifier (120 estimators)...")
    from sklearn.ensemble import RandomForestClassifier
    model = RandomForestClassifier(
        n_estimators=120,
        max_depth=8,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n>>> Test Set Accuracy: {acc * 100:.2f}%")
    print("\nDetailed Geotechnical Classification Report:")
    print(classification_report(y_test, y_pred, target_names=classifier.CLASSES))

    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    print("\nFeature Importances:")
    for fname, imp in sorted(zip(classifier.feature_names, model.feature_importances_), key=lambda x: x[1], reverse=True):
        print(f"  - {fname:25s}: {imp * 100:.2f}%")

    print("\nVerification Inference Test:")
    sample_normal = {"resultant_tilt": 0.2, "tilt_rate": 0.005, "displacement": 1.2, "displacement_velocity": 0.05, "vibration_rms": 0.5, "spatial_deviation": 0.1, "crack_event": 0.0}
    sample_critical = {"resultant_tilt": 4.5, "tilt_rate": 0.40, "displacement": 52.0, "displacement_velocity": 14.0, "vibration_rms": 11.5, "spatial_deviation": 3.2, "crack_event": 1.0}

    classifier.model = model
    res_norm = classifier.predict_risk(sample_normal)
    res_crit = classifier.predict_risk(sample_critical)

    print(f"  Normal Sample -> Predicted: {res_norm['predicted_class']} (Conf: {res_norm['confidence']:.2f}, Severity: {res_norm['weighted_severity']})")
    print(f"  Critical Sample -> Predicted: {res_crit['predicted_class']} (Conf: {res_crit['confidence']:.2f}, Severity: {res_crit['weighted_severity']})")
    print("\n[SUCCESS] Model training and verification completed successfully.")
    print("=" * 60)

if __name__ == "__main__":
    main()
