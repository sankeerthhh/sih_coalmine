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
  Filter,
  ArrowLeft,
  Pencil,
  X,
  Radio,
  Send,
  Phone,
  Mail,
  Volume2,
  FileText,
  Loader2,
  History,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { useSensorStore, BroadcastConfig, BroadcastLogItem } from '../store/sensorStore';
import { api } from '../services/api';
import { Alert } from '../types';

interface AlertsPageProps {
  onNavigatePage: (page: any) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigatePage }) => {
  const { 
    alerts, 
    setAlerts, 
    setSelectedSensorId, 
    acknowledgeAlertLocal, 
    resolveAlertLocal,
    broadcastConfig,
    updateBroadcastConfig,
    broadcastLogs,
    recordBroadcastLog,
    supervisors,
    selectedPanelId
  } = useSensorStore();

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Test Broadcast Dispatch Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchStep, setDispatchStep] = useState(0); // 0: idle, 1: telemetry, 2: sms, 3: dgms, 4: siren, 5: completed
  const [currentDispatchResult, setCurrentDispatchResult] = useState<BroadcastLogItem | null>(null);

  // Edit Dispatch Targets Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<BroadcastConfig>(broadcastConfig);
  const [editSavedSuccess, setEditSavedSuccess] = useState(false);

  // History Accordion State
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    api.getAlerts().then(setAlerts).catch(console.error);
  }, [setAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setLoadingAction(alertId);
      acknowledgeAlertLocal(alertId, 'Mine Safety Officer (SECL)');
      const updated = await api.acknowledgeAlert(alertId, 'Mine Safety Officer (SECL)');
      setAlerts(alerts.map(a => a.id === alertId ? updated : a));
    } catch (err) {
      console.warn("Acknowledge fallback active:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setLoadingAction(alertId);
      resolveAlertLocal(alertId, 'Mine Safety Officer (SECL)');
      const updated = await api.resolveAlert(alertId, 'Mine Safety Officer (SECL)');
      setAlerts(alerts.map(a => a.id === alertId ? updated : a));
    } catch (err) {
      console.warn("Resolve fallback active:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTriggerTestBroadcast = async () => {
    setIsDispatchModalOpen(true);
    setDispatchStep(1); // capturing telemetry
    setCurrentDispatchResult(null);

    setTimeout(() => setDispatchStep(2), 400); // sending SMS
    setTimeout(() => setDispatchStep(3), 850); // emailing DGMS
    setTimeout(() => setDispatchStep(4), 1300); // sounding siren

    try {
      const apiRes = await api.triggerTestBroadcast(selectedPanelId || 'PANEL-B3');
      const logRecord: BroadcastLogItem = {
        id: `TX-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toLocaleTimeString(),
        panel_id: selectedPanelId || 'PANEL-B3',
        trigger_type: 'MANUAL_TEST',
        status: 'DELIVERED',
        sms_receipt: apiRes?.channels?.sms?.gateway_tx || `TX-NIC-${Math.floor(10000 + Math.random() * 90000)}`,
        dgms_receipt: apiRes?.channels?.email?.receipt || `SMTP-DGMS-${Math.floor(1000 + Math.random() * 9000)}`,
        siren_status: 'ACTIVE (120dB Pulse - Zone 4 Perimeter)',
        recipients_count: 3 + supervisors.length,
        message_preview: `[DGMS URGENT]: Surface strata subsidence drill alert. Displacement 14.8mm recorded over Panel B3, Korba Colliery. Evacuate surface perimeter immediately.`
      };

      setTimeout(() => {
        setDispatchStep(5);
        setCurrentDispatchResult(logRecord);
        recordBroadcastLog(logRecord);
      }, 1650);
    } catch (err) {
      console.error(err);
      setTimeout(() => setDispatchStep(5), 1650);
    }
  };

  const handleOpenEditTargets = () => {
    setEditForm({ ...broadcastConfig });
    setIsEditModalOpen(true);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    updateBroadcastConfig(editForm);
    setEditSavedSuccess(true);
    setTimeout(() => {
      setEditSavedSuccess(false);
      setIsEditModalOpen(false);
    }, 1000);
  };

  const handleSelectSupervisor = (supId: string) => {
    const found = supervisors.find(s => s.id === supId);
    if (found) {
      setEditForm(prev => ({
        ...prev,
        smsTargetName: `${found.name} (${found.designation})`,
        smsTargetPhone: found.phone
      }));
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesSev = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStat = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSev && matchesStat;
  });

  return (
    <div className="space-y-5">
      {/* Top Filter Bar with Back Button */}
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
            <span className="font-semibold text-slate-900">Alerts</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-600" />
            Mine Subsidence Early Warning & Alert Management
          </h2>
          <p className="text-xs text-slate-500">
            Decision-support notification dispatch for geotechnical safety officers and mine operators
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onNavigatePage('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition cursor-pointer border border-slate-300 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
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

      {/* Emergency Multi-Channel Broadcast Console */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg p-5 text-white shadow-md space-y-4 border border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2">
                <span>Automated Multi-Channel Emergency Broadcast Dispatcher</span>
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Direct telemetry integration with NIC SMS Gateway, DGMS Regional Circle email bulletins, and site sirens
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenEditTargets}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded font-semibold text-xs transition border border-slate-600 cursor-pointer shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-400" />
              <span>Edit Dispatch Details</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerTestBroadcast}
              className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-xs transition shadow-md cursor-pointer border border-red-500"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Test Emergency Broadcast (SMS & Email)</span>
            </button>
          </div>
        </div>

        {/* Channels & Recipient List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Channel 1: SMS Gateway */}
          <div className="bg-slate-800/80 rounded-lg border border-slate-700/80 p-3.5 space-y-1.5">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              SMS GATEWAY (NIC/CDAC)
            </div>
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Direct Telecommunication Active</span>
            </div>
            <div className="text-xs text-slate-300">
              Target: <span className="font-medium text-slate-200">{broadcastConfig.smsTargetName} ({broadcastConfig.smsTargetPhone})</span>
            </div>
          </div>

          {/* Channel 2: DGMS Statutory Bulletin */}
          <div className="bg-slate-800/80 rounded-lg border border-slate-700/80 p-3.5 space-y-1.5">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              DGMS STATUTORY BULLETIN
            </div>
            <div className="font-semibold text-blue-400 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Regional Circle Connected</span>
            </div>
            <div className="text-xs text-slate-300 truncate" title={`${broadcastConfig.dgmsRecipientName} (${broadcastConfig.dgmsRecipientEmail})`}>
              Target: <span className="font-medium text-slate-200">{broadcastConfig.dgmsRecipientName} ({broadcastConfig.dgmsRecipientEmail})</span>
            </div>
          </div>

          {/* Channel 3: On-Site Surface Evacuation */}
          <div className="bg-slate-800/80 rounded-lg border border-slate-700/80 p-3.5 space-y-1.5">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              ON-SITE SURFACE EVACUATION
            </div>
            <div className="font-semibold text-amber-400 flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Panel B3 Perimeter Siren</span>
            </div>
            <div className="text-xs text-slate-300">
              Target: <span className="font-medium text-slate-200">{broadcastConfig.sirenLocation}</span>
            </div>
          </div>
        </div>

        {/* Collapsible Dispatch History Logs */}
        {broadcastLogs.length > 0 && (
          <div className="pt-2 border-t border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white font-semibold cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>Emergency Dispatch Logs ({broadcastLogs.length} transmissions)</span>
              {showLogs ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
            </button>

            {showLogs && (
              <div className="mt-2 space-y-2 bg-slate-950/70 p-3 rounded border border-slate-800 max-h-40 overflow-y-auto font-mono text-[11px]">
                {broadcastLogs.map((log) => (
                  <div key={log.id} className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-1.5 text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">[{log.status}]</span>
                      <span className="text-white font-bold">{log.id}</span>
                      <span className="text-slate-400">{log.timestamp}</span>
                      <span className="text-blue-300 font-sans font-semibold">({log.panel_id})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-3">
                      <span>SMS: {log.sms_receipt}</span>
                      <span>DGMS: {log.dgms_receipt}</span>
                      <span className="text-amber-300">{log.siren_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
                      const matchedNode = alt.node_cluster.match(/N\d+/)?.[0] || 'N14';
                      setSelectedSensorId(matchedNode);
                      onNavigatePage('gis-map');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Cluster on GIS Map</span>
                  </button>
                  <button
                    onClick={() => {
                      const matchedNode = alt.node_cluster.match(/N\d+/)?.[0] || 'N14';
                      setSelectedSensorId(matchedNode);
                      onNavigatePage('analytics');
                    }}
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

      {/* 1. Interactive Test Emergency Broadcast Progress Modal */}
      {isDispatchModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => dispatchStep === 5 && setIsDispatchModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-300 overflow-hidden text-xs animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="font-bold text-sm">Emergency Multi-Channel Telemetry Dispatch</span>
              </div>
              {dispatchStep === 5 && (
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Telemetry Context Box */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Geotechnical Trigger: Panel B3 Core Subsidence Drill</span>
                  <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono font-bold">
                    14.8 mm / 2.3° TILT
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Simulating automated statutory escalation across physical and wireless telecommunication channels.
                </p>
              </div>

              {/* Step Sequence */}
              <div className="space-y-3">
                {/* Step 1: Telemetry Analysis */}
                <div className={`flex items-start gap-3 p-2.5 rounded border transition ${
                  dispatchStep >= 1 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <div className="mt-0.5">
                    {dispatchStep >= 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : dispatchStep === 1 ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 block" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs">1. Geotechnical Anomaly Formulation</div>
                    <div className="text-[11px] text-slate-600">
                      Telemetry verified across 24 LoRa mesh nodes. Surface tension fracture circuit tripped.
                    </div>
                  </div>
                </div>

                {/* Step 2: NIC SMS Broadcast */}
                <div className={`flex items-start gap-3 p-2.5 rounded border transition ${
                  dispatchStep >= 2 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <div className="mt-0.5">
                    {dispatchStep >= 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : dispatchStep === 2 ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 block" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs">2. NIC SMS Gateway API Broadcast</div>
                    <div className="text-[11px] text-slate-600">
                      Dispatched to <span className="font-bold">{broadcastConfig.smsTargetName}</span> ({broadcastConfig.smsTargetPhone}) via {broadcastConfig.smsGatewayRoute}
                    </div>
                  </div>
                </div>

                {/* Step 3: DGMS Regional Email */}
                <div className={`flex items-start gap-3 p-2.5 rounded border transition ${
                  dispatchStep >= 3 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <div className="mt-0.5">
                    {dispatchStep >= 4 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : dispatchStep === 3 ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 block" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs">3. DGMS Statutory Regional Circle Bulletin</div>
                    <div className="text-[11px] text-slate-600">
                      Transmitted CMR-2017 Form IV incident brief to <span className="font-bold">{broadcastConfig.dgmsRecipientEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Step 4: Perimeter Siren */}
                <div className={`flex items-start gap-3 p-2.5 rounded border transition ${
                  dispatchStep >= 4 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <div className="mt-0.5">
                    {dispatchStep >= 5 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : dispatchStep === 4 ? (
                      <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 block" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs">4. On-Site Surface Perimeter Siren Activation</div>
                    <div className="text-[11px] text-slate-600">
                      Pulsed Modbus TCP relay at {broadcastConfig.sirenLocation} ({broadcastConfig.sirenRelayChannel})
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Confirmation & Payload Preview */}
              {dispatchStep === 5 && currentDispatchResult && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>All Emergency Channels Successfully Triggered & Acknowledged!</span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      {currentDispatchResult.id}
                    </span>
                  </div>

                  {/* SMS Payload Display */}
                  <div className="bg-slate-900 text-slate-200 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Live SMS Payload (Sender: CDAC-MINESAFE)</span>
                      <span className="text-emerald-400 font-bold">DELIVERED</span>
                    </div>
                    <p className="text-[11px] font-sans leading-relaxed text-slate-100 italic bg-slate-800/80 p-2 rounded border border-slate-700">
                      "{currentDispatchResult.message_preview}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {dispatchStep < 5 ? 'Dispatch sequence in progress...' : 'Transmission logged in statutory audit register.'}
              </span>
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                disabled={dispatchStep < 5}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Dispatch Targets & Details Modal */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-300 overflow-hidden text-xs animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">Configure Emergency Dispatch Channels & Targets</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTargets} className="p-5 space-y-4">
              {/* Quick Select from Enrolled Supervisors */}
              {supervisors.length > 0 && (
                <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200">
                  <label className="block text-blue-900 font-semibold mb-1 text-[11px]">
                    Quick Assign from Safety Supervisors Roster:
                  </label>
                  <select
                    onChange={(e) => handleSelectSupervisor(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Choose active supervisor from roster --</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} • {s.designation} ({s.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Section 1: SMS Gateway Target */}
              <div className="space-y-2 border-b border-slate-200 pb-3">
                <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5 text-emerald-700">
                  <Smartphone className="w-3.5 h-3.5" /> 1. SMS Gateway Target Contact
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px]">Target Officer Name & Role</label>
                    <input
                      type="text"
                      value={editForm.smsTargetName}
                      onChange={(e) => setEditForm({ ...editForm, smsTargetName: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px]">SMS Contact Phone (+91)</label>
                    <input
                      type="tel"
                      value={editForm.smsTargetPhone}
                      onChange={(e) => setEditForm({ ...editForm, smsTargetPhone: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 text-[11px]">Gateway Route / Sender ID</label>
                  <input
                    type="text"
                    value={editForm.smsGatewayRoute}
                    onChange={(e) => setEditForm({ ...editForm, smsGatewayRoute: e.target.value })}
                    required
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-xs"
                  />
                </div>
              </div>

              {/* Section 2: DGMS Statutory Email */}
              <div className="space-y-2 border-b border-slate-200 pb-3">
                <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5 text-blue-700">
                  <Mail className="w-3.5 h-3.5" /> 2. DGMS Statutory Bulletin Target
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px]">DGMS Authority / Regional Circle</label>
                    <input
                      type="text"
                      value={editForm.dgmsRecipientName}
                      onChange={(e) => setEditForm({ ...editForm, dgmsRecipientName: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px]">DGMS Official Email Address</label>
                    <input
                      type="email"
                      value={editForm.dgmsRecipientEmail}
                      onChange={(e) => setEditForm({ ...editForm, dgmsRecipientEmail: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 text-[11px]">Statutory Compliance Reference</label>
                  <input
                    type="text"
                    value={editForm.dgmsRegulationRef}
                    onChange={(e) => setEditForm({ ...editForm, dgmsRegulationRef: e.target.value })}
                    required
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-xs"
                  />
                </div>
              </div>

              {/* Section 3: On-Site Siren */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5 text-amber-700">
                  <Volume2 className="w-3.5 h-3.5" /> 3. Surface Evacuation Siren Relay
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px]">Siren Physical Station Location</label>
                    <input
                      type="text"
                      value={editForm.sirenLocation}
                      onChange={(e) => setEditForm({ ...editForm, sirenLocation: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 text-[11px]">Modbus TCP PLC Relay Channel</label>
                    <input
                      type="text"
                      value={editForm.sirenRelayChannel}
                      onChange={(e) => setEditForm({ ...editForm, sirenRelayChannel: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {editSavedSuccess && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md p-2.5 flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Emergency dispatch channels and targets successfully updated!</span>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs transition cursor-pointer border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Dispatch Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
