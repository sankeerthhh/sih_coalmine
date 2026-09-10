import React from 'react';
import {
  LayoutDashboard,
  Map,
  Network,
  Cpu,
  Bell,
  LineChart,
  Activity,
  Settings,
  LogOut,
  Mountain
} from 'lucide-react';
import { PageType } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useSensorStore } from '../../store/sensorStore';

interface SidebarProps {
  currentPage: PageType;
  onSelectPage: (page: PageType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage }) => {
  const { logout } = useAuthStore();
  const { alerts } = useSensorStore();

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const navItems = [
    { id: 'dashboard' as PageType, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'gis-map' as PageType, label: 'Live GIS Map', icon: <Map className="w-4 h-4" /> },
    { id: 'sensors' as PageType, label: 'Sensor Network', icon: <Network className="w-4 h-4" /> },
    { id: 'ai-risk' as PageType, label: 'AI Risk Assessment', icon: <Cpu className="w-4 h-4" /> },
    { 
      id: 'alerts' as PageType, 
      label: 'Alerts', 
      icon: <Bell className="w-4 h-4" />,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined 
    },
    { id: 'analytics' as PageType, label: 'Historical Analytics', icon: <LineChart className="w-4 h-4" /> },
    { id: 'system-health' as PageType, label: 'System Health', icon: <Activity className="w-4 h-4" /> },
    { id: 'settings' as PageType, label: 'Admin Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 border-r border-slate-800">
      <div>
        {/* Project & Ministry Logo Branding */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight leading-tight">
              MINE SUBSIDENCE
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Ministry of Coal &bull; GoI
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive ? 'bg-white text-blue-700' : 'bg-red-600 text-white animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/60 rounded-md p-2.5 mb-3 border border-slate-700/50">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Wireless Surface Mesh
          </p>
          <p className="text-xs text-slate-200 font-bold mt-0.5">
            LoRa DAG Active (N01 Gateway)
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
