import React, { useState } from 'react';
import { Play, AlertTriangle, AlertCircle, Radio, WifiOff, RotateCcw, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useSensorStore } from '../../store/sensorStore';

export const DemoSimulatorBar: React.FC = () => {
  const { activeScenario, setActiveScenario } = useSensorStore();
  const [loading, setLoading] = useState(false);

  const handleTrigger = async (scenario: string) => {
    try {
      setLoading(true);
      const res = await api.triggerSimulatorScenario(scenario);
      setActiveScenario(res.current_scenario);
    } catch (err) {
      console.error("Simulator trigger error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1E293B] text-white px-4 py-2 flex flex-wrap items-center justify-between text-xs border-b border-slate-700 select-none shadow-inner">
      <div className="flex items-center gap-2">
        <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          SIH Demonstration Scenarios:
        </span>
        <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[11px] ${
          activeScenario === 'CRITICAL' || activeScenario === 'SUBSIDENCE_CRITICAL' ? 'bg-red-600 text-white' :
          activeScenario === 'EARLY_WARNING' ? 'bg-amber-500 text-slate-950' :
          activeScenario === 'SENSOR_FAILURE' || activeScenario === 'NETWORK_FAILURE' ? 'bg-orange-600 text-white' :
          'bg-emerald-600 text-white'
        }`}>
          {activeScenario}
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <button
          onClick={() => handleTrigger('NORMAL')}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-medium transition active:scale-95 disabled:opacity-50"
          title="Return all sensor telemetry to quiescent baseline"
        >
          <Play className="w-3 h-3" />
          Normal
        </button>

        <button
          onClick={() => handleTrigger('EARLY_WARNING')}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 font-medium transition active:scale-95 disabled:opacity-50"
          title="Simulate gradual tilt and displacement in Panel B3"
        >
          <AlertTriangle className="w-3 h-3" />
          Early Warning
        </button>

        <button
          onClick={() => handleTrigger('SUBSIDENCE_CRITICAL')}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/70 hover:bg-red-900/90 text-red-300 border border-red-500/50 font-bold transition active:scale-95 disabled:opacity-50"
          title="Simulate rapid ground subsidence and tension crack event"
        >
          <AlertCircle className="w-3 h-3 text-red-400" />
          Critical Subsidence
        </button>

        <button
          onClick={() => handleTrigger('SENSOR_FAILURE')}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-medium transition active:scale-95 disabled:opacity-50"
          title="Simulate Node N14 dropping offline"
        >
          <WifiOff className="w-3 h-3 text-orange-400" />
          Node Failure
        </button>

        <button
          onClick={() => handleTrigger('NETWORK_FAILURE')}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-medium transition active:scale-95 disabled:opacity-50"
          title="Simulate mesh repeater degradation"
        >
          <Radio className="w-3 h-3 text-yellow-400" />
          Mesh Degraded
        </button>

        <button
          onClick={() => handleTrigger('RESET')}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-500 font-medium transition active:scale-95 disabled:opacity-50"
          title="Reset simulation parameters"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
          Reset
        </button>
      </div>
    </div>
  );
};
