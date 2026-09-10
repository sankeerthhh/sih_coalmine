import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Volume2, X } from 'lucide-react';
import { useSensorStore } from '../../store/sensorStore';
import { PageType } from '../../types';

interface EmergencyAlertBannerProps {
  onNavigatePage: (page: PageType) => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({ onNavigatePage }) => {
  const { alerts, activeScenario, broadcastConfig, acknowledgeAlertLocal } = useSensorStore();
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // Find the highest severity active alert
  const activeCriticalAlert = alerts.find(a => a.status === 'ACTIVE' && a.severity === 'CRITICAL');
  const activeWarningAlert = alerts.find(a => a.status === 'ACTIVE' && a.severity === 'WARNING');
  const activeAlert = activeCriticalAlert || activeWarningAlert;

  // Sound alert chime when critical alert is active
  useEffect(() => {
    if (activeCriticalAlert && dismissedId !== activeCriticalAlert.id) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {
        // AudioContext might be blocked until user gesture, safe to ignore
      }
    }
  }, [activeCriticalAlert?.id, dismissedId]);

  if (!activeAlert || dismissedId === activeAlert.id) {
    // If no active alert from database/mock, check if an active scenario is simulating alert
    if (activeScenario === 'NORMAL' || activeScenario === 'RESET') {
      return null;
    }
  }

  const isCritical = activeAlert?.severity === 'CRITICAL' || activeScenario === 'SUBSIDENCE_CRITICAL';

  return (
    <div className={`w-full px-4 py-2.5 transition-all duration-300 shadow-md flex items-center justify-between border-b ${
      isCritical 
        ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white border-red-700' 
        : 'bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 border-amber-700'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex shrink-0 items-center justify-center">
          <span className={`animate-ping absolute inline-flex h-6 w-6 rounded-full opacity-75 ${
            isCritical ? 'bg-red-500' : 'bg-amber-400'
          }`} />
          {isCritical ? (
            <AlertCircle className="w-5 h-5 text-red-400 relative" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 relative" />
          )}
        </div>

        <div className="text-xs leading-tight min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase ${
              isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {isCritical ? 'CRITICAL SUBSIDENCE ALERT' : 'SUBSIDENCE RISK ADVISORY'}
            </span>
            <span className="font-bold text-white text-xs truncate">
              {activeAlert?.title || 'Elevated Strata Displacement in Panel B3'}
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              [{activeAlert?.panel_id || 'PANEL-B3'} • Cluster N14-N15]
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-200">
            <span>
              Displacement: <strong className="text-white font-mono">{activeAlert?.measured_displacement || '14.8'} mm</strong>
            </span>
            <span>•</span>
            <span>
              Tilt: <strong className="text-white font-mono">{activeAlert?.measured_tilt || '2.45'}°</strong>
            </span>
            <span>•</span>
            <span className="hidden sm:inline text-slate-300">
              Target: <strong className="text-white">{broadcastConfig.smsTargetName}</strong> ({broadcastConfig.smsTargetPhone}) &amp; <strong className="text-white">{broadcastConfig.dgmsRecipientName}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        {activeAlert && (
          <button
            type="button"
            onClick={() => acknowledgeAlertLocal(activeAlert.id, 'R Sai Sankeerth Reddy (Mine Safety Officer)')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-semibold text-xs transition border border-white/20 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acknowledge</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigatePage('alerts')}
          className="flex items-center gap-1.5 px-3 py-1 bg-white text-slate-900 hover:bg-slate-100 rounded font-bold text-xs transition cursor-pointer shadow-sm"
        >
          <span>Open Alerts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (activeAlert) setDismissedId(activeAlert.id);
          }}
          className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
