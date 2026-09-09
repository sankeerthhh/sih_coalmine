import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wifi, WifiOff, MapPin, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSensorStore } from '../../store/sensorStore';

interface HeaderProps {
  isOffline: boolean;
  lastUpdate: Date;
}

export const Header: React.FC<HeaderProps> = ({ isOffline, lastUpdate }) => {
  const { user } = useAuthStore();
  const { selectedPanelId, setSelectedPanelId } = useSensorStore();
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000));
      setSecondsAgo(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 animate-bounce" />
          <span>Offline Mode — Live connection interrupted. Displaying cached telemetry data.</span>
        </div>
      )}

      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Location context */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Korba Underground Coal Mine (Block-A)
            </span>
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

        {/* Right: Telemetry sync status & User profile */}
        <div className="flex items-center gap-4 text-xs">
          {/* System status pill */}
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>All Systems Operational</span>
          </div>

          {/* Sync indicator */}
          <div className="flex items-center gap-1.5 text-[#64748B] font-mono">
            {isOffline ? (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <WifiOff className="w-3.5 h-3.5" /> Disconnected
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-blue-600" />
                Updated {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}
              </span>
            )}
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
  );
};
