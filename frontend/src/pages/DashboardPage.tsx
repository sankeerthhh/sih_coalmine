import React, { useEffect, useState } from 'react';
import {
  Radio,
  WifiOff,
  ShieldAlert,
  Bell,
  MapPin,
  Activity,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { GisMap } from '../components/map/GisMap';
import { NodeDetailDrawer } from '../components/map/NodeDetailDrawer';
import { RiskScoreGauge } from '../components/charts/RiskScoreGauge';
import { SensorTrendChart } from '../components/charts/SensorTrendChart';
import { useSensorStore } from '../store/sensorStore';
import { api } from '../services/api';
import { DashboardSummary, SensorNode } from '../types';

interface DashboardPageProps {
  onNavigatePage: (page: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigatePage }) => {
  const { sensors, selectedSensorId, setSelectedSensorId, riskSummary, alerts } = useSensorStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [drawerNode, setDrawerNode] = useState<SensorNode | null>(null);

  useEffect(() => {
    // Fetch summary
    api.getDashboardSummary().then(setSummary).catch(console.error);

    // Fetch trend readings for focus node N14
    api.getSensorReadings('N14', 24).then(setTrendData).catch(console.error);
  }, []);

  // Only update drawer telemetry if the drawer is currently open
  useEffect(() => {
    if (drawerNode) {
      const found = sensors.find(s => s.id === drawerNode.id);
      if (found) setDrawerNode(found);
    }
  }, [sensors]);

  const activeNodes = sensors.filter(s => s.status !== 'OFFLINE').length || 24;
  const offlineNodes = sensors.filter(s => s.status === 'OFFLINE').length;
  const currentRiskScore = riskSummary?.current_risk_score ?? summary?.current_risk_score ?? 14.5;
  const currentRiskLevel = riskSummary?.risk_classification ?? summary?.current_risk_level ?? 'NORMAL';

  return (
    <div className="space-y-6">
      {/* 5-Question Immediate Geotechnical Executive Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg text-white font-bold ${
            currentRiskLevel === 'CRITICAL' ? 'bg-red-600 animate-pulse' :
            currentRiskLevel === 'WARNING' ? 'bg-amber-500' :
            currentRiskLevel === 'HIGH' ? 'bg-orange-500' : 'bg-emerald-600'
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Current Safety Assessment:
              </h2>
              <StatusBadge status={currentRiskLevel} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentRiskLevel === 'CRITICAL'
                ? "Abnormal surface deformation detected in Panel B3 depillaring cluster. Field inspection recommended."
                : currentRiskLevel === 'WARNING'
                ? "Developing tilt & displacement trend observed in Panel B3. Heightened monitoring active."
                : "All panels within permissible geotechnical tolerance limits. Normal operations."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigatePage('alerts')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md border border-slate-300 transition flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-red-600" />
            <span>Active Alerts ({alerts.filter(a => a.status === 'ACTIVE').length})</span>
          </button>
          <button
            onClick={() => onNavigatePage('gis-map')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Full GIS Map</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          label="Active Nodes"
          value={activeNodes}
          unit="/ 24"
          subtext="Surface LoRa mesh online"
          icon={<Radio className="w-4 h-4 text-emerald-600" />}
          alertLevel="NORMAL"
        />

        <StatCard
          label="Nodes Offline"
          value={offlineNodes}
          unit="nodes"
          subtext={offlineNodes > 0 ? "Requires field battery check" : "Zero packet drop"}
          icon={<WifiOff className="w-4 h-4 text-slate-600" />}
          alertLevel={offlineNodes > 0 ? 'WARNING' : 'NEUTRAL'}
        />

        <StatCard
          label="Current Risk"
          value={`${Math.round(currentRiskScore)}`}
          unit="/ 100"
          subtext={currentRiskLevel}
          icon={<ShieldAlert className="w-4 h-4 text-blue-600" />}
          alertLevel={currentRiskLevel as any}
        />

        <StatCard
          label="Active Alerts"
          value={alerts.filter(a => a.status === 'ACTIVE').length}
          unit="events"
          subtext="Operator actionable"
          icon={<Bell className="w-4 h-4 text-amber-600" />}
          alertLevel={
            alerts.some(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE') ? 'CRITICAL' :
            alerts.some(a => a.severity === 'WARNING' && a.status === 'ACTIVE') ? 'WARNING' :
            'NORMAL'
          }
        />

        <StatCard
          label="Area Monitored"
          value="4.85"
          unit="sq. km"
          subtext="5 underground panels"
          icon={<MapPin className="w-4 h-4 text-blue-600" />}
          alertLevel="NEUTRAL"
        />

        <StatCard
          label="Telemetry Stream"
          value="Real-Time"
          subtext="Every 6 seconds"
          icon={<Clock className="w-4 h-4 text-emerald-600" />}
          alertLevel="NORMAL"
        />
      </div>

      {/* Main Content Grid: LEFT Map, RIGHT AI Risk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Mini GIS Map with Panel B3 Focus */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Surface Deformation & GIS Risk Zones
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any sensor node to inspect live tilt, displacement & RSSI telemetry
              </p>
            </div>
            <button
              onClick={() => onNavigatePage('gis-map')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Expand GIS Viewer &rarr;
            </button>
          </div>

          <div className="flex-1 min-h-[380px]">
            <GisMap
              sensors={sensors}
              selectedNodeId={selectedSensorId}
              onSelectNode={(node) => {
                setSelectedSensorId(node.id);
                setDrawerNode(node);
              }}
              height="380px"
            />
          </div>
        </div>

        {/* RIGHT: Current Risk Summary & Explainability Breakdown */}
        <div className="flex flex-col gap-4">
          <RiskScoreGauge
            score={currentRiskScore}
            classification={currentRiskLevel}
            factors={riskSummary?.factors || {
              "Displacement Velocity": 38.0,
              "Tilt Angle Increase": 24.0,
              "Spatial Correlation": 20.0,
              "Vibration RMS": 18.0
            }}
            explanation={riskSummary?.explanation}
          />

          {/* Quick innovation note */}
          <div className="bg-slate-900 text-white rounded-lg p-4 border border-slate-800 shadow-xs text-xs">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block mb-1">
              Ministry of Coal SIH Innovation
            </span>
            <p className="text-slate-300 font-semibold leading-relaxed">
              Wireless Surface Mesh Network autonomously relays geotechnical deformation frames through LoRa DAG repeaters directly to this decision-support portal.
            </p>
          </div>
        </div>
      </div>

      {/* Sensor Trends & Recent Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sensor Trends Chart */}
        <SensorTrendChart
          data={trendData}
          title="Surface Strata Trends: Node N14 (Core Panel B3 Cluster)"
          height={260}
        />

        {/* Recent Alerts Table */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-red-600" />
              Priority Subsidence Alerts
            </h3>
            <button
              onClick={() => onNavigatePage('alerts')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              View All &rarr;
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5">Severity</th>
                  <th className="py-2 px-2.5">Location</th>
                  <th className="py-2 px-2.5">Condition</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.slice(0, 4).map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-2.5 font-semibold">
                      <StatusBadge status={alt.severity} size="sm" />
                    </td>
                    <td className="py-2.5 px-2.5 font-medium text-slate-800">
                      {alt.node_cluster}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-600 truncate max-w-[200px]">
                      {alt.condition_detected}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.status === 'ACTIVE'
                          ? (alt.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')
                          : alt.status === 'ACKNOWLEDGED' ? 'bg-orange-100 text-orange-800' :
                          'bg-emerald-100 text-emerald-800'
                      }`}>
                        {alt.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      No active subsidence alerts. All panels normal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-out node inspection drawer if a node is clicked */}
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
