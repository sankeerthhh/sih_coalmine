# Geotechnical AI/ML Pipeline Specification

The platform implements an explainable 6-stage anomaly detection and risk assessment pipeline designed specifically for underground coal mine subsidence.

---

### Stage 1: Validation & Plausibility Filter
Rejects malformed, impossible, or duplicate frames:
- Tilt values clamped within $[-45^\circ, +45^\circ]$.
- Instantaneous displacement jump step $> 150\text{ mm}$ rejected as non-geotechnical anomaly.
- Battery level valid in $[0\%, 100\%]$.

### Stage 2: Noise Filtering
Applies Exponential Moving Average (EMA) with smoothing factor $\alpha = 0.35$ to mechanical vibration signals to suppress non-subsidence high-frequency noise (e.g. from diesel haulage trucks on surface roads).

### Stage 3: Spatial-Temporal Feature Extraction
Computes:
1. Resultant Tilt Angle: $\theta = \sqrt{\theta_x^2 + \theta_y^2}$
2. Tilt Rate: $d\theta/dt = (\theta_t - \theta_{t-1}) / \Delta t$
3. Surface Displacement Velocity: $v_D = (D_t - D_{t-1}) / \Delta t$
4. Spatial Gradient: Mean deviation from adjacent nodes in the same panel cluster.

### Stage 4: Isolation Forest Anomaly Scoring
Scikit-Learn `IsolationForest` trained on normal quiescent baseline distributions produces an anomaly score normalized between $0.0$ and $1.0$.

### Stage 5: Weighted Geotechnical Risk Index ($0 - 100$)
$$\text{Score} = 0.25 \cdot S_{\text{tilt}} + 0.35 \cdot S_{\text{displacement}} + 0.15 \cdot S_{\text{vibration}} + 0.15 \cdot S_{\text{spatial}} + 0.10 \cdot S_{\text{crack}}$$
Blended with Isolation Forest output for non-linear correlation.

### Stage 6: Explainable Safety Classification
- **$0 - 30$:** `NORMAL` (Safe Green)
- **$31 - 60$:** `WARNING` (Advisory Amber)
- **$61 - 80$:** `HIGH RISK` (Warning Orange)
- **$81 - 100$:** `CRITICAL` (Immediate Field Inspection Red)
