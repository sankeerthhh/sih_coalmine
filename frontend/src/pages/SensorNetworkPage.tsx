import React, { useEffect, useState } from 'react';
import { Network, Search, Filter, Battery, Wifi, Activity, ArrowUpDown } from 'lucide-react';
import { MeshVisualizer } from '../components/mesh/MeshVisualizer';
import { NodeDetailDrawer } from '../components/map/NodeDetailDrawer';
import { StatusBadge } from '../components/common/StatusBadge';
import { useSensorStore } from '../store/sensorStore';
import { api } from '../services/api';
import { MeshNetwork, SensorNode } from '../types';

interface SensorNetworkPageProps {
  onNavigatePage: (page: any) => void;
}

export const SensorNetworkPage: React.FC<SensorNetworkPageProps> = ({ onNavigatePage }) => {
  const { sensors, selectedSensorId, setSelectedSensorId } = useSensorStore();
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
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (node: SensorNode) => {
    setSelectedSensorId(node.id);
    setDrawerNode(node);
  };

  return (
    <div className="space-y-6">
      {/* 1. Wireless Surface Mesh Network Topology Visualizer */}
      <MeshVisualizer
        meshData={meshData}
        onSelectNode={(nodeId) => {
          const found = sensors.find(s => s.id === nodeId);
          if (found) handleRowClick(found);
        }}
      />

      {/* 2. Comprehensive Sensor Node Telemetry Table */}
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
                      <StatusBadge status={node.status} size="sm" />
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
