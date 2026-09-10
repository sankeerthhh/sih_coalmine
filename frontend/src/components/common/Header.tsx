import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wifi, WifiOff, MapPin, User, FileText, Bell, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSensorStore } from '../../store/sensorStore';
import { DgmsReportModal } from './DgmsReportModal';
import { offlineSyncService } from '../../services/offlineSync';

interface HeaderProps {
  isOffline: boolean;
  lastUpdate: Date;
}

export const Header: React.FC<HeaderProps> = ({ isOffline: propOffline, lastUpdate }) => {
  const { user } = useAuthStore();
  const { selectedPanelId, setSelectedPanelId, activeScenario } = useSensorStore();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isDgmsOpen, setIsDgmsOpen] = useState(false);
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState(offlineSyncService.getStatus());

  useEffect(() => {
    const unsub = offlineSyncService.subscribe((online, pending) => {
      setOfflineStatus({ isOnline: online, pendingCount: pending });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000));
      setSecondsAgo(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  const isCritical = activeScenario === 'CRITICAL_SUBSIDENCE';

  return (
    <>
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
        {/* Critical Subsidence Siren Banner */}
        {isCritical && (
          <div className="bg-rose-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-pulse shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>EMERGENCY ALERT: ACCELERATED SUBSIDENCE & GROUND CRACK DETECTED OVER PANEL B3</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] bg-rose-800 px-2 py-0.5 rounded border border-rose-600">
                Evacuate Surface Perimeter
              </span>
              <button
                onClick={() => setIsSirenMuted(!isSirenMuted)}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[11px] transition cursor-pointer"
              >
                {isSirenMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isSirenMuted ? 'Muted' : 'Siren Active'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Offline Warning Banner */}
        {(!offlineStatus.isOnline || propOffline) && (
          <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5 animate-bounce" />
            <span>
              Offline Mesh Buffer Active — {offlineStatus.pendingCount} actions queued for cloud synchronization.
            </span>
          </div>
        )}

        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left: Location context */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <select
                aria-label="Coalfield Selection"
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
              >
                <option value="KORBA_SECL">SECL • Korba Coalfield (Block-A)</option>
                <option value="JHARIA_BCCL">BCCL • Jharia Coalfield (Moonidih)</option>
                <option value="RANIGANJ_ECL">ECL • Raniganj Coalfield (Kottadih)</option>
                <option value="NAGPUR_WCL">WCL • Nagpur Coalfield (Umrer)</option>
              </select>
              <span className="text-slate-300">/</span>
              <div className="relative inline-block">
                <select
                  value={selectedPanelId}
                  onChange={(e) => setSelectedPanelId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                >
                  <option value="PANEL-B3">Panel B3 (Active Depillaring)</option>
                  <option value="PANEL-B2">Panel B2 (Development Section)</option>
                  <option value="PANEL-B1">Panel B1 (Continuous Miner)</option>
                  <option value="PANEL-A2">Panel A2 (Post-Depillared)</option>
                  <option value="PANEL-A1">Panel A1 (Sealed Gaf)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right: Actions, DGMS Report, Sync status & User profile */}
          <div className="flex items-center gap-3 text-xs">
            {/* DGMS Report Button */}
            <button
              onClick={() => setIsDgmsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold text-xs transition shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>DGMS Safety Report</span>
            </button>

            {/* Cloud Sync Status Pill */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-full font-medium text-slate-700">
              <span className={`w-2 h-2 rounded-full ${offlineStatus.isOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span>{offlineStatus.isOnline ? 'Cloud Synced' : 'Mesh Buffer'}</span>
            </div>

            {/* Telemetry Age */}
            <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
              <Wifi className="w-3 h-3 text-blue-600" />
              <span>{secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* User profile */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-slate-900 text-xs leading-none">
                  {user?.full_name || 'Mine Safety Officer'}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {user?.role || 'ADMIN'} &bull; Ministry of Coal
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* DGMS Report Modal */}
      <DgmsReportModal isOpen={isDgmsOpen} onClose={() => setIsDgmsOpen(false)} />
    </>
  );
};
