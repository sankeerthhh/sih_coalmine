import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon: React.ReactNode;
  alertLevel?: 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL' | 'NEUTRAL';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtext,
  icon,
  alertLevel = 'NEUTRAL'
}) => {
  let borderClass = 'border-[#E2E8F0]';
  let badgeColor = 'bg-slate-100 text-slate-700';

  if (alertLevel === 'NORMAL') {
    borderClass = 'border-emerald-200';
    badgeColor = 'bg-emerald-50 text-emerald-700';
  } else if (alertLevel === 'WARNING') {
    borderClass = 'border-amber-300 ring-1 ring-amber-200';
    badgeColor = 'bg-amber-50 text-amber-800';
  } else if (alertLevel === 'HIGH') {
    borderClass = 'border-orange-300 ring-1 ring-orange-200';
    badgeColor = 'bg-orange-50 text-orange-800';
  } else if (alertLevel === 'CRITICAL') {
    borderClass = 'border-red-400 ring-2 ring-red-300 animate-pulse';
    badgeColor = 'bg-red-100 text-red-800';
  }

  return (
    <div className={`bg-white rounded-lg p-4 border ${borderClass} shadow-xs flex flex-col justify-between transition-all`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[#64748B]">{label}</span>
        <div className={`p-1.5 rounded-md ${badgeColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-[#0F172A] tracking-tight">{value}</span>
        {unit && <span className="text-xs font-semibold text-[#64748B]">{unit}</span>}
      </div>
      {subtext && (
        <div className="mt-2 text-xs text-[#64748B] flex items-center gap-1 border-t border-slate-100 pt-2">
          {subtext}
        </div>
      )}
    </div>
  );
};
