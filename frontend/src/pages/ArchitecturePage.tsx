import React from 'react';
import {
  Cpu,
  Radio,
  Server,
  Activity,
  Filter,
  Brain,
  Layers,
  Fingerprint,
  MapPin,
  Bell,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { PrototypeTechSpecs } from '../components/common/PrototypeTechSpecs';

interface ArchitecturePageProps {
  onNavigatePage: (page: any) => void;
}

export const ArchitecturePage: React.FC<ArchitecturePageProps> = ({ onNavigatePage }) => {
  const stages = [
    {
      step: 1,
      title: "Low-Cost Surface Sensor Nodes",
      subtitle: "ESP32 + IMU + Extensometer + Solar",
      desc: "Distributed sensor nodes deployed above underground coal extraction panels monitoring resultant surface tilt, vertical displacement, micro-vibration RMS, and crack wire continuity.",
      icon: <Cpu className="w-5 h-5 text-blue-600" />,
      color: "border-blue-200 bg-blue-50/50"
    },
    {
      step: 2,
      title: "Wireless Surface Mesh Network",
      subtitle: "LoRa 865MHz Multi-Hop DAG Topology",
      desc: "The primary technical innovation: nodes form an autonomous self-healing mesh relaying telemetry packets hop-by-hop across rugged coalfield terrain without cellular coverage.",
      icon: <Radio className="w-5 h-5 text-emerald-600" />,
      color: "border-emerald-200 bg-emerald-50/50"
    },
    {
      step: 3,
      title: "Local Sensor Gateway",
      subtitle: "LoRa Concentrator / gateway_bridge.py",
      desc: "Colliery surface gateway aggregates incoming RF packets, validates CRC checksums, and transmits telemetry to the central decision portal via serial or IP bridge.",
      icon: <Server className="w-5 h-5 text-purple-600" />,
      color: "border-purple-200 bg-purple-50/50"
    },
    {
      step: 4,
      title: "Real-Time Ingestion & Validation",
      subtitle: "FastAPI REST + WebSocket Daemon",
      desc: "Validates physical feasibility: flags out-of-bound tilt (>45°), negative displacement jumps, and sudden velocity spikes before committing to local SQLite / Postgres DB.",
      icon: <Filter className="w-5 h-5 text-amber-600" />,
      color: "border-amber-200 bg-amber-50/50"
    },
    {
      step: 5,
      title: "Noise Filtering & Feature Extraction",
      subtitle: "Resultant Vector & Rate of Change",
      desc: "Computes resultant tilt magnitude √(x²+y²), angular tilt rate (°/min), displacement velocity (mm/min), smoothed vibration RMS, and spatial cluster deviation.",
      icon: <Activity className="w-5 h-5 text-cyan-600" />,
      color: "border-cyan-200 bg-cyan-50/50"
    },
    {
      step: 6,
      title: "Dual AI/ML Inference Pipeline",
      subtitle: "Isolation Forest + Supervised Random Forest",
      desc: "Isolation Forest detects multi-sensor statistical anomalies. Supervised Random Forest predicts risk class (Normal, Warning, High, Critical) with full probability distributions.",
      icon: <Brain className="w-5 h-5 text-indigo-600" />,
      color: "border-indigo-200 bg-indigo-50/50"
    },
    {
      step: 7,
      title: "Transparent Risk Fusion Engine",
      subtitle: "60% Geotech + 25% ML + 15% Anomaly",
      desc: "Synthesizes geotechnical physical heuristics, Random Forest probability-weighted severity, and anomaly score into an explainable 0–100 colliery safety index.",
      icon: <Layers className="w-5 h-5 text-rose-600" />,
      color: "border-rose-200 bg-rose-50/50"
    },
    {
      step: 8,
      title: "Subsidence Fingerprint Engine",
      subtitle: "5 Discrete Regimes & Signal Checklist",
      desc: "Synthesizes multiple physical signals into distinct states: STABLE, EARLY DEFORMATION, PROGRESSIVE SUBSIDENCE, ACCELERATING SUBSIDENCE, or CRITICAL DEFORMATION.",
      icon: <Fingerprint className="w-5 h-5 text-violet-600" />,
      color: "border-violet-200 bg-violet-50/50"
    },
    {
      step: 9,
      title: "Spatial Clustering & GIS Risk Zones",
      subtitle: "Multi-Node Basin & Angle of Draw (21°)",
      desc: "Correlates adjacent mesh sensors to delineate active subsidence troughs. Projects influence boundaries and risk contours on interactive Leaflet GIS strata maps.",
      icon: <MapPin className="w-5 h-5 text-teal-600" />,
      color: "border-teal-200 bg-teal-50/50"
    },
    {
      step: 10,
      title: "Early Warning & Gemini AI Advisory",
      subtitle: "5-Tier Early Warning + Multi-Channel Alerts",
      desc: "Autonomous early warning engine triggers SMS, Email, and Siren alerts. Gemini AI provides structured geotechnical explanations and DGMS regulatory field guidance.",
      icon: <Bell className="w-5 h-5 text-red-600" />,
      color: "border-red-200 bg-red-50/50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
            <button
              onClick={() => onNavigatePage('dashboard')}
              className="hover:text-blue-600 font-medium cursor-pointer"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-900">System Architecture</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            End-to-End System Architecture & Telemetry Pipeline
          </h2>
          <p className="text-xs text-slate-500">
            How the platform functions from surface sensor mesh nodes to AI risk fusion and colliery early warning
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigatePage('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition cursor-pointer border border-slate-300 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Hero Banner for SIH Judges */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            SIH Problem Statement Core Innovation
          </span>
        </div>
        <h3 className="text-base font-bold text-white tracking-tight">
          Wireless Surface Mesh Sensor Network for Real-Time Underground Mine Subsidence Monitoring
        </h3>
        <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
          Traditional subsidence surveying relies on periodic manual total station optical surveys with delays of weeks to months. This platform deploys an autonomous, solar-harvested <strong>wireless surface mesh network</strong> directly above underground depillaring panels, streaming continuous 6-second multi-parameter geotechnical telemetry through an end-to-end AI/ML risk fusion pipeline.
        </p>

        {/* 1-Line Judge Pipeline Summary */}
        <div className="p-3 bg-slate-800/90 rounded-md border border-slate-700 font-mono text-[11px] text-blue-300 flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <span>Surface Nodes</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span>LoRa Mesh DAG</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Gateway</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Validation</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Isolation Forest</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Random Forest</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Risk Fusion (60/25/15)</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Fingerprint</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span>GIS Zones</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Early Warning</span>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="text-emerald-400 font-bold">Gemini AI</span>
        </div>
      </div>

      {/* 10-Stage Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {stages.map((stage) => (
          <div
            key={stage.step}
            className={`p-4 rounded-lg border ${stage.color} flex flex-col justify-between space-y-3 bg-white shadow-2xs hover:shadow-xs transition`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                  {stage.step}
                </span>
                <div className="p-1.5 bg-white rounded-md border border-slate-200 shadow-2xs">
                  {stage.icon}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{stage.title}</h4>
                <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">{stage.subtitle}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {stage.desc}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Fully Implemented</span>
            </div>
          </div>
        ))}
      </div>

      {/* Low-Cost Student Prototype Specs */}
      <PrototypeTechSpecs />
    </div>
  );
};
