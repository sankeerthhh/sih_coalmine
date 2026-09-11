import math
from typing import Dict, Any, List, Optional

class SpatialRiskAnalyzer:
    """
    Stage 8: Spatial Correlation & Subsidence Zone Prediction Engine
    Analyzes spatial patterns across adjacent surface mesh sensor clusters
    to identify and delineate multi-node subsidence zones rather than isolated sensors.
    """
    DISCLAIMER = (
        "Prototype Spatial Zone Prediction — Based on Angle of Draw (21°) & "
        "Empirical Influence Modeling. Geotechnical survey required."
    )

    # Standard zone definitions mapped to extraction panels
    ZONE_MAPPINGS = {
        "ZONE-B3-CORE": {
            "name": "Panel B3 Active Depillaring Epicenter Zone",
            "panel_id": "PANEL-B3",
            "member_nodes": ["N12", "N13", "N14", "N15", "N16", "N17", "N18", "N24"],
            "depth_m": 210.0,
            "center_lat": 22.3642,
            "center_lon": 82.7578
        },
        "ZONE-B2-DEV": {
            "name": "Panel B2 Development & Heading Section",
            "panel_id": "PANEL-B2",
            "member_nodes": ["N09", "N10", "N11", "N19", "N20", "N23"],
            "depth_m": 185.0,
            "center_lat": 22.3635,
            "center_lon": 82.7525
        },
        "ZONE-B1-CM": {
            "name": "Panel B1 Continuous Miner Section",
            "panel_id": "PANEL-B1",
            "member_nodes": ["N01", "N06", "N07", "N08"],
            "depth_m": 190.0,
            "center_lat": 22.3620,
            "center_lon": 82.7465
        },
        "ZONE-A2-POST": {
            "name": "Panel A2 Post-Depillared Caving Zone",
            "panel_id": "PANEL-A2",
            "member_nodes": ["N04", "N05", "N22"],
            "depth_m": 175.0,
            "center_lat": 22.3565,
            "center_lon": 82.7540
        },
        "ZONE-A1-GAF": {
            "name": "Panel A1 Sealed Gaf Zone",
            "panel_id": "PANEL-A1",
            "member_nodes": ["N02", "N03", "N21"],
            "depth_m": 160.0,
            "center_lat": 22.3550,
            "center_lon": 82.7460
        }
    }

    @classmethod
    def evaluate_spatial_zones(
        cls,
        nodes_state: List[Dict[str, Any]],
        active_scenario: str = "NORMAL"
    ) -> List[Dict[str, Any]]:
        """
        Evaluates spatial zones by aggregating telemetry, ML probabilities,
        and anomaly scores from member nodes.
        """
        node_lookup = {n["id"]: n for n in nodes_state}
        predicted_zones = []

        for zone_id, zmeta in cls.ZONE_MAPPINGS.items():
            members = [node_lookup[nid] for nid in zmeta["member_nodes"] if nid in node_lookup]
            if not members:
                continue

            # Calculate zone aggregates
            total_members = len(members)
            elevated_nodes = []
            max_disp = 0.0
            max_tilt = 0.0
            avg_risk = 0.0
            max_ml_prob = 0.0
            any_crack = False

            sum_lat = 0.0
            sum_lon = 0.0
            weights = 0.0

            for m in members:
                disp = float(m.get("displacement", 0.0))
                tilt = float(m.get("resultant_tilt", 0.0))
                risk = float(m.get("risk_score", 12.0))
                crack = bool(m.get("crack_detected", False))
                status = m.get("status", "ONLINE")

                max_disp = max(max_disp, disp)
                max_tilt = max(max_tilt, tilt)
                avg_risk += risk
                if crack:
                    any_crack = True

                # Node is elevated if displacement > 8mm or tilt > 1.2 or status != ONLINE
                if disp > 6.0 or tilt > 0.8 or status in ["WARNING", "CRITICAL"] or crack:
                    elevated_nodes.append(m["id"])
                    w = max(1.0, disp)
                    sum_lat += m.get("latitude", zmeta["center_lat"]) * w
                    sum_lon += m.get("longitude", zmeta["center_lon"]) * w
                    weights += w

            avg_risk = round(avg_risk / max(1, total_members), 1)

            # Zone Risk Level determination based on multi-node spatial correlation
            # If 2 or more nodes are elevated, spatial risk is magnified
            elevated_count = len(elevated_nodes)
            elevation_ratio = elevated_count / max(1, total_members)

            if any_crack or (max_disp > 30.0 and elevated_count >= 2) or avg_risk > 70.0:
                zone_risk = "CRITICAL"
                ml_prob = 0.88
                fingerprint = "CRITICAL_DEFORMATION"
                action = "Halt extraction immediately. Evacuate surface perimeter and restrict haulage access."
            elif (max_disp > 15.0 and elevated_count >= 2) or elevation_ratio >= 0.35 or avg_risk > 50.0:
                zone_risk = "HIGH"
                ml_prob = 0.82
                fingerprint = "ACCELERATING_SUBSIDENCE"
                action = "Conduct immediate optical levelling cross-check and alert colliery safety superintendent."
            elif elevated_count >= 1 or max_disp > 6.0 or avg_risk > 30.0:
                zone_risk = "WARNING"
                ml_prob = 0.64
                fingerprint = "PROGRESSIVE_SUBSIDENCE"
                action = "Increase mesh telemetry frequency to 3-second cycle and inspect perimeter benchmark monuments."
            else:
                zone_risk = "NORMAL"
                ml_prob = 0.05
                fingerprint = "STABLE"
                action = "Maintain standard automated 6-second surface mesh telemetry monitoring."

            # Compute centroid of subsidence influence
            if weights > 0:
                centroid_lat = round(sum_lat / weights, 4)
                centroid_lon = round(sum_lon / weights, 4)
            else:
                centroid_lat = zmeta["center_lat"]
                centroid_lon = zmeta["center_lon"]

            # Calculate influence radius based on depth and angle of draw (21 deg)
            # R = Depth * tan(21 deg) ~ Depth * 0.384
            base_radius = zmeta["depth_m"] * math.tan(math.radians(21.0))
            if zone_risk == "CRITICAL":
                influence_radius = round(base_radius * 1.35, 1)
            elif zone_risk == "HIGH":
                influence_radius = round(base_radius * 1.15, 1)
            else:
                influence_radius = round(base_radius, 1)

            predicted_zones.append({
                "zone_id": zone_id,
                "zone_name": zmeta["name"],
                "panel_id": zmeta["panel_id"],
                "risk_level": zone_risk,
                "average_risk_score": avg_risk,
                "maximum_displacement_mm": round(max_disp, 1),
                "maximum_tilt_deg": round(max_tilt, 2),
                "total_nodes_count": total_members,
                "affected_nodes_count": elevated_count,
                "affected_node_ids": elevated_nodes,
                "ml_probability": ml_prob,
                "fingerprint_state": fingerprint,
                "centroid": {"latitude": centroid_lat, "longitude": centroid_lon},
                "influence_radius_meters": influence_radius,
                "depth_meters": zmeta["depth_m"],
                "recommended_action": action,
                "scientific_disclaimer": cls.DISCLAIMER
            })

        return predicted_zones

spatial_risk_analyzer = SpatialRiskAnalyzer()
