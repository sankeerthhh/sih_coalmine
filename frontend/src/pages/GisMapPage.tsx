import React, { useState } from 'react';
import { Layers, Filter, Eye, ShieldAlert, Radio, ArrowLeft } from 'lucide-react';
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
      {/* Header Controls & Filter Bar with Back Button */}
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
            <span className="font-semibold text-slate-900">Live GIS Map</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Live GIS Strata Deformation & Risk Mapping
          </h2>
          <p className="text-xs text-slate-500">
            Multi-layer GIS strata mapping (Satellite Imagery, Tactical Dark, Topo, Street) with live LoRa surface sensors, strain links, and AI subsidence basin
          </p>
        </div>

        {/* Right: Filters and Back Button */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onNavigatePage('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition cursor-pointer border border-slate-300 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
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
