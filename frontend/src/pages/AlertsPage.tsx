import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  ShieldCheck,
  Check,
  RotateCcw,
  Clock,
  Filter
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { useSensorStore } from '../store/sensorStore';
import { api } from '../services/api';
import { Alert } from '../types';

interface AlertsPageProps {
  onNavigatePage: (page: any) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigatePage }) => {
  const { alerts, setAlerts, setSelectedSensorId } = useSensorStore();
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    api.getAlerts().then(setAlerts).catch(console.error);
  }, [setAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setLoadingAction(alertId);
      const updated = await api.acknowledgeAlert(alertId, 'Mine Safety Officer (SECL)');
      setAlerts(alerts.map(a => a.id === alertId ? updated : a));
    } catch (err) {
      console.error("Acknowledge alert error:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setLoadingAction(alertId);
      const updated = await api.resolveAlert(alertId, 'Mine Safety Officer (SECL)');
      setAlerts(alerts.map(a => a.id === alertId ? updated : a));
    } catch (err) {
      console.error("Resolve alert error:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesSev = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStat = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSev && matchesStat;
  });

  return (
    <div className="space-y-5">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-600" />
            Mine Subsidence Early Warning & Alert Management
          </h2>
          <p className="text-xs text-slate-500">
            Decision-support notification dispatch for geotechnical safety officers and mine operators
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-[11px] font-semibold transition ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 font-semibold text-slate-800 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warning Only</option>
          </select>
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-3.5">
        {filteredAlerts.map((alt) => {
          const isCritical = alt.severity === 'CRITICAL';
          const cardBorder = isCritical && alt.status === 'ACTIVE'
            ? 'border-red-400 ring-1 ring-red-300'
            : 'border-slate-200';

          return (
            <div
              key={alt.id}
              className={`bg-white rounded-lg border ${cardBorder} p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={alt.severity} size="md" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{alt.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-blue-700">{alt.panel_id}</span>
                      <span>&bull;</span>
                      <span className="font-medium text-slate-700">{alt.node_cluster}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-400">{alt.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(alt.created_at).toLocaleString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    alt.status === 'ACTIVE' ? 'bg-red-100 text-red-800' :
                    alt.status === 'ACKNOWLEDGED' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {alt.status}
                  </span>
                </div>
              </div>

              {/* Measured Metrics & Diagnostics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">AI Risk Index</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {Math.round(alt.ai_risk_score)} / 100
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Resultant Tilt</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {alt.measured_tilt?.toFixed(2)}°
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Surface Displacement</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {alt.measured_displacement?.toFixed(1)} mm
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Crack Initiation</span>
                  <span className={`text-sm font-bold ${alt.crack_detected ? 'text-red-600' : 'text-emerald-700'}`}>
                    {alt.crack_detected ? 'Triggered / Severed' : 'Intact'}
                  </span>
                </div>
              </div>

              {/* Condition and Recommended Action */}
              <div className="space-y-2 text-xs">
                <div className="text-slate-700">
                  <span className="font-semibold text-slate-900">Detected Condition: </span>
                  {alt.condition_detected}
                </div>

                <div className="p-3 bg-blue-50/60 rounded-md border border-blue-100 text-blue-900">
                  <span className="font-bold">Recommended Engineering Action: </span>
                  {alt.recommended_action}
                </div>

                {alt.acknowledged_by && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Acknowledged by {alt.acknowledged_by} at {alt.acknowledged_at ? new Date(alt.acknowledged_at).toLocaleTimeString() : ''}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSensorId('N14');
                      onNavigatePage('gis-map');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Cluster on GIS Map</span>
                  </button>
                  <button
                    onClick={() => onNavigatePage('analytics')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition"
                  >
                    Inspect Trends
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {alt.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleAcknowledge(alt.id)}
                      disabled={loadingAction === alt.id}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>
                  )}

                  {alt.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(alt.id)}
                      disabled={loadingAction === alt.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolve Alert
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="bg-white rounded-lg p-12 border border-slate-200 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Alerts Match Selected Filters</p>
            <p className="text-xs text-slate-400 mt-1">Ground movement across all mining panels is quiescent.</p>
          </div>
        )}
      </div>
    </div>
  );
};
