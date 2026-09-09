import React from 'react';

interface StatusBadgeProps {
  status: 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL' | 'ONLINE' | 'OFFLINE' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let dotColor = 'bg-slate-500';

  if (normalized === 'NORMAL' || normalized === 'ONLINE' || normalized === 'RESOLVED' || normalized === 'HEALTHY') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dotColor = 'bg-emerald-600';
  } else if (normalized === 'WARNING' || normalized === 'DEGRADED') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'HIGH' || normalized === 'ACKNOWLEDGED') {
    colorClasses = 'bg-orange-50 text-orange-800 border-orange-300';
    dotColor = 'bg-orange-500';
  } else if (normalized === 'CRITICAL' || normalized === 'DANGER' || normalized === 'ERROR') {
    colorClasses = 'bg-red-50 text-red-800 border-red-300';
    dotColor = 'bg-red-600';
  } else if (normalized === 'OFFLINE') {
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
    dotColor = 'bg-slate-400';
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${paddingClass} ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {normalized}
    </span>
  );
};
