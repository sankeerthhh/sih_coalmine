import React, { useEffect, useState } from 'react';
import { Network, Search, Filter, Battery, Wifi, Activity, ArrowUpDown, ArrowLeft } from 'lucide-react';
import { MeshVisualizer } from '../components/mesh/MeshVisualizer';
import { NodeDetailDrawer } from '../components/map/NodeDetailDrawer';
import { StatusBadge } from '../components/common/StatusBadge';
import { useSensorStore } from '../store/sensorStore';
import { api } from '../services/api';
import { MeshNetwork, SensorNode } from '../types';
import { getCalculatedNodeStatus, getActiveAlertForNode } from '../utils/statusUtils';

interface SensorNetworkPageProps {
  onNavigatePage: (page: any) => void;
}

export const SensorNetworkPage: React.FC<SensorNetworkPageProps> = ({ onNavigatePage }) => {
  const { sensors, selectedSensorId, setSelectedSensorId, activeScenario, alerts } = useSensorStore();
  const [meshData, setMeshData] = useState<MeshNetwork | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [drawerNode, setDrawerNode] = useState<SensorNode | null>(null);

  useEffect(() => {
    api.getMeshNetwork().then(setMeshData).catch(console.error);
  }, [sensors]);

  const filteredSensors = sensors.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.panel_id.toLowerCase().includes(q);
    const calculatedStatus = getCalculatedNodeStatus(s, activeScenario, alerts);
    const matchesStatus = statusFilter === 'ALL' || calculatedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (node: SensorNode) => {
    setSelectedSensorId(node.id);
    setDrawerNode(node);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar with Breadcrumb and Back Button */}
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
            <span className="font-semibold text-slate-900">Sensor Network</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            Wireless Surface Mesh Network & Sensor Telemetry
          </h2>
          <p className="text-xs text-slate-500">
            Multi-hop LoRa DAG topology, link budgets, and real-time geotechnical telemetry
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

      {/* 1. Wireless Surface Mesh Network Topology Visualizer */}
      <MeshVisualizer
        meshData={meshData}
        onSelectNode={(nodeId) => {
          const found = sensors.find(s => s.id === nodeId);
          if (found) handleRowClick(found);
        }}
      />

      {/* 2. Live LoRa 865MHz Surface Mesh Radio Monitor */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 text-white shadow-xs space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-slate-200 uppercase tracking-wide">
              Live LoRa 865MHz Surface Mesh RF Gateway Monitor (IN865 Band)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Freq: <strong className="text-white">865.50 MHz</strong></span>
            <span>BW: <strong className="text-white">125 kHz</strong></span>
            <span>SF: <strong className="text-white">SF7</strong></span>
            <span>CR: <strong className="text-white">4/5</strong></span>
            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Gateway N01 Active
            </span>
          </div>
        </div>

        {/* Live Packet Log Stream */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <div className="text-slate-400 text-[10px]">LATEST RF HOP PATH</div>
            <div className="text-blue-400 font-bold mt-1">N14 → N13 → N12 → N09 → N01</div>
            <div className="text-slate-500 text-[10px]">Mesh Transit Delay: 42ms</div>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <div className="text-slate-400 text-[10px]">LINK BUDGET & RSSI</div>
            <div className="text-emerald-400 font-bold mt-1">-74 dBm (SNR: +8.5 dB)</div>
            <div className="text-slate-500 text-[10px]">0 Packet Dropped (CRC OK)</div>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <div className="text-slate-400 text-[10px]">HARDWARE PLATFORM</div>
            <div className="text-slate-200 font-bold mt-1">ESP32 + SX1262 LoRa</div>
            <div className="text-slate-500 text-[10px]">Power: 3.7V Solar Harvested</div>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <div className="text-slate-400 text-[10px]">INGESTION DAEMON</div>
            <div className="text-amber-400 font-bold mt-1">gateway_bridge.py</div>
            <div className="text-slate-500 text-[10px]">Mode: Dual (Serial / Virtual)</div>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Sensor Node Telemetry Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Surface Sensor Node Directory & Live Telemetry
            </h3>
            <p className="text-xs text-slate-500">
              Distributed sensor array monitoring tilt, surface displacement, vibration and crack initiation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
              {['ALL', 'ONLINE', 'WARNING', 'CRITICAL', 'OFFLINE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search node or panel..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-2.5 px-3">Node ID</th>
                <th className="py-2.5 px-3">Panel Section</th>
                <th className="py-2.5 px-3">Operational Status</th>
                <th className="py-2.5 px-3">Resultant Tilt</th>
                <th className="py-2.5 px-3">Displacement</th>
                <th className="py-2.5 px-3">Vibration</th>
                <th className="py-2.5 px-3">Crack Wire</th>
                <th className="py-2.5 px-3">Battery</th>
                <th className="py-2.5 px-3">LoRa RSSI</th>
                <th className="py-2.5 px-3">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSensors.map((node) => {
                const reading = node.latest_reading;
                const resultantTilt = reading 
                  ? Math.sqrt(reading.tilt_x**2 + reading.tilt_y**2).toFixed(2) 
                  : '0.00';
                const calculatedStatus = getCalculatedNodeStatus(node, activeScenario, alerts);
                const activeAlert = getActiveAlertForNode(node, alerts);

                return (
                  <tr
                    key={node.id}
                    onClick={() => handleRowClick(node)}
                    className="hover:bg-blue-50/40 cursor-pointer transition select-none"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${node.is_gateway ? 'bg-blue-600' : 'bg-slate-400'}`} />
                      {node.id}
                      {node.is_gateway && (
                        <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                          GW
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {node.panel_id}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={calculatedStatus} size="sm" />
                        {activeAlert && (
                          <span
                            title={`${activeAlert.title} (${activeAlert.id})`}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border flex items-center gap-1 ${
                              activeAlert.severity === 'CRITICAL'
                                ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            ⚠ {activeAlert.severity}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {resultantTilt}°
                    </td>

                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {reading?.displacement?.toFixed(1) ?? '0.0'} mm
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {reading?.vibration?.toFixed(2) ?? '0.00'} mm/s
                    </td>

                    <td className="py-2.5 px-3">
                      {reading?.crack_detected ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                          SEVERED
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Intact
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Battery className={`w-3.5 h-3.5 ${node.battery_level < 20 ? 'text-red-500' : 'text-emerald-600'}`} />
                        <span>{node.battery_level.toFixed(0)}%</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {node.signal_strength_rssi} dBm
                    </td>

                    <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono">
                      {node.last_seen_at ? new Date(node.last_seen_at).toLocaleTimeString() : 'Recent'}
                    </td>
                  </tr>
                );
              })}
              {filteredSensors.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No sensor nodes match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Node Detail Drawer */}
      <NodeDetailDrawer
        node={drawerNode}
        onClose={() => {
          setDrawerNode(null);
          setSelectedSensorId(null);
        }}
        onViewAnalytics={(nodeId) => {
          setSelectedSensorId(nodeId);
          setDrawerNode(null);
          onNavigatePage('analytics');
        }}
      />
    </div>
  );
};
