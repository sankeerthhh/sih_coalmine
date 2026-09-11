import React, { useState } from 'react';
import {
  Play,
  AlertTriangle,
  AlertCircle,
  Radio,
  WifiOff,
  RotateCcw,
  Loader2,
  Cpu,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { useSensorStore } from '../../store/sensorStore';
import { DataSourceMode } from '../../types';

export const DemoSimulatorBar: React.FC = () => {
  const {
    activeScenario,
    setActiveScenario,
    applyLocalScenario,
    dataSourceMode,
    setDataSourceMode,
    isHardwareConnected,
    lastHardwareTelemetryAt
  } = useSensorStore();
  const [loading, setLoading] = useState(false);

  const handleTrigger = async (scenario: string) => {
    // Strictly prevent scenario changes if in HARDWARE mode
    if (dataSourceMode === 'HARDWARE') return;

    try {
      setLoading(true);
      // Immediately transform local store state for instant visual feedback
      applyLocalScenario(scenario);
      // Also notify backend if online
      const res = await api.triggerSimulatorScenario(scenario);
      if (res?.current_scenario) {
        setActiveScenario(res.current_scenario);
      }
    } catch (err) {
      console.warn("Simulator backend notification deferred:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (mode: DataSourceMode) => {
    if (mode === dataSourceMode) return;
    try {
      setLoading(true);
      await setDataSourceMode(mode, true);
    } catch (err) {
      console.warn("Failed to switch data source mode:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0F172A] text-white px-4 py-2 flex flex-wrap items-center justify-between text-xs border-b border-slate-700 select-none shadow-md gap-3">
      {/* Left: Mode Toggle & Provenance Badge */}
      <div className="flex items-center flex-wrap gap-2.5">
        <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 text-[11px]">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          Data Source:
        </span>

        {/* High-visibility Mode Switcher */}
        <div className="inline-flex rounded-lg p-0.5 bg-slate-900 border border-slate-700 shadow-inner">
          <button
            onClick={() => handleModeChange('SIMULATION')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
              dataSourceMode === 'SIMULATION'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to Synthetic Geotechnical Simulation / Demo Data"
          >
            <Layers className="w-3 h-3" />
            SIMULATION / DEMO
          </button>

          <button
            onClick={() => handleModeChange('HARDWARE')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
              dataSourceMode === 'HARDWARE'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to Real ESP32 / LoRa Surface Mesh Sensor Hardware Telemetry"
          >
            <Activity className="w-3 h-3" />
            LIVE HARDWARE
          </button>
        </div>

        {/* Clear Data Mode Label */}
        {dataSourceMode === 'SIMULATION' ? (
          <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40 font-mono font-bold uppercase text-[10px] tracking-wide">
            SIMULATION / DEMO DATA
          </span>
        ) : isHardwareConnected ? (
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-mono font-bold uppercase text-[10px] tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE HARDWARE STREAMING
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/50 font-mono font-bold uppercase text-[10px] tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            HARDWARE STANDBY (DISCONNECTED)
          </span>
        )}
      </div>

      {/* Right: Scenarios (Simulation) OR Hardware Status (Hardware Mode) */}
      {dataSourceMode === 'SIMULATION' ? (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Scenario Indicator */}
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="text-[11px] text-slate-400">Scenarios:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[11px] ${
              activeScenario === 'CRITICAL' || activeScenario === 'SUBSIDENCE_CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
              activeScenario === 'EARLY_WARNING' ? 'bg-amber-500 text-slate-950' :
              activeScenario === 'SENSOR_FAILURE' || activeScenario === 'NETWORK_FAILURE' ? 'bg-orange-600 text-white' :
              'bg-emerald-600 text-white'
            }`}>
              {activeScenario}
            </span>
          </div>

          {/* 6 Simulation Scenario Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => handleTrigger('NORMAL')}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-medium transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Return all sensor telemetry to quiescent baseline"
            >
              <Play className="w-3 h-3" />
              Normal
            </button>

            <button
              onClick={() => handleTrigger('EARLY_WARNING')}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 font-medium transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Simulate gradual tilt and displacement in Panel B3"
            >
              <AlertTriangle className="w-3 h-3" />
              Early Warning
            </button>

            <button
              onClick={() => handleTrigger('SUBSIDENCE_CRITICAL')}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/70 hover:bg-red-900/90 text-red-300 border border-red-500/50 font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Simulate rapid ground subsidence and tension crack event"
            >
              <AlertCircle className="w-3 h-3 text-red-400" />
              Critical Subsidence
            </button>

            <button
              onClick={() => handleTrigger('SENSOR_FAILURE')}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-medium transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Simulate Node N14 dropping offline"
            >
              <WifiOff className="w-3 h-3 text-orange-400" />
              Node Failure
            </button>

            <button
              onClick={() => handleTrigger('NETWORK_FAILURE')}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-medium transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Simulate mesh repeater degradation"
            >
              <Radio className="w-3 h-3 text-yellow-400" />
              Mesh Degraded
            </button>

            <button
              onClick={() => handleTrigger('RESET')}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-500 font-medium transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Reset simulation parameters"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Reset
            </button>
          </div>
        </div>
      ) : (
        /* LIVE HARDWARE Mode Status Banner */
        <div className="flex items-center gap-3 flex-wrap">
          {isHardwareConnected ? (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded text-emerald-200 text-xs font-semibold shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE TELEMETRY STREAMING</span>
              <span className="text-emerald-400 font-mono text-[11px]">
                {lastHardwareTelemetryAt ? `(Last packet: ${new Date(lastHardwareTelemetryAt).toLocaleTimeString()})` : '(Gateway Online)'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-950/70 border border-amber-500/60 px-3 py-1 rounded text-amber-200 text-xs font-medium shadow-inner">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-ping shrink-0" />
              <span className="font-bold tracking-wide text-amber-300">
                Waiting for physical hardware telemetry
              </span>
              <span className="hidden sm:inline text-amber-200/80 font-mono text-[11px]">
                &bull; Gateway Offline / Not Connected
              </span>
            </div>
          )}

          <div className="hidden lg:flex items-center text-slate-400 text-[11px] font-mono italic">
            (Scenarios locked in Hardware Mode)
          </div>
        </div>
      )}
    </div>
  );
};
