import React, { useState } from 'react';
import { Layers, Filter, Eye, ShieldAlert, Radio } from 'lucide-react';
import { GisMap } from '../components/map/GisMap';
import { NodeDetailDrawer } from '../components/map/NodeDetailDrawer';
import { useSensorStore } from '../store/sensorStore';
import { SensorNode } from '../types';

interface GisMapPageProps {
  onNavigatePage: (page: any) => void;
}

export const GisMapPage: React.FC<GisMapPageProps> = ({ onNavigatePage }) => {
  const { sensors, selectedSensorId, setSelectedSensorId, selectedPanelId, setSelectedPanelId } = useSensorStore();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [drawerNode, setDrawerNode] = useState<SensorNode | null>(null);

  const filteredSensors = sensors.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesPanel = selectedPanelId === 'ALL' || s.panel_id === selectedPanelId;
    return matchesStatus && matchesPanel;
  });

  const handleSelectNode = (node: SensorNode) => {
    setSelectedSensorId(node.id);
    setDrawerNode(node);
  };

  return (
    <div className="space-y-4">
      {/* Header Controls & Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Live GIS Strata Deformation & Risk Mapping
          </h2>
          <p className="text-xs text-slate-500">
            OpenStreetMap layer displaying 24 LoRa surface sensors and active depillaring boundaries
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Panel Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1">
            <span className="text-slate-500 font-medium">Panel:</span>
            <select
              value={selectedPanelId}
              onChange={(e) => setSelectedPanelId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Panels (5)</option>
              <option value="PANEL-B3">Panel B3 (Active Depillaring)</option>
              <option value="PANEL-B2">Panel B2 (Development)</option>
              <option value="PANEL-B1">Panel B1 (Continuous)</option>
              <option value="PANEL-A2">Panel A2 (Post-Depillared)</option>
              <option value="PANEL-A1">Panel A1 (Sealed Gaf)</option>
            </select>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            {['ALL', 'NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'].map((status) => (
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
        </div>
      </div>

      {/* Main Full-Size Map Canvas */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <GisMap
          sensors={filteredSensors}
          selectedNodeId={selectedSensorId}
          onSelectNode={handleSelectNode}
          height="660px"
          showPanelOverlays={true}
        />
      </div>

      {/* Node Inspection Drawer */}
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
