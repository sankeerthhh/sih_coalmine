import React, { useState } from 'react';
import { Settings, Sliders, ShieldAlert, Plus, Check, Save, Radio, Trash2 } from 'lucide-react';
import { useSensorStore } from '../store/sensorStore';

export const SettingsPage: React.FC = () => {
  const { sensors } = useSensorStore();

  const [warningThreshold, setWarningThreshold] = useState(30);
  const [highThreshold, setHighThreshold] = useState(60);
  const [criticalThreshold, setCriticalThreshold] = useState(80);
  const [samplingInterval, setSamplingInterval] = useState(6);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Node Form State
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodePanel, setNewNodePanel] = useState('PANEL-B3');
  const [newNodeLat, setNewNodeLat] = useState('22.3650');
  const [newNodeLon, setNewNodeLon] = useState('82.7570');
  const [nodeAddSuccess, setNodeAddSuccess] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeId) return;
    setNodeAddSuccess(true);
    setTimeout(() => {
      setNodeAddSuccess(false);
      setNewNodeId('');
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          Platform Administration & Geotechnical Threshold Settings
        </h2>
        <p className="text-xs text-slate-500">
          Configure safety classification thresholds, sensor sampling intervals, and node telemetry provisioning
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: AI Risk Thresholds */}
        <form onSubmit={handleSaveConfig} className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              AI Risk Classification Thresholds
            </h3>
            <p className="text-[11px] text-slate-500">
              Configurable scoring cutoffs for triggering early warnings and field inspection advisories
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Warning Threshold
                </span>
                <span className="font-mono text-slate-900">{warningThreshold} / 100</span>
              </div>
              <input
                type="range"
                min="20"
                max="50"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Triggers yellow advisory badge and heightened sampling
              </span>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 text-orange-700">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  High Risk Threshold
                </span>
                <span className="font-mono text-slate-900">{highThreshold} / 100</span>
              </div>
              <input
                type="range"
                min="50"
                max="75"
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Triggers orange advisory and cluster verification
              </span>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  Critical Subsidence Threshold
                </span>
                <span className="font-mono text-slate-900">{criticalThreshold} / 100</span>
              </div>
              <input
                type="range"
                min="75"
                max="95"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Generates high-priority critical alert & immediate field inspection notice
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                LoRa Telemetry Sampling Cadence
              </label>
              <select
                value={samplingInterval}
                onChange={(e) => setSamplingInterval(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
              >
                <option value={6}>6 Seconds (SIH Real-Time Demo Mode)</option>
                <option value={30}>30 Seconds (Fast Extraction Monitoring)</option>
                <option value={60}>1 Minute (Standard Field Production)</option>
                <option value={300}>5 Minutes (Quiescent Strata Battery Saver)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Thresholds Updated!' : 'Save Configuration'}</span>
          </button>
        </form>

        {/* Card 2: Provision New Sensor Node */}
        <form onSubmit={handleAddNode} className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              Provision New Surface Sensor Node
            </h3>
            <p className="text-[11px] text-slate-500">
              Register an ESP32 / SX1262 LoRa telemetry node to a mining panel
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Node ID (e.g. N25)
              </label>
              <input
                type="text"
                required
                value={newNodeId}
                onChange={(e) => setNewNodeId(e.target.value)}
                placeholder="N25"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Assigned Underground Panel
              </label>
              <select
                value={newNodePanel}
                onChange={(e) => setNewNodePanel(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-semibold"
              >
                <option value="PANEL-B3">Panel B3 (Active Depillaring)</option>
                <option value="PANEL-B2">Panel B2 (Development Section)</option>
                <option value="PANEL-B1">Panel B1 (Continuous Miner)</option>
                <option value="PANEL-A2">Panel A2 (Post-Depillared)</option>
                <option value="PANEL-A1">Panel A1 (Sealed Gaf)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Latitude (°N)</label>
                <input
                  type="text"
                  required
                  value={newNodeLat}
                  onChange={(e) => setNewNodeLat(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Longitude (°E)</label>
                <input
                  type="text"
                  required
                  value={newNodeLon}
                  onChange={(e) => setNewNodeLon(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mesh Parent Relay</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-700">
                <option value="N01">N01 (Gateway Direct Hop)</option>
                <option value="N12">N12 (Panel B3 Primary Repeater)</option>
                <option value="N15">N15 (Panel B3 Secondary Repeater)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            {nodeAddSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
            <span>{nodeAddSuccess ? 'Node Provisioned Successfully!' : 'Register Sensor Node'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
