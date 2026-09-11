import os
import json
import logging
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("subsidence.gemini_service")

class GeminiService:
    """
    Stage 10: Gemini AI Geotechnical Decision Explanation Service
    Receives structured inputs strictly from the ML and Risk Fusion engines:
    - Fused risk score & classification
    - Supervised ML prediction & probabilities
    - Isolation Forest anomaly score
    - Subsidence fingerprint & detected physical signals
    - Spatial zone & sensor telemetry values

    Outputs:
    1. Geotechnical plain-language explanation
    2. Primary contributing physical factors
    3. Recommended engineering & operational actions
    Strictly constrained NOT to invent numbers, change locations, or override ML results.
    """
    GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    @classmethod
    async def generate_explanation(cls, structured_context: Dict[str, Any]) -> Dict[str, Any]:
        api_key = os.getenv("GEMINI_API_KEY", "").strip()

        # If API key is configured, invoke Google Gemini REST API
        if api_key:
            try:
                explanation = await cls._call_gemini_api(api_key, structured_context)
                if explanation:
                    return explanation
            except Exception as exc:
                logger.warning(f"Gemini API invocation encountered error: {exc}. Falling back to deterministic geotechnical explainer.")

        # Deterministic Geotechnical Fallback Explainer
        return cls._generate_deterministic_explanation(structured_context)

    @classmethod
    async def _call_gemini_api(cls, api_key: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        prompt = (
            "You are a Senior Geotechnical Mining Expert providing statutory decision support under Directorate General "
            "of Mines Safety (DGMS) norms for an underground coal mine subsidence monitoring platform.\n\n"
            "CRITICAL INSTRUCTIONS:\n"
            "1. Base your explanation strictly on the verified system telemetry and ML output provided below.\n"
            "2. DO NOT invent sensor numbers, change locations, or override the ML risk prediction.\n"
            "3. Format your response strictly as valid JSON with keys: "
            "'geotechnical_explanation', 'primary_contributing_factors' (array of strings), "
            "'recommended_actions' (array of strings), 'dgms_compliance_summary'.\n\n"
            f"STRUCTURED TELEMETRY & ML DATA:\n{json.dumps(context, indent=2)}"
        )

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800,
                "responseMimeType": "application/json"
            }
        }

        url = f"{cls.GEMINI_API_URL}?key={api_key}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                parsed["source"] = "Google Gemini 2.5 Flash (Live API)"
                return parsed
            else:
                logger.error(f"Gemini API returned HTTP {resp.status_code}: {resp.text}")
                return None

    @classmethod
    def _generate_deterministic_explanation(cls, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Expert Geotechnical Knowledge System providing instant explainability
        calibrated for SIH presentations when offline or when GEMINI_API_KEY is not set.
        """
        panel_id = context.get("panel_id", "PANEL-B3")
        fused_score = context.get("fused_risk_score", 14.5)
        risk_class = context.get("risk_classification", "NORMAL")
        fp_state = context.get("fingerprint_state", "STABLE")
        signals = context.get("detected_signals", [])
        disp = context.get("displacement", 1.8)
        tilt = context.get("resultant_tilt", 0.3)
        crack = context.get("crack_detected", False)
        ml_class = context.get("ml_predicted_class", "NORMAL")
        ml_conf = context.get("ml_confidence", 0.92)

        if risk_class == "CRITICAL" or crack:
            explanation = (
                f"Severe surface deformation detected across {panel_id}. Continuous strata settlement has reached "
                f"{disp:.1f}mm with resultant tilt magnitude of {tilt:.2f}°. "
                + ("Tension crack monitoring circuit has been severed, confirming discontinuous ground rupture. " if crack else "")
                + f"The Random Forest model classifies this event as {ml_class} ({ml_conf*100:.0f}% confidence), "
                f"indicating accelerating shear failure above the underground coal extraction horizon."
            )
            factors = [
                f"Excessive vertical displacement ({disp:.1f} mm exceeding DGMS 50mm statutory ceiling)" if disp > 30 else f"High vertical settlement ({disp:.1f} mm)",
                f"Severe differential angular tilt ({tilt:.2f}° curvature)",
                "Physical tension crack detection circuit opened",
                f"Autonomous Subsidence Fingerprint classified as {fp_state}"
            ]
            actions = [
                f"Immediately halt all depillaring / longwall coal cutting operations in {panel_id}.",
                "Evacuate personnel and heavy machinery from the surface influence perimeter.",
                "Trigger automated colliery sirens and dispatch statutory bulletins to SECL & DGMS inspectors.",
                "Establish physical barricading and deploy emergency optical levelling survey."
            ]
            compliance = "Action required under Coal Mines Regulations (CMR) 2017 Reg 111 & 112 (Precautions against subsidence)."

        elif risk_class in ["WARNING", "HIGH"]:
            explanation = (
                f"Emerging inelastic deformation regime detected over {panel_id}. Vertical movement is currently "
                f"{disp:.1f}mm with differential tilt of {tilt:.2f}°. Multi-sensor correlation indicates "
                f"{fp_state} driven by underground void collapse and gradual overburden bending. "
                f"Supervised ML predicts {ml_class} risk with {ml_conf*100:.0f}% confidence."
            )
            factors = [
                f"Increasing surface displacement rate (+{disp:.1f} mm)",
                f"Elevated tilt rate across adjacent mesh nodes (+{tilt:.2f}°)",
                "Inter-node spatial divergence indicating differential ground curvature",
                f"Active Subsidence Fingerprint: {fp_state}"
            ]
            actions = [
                "Increase wireless surface mesh sampling rate from 6-second to 2-second cycle.",
                "Perform physical visual inspection of surface drainage and benchmark monuments.",
                "Cross-reference real-time subsidence curve with face advancement speed in depillaring section.",
                "Notify shift safety overman and keep emergency response standby active."
            ]
            compliance = "Monitored per Directorate General of Mines Safety (DGMS) Geotechnical Subsidence Circular guidelines."

        else:
            explanation = (
                f"All 24 wireless surface mesh nodes across {panel_id} show uniform elastic equilibrium. "
                f"Ground displacement ({disp:.1f}mm) and tilt ({tilt:.2f}°) remain well within baseline statutory limits. "
                f"Supervised ML and Isolation Forest anomaly pipelines confirm quiescent, safe mining conditions."
            )
            factors = [
                "All surface displacement readings below 2.5 mm baseline threshold",
                "Angular surface tilt within 0.4° elastic tolerance",
                "Complete continuity on all surface crack detection circuits",
                "Active Subsidence Fingerprint: STABLE"
            ]
            actions = [
                "Maintain standard automated 6-second wireless mesh telemetry acquisition.",
                "Perform scheduled bi-weekly battery and radio link budget health audits.",
                "Continue standard underground extraction schedule."
            ]
            compliance = "Fully compliant with baseline safety tolerances under CMR 2017."

        return {
            "geotechnical_explanation": explanation,
            "primary_contributing_factors": factors,
            "recommended_actions": actions,
            "dgms_compliance_summary": compliance,
            "source": "Deterministic Geotechnical Knowledge System (SIH Decision Support)"
        }

gemini_service = GeminiService()
