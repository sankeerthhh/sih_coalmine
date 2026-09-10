import React, { useState } from 'react';
import { Settings, Sliders, ShieldAlert, Plus, Check, Save, Radio, Trash2, ArrowLeft, UserCheck, Phone, Clock, MapPin, Pencil, X } from 'lucide-react';
import { useSensorStore, Supervisor } from '../store/sensorStore';
import { SensorNode } from '../types';
import { getCalculatedNodeStatus } from '../utils/statusUtils';

interface SettingsPageProps {
  onNavigatePage?: (page: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigatePage }) => {
  const { 
    sensors, 
    thresholds, 
    updateThresholds, 
    addSensor, 
    updateSensor,
    removeSensor, 
    supervisors, 
    addSupervisor, 
    updateSupervisor, 
    removeSupervisor,
    activeScenario,
    alerts
  } = useSensorStore();

  const [warningThreshold, setWarningThreshold] = useState(thresholds.warningThreshold);
  const [highThreshold, setHighThreshold] = useState(thresholds.highThreshold);
  const [criticalThreshold, setCriticalThreshold] = useState(thresholds.criticalThreshold);
  const [samplingInterval, setSamplingInterval] = useState(thresholds.samplingInterval);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Node Form State
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodePanel, setNewNodePanel] = useState('PANEL-B3');
  const [newNodeLat, setNewNodeLat] = useState('22.3650');
  const [newNodeLon, setNewNodeLon] = useState('82.7570');
  const [nodeAddSuccess, setNodeAddSuccess] = useState(false);

  // Node Edit Modal State
  const [editingNode, setEditingNode] = useState<SensorNode | null>(null);
  const [editNodeName, setEditNodeName] = useState('');
  const [editNodePanel, setEditNodePanel] = useState('PANEL-B3');
  const [editNodeLat, setEditNodeLat] = useState('22.3650');
  const [editNodeLon, setEditNodeLon] = useState('82.7570');
  const [editNodeModel, setEditNodeModel] = useState('');
  const [editNodeParent, setEditNodeParent] = useState('N01');
  const [editNodeIsGateway, setEditNodeIsGateway] = useState(false);
  const [editNodeStatus, setEditNodeStatus] = useState<'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE'>('ONLINE');
  const [nodeEditSuccess, setNodeEditSuccess] = useState(false);

  // Supervisor Form State (Enrollment)
  const [supName, setSupName] = useState('');
  const [supRole, setSupRole] = useState('Shift Safety Overman');
  const [supPhone, setSupPhone] = useState('+91 ');
  const [supShift, setSupShift] = useState('Morning (06:00 - 14:00)');
  const [supPanel, setSupPanel] = useState('PANEL-B3');
  const [supAddSuccess, setSupAddSuccess] = useState(false);

  // Supervisor Edit Modal State
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editPanel, setEditPanel] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const handleOpenEditNode = (sensor: SensorNode) => {
    setEditingNode(sensor);
    setEditNodeName(sensor.name || `Surface Sensor ${sensor.id}`);
    setEditNodePanel(sensor.panel_id || 'PANEL-B3');
    setEditNodeLat(sensor.latitude !== undefined ? sensor.latitude.toString() : '22.3650');
    setEditNodeLon(sensor.longitude !== undefined ? sensor.longitude.toString() : '82.7570');
    setEditNodeModel(sensor.hardware_model || 'SEM-LR200 Inclinometer');
    setEditNodeParent(sensor.mesh_parent_id || 'N01');
    setEditNodeIsGateway(sensor.is_gateway || false);
    setEditNodeStatus((sensor.status as any) || 'ONLINE');
    setNodeEditSuccess(false);
  };

  const handleSaveEditNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    updateSensor(editingNode.id, {
      name: editNodeName.trim(),
      panel_id: editNodePanel,
      latitude: parseFloat(editNodeLat) || editingNode.latitude,
      longitude: parseFloat(editNodeLon) || editingNode.longitude,
      hardware_model: editNodeModel.trim(),
      mesh_parent_id: editNodeIsGateway ? null : (editNodeParent === 'NONE' ? null : editNodeParent),
      is_gateway: editNodeIsGateway,
      status: editNodeStatus
    });

    setNodeEditSuccess(true);
    setTimeout(() => {
      setNodeEditSuccess(false);
      setEditingNode(null);
    }, 1200);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds({
      warningThreshold,
      highThreshold,
      criticalThreshold,
      samplingInterval
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeId.trim()) return;
    const formattedId = newNodeId.trim().toUpperCase();
    const nodeObj: SensorNode = {
      id: formattedId,
      panel_id: newNodePanel,
      name: `Surface Sensor ${formattedId}`,
      latitude: parseFloat(newNodeLat) || 22.3650,
      longitude: parseFloat(newNodeLon) || 82.7570,
      hardware_model: "ESP32-SX1262-TiltNode",
      mesh_parent_id: "N10",
      is_gateway: false,
      status: "ONLINE",
      battery_level: 95.0,
      signal_strength_rssi: -68,
      last_seen_at: new Date().toISOString(),
      latest_reading: {
        id: Date.now(),
        node_id: formattedId,
        timestamp: new Date().toISOString(),
        tilt_x: 0.14,
        tilt_y: 0.17,
        displacement: 1.2,
        vibration: 0.08,
        crack_detected: false,
        battery_level: 95.0,
        signal_strength: -68,
        anomaly_score: 11.2,
        is_outlier: false,
        resultant_tilt: 0.22
      }
    };
    addSensor(nodeObj);
    setNodeAddSuccess(true);
    setTimeout(() => {
      setNodeAddSuccess(false);
      setNewNodeId('');
    }, 2500);
  };

  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    const newSup: Supervisor = {
      id: `SUP-${Date.now().toString().slice(-4)}`,
      name: supName.trim(),
      designation: supRole,
      phone: supPhone.trim() || '+91 94415 62832',
      shift: supShift,
      assignedPanel: supPanel
    };
    addSupervisor(newSup);
    setSupAddSuccess(true);
    setTimeout(() => {
      setSupAddSuccess(false);
      setSupName('');
      setSupPhone('+91 ');
    }, 2500);
  };

  const handleOpenEdit = (sup: Supervisor) => {
    setEditingSupervisor(sup);
    setEditName(sup.name);
    setEditRole(sup.designation);
    setEditPhone(sup.phone);
    setEditShift(sup.shift);
    setEditPanel(sup.assignedPanel);
  };

  const handleSaveSupervisorEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupervisor || !editName.trim()) return;
    updateSupervisor(editingSupervisor.id, {
      name: editName.trim(),
      designation: editRole,
      phone: editPhone.trim(),
      shift: editShift,
      assignedPanel: editPanel
    });
    setEditSuccess(true);
    setTimeout(() => {
      setEditSuccess(false);
      setEditingSupervisor(null);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header with Back to Dashboard Button */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            Platform Administration & Safety Roster Settings
          </h2>
          <p className="text-xs text-slate-500">
            Configure safety thresholds, sensor node provisioning, and mine supervisor duty rosters
          </p>
        </div>

        {onNavigatePage && (
          <button
            type="button"
            onClick={() => onNavigatePage('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition cursor-pointer border border-slate-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        )}
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

      {/* Card 3: Provisioned Surface Sensors Directory & Management */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              Provisioned Node Registry ({sensors.length} Active Hardware Units)
            </h3>
            <p className="text-[11px] text-slate-500">
              Live hardware telemetry units communicating via LoRa mesh
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded border border-slate-200">
              Cadence: {samplingInterval}s
            </span>
            <button
              type="button"
              onClick={() => handleOpenEditNode(sensors[0])}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-xs transition cursor-pointer shadow-2xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Nodes</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          {sensors.map((sensor) => {
            const calculatedStatus = getCalculatedNodeStatus(sensor, activeScenario, alerts);
            return (
              <div
                key={sensor.id}
                onClick={() => handleOpenEditNode(sensor)}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-xs flex items-center justify-between transition cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-blue-600 transition">
                    <span className={`w-2 h-2 rounded-full ${
                      calculatedStatus === 'CRITICAL' ? 'bg-red-600' :
                      calculatedStatus === 'WARNING' ? 'bg-amber-500' :
                      calculatedStatus === 'OFFLINE' ? 'bg-slate-400' : 'bg-emerald-600'
                    }`} />
                    {sensor.id}
                    {sensor.is_gateway && (
                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-bold">
                        GW
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {sensor.panel_id}
                  </span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditNode(sensor);
                    }}
                    title={`Edit node ${sensor.id} configuration`}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition cursor-pointer shadow-2xs"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                    <span>Edit</span>
                  </button>
                  {!sensor.is_gateway && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSensor(sensor.id);
                      }}
                      title={`Deprovision node ${sensor.id}`}
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Mine Safety Supervisors & Shift In-Charge Directory */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Mine Safety Supervisors & Shift In-Charge Roster
            </h3>
            <p className="text-xs text-slate-500">
              Designated statutory safety officers and shift in-charges receiving automated early warning SMS broadcasts
            </p>
          </div>
        </div>

        {/* Form to Enroll New Supervisor */}
        <form onSubmit={handleAddSupervisor} className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 space-y-4 text-xs">
          <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Enroll New Mine Supervisor / Safety Officer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 text-[11px]">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Er. Sai Sankeerth Reddy"
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-[11px]">Designation / Role</label>
              <select
                value={supRole}
                onChange={(e) => setSupRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Mine Safety Officer (SECL)">Mine Safety Officer (SECL)</option>
                <option value="Surface Geotechnical In-Charge">Surface Geotechnical In-Charge</option>
                <option value="Shift Safety Overman">Shift Safety Overman</option>
                <option value="First Class Mine Manager">First Class Mine Manager</option>
                <option value="Wireless Mesh Field Engineer">Wireless Mesh Field Engineer</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-[11px]">Contact (SMS Alert Target)</label>
              <input
                type="tel"
                placeholder="+91 94415 62832"
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-[11px]">Assigned Shift</label>
              <select
                value={supShift}
                onChange={(e) => setSupShift(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</option>
                <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                <option value="General Shift (09:00 - 17:00)">General Shift (09:00 - 17:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-[11px]">Monitored Panel</label>
              <select
                value={supPanel}
                onChange={(e) => setSupPanel(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="PANEL-B3">Panel B3 (Active Depillaring)</option>
                <option value="PANEL-B2">Panel B2 (Development Section)</option>
                <option value="PANEL-B1">Panel B1 (Continuous Miner)</option>
                <option value="PANEL-A2">Panel A2 (Post-Depillared)</option>
                <option value="PANEL-A1">Panel A1 (Sealed Gaf)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enroll Supervisor into Roster</span>
            </button>
            {supAddSuccess && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Supervisor added and registered for early warning SMS!
              </span>
            )}
          </div>
        </form>

        {/* Current Active Supervisors Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3">Supervisor Name</th>
                <th className="p-3">Designation / Statutory Role</th>
                <th className="p-3">Contact (SMS Target)</th>
                <th className="p-3">Assigned Shift</th>
                <th className="p-3">Mining Sector</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {supervisors.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {sup.name}
                  </td>
                  <td className="p-3 font-medium text-slate-800">{sup.designation}</td>
                  <td className="p-3 font-mono text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {sup.phone}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {sup.shift}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-blue-700">{sup.assignedPanel}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sup)}
                        title={`Edit details for ${sup.name}`}
                        className="flex items-center gap-1 px-2.5 py-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded text-xs font-semibold transition cursor-pointer border border-blue-200 shadow-2xs"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSupervisor(sup.id)}
                        title={`Remove ${sup.name}`}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {supervisors.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No supervisors currently enrolled. Use the form above to add mine safety officers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Supervisor Modal */}
      {editingSupervisor && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingSupervisor(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-300 overflow-hidden text-xs animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">Edit Mine Safety Supervisor ({editingSupervisor.id})</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingSupervisor(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSupervisorEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Supervisor Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Designation / Statutory Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                >
                  <option value="Mine Safety Officer (SECL)">Mine Safety Officer (SECL)</option>
                  <option value="Surface Geotechnical In-Charge">Surface Geotechnical In-Charge</option>
                  <option value="Shift Safety Overman">Shift Safety Overman</option>
                  <option value="First Class Mine Manager">First Class Mine Manager</option>
                  <option value="Wireless Mesh Field Engineer">Wireless Mesh Field Engineer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact (SMS Alert Broadcast Target)</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Shift</label>
                  <select
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                  >
                    <option value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</option>
                    <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                    <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                    <option value="General Shift (09:00 - 17:00)">General Shift (09:00 - 17:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mining Sector / Panel</label>
                  <select
                    value={editPanel}
                    onChange={(e) => setEditPanel(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                  >
                    <option value="Panel B3 (Active Depillaring)">Panel B3 (Active Depillaring)</option>
                    <option value="Panel B2 & B3">Panel B2 & B3</option>
                    <option value="Panel B2 (Development Section)">Panel B2 (Development Section)</option>
                    <option value="Panel B1 (Continuous Miner)">Panel B1 (Continuous Miner)</option>
                    <option value="Panel A2 (Post-Depillared)">Panel A2 (Post-Depillared)</option>
                    <option value="Panel A1 (Sealed Gaf)">Panel A1 (Sealed Gaf)</option>
                  </select>
                </div>
              </div>

              {editSuccess && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md p-2.5 flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Supervisor details successfully updated!</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSupervisor(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition cursor-pointer border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Provisioned Sensor Node Modal */}
      {editingNode && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingNode(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-300 overflow-hidden text-xs animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">
                  Configure Hardware Node {editingNode.id}
                  {editingNode.is_gateway && (
                    <span className="ml-2 text-[10px] bg-blue-500/30 text-blue-300 border border-blue-400/40 px-1.5 py-0.5 rounded font-mono font-bold">
                      GATEWAY
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingNode(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditNode} className="p-5 space-y-4">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                  <Pencil className="w-3 h-3 text-blue-600" />
                  <span>Select Node to Edit:</span>
                </span>
                <select
                  value={editingNode.id}
                  onChange={(e) => {
                    const target = sensors.find(s => s.id === e.target.value);
                    if (target) handleOpenEditNode(target);
                  }}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 font-bold text-blue-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  {sensors.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} {s.is_gateway ? '(Substation GW)' : `(${s.panel_id})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Node Identifier (UID)</label>
                  <input
                    type="text"
                    disabled
                    value={editingNode.id}
                    className="w-full bg-slate-100 border border-slate-300 rounded-md px-3 py-2 font-mono font-bold text-slate-500 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Underground Panel</label>
                  <select
                    value={editNodePanel}
                    onChange={(e) => setEditNodePanel(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                  >
                    <option value="PANEL-B3">Panel B3 (Active Depillaring)</option>
                    <option value="PANEL-B2">Panel B2 (Development Section)</option>
                    <option value="PANEL-B1">Panel B1 (Continuous Miner)</option>
                    <option value="PANEL-A2">Panel A2 (Post-Depillared)</option>
                    <option value="PANEL-A1">Panel A1 (Sealed Gaf)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Hardware Label / Friendly Name</label>
                <input
                  type="text"
                  value={editNodeName}
                  onChange={(e) => setEditNodeName(e.target.value)}
                  required
                  placeholder="e.g. Surface Displacement Sensor N14"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Hardware Sensor Model</label>
                <input
                  type="text"
                  value={editNodeModel}
                  onChange={(e) => setEditNodeModel(e.target.value)}
                  placeholder="e.g. SEM-LR200 Inclinometer & Extensometer"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Surface Latitude (°N)</label>
                  <input
                    type="text"
                    value={editNodeLat}
                    onChange={(e) => setEditNodeLat(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Surface Longitude (°E)</label>
                  <input
                    type="text"
                    value={editNodeLon}
                    onChange={(e) => setEditNodeLon(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mesh Parent Hop (Relay)</label>
                  <select
                    disabled={editNodeIsGateway}
                    value={editNodeIsGateway ? 'NONE' : editNodeParent}
                    onChange={(e) => setEditNodeParent(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="N01">N01 (Gateway Direct Hop)</option>
                    {sensors.filter(s => s.id !== editingNode.id && s.id !== 'N01').map(s => (
                      <option key={s.id} value={s.id}>{s.id} ({s.panel_id})</option>
                    ))}
                    <option value="NONE">None / Standalone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status Override</label>
                  <select
                    value={editNodeStatus}
                    onChange={(e) => setEditNodeStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                  >
                    <option value="ONLINE">ONLINE (Normal)</option>
                    <option value="WARNING">WARNING (Elevated)</option>
                    <option value="CRITICAL">CRITICAL (Breach)</option>
                    <option value="OFFLINE">OFFLINE (Disconnected)</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editNodeIsGateway}
                    onChange={(e) => setEditNodeIsGateway(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-800 font-semibold text-xs">
                    Designate as Primary Substation LoRa Gateway (GW)
                  </span>
                </label>
              </div>

              {nodeEditSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2 text-emerald-800 font-semibold text-xs animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hardware node {editingNode.id} updated and synchronized across all dashboards!</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
