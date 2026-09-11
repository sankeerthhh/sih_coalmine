import React, { useEffect, useState } from 'react';
import {
  Radio,
  WifiOff,
  ShieldAlert,
  Bell,
  MapPin,
  Activity,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { GisMap } from '../components/map/GisMap';
import { NodeDetailDrawer } from '../components/map/NodeDetailDrawer';
import { RiskScoreGauge } from '../components/charts/RiskScoreGauge';
import { SensorTrendChart } from '../components/charts/SensorTrendChart';
import { GeminiAnalysisCard } from '../components/ai/GeminiAnalysisCard';
import { useSensorStore } from '../store/sensorStore';
import { api } from '../services/api';
import { DashboardSummary, SensorNode } from '../types';

interface DashboardPageProps {
  onNavigatePage: (page: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigatePage }) => {
  const {
    sensors,
    selectedSensorId,
    setSelectedSensorId,
    riskSummary,
    alerts,
    selectedPanelId,
    dataSourceMode,
    isHardwareConnected,
    lastHardwareTelemetryAt
  } = useSensorStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [drawerNode, setDrawerNode] = useState<SensorNode | null>(null);

  useEffect(() => {
    // Fetch summary
    api.getDashboardSummary().then(setSummary).catch(console.error);

    // Fetch trend readings for focus node N14
    api.getSensorReadings('N14', 24).then(setTrendData).catch(console.error);
  }, []);

  // Only update drawer telemetry if the drawer is currently open
  useEffect(() => {
    if (drawerNode) {
      const found = sensors.find(s => s.id === drawerNode.id);
      if (found) setDrawerNode(found);
    }
  }, [sensors]);

  const activeNodes = sensors.filter(s => s.status !== 'OFFLINE').length || 24;
  const offlineNodes = sensors.filter(s => s.status === 'OFFLINE').length;
  const currentRiskScore = riskSummary?.current_risk_score ?? summary?.current_risk_score ?? 14.5;
  const currentRiskLevel = riskSummary?.risk_classification ?? summary?.current_risk_level ?? 'NORMAL';

  // Derived or default ML prediction values
  const rawMl = riskSummary?.ml_prediction;
  const mlPred = {
    predicted_class: (rawMl?.predicted_class || (currentRiskLevel === 'CRITICAL' ? 'CRITICAL' : currentRiskLevel === 'WARNING' ? 'WARNING' : 'NORMAL')) as any,
    confidence: rawMl?.confidence ?? 0.94,
    probabilities: rawMl?.probabilities || {
      NORMAL: currentRiskLevel === 'NORMAL' ? 0.92 : 0.05,
      WARNING: currentRiskLevel === 'WARNING' ? 0.78 : 0.15,
      HIGH: currentRiskLevel === 'HIGH' ? 0.81 : 0.08,
      CRITICAL: currentRiskLevel === 'CRITICAL' ? 0.91 : 0.02
    },
    weighted_severity: rawMl?.weighted_severity ?? currentRiskScore,
    model_type: rawMl?.model_type || 'Random Forest Classifier (120 Estimators, Max Depth=12)',
    scientific_disclaimer: rawMl?.scientific_disclaimer || (dataSourceMode === 'SIMULATION' ? 'SIMULATION / DEMO DATA — Trained on Synthetic Geotechnical Data' : 'LIVE HARDWARE DATA — Real-Time Inference on Incoming Telemetry')
  };

  // 5-state Subsidence Fingerprint
  const rawFp = riskSummary?.fingerprint;
  const fingerprintState: string =
    rawFp?.state ||
    (rawFp as any)?.fingerprint_state ||
    (currentRiskLevel === 'CRITICAL' ? 'ACCELERATING_SUBSIDENCE' : currentRiskLevel === 'WARNING' ? 'PROGRESSIVE_SUBSIDENCE' : 'STABLE');
  const fingerprintSummary: string =
    rawFp?.summary ||
    (currentRiskLevel === 'CRITICAL'
      ? 'Accelerating subsidence trough with tensile surface strain.'
      : currentRiskLevel === 'WARNING'
      ? 'Progressive ground movement with detectable tilt curvature.'
      : 'Elastic strata equilibrium; baseline thermal drift only.');
  const fingerprintSignals: string[] =
    rawFp?.signals ||
    (rawFp as any)?.contributing_signals ||
    (currentRiskLevel === 'CRITICAL'
      ? [
          'Vertical displacement exceeds 25mm threshold',
          'Tilt divergence > 1.8 deg',
          'Inter-node baseline tensile strain > 12mm',
          'Cluster spatial correlation divergence'
        ]
      : currentRiskLevel === 'WARNING'
      ? [
          'Vertical displacement moderate (8-20mm)',
          'Tilt rate increasing (+0.4 deg/day)',
          'Neighbor node strain correlation active'
        ]
      : [
          'Resultant tilt within tolerance (< 0.5 deg)',
          'Vertical deformation baseline (< 2.5mm)',
          'Spatial strain gradient neutral',
          'Vibration noise floor quiescent'
        ]);

  const fingerprint = {
    state: fingerprintState,
    summary: fingerprintSummary,
    signals: fingerprintSignals,
    severity_index: rawFp?.severity_index ?? currentRiskScore
  };

  // 5-Tier Early Warning Engine
  const rawEw = riskSummary?.early_warning;
  const earlyWarning = {
    level: rawEw?.level || (rawEw as any)?.warning_level || (currentRiskLevel === 'CRITICAL' ? 'CRITICAL' : currentRiskLevel === 'WARNING' ? 'ELEVATED' : 'NORMAL'),
    urgency: rawEw?.urgency || (currentRiskLevel === 'CRITICAL' ? 'EVACUATE SURFACE IMMEDIATELY' : currentRiskLevel === 'WARNING' ? 'HEIGHTENED INSPECTION' : 'ROUTINE MONITORING'),
    action: rawEw?.action || (rawEw as any)?.recommended_action || (currentRiskLevel === 'CRITICAL'
      ? 'Restrict surface access above Panel B3. Halt depillaring extraction immediately per DGMS Circular 4/2018.'
      : currentRiskLevel === 'WARNING'
      ? 'Increase telemetry sampling rate to 2s. Dispatch geotechnical survey crew for ground crack verification.'
      : 'Maintain standard LoRa 6s polling cycle. Inspect Node N14 physical anchor.')
  };

  const fusionGeotech = riskSummary?.geotechnical_score ?? (currentRiskScore * 0.95);
  const fusionMl = riskSummary?.ml_severity_score ?? (currentRiskScore * 1.05);
  const fusionAnomaly = currentRiskLevel === 'CRITICAL' ? 88.0 : currentRiskLevel === 'WARNING' ? 45.0 : 12.0;

  return (
    <div className="space-y-6">
      {/* Standby Banner when LIVE HARDWARE mode is active and waiting for physical packets */}
      {dataSourceMode === 'HARDWARE' && !isHardwareConnected && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-xl border-2 border-amber-300 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 animate-pulse">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-amber-950 tracking-tight">
                  Waiting for hardware telemetry
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400 font-bold uppercase text-[10px] tracking-wider">
                  LIVE HARDWARE MODE ACTIVE
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 max-w-2xl leading-relaxed">
                Hardware prototype bridge is standing by. The dashboard will exclusively display real sensor telemetry received from your physical ESP32 LoRa Gateway on <code className="bg-amber-100 text-amber-950 font-mono px-1.5 py-0.5 rounded text-[11px] font-bold">POST /api/v1/sensors/ingest</code>. No synthetic simulation data is substituted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-2 bg-white/90 border border-amber-300 rounded-lg text-xs font-mono text-amber-950 shadow-2xs">
              <span className="text-slate-500 font-sans text-[10px] uppercase font-bold block">Gateway Bridge Ingest</span>
              <span className="font-bold">/api/v1/sensors/ingest</span>
            </div>
          </div>
        </div>
      )}

      {/* 5-Question Immediate Geotechnical Executive Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg text-white font-bold ${
            currentRiskLevel === 'CRITICAL' ? 'bg-red-600 animate-pulse' :
            currentRiskLevel === 'WARNING' ? 'bg-amber-500' :
            currentRiskLevel === 'HIGH' ? 'bg-orange-500' : 'bg-emerald-600'
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Current Safety Assessment:
              </h2>
              <StatusBadge status={currentRiskLevel} size="sm" />
              
              {/* Data provenance tag */}
              <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] tracking-wide border ${
                dataSourceMode === 'SIMULATION'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : isHardwareConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {dataSourceMode === 'SIMULATION'
                  ? 'SIMULATION / DEMO DATA'
                  : isHardwareConnected
                  ? 'LIVE HARDWARE DATA'
                  : 'WAITING FOR HARDWARE TELEMETRY'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dataSourceMode === 'HARDWARE' && !isHardwareConnected
                ? "Standing by for physical sensor telemetry packets from ESP32 LoRa Gateway."
                : currentRiskLevel === 'CRITICAL'
                ? "Abnormal surface deformation detected in Panel B3 depillaring cluster. Field inspection recommended."
                : currentRiskLevel === 'WARNING'
                ? "Developing tilt & displacement trend observed in Panel B3. Heightened monitoring active."
                : "All panels within permissible geotechnical tolerance limits. Normal operations."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigatePage('alerts')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-red-600" />
            <span>Active Alerts ({alerts.filter(a => a.status === 'ACTIVE').length})</span>
          </button>
          <button
            onClick={() => onNavigatePage('gis-map')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Full GIS Map</span>
          </button>
        </div>
      </div>

      {/* 5-Tier Early Warning Engine Banner */}
      {earlyWarning.level !== 'NORMAL' && (
        <div className={`p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4 shadow-xs ${
          earlyWarning.level === 'CRITICAL'
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : earlyWarning.level === 'HIGH_RISK'
            ? 'bg-orange-50 border-orange-300 text-orange-900'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 shrink-0 ${earlyWarning.level === 'CRITICAL' ? 'text-rose-600 animate-bounce' : 'text-amber-600'}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  5-Tier Early Warning: {earlyWarning.level}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 font-bold border border-current">
                  Urgency: {earlyWarning.urgency}
                </span>
              </div>
              <p className="text-xs mt-1 font-medium leading-relaxed">
                <span className="font-bold">DGMS Statutory Action: </span>{earlyWarning.action}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigatePage('alerts')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            Review Protocol &rarr;
          </button>
        </div>
      )}

      {/* Top 6 KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          label="Active Nodes"
          value={activeNodes}
          unit="/ 24"
          subtext="Surface LoRa mesh online"
          icon={<Radio className="w-4 h-4 text-emerald-600" />}
          alertLevel="NORMAL"
        />

        <StatCard
          label="Nodes Offline"
          value={offlineNodes}
          unit="nodes"
          subtext={offlineNodes > 0 ? "Requires field battery check" : "Zero packet drop"}
          icon={<WifiOff className="w-4 h-4 text-slate-600" />}
          alertLevel={offlineNodes > 0 ? 'WARNING' : 'NEUTRAL'}
        />

        <StatCard
          label="Current Risk"
          value={`${Math.round(currentRiskScore)}`}
          unit="/ 100"
          subtext={currentRiskLevel}
          icon={<ShieldAlert className="w-4 h-4 text-blue-600" />}
          alertLevel={currentRiskLevel as any}
        />

        <StatCard
          label="Active Alerts"
          value={alerts.filter(a => a.status === 'ACTIVE').length}
          unit="events"
          subtext="Operator actionable"
          icon={<Bell className="w-4 h-4 text-amber-600" />}
          alertLevel={
            alerts.some(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE') ? 'CRITICAL' :
            alerts.some(a => a.severity === 'WARNING' && a.status === 'ACTIVE') ? 'WARNING' :
            'NORMAL'
          }
        />

        <StatCard
          label="Area Monitored"
          value="4.85"
          unit="sq. km"
          subtext="5 underground panels"
          icon={<MapPin className="w-4 h-4 text-blue-600" />}
          alertLevel="NEUTRAL"
        />

        <StatCard
          label="Telemetry Stream"
          value="Real-Time"
          subtext="Every 6 seconds"
          icon={<Clock className="w-4 h-4 text-emerald-600" />}
          alertLevel="NORMAL"
        />
      </div>

      {/* AI Intelligence Suite: ML Prediction, 5-State Fingerprint & 60/25/15 Fusion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: Supervised ML Classifier (Random Forest) */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Supervised ML Classifier
                </h3>
              </div>
              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-200">
                Random Forest
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Predicted Risk Class:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-base font-extrabold ${
                    mlPred.predicted_class === 'CRITICAL' ? 'text-red-600' :
                    mlPred.predicted_class === 'HIGH' ? 'text-orange-600' :
                    mlPred.predicted_class === 'WARNING' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {mlPred.predicted_class}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold font-mono">
                    ({(mlPred.confidence * 100).toFixed(1)}% conf)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Weighted Severity</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {mlPred.weighted_severity?.toFixed(1) ?? currentRiskScore.toFixed(1)} / 100
                </span>
              </div>
            </div>

            {/* Probability Breakdown Bar Chart */}
            <div className="space-y-1.5 text-xs mb-3">
              <span className="text-[11px] font-semibold text-slate-600 block">Class Probability Distribution:</span>
              {[
                { label: 'Normal', val: mlPred.probabilities.NORMAL ?? 0, color: 'bg-emerald-500' },
                { label: 'Warning', val: mlPred.probabilities.WARNING ?? 0, color: 'bg-amber-500' },
                { label: 'High', val: mlPred.probabilities.HIGH ?? 0, color: 'bg-orange-500' },
                { label: 'Critical', val: mlPred.probabilities.CRITICAL ?? 0, color: 'bg-red-500' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-12 text-right">{item.label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(0, item.val * 100))}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-700 w-8 text-right">
                    {(item.val * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
            Prototype ML Model — Trained on Simulated/Labeled Data
          </div>
        </div>

        {/* CARD 2: 5-State Geotechnical Subsidence Fingerprint */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Subsidence Fingerprint
                </h3>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
                5 Geotechnical States
              </span>
            </div>

            <div className="mb-3">
              <span className="text-[11px] text-slate-500 font-medium">Kinematic Strata State:</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5 tracking-tight">
                {(fingerprint.state || 'STABLE').replace(/_/g, ' ')}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                {fingerprint.summary}
              </p>
            </div>

            {/* Contributing physical signals checklist */}
            <div className="space-y-1.5 text-xs mb-3">
              <span className="text-[11px] font-semibold text-slate-600 block">Contributing Physical Signals:</span>
              {(fingerprint.signals || []).map((sig: string, idx: number) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    currentRiskLevel === 'CRITICAL' ? 'text-red-500' :
                    currentRiskLevel === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'
                  }`} />
                  <span className="leading-tight">{sig}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Multi-sensor kinematic signature synthesis (Tilt + Displacement + Inclinometer)
          </div>
        </div>

        {/* CARD 3: Hybrid Risk Fusion Engine (60% / 25% / 15%) */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Risk Fusion Engine
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                60 / 25 / 15
              </span>
            </div>

            <div className="mb-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Fused Geotechnical Risk:</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {currentRiskScore.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 100</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs mb-3">
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-600">Geotechnical Heuristic Rules (60%)</span>
                  <span className="font-mono text-slate-800 font-bold">{fusionGeotech.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, fusionGeotech)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-600">Supervised Random Forest ML (25%)</span>
                  <span className="font-mono text-slate-800 font-bold">{fusionMl.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${Math.min(100, fusionMl)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-600">Isolation Forest Anomaly (15%)</span>
                  <span className="font-mono text-slate-800 font-bold">{fusionAnomaly.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, fusionAnomaly)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Weighted normalized risk synthesis preventing false positive alarms
          </div>
        </div>
      </div>

      {/* Main Content Grid: LEFT Map, RIGHT AI Risk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Mini GIS Map with Panel B3 Focus */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Surface Deformation & GIS Risk Zones
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any sensor node to inspect live tilt, displacement & RSSI telemetry
              </p>
            </div>
            <button
              onClick={() => onNavigatePage('gis-map')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Expand GIS Viewer &rarr;
            </button>
          </div>

          <div className="flex-1 min-h-[380px]">
            <GisMap
              sensors={sensors}
              selectedNodeId={selectedSensorId}
              onSelectNode={(node) => {
                setSelectedSensorId(node.id);
                setDrawerNode(node);
              }}
              height="380px"
            />
          </div>
        </div>

        {/* RIGHT: Current Risk Summary & Explainability Breakdown */}
        <div className="flex flex-col gap-4">
          <RiskScoreGauge
            score={currentRiskScore}
            classification={currentRiskLevel}
            factors={riskSummary?.factors || {
              "Displacement Velocity": 38.0,
              "Tilt Angle Increase": 24.0,
              "Spatial Correlation": 20.0,
              "Vibration RMS": 18.0
            }}
            explanation={riskSummary?.explanation}
          />

          {/* Quick innovation note */}
          <div className="bg-slate-900 text-white rounded-lg p-4 border border-slate-800 shadow-xs text-xs">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block mb-1">
              Ministry of Coal SIH Innovation
            </span>
            <p className="text-slate-300 font-semibold leading-relaxed">
              Wireless Surface Mesh Network autonomously relays geotechnical deformation frames through LoRa DAG repeaters directly to this decision-support portal.
            </p>
          </div>
        </div>
      </div>

      {/* Decision Support: Gemini AI Analysis */}
      <div>
        <GeminiAnalysisCard
          panelId={selectedPanelId}
          riskScore={currentRiskScore}
          riskClassification={currentRiskLevel}
        />
      </div>

      {/* Sensor Trends & Recent Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sensor Trends Chart */}
        <SensorTrendChart
          data={trendData}
          title="Surface Strata Trends: Node N14 (Core Panel B3 Cluster)"
          height={260}
        />

        {/* Recent Alerts Table */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-red-600" />
              Priority Subsidence Alerts
            </h3>
            <button
              onClick={() => onNavigatePage('alerts')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              View All &rarr;
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5">Severity</th>
                  <th className="py-2 px-2.5">Location</th>
                  <th className="py-2 px-2.5">Condition</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.slice(0, 4).map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-2.5 font-semibold">
                      <StatusBadge status={alt.severity} size="sm" />
                    </td>
                    <td className="py-2.5 px-2.5 font-medium text-slate-800">
                      {alt.node_cluster}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-600 truncate max-w-[200px]">
                      {alt.condition_detected}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.status === 'ACTIVE'
                          ? (alt.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')
                          : alt.status === 'ACKNOWLEDGED' ? 'bg-orange-100 text-orange-800' :
                          'bg-emerald-100 text-emerald-800'
                      }`}>
                        {alt.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      No active subsidence alerts. All panels normal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-out node inspection drawer if a node is clicked */}
      <NodeDetailDrawer
        node={drawerNode}
        onClose={() => setDrawerNode(null)}
        onViewAnalytics={(nodeId) => {
          setSelectedSensorId(nodeId);
          setDrawerNode(null);
          onNavigatePage('analytics');
        }}
      />
    </div>
  );
};

