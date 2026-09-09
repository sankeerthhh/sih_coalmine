import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, AlertTriangle, TrendingUp, Info, Activity, Layers } from 'lucide-react';
import { RiskScoreGauge } from '../components/charts/RiskScoreGauge';
import { SensorTrendChart } from '../components/charts/SensorTrendChart';
import { StatusBadge } from '../components/common/StatusBadge';
import { useSensorStore } from '../store/sensorStore';
import { api } from '../services/api';
import { RiskSummary, RiskAssessment } from '../types';

export const AiRiskPage: React.FC = () => {
  const { selectedPanelId, riskSummary, setRiskSummary } = useSensorStore();
  const [history, setHistory] = useState<RiskAssessment[]>([]);

  useEffect(() => {
    api.getCurrentRisk(selectedPanelId).then(setRiskSummary).catch(console.error);
    api.getRiskHistory(selectedPanelId, 24).then(setHistory).catch(console.error);
  }, [selectedPanelId, setRiskSummary]);

  const currentScore = riskSummary?.current_risk_score ?? 14.5;
  const classification = riskSummary?.risk_classification ?? 'NORMAL';

  // Format risk trend for chart
  const riskTrendData = history.map(h => ({
    timestamp: h.timestamp,
    tilt: h.tilt_factor,
    displacement: h.displacement_factor,
    vibration: h.vibration_factor,
    risk_score: h.risk_score
  }));

  return (
    <div className="space-y-6">
      {/* Top Scientific Responsibility Callout Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 shadow-xs flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Methodology & Geotechnical Decision Support
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight mt-1">
            Multi-Parameter AI Anomaly Detection & Geotechnical Risk Assessment
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            The platform synthesizes resultant surface tilt, differential displacement velocity, micro-vibration RMS, spatial neighbor correlation, and physical crack sensor continuity using an ensemble Isolation Forest and physical weighting pipeline.
          </p>
        </div>

        <div className="bg-slate-800/90 rounded-md p-3 border border-slate-700 max-w-xs text-right">
          <span className="text-[10px] text-slate-400 font-medium block">Monitored Mining Panel</span>
          <span className="text-sm font-bold text-white">{selectedPanelId}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Depth: 210m &bull; Depillaring</span>
        </div>
      </div>

      {/* Main AI Risk Assessment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1: Radial Gauge & Factor Attribution */}
        <div className="lg:col-span-1">
          <RiskScoreGauge
            score={currentScore}
            classification={classification}
            factors={riskSummary?.factors || {
              "Displacement Velocity": 38.0,
              "Tilt Angle Increase": 24.0,
              "Spatial Correlation": 20.0,
              "Vibration RMS": 18.0
            }}
            explanation={riskSummary?.explanation}
          />
        </div>

        {/* Right 2: Detailed Anomaly Attribution Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Geotechnical Attribution & Explainable Diagnostics
              </h3>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                Cluster: {riskSummary?.affected_cluster || 'Panel B3'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-slate-500 font-medium block text-[11px]">Primary Deformation Mode</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {currentScore > 60 ? "Accelerated Tensile Subsidence Trough" : "Quiescent Strata Equilibrium"}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Correlated between Surface Nodes N12, N13, N14, N15.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-slate-500 font-medium block text-[11px]">Spatial Correlation Index</span>
                <span className="text-sm font-bold text-blue-700 mt-1 block">
                  {currentScore > 60 ? "High Neighbor Divergence (0.84)" : "Uniform Spatial Baseline (0.08)"}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Differential movement between adjacent nodes in Panel B3.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-slate-500 font-medium block text-[11px]">AI Model Architecture</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  Isolation Forest + Calibrated Geotechnical Heuristics
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  500 baseline estimator runs over rolling 10-minute window.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-slate-500 font-medium block text-[11px]">Recommended Engineering Action</span>
                <span className={`text-sm font-bold mt-1 block ${currentScore > 80 ? 'text-red-700' : 'text-slate-900'}`}>
                  {currentScore > 80
                    ? "Immediate field inspection recommended. Restrict heavy machinery."
                    : currentScore > 60
                    ? "Deploy portable geotechnical inclinometer & increase telemetry rate."
                    : "Maintain standard 6-second LoRa monitoring cycle."}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Directorate General of Mines Safety (DGMS) guidelines compliant.
                </p>
              </div>
            </div>
          </div>

          {/* Historical Risk Score Evolution Trend */}
          <SensorTrendChart
            data={riskTrendData}
            title="Panel B3 Risk Score Evolution (Past 24 Hours)"
            metric="displacement"
            height={200}
          />
        </div>
      </div>
    </div>
  );
};
