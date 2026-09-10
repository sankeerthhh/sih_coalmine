import React, { useEffect } from 'react';
import { X, Battery, Wifi, Activity, AlertTriangle, Clock, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { SensorNode } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useSensorStore } from '../../store/sensorStore';
import { getCalculatedNodeStatus, getActiveAlertForNode } from '../../utils/statusUtils';

interface NodeDetailDrawerProps {
  node: SensorNode | null;
  onClose: () => void;
  onViewAnalytics?: (nodeId: string) => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({ node, onClose, onViewAnalytics }) => {
  const { activeScenario, alerts } = useSensorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!node) return null;

  const calculatedStatus = getCalculatedNodeStatus(node, activeScenario, alerts);
  const activeAlert = getActiveAlertForNode(node, alerts);
  const reading = node.latest_reading;
  const resultantTilt = reading 
    ? Math.sqrt(reading.tilt_x**2 + reading.tilt_y**2).toFixed(2)
    : '0.00';

  return (
    <>
      {/* Backdrop overlay for outside-click dismissal */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[9990] transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 z-[9995] flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header with Back Button */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{node.id}</h2>
              <StatusBadge status={calculatedStatus} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{node.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Back to dashboard / Close"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-semibold text-xs transition cursor-pointer border border-slate-300 bg-white shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

      {/* Drawer Content */}
      <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
        {/* Active Alert Banner */}
        {activeAlert && (
          <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
            activeAlert.severity === 'CRITICAL'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
              activeAlert.severity === 'CRITICAL' ? 'text-red-600 animate-pulse' : 'text-amber-600'
            }`} />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[11px] uppercase tracking-wider">
                  Active {activeAlert.severity} Alert
                </span>
                <span className="text-[10px] font-mono px-1 bg-white/80 rounded border border-current">
                  {activeAlert.id}
                </span>
              </div>
              <p className="font-semibold text-xs leading-snug">{activeAlert.title}</p>
              <p className="text-[11px] text-slate-600">{activeAlert.condition_detected}</p>
            </div>
          </div>
        )}

        {/* Geographic & Mesh Location */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Underground Panel:</span>
            <span className="font-semibold text-slate-800">{node.panel_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Surface Coordinates:</span>
            <span className="font-mono text-slate-800">{node.latitude.toFixed(4)}°N, {node.longitude.toFixed(4)}°E</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mesh Parent Hop:</span>
            <span className="font-semibold text-blue-700">{node.mesh_parent_id || 'Gateway Direct'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Hardware Model:</span>
            <span className="text-slate-700 font-mono text-[11px]">{node.hardware_model}</span>
          </div>
        </div>

        {/* Live Geotechnical Telemetry Readings */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Live Geotechnical Telemetry
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white border border-slate-200 rounded p-3">
              <span className="text-slate-500 block text-[11px]">Resultant Tilt</span>
              <span className="text-lg font-bold text-slate-900">{resultantTilt}°</span>
              <span className="block text-[10px] text-slate-400">X: {reading?.tilt_x ?? 0}° | Y: {reading?.tilt_y ?? 0}°</span>
            </div>

            <div className="bg-white border border-slate-200 rounded p-3">
              <span className="text-slate-500 block text-[11px]">Displacement</span>
              <span className="text-lg font-bold text-slate-900">{reading?.displacement?.toFixed(1) ?? '0.0'} mm</span>
              <span className="block text-[10px] text-slate-400">Surface stretch</span>
            </div>

            <div className="bg-white border border-slate-200 rounded p-3">
              <span className="text-slate-500 block text-[11px]">Vibration (RMS)</span>
              <span className="text-lg font-bold text-slate-900">{reading?.vibration?.toFixed(2) ?? '0.00'}</span>
              <span className="block text-[10px] text-slate-400">mm/s velocity</span>
            </div>

            <div className="bg-white border border-slate-200 rounded p-3">
              <span className="text-slate-500 block text-[11px]">Crack Initiation Wire</span>
              <span className={`text-sm font-bold ${reading?.crack_detected ? 'text-red-600' : 'text-emerald-700'}`}>
                {reading?.crack_detected ? 'SEVERED' : 'INTACT'}
              </span>
              <span className="block text-[10px] text-slate-400">Tension circuit</span>
            </div>
          </div>
        </div>

        {/* Node Health & Connectivity */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-blue-600" />
            Node Health & LoRa Link
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-2">
                <Battery className={`w-4 h-4 ${node.battery_level < 20 ? 'text-red-500' : 'text-emerald-600'}`} />
                <span className="text-slate-700">Battery Level</span>
              </div>
              <span className="font-bold text-slate-900">{node.battery_level.toFixed(1)}%</span>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700">LoRa Signal (RSSI)</span>
              </div>
              <span className="font-bold text-slate-900">{node.signal_strength_rssi} dBm</span>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">Last Telemetry Packet</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {new Date(node.last_seen_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Footer Action */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2 sticky bottom-0 z-10">
        <button
          onClick={() => onViewAnalytics && onViewAnalytics(node.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition cursor-pointer shadow-xs"
        >
          <span>View Historical Analytics for {node.id}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs border border-slate-300 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Dashboard / Close</span>
        </button>
      </div>
    </div>
  </>
);
};
