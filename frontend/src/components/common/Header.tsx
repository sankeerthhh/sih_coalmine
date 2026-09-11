import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wifi, WifiOff, MapPin, User, FileText, Bell, Volume2, VolumeX, AlertTriangle, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSensorStore } from '../../store/sensorStore';
import { DgmsReportModal } from './DgmsReportModal';
import { offlineSyncService } from '../../services/offlineSync';
import { isCriticalScenario } from '../../utils/statusUtils';

interface HeaderProps {
  isOffline?: boolean;
  lastUpdate?: Date;
}

function getCleanMineName(name: string, org?: string): string {
  let prefix = 'SECL';
  if (org) {
    if (org.includes('South Eastern') || org.includes('SECL')) prefix = 'SECL';
    else if (org.includes('Bharat Coking') || org.includes('BCCL')) prefix = 'BCCL';
    else if (org.includes('Eastern Coalfields') || org.includes('ECL')) prefix = 'ECL';
    else if (org.includes('Central Coalfields') || org.includes('CCL')) prefix = 'CCL';
    else if (org.includes('Western Coalfields') || org.includes('WCL')) prefix = 'WCL';
    else prefix = org.slice(0, 6);
  }
  const clean = name
    .replace('Underground Coal Mine', '')
    .replace('Underground Coalfield', '')
    .replace(/\s+/g, ' ')
    .trim();
  return `${prefix} • ${clean}`;
}

function getCleanPanelName(name: string): string {
  return name
    .replace(' - Core', '')
    .replace('Depillaring', 'Depill.')
    .replace('Continuous Miner Development', 'CM Dev')
    .replace(/\s+/g, ' ')
    .trim();
}

export const Header: React.FC<HeaderProps> = ({ isOffline: propOffline, lastUpdate }) => {
  const { user } = useAuthStore();
  const {
    selectedPanelId,
    setSelectedPanelId,
    activeScenario,
    mines,
    selectedMineId,
    setSelectedMineId,
    offlineBufferCount,
    syncOfflineReadings,
    dataSourceMode,
    isHardwareConnected
  } = useSensorStore();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isDgmsOpen, setIsDgmsOpen] = useState(false);
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState(offlineSyncService.getStatus());

  useEffect(() => {
    const unsub = offlineSyncService.subscribe((online, pending) => {
      setOfflineStatus({ isOnline: online, pendingCount: pending });
    });
    return unsub;
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineReadings();
      await offlineSyncService.syncPending();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = lastUpdate ? Math.max(0, Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)) : 0;
      setSecondsAgo(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  const isCritical = isCriticalScenario(activeScenario);

  // Active mine's panels
  const currentMine = mines.find(m => (m.id === selectedMineId || m.mine_id === selectedMineId)) || mines[0];
  const panels = currentMine?.panels || [
    { id: 'PANEL-B3', panel_id: 'PANEL-B3', name: 'Panel B3 (Active Depillaring)' },
    { id: 'PANEL-B2', panel_id: 'PANEL-B2', name: 'Panel B2 (Development Section)' },
    { id: 'PANEL-B1', panel_id: 'PANEL-B1', name: 'Panel B1 (Continuous Miner)' },
    { id: 'PANEL-A2', panel_id: 'PANEL-A2', name: 'Panel A2 (Post-Depillared)' },
    { id: 'PANEL-A1', panel_id: 'PANEL-A1', name: 'Panel A1 (Sealed Gaf)' }
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        {/* Critical Subsidence Siren Banner */}
        {isCritical && (
          <div className="bg-rose-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-pulse shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce shrink-0" />
              <span className="truncate">EMERGENCY ALERT: ACCELERATED SUBSIDENCE & GROUND CRACK DETECTED OVER PANEL B3</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] bg-rose-800 px-2 py-0.5 rounded border border-rose-600 whitespace-nowrap">
                Evacuate Surface Perimeter
              </span>
              <button
                onClick={() => setIsSirenMuted(!isSirenMuted)}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[11px] transition cursor-pointer whitespace-nowrap"
              >
                {isSirenMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isSirenMuted ? 'Muted' : 'Siren Active'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Offline Warning Banner */}
        {(!offlineStatus.isOnline || propOffline || offlineBufferCount > 0) && (
          <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span>
                Offline Mesh Buffer Active — {offlineStatus.pendingCount + offlineBufferCount} readings queued for synchronization.
              </span>
            </div>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="bg-white text-amber-900 hover:bg-amber-100 px-2.5 py-0.5 rounded text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isSyncing ? 'Syncing...' : 'Sync Buffer to Cloud'}
            </button>
          </div>
        )}

        {/* Main Header Bar */}
        <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-3 min-w-0">
          {/* Left: Location context selectors */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 h-9 min-w-0 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              
              {/* Mine Selector */}
              <select
                aria-label="Coalfield Selection"
                value={selectedMineId}
                onChange={(e) => setSelectedMineId(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs max-w-[180px] sm:max-w-[220px] md:max-w-[250px] truncate"
                title="Select Coalfield / Mine"
              >
                {mines.length > 0 ? (
                  mines.map((m, idx) => {
                    const mId = m.id || m.mine_id || `mine-${idx}`;
                    return (
                      <option key={mId} value={mId}>
                        {getCleanMineName(m.name, m.organization || m.subsidiary)}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="MINE-SECL-KORBA">SECL • Korba (Block-A)</option>
                    <option value="MINE-SECL-RAIGARH">SECL • Raigarh (Block-B)</option>
                    <option value="MINE-BCCL-JHARIA">BCCL • Jharia (Moonidih)</option>
                    <option value="MINE-ECL-RANIGANJ">ECL • Raniganj (Kottadih)</option>
                  </>
                )}
              </select>

              <span className="text-slate-300 shrink-0 font-light">/</span>

              {/* Panel Selector */}
              <select
                aria-label="Panel Selection"
                value={selectedPanelId}
                onChange={(e) => setSelectedPanelId(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer text-xs max-w-[130px] sm:max-w-[170px] md:max-w-[200px] truncate"
                title="Select Mining Panel"
              >
                {panels.map((p: any, idx: number) => {
                  const pId = p.id || p.panel_id || `panel-${idx}`;
                  return (
                    <option key={pId} value={pId}>
                      {getCleanPanelName(p.name)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Data Source Indicator Pill */}
            {dataSourceMode === 'SIMULATION' ? (
              <div className="hidden lg:flex items-center gap-1.5 h-9 px-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs" title="Currently displaying synthetic geotechnical simulation scenarios">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>SIMULATION DATA</span>
              </div>
            ) : (
              <div className={`hidden lg:flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs border ${
                isHardwareConnected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`} title={isHardwareConnected ? "Real ESP32 LoRa Gateway hardware streaming" : "Standing by for real ESP32 LoRa Gateway telemetry"}>
                <span className={`w-2 h-2 rounded-full ${isHardwareConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
                <span>{isHardwareConnected ? 'LIVE HARDWARE' : 'HARDWARE (STANDBY)'}</span>
              </div>
            )}
          </div>

          {/* Right: DGMS Report, Sync status & User profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* DGMS Report Button */}
            <button
              onClick={() => setIsDgmsOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
              title="Statutory DGMS Compliance & Hazard Report"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="whitespace-nowrap">DGMS Safety Report</span>
            </button>

            {/* Cloud Sync Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 text-xs whitespace-nowrap shrink-0 shadow-2xs">
              <span className={`w-2 h-2 rounded-full shrink-0 ${offlineStatus.isOnline && offlineBufferCount === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{offlineStatus.isOnline && offlineBufferCount === 0 ? 'Cloud Synced' : `Buffer (${offlineBufferCount})`}</span>
            </div>

            {/* Telemetry Age */}
            <div className="hidden md:flex items-center gap-1 text-slate-500 font-mono text-[11px] whitespace-nowrap shrink-0">
              <Wifi className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}</span>
            </div>

            <div className="hidden sm:block h-5 w-[1px] bg-slate-200 shrink-0" />

            {/* User profile */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ring-1 ring-slate-200">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden xl:flex flex-col text-left leading-none">
                <span className="font-semibold text-slate-900 text-xs truncate max-w-[150px]">
                  {user?.full_name || 'Mine Safety Officer'}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[150px] mt-0.5">
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
